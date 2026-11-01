import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toast } from "sonner-native";
import {
  finishTransaction,
  getAvailablePurchases,
  isUserCancelledError,
  useIAP,
  type Purchase,
} from "expo-iap";
import { t } from "@/localization/i18n";
import { hapticSuccess } from "@/utils/haptics";

/** The one non-consumable: created in App Store Connect and Play Console under this id. */
export const PRO_PRODUCT_ID = "com.johnhaup.paycheckplanner.pro";

interface ProState {
  isPro: boolean;
  setIsPro: (isPro: boolean) => void;
}

/**
 * Cached entitlement. The store is asked again on every launch (see
 * useProEntitlement), so a refund revokes Pro on the next cold start while an
 * offline launch keeps whatever was last confirmed.
 */
export const useProStore = create<ProState>()(
  persist(
    (set) => ({
      isPro: false,
      setIsPro: (isPro) => set({ isPro }),
    }),
    {
      name: "paycheck-planner-pro",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function useIsPro(): boolean {
  return useProStore((s) => s.isPro);
}

export function hasProEntitlement(purchases: Purchase[]): boolean {
  return purchases.some((p) => p.productId === PRO_PRODUCT_ID && p.purchaseState === "purchased");
}

/** Reads the store's current entitlements and updates the cache. Throws when the store is unreachable. */
export async function refreshProEntitlement(): Promise<boolean> {
  const purchases = await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  const isPro = hasProEntitlement(purchases);
  useProStore.getState().setIsPro(isPro);
  return isPro;
}

async function handlePurchase(purchase: Purchase) {
  if (purchase.productId !== PRO_PRODUCT_ID || purchase.purchaseState !== "purchased") return;
  useProStore.getState().setIsPro(true);
  hapticSuccess();
  await finishTransaction({ purchase, isConsumable: false });
}

function ignore() {}

/**
 * Mounted once at the root: connects to the store, grants Pro for any
 * completed purchase of the product (including ones finished while the paywall
 * was closed, such as an approved Ask to Buy) and re-checks the entitlement on
 * every launch.
 */
export function useProEntitlement() {
  const { connected } = useIAP({
    onPurchaseSuccess: (purchase) => {
      handlePurchase(purchase).catch(ignore);
    },
    onPurchaseError: (error) => {
      if (!isUserCancelledError(error)) {
        toast.error(t("pro.purchaseFailed"));
      }
    },
  });

  useEffect(() => {
    if (connected) {
      refreshProEntitlement().catch(ignore);
    }
  }, [connected]);
}

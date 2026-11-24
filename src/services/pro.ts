import { useEffect } from "react";
import { create } from "zustand";
import {
  finishTransaction,
  getAvailablePurchases,
  isUserCancelledError,
  useIAP,
  type Purchase,
} from "expo-iap";
import { t } from "@/localization/i18n";
import { hapticSuccess } from "@/utils/haptics";
import {
  isProStoreMock,
  mockGetAvailablePurchases,
  useMockIAP,
  type ProStoreConnection,
} from "@/services/proStoreMock";
import { toastError } from "@/utils/toastError";

/** The one non-consumable: created in App Store Connect and Play Console under this id. */
export const PRO_PRODUCT_ID = "com.johnhaup.paycheckplanner.pro";

/**
 * Inlined at build time; only screenshot builds (expo-local-ship screenshots capture --build) set it.
 * `paycheck-planner://demo` then loads sample data with Pro on, so the store shots show Pro screens.
 */
export const IS_STORE_DEMO = process.env.EXPO_PUBLIC_STORE_DEMO === "1";

/**
 * The store connection for the root hook and the paywall: expo-iap, or the mock
 * store when the app was launched with `-proStoreMock` (QA only, see proStoreMock.ts).
 */
export const useProStoreConnection: ProStoreConnection = isProStoreMock ? useMockIAP : useIAP;

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
  (set) => ({
    isPro: false,
    setIsPro: (isPro) => set({ isPro }),
  })
);

export function useIsPro(): boolean {
  return useProStore((s) => s.isPro);
}

export function hasProEntitlement(purchases: Purchase[]): boolean {
  return purchases.some((p) => p.productId === PRO_PRODUCT_ID && p.purchaseState === "purchased");
}

/** Reads the store's current entitlements and updates the cache. Throws when the store is unreachable. */
export async function refreshProEntitlement(): Promise<boolean> {
  const purchases = isProStoreMock
    ? await mockGetAvailablePurchases(PRO_PRODUCT_ID)
    : await getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  const isPro = hasProEntitlement(purchases);
  useProStore.getState().setIsPro(isPro);
  return isPro;
}

async function handlePurchase(purchase: Purchase) {
  if (purchase.productId !== PRO_PRODUCT_ID || purchase.purchaseState !== "purchased") return;
  useProStore.getState().setIsPro(true);
  hapticSuccess();
  if (!isProStoreMock) {
    await finishTransaction({ purchase, isConsumable: false });
  }
}

function ignore() {}

/**
 * Mounted once at the root: connects to the store, grants Pro for any
 * completed purchase of the product (including ones finished while the paywall
 * was closed, such as an approved Ask to Buy) and re-checks the entitlement on
 * every launch.
 */
export function useProEntitlement() {
  const { connected } = useProStoreConnection({
    onPurchaseSuccess: (purchase) => {
      handlePurchase(purchase).catch(ignore);
    },
    onPurchaseError: (error) => {
      if (!isUserCancelledError(error)) {
        toastError(t("pro.purchaseFailed"));
      }
    },
  });

  useEffect(() => {
    // A screenshot build has no purchase; asking the store would take the demo's Pro away again
    if (connected && !IS_STORE_DEMO) {
      refreshProEntitlement().catch(ignore);
    }
  }, [connected]);
}

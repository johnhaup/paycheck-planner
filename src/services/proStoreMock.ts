import { useCallback, useEffect, useState } from "react";
import { Platform, Settings } from "react-native";
import type { Product, Purchase, useIAP } from "expo-iap";

/**
 * A stand-in for the App Store, used only when the app is launched with the
 * `-proStoreMock` argument (Maestro `launchApp: arguments: { "-proStoreMock": true }`; Maestro
 * does not add the dash itself),
 * so the release gate can buy and restore Pro on a plain simctl launch where
 * StoreKit has no test environment. iOS puts launch arguments in the
 * NSUserDefaults argument domain, which React Native's Settings reads; there is
 * no UI or deep link that reaches it. On Android Settings does not exist and the
 * mock stays off.
 *
 * The mock's "account" (whether Pro was bought) lives in NSUserDefaults under its
 * own key, apart from the app's cached entitlement. `-proStoreMockRevoke` clears it
 * at launch, which plays the refund path.
 */

const MOCK_ARG = "proStoreMock";
const REVOKE_ARG = "proStoreMockRevoke";
const OWNED_KEY = "proStoreMockOwned";
const BUY_DELAY_MS = 800;

function isOn(value: unknown): boolean {
  return value === true || value === 1 || value === "true" || value === "YES" || value === "1";
}

export const isProStoreMock = Platform.OS === "ios" && isOn(Settings.get(MOCK_ARG));

if (isProStoreMock && isOn(Settings.get(REVOKE_ARG))) {
  Settings.set({ [OWNED_KEY]: false });
}

function mockOwns(): boolean {
  return isOn(Settings.get(OWNED_KEY));
}

function mockProduct(id: string): Product {
  return {
    id,
    type: "in-app",
    platform: "ios",
    title: "Paycheck Planner Pro",
    description: "One-time purchase",
    displayName: "Paycheck Planner Pro",
    displayPrice: "$4.99",
    price: 4.99,
    currency: "USD",
  } as Product;
}

function mockPurchase(productId: string): Purchase {
  return {
    id: `mock-${productId}`,
    productId,
    platform: "ios",
    purchaseState: "purchased",
    transactionDate: Date.now(),
    quantity: 1,
    isAutoRenewing: false,
    store: "apple",
    storeId: `mock-${productId}`,
    transactionId: `mock-${productId}`,
  } as Purchase;
}

type Listener = (purchase: Purchase) => void;
const listeners = new Set<Listener>();

/** What the mock account owns: the product once bought, nothing after a revoke. */
export async function mockGetAvailablePurchases(productId: string): Promise<Purchase[]> {
  return mockOwns() ? [mockPurchase(productId)] : [];
}

/** The part of expo-iap's useIAP that the app uses; the mock answers exactly this. */
export type ProStoreConnection = (
  options?: Parameters<typeof useIAP>[0]
) => Pick<
  ReturnType<typeof useIAP>,
  "connected" | "products" | "fetchProducts" | "requestPurchase" | "restorePurchases"
>;

/** Options other than onPurchaseSuccess are ignored: a mock purchase cannot fail. */
export const useMockIAP: ProStoreConnection = (options) => {
  const [products, setProducts] = useState<Product[]>([]);
  const onPurchaseSuccess = options?.onPurchaseSuccess;

  useEffect(() => {
    if (!onPurchaseSuccess) return;
    listeners.add(onPurchaseSuccess);
    return () => {
      listeners.delete(onPurchaseSuccess);
    };
  }, [onPurchaseSuccess]);

  const fetchProducts = useCallback(async ({ skus }: { skus: string[] }) => {
    setProducts(skus.map(mockProduct));
  }, []);

  // Like StoreKit: resolves after the "sheet", and the purchase reaches every listener
  const requestPurchase = useCallback(async (params: Parameters<ReturnType<ProStoreConnection>["requestPurchase"]>[0]) => {
    const sku = params.request.apple?.sku;
    if (!sku) throw new Error("Mock store: no Apple sku in the purchase request");
    await new Promise((resolve) => setTimeout(resolve, BUY_DELAY_MS));
    Settings.set({ [OWNED_KEY]: true });
    const purchase = mockPurchase(sku);
    listeners.forEach((listener) => listener(purchase));
    return purchase;
  }, []);

  // StoreKit's sync; the mock account is always in sync, getAvailablePurchases reads it
  const restorePurchases = useCallback(async () => {}, []);

  return { connected: true, products, fetchProducts, requestPurchase, restorePurchases };
};

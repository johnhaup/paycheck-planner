import { useCallback, useEffect, useMemo, useState, type ComponentProps } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useIAP } from "expo-iap";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { PRO_PRODUCT_ID, refreshProEntitlement, useIsPro } from "@/services/pro";
import { hapticSuccess } from "@/utils/haptics";
import type { TranslationKey } from "@/localization/i18n";

type IconName = ComponentProps<typeof Ionicons>["name"];

const FEATURES: { icon: IconName; key: TranslationKey }[] = [
  { icon: "briefcase-outline", key: "pro.features.incomes" },
  { icon: "calendar-outline", key: "pro.features.projection" },
  { icon: "notifications-outline", key: "pro.features.reminders" },
  { icon: "wallet-outline", key: "pro.features.setAsides" },
  { icon: "create-outline", key: "pro.features.overrides" },
  { icon: "time-outline", key: "pro.features.history" },
  { icon: "document-text-outline", key: "pro.features.csv" },
];

const SKUS = [PRO_PRODUCT_ID];

/** The one paywall: what Pro adds, the store's localized price, Buy and Restore Purchases. */
export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const t = useT();
  const isPro = useIsPro();
  const [priceFailed, setPriceFailed] = useState(false);
  const [busy, setBusy] = useState<"buy" | "restore" | undefined>();

  const { connected, products, fetchProducts, requestPurchase, restorePurchases } = useIAP();

  const product = useMemo(() => products.find((p) => p.id === PRO_PRODUCT_ID), [products]);

  const loadPrice = useCallback(() => {
    fetchProducts({ skus: SKUS, type: "in-app" }).then(
      () => setPriceFailed(false),
      () => setPriceFailed(true)
    );
  }, [fetchProducts]);

  useEffect(() => {
    if (connected && !product) {
      loadPrice();
    }
  }, [connected, product, loadPrice]);

  // The root entitlement hook flips isPro when the store reports the purchase
  const handleBuy = useCallback(async () => {
    setBusy("buy");
    try {
      await requestPurchase({
        request: { apple: { sku: PRO_PRODUCT_ID }, google: { skus: SKUS } },
        type: "in-app",
      });
    } catch {
      // Reported through the root hook's onPurchaseError
    } finally {
      setBusy(undefined);
    }
  }, [requestPurchase]);

  const handleRestore = useCallback(async () => {
    setBusy("restore");
    try {
      await restorePurchases();
      const restored = await refreshProEntitlement();
      if (restored) {
        hapticSuccess();
        toast.success(t("pro.restored"));
      } else {
        toast(t("pro.nothingToRestore"));
      }
    } catch {
      toast.error(t("pro.priceUnavailable"));
    } finally {
      setBusy(undefined);
    }
  }, [restorePurchases, t]);

  const handleDone = useCallback(() => {
    router.back();
  }, [router]);

  const containerStyle = useMemo(() => ({ backgroundColor: colors.modalBackground }), [colors]);
  const heroStyle = useMemo(() => [styles.hero, { backgroundColor: colors.cardBackground }], [colors]);

  const priceBlock = product ? null : priceFailed ? (
    <View style={styles.priceState}>
      <AppText variant="meta" center>{t("pro.priceUnavailable")}</AppText>
      <AppButton title={t("pro.retry")} variant="outline" onPress={loadPrice} />
    </View>
  ) : (
    <View style={styles.priceState}>
      <ActivityIndicator color={colors.textSecondary} />
    </View>
  );

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={heroStyle}>
        <Ionicons name={isPro ? "checkmark-circle" : "sparkles"} size={40} color={colors.primaryText} />
        <AppText variant="title" center>{t(isPro ? "pro.unlockedTitle" : "pro.title")}</AppText>
        <AppText variant="meta" center>{t(isPro ? "pro.unlockedBody" : "pro.subtitle")}</AppText>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View key={feature.key} style={styles.feature}>
            <Ionicons name={feature.icon} size={22} color={colors.primaryText} />
            <AppText variant="body" style={styles.featureText}>{t(feature.key)}</AppText>
          </View>
        ))}
      </View>

      {isPro ? (
        <AppButton title={t("common.done")} onPress={handleDone} style={styles.primaryAction} />
      ) : (
        <>
          {priceBlock}
          <AppButton
            title={product ? t("pro.buy", { price: product.displayPrice }) : t("pro.oneTime")}
            onPress={handleBuy}
            disabled={!product || busy !== undefined}
            style={styles.primaryAction}
          />
          <AppButton
            title={t("pro.restore")}
            variant="outline"
            onPress={handleRestore}
            disabled={!connected || busy !== undefined}
            style={styles.secondaryAction}
          />
          <AppText variant="caption" center style={styles.footnote}>
            {t("pro.footnote")}
          </AppText>
        </>
      )}
      {busy ? <ActivityIndicator style={styles.busy} color={colors.textSecondary} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: MEASUREMENTS.spacing.gutter,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  hero: {
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    padding: MEASUREMENTS.spacing.xxl,
    borderRadius: MEASUREMENTS.radius.card,
  },
  features: {
    gap: MEASUREMENTS.spacing.lg,
    marginVertical: MEASUREMENTS.spacing.section,
    paddingHorizontal: MEASUREMENTS.spacing.sm,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.lg,
  },
  featureText: {
    flex: 1,
  },
  priceState: {
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
    marginBottom: MEASUREMENTS.spacing.lg,
    minHeight: 24,
  },
  primaryAction: {
    marginTop: MEASUREMENTS.spacing.xs,
  },
  secondaryAction: {
    marginTop: MEASUREMENTS.spacing.base,
  },
  footnote: {
    marginTop: MEASUREMENTS.spacing.lg,
    paddingHorizontal: MEASUREMENTS.spacing.md,
  },
  busy: {
    marginTop: MEASUREMENTS.spacing.lg,
  },
});

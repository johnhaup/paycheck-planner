import { useCallback, useEffect, useMemo, useState, type ComponentProps } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { PRO_PRODUCT_ID, refreshProEntitlement, useIsPro, useProStoreConnection } from "@/services/pro";
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

// The purchase footer is pinned like a toolbar, so its text stops growing here and the list keeps the room
const FOOTER_MAX_SCALE = 1.5;
// Past this the longest word of the tagline and rows (ml "ഓർമ്മപ്പെടുത്തലുകൾ", de "Einkommensquelle") is wider
// than a 375pt phone's row and iOS breaks it mid-word (React Native cannot hyphenate). The title scales
// freely: "Paycheck" at the largest size is 316pt, inside the 335pt row.
const LIST_MAX_SCALE = 2;
const FADE_HEIGHT = 32;

/**
 * The one paywall: what Pro adds in a list that scrolls behind a pinned footer with the store's
 * localized price, Buy and Restore Purchases (the layout every paywall shares, see the brain's principles).
 */
export default function PaywallScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const t = useT();
  const isPro = useIsPro();
  const [priceFailed, setPriceFailed] = useState(false);
  const [busy, setBusy] = useState<"buy" | "restore" | undefined>();
  const [restoreMessage, setRestoreMessage] = useState<string | undefined>();
  const [footerHeight, setFooterHeight] = useState(0);

  const { connected, products, fetchProducts, requestPurchase, restorePurchases } = useProStoreConnection();

  const product = useMemo(() => products.find((p) => p.id === PRO_PRODUCT_ID), [products]);

  const loadPrice = useCallback(() => {
    fetchProducts({ skus: SKUS, type: "in-app" }).then(
      () => setPriceFailed(false),
      () => setPriceFailed(true)
    );
  }, [fetchProducts]);

  // The root entitlement hook flips isPro when the store reports the purchase
  const handleBuy = useCallback(async () => {
    setBusy("buy");
    setRestoreMessage(undefined);
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

  // The outcome stays in the footer: a toast would be gone before a slow reader reaches it
  const handleRestore = useCallback(async () => {
    setBusy("restore");
    setRestoreMessage(undefined);
    try {
      await restorePurchases();
      const restored = await refreshProEntitlement();
      if (restored) {
        hapticSuccess();
        toast.success(t("pro.restored"));
      } else {
        setRestoreMessage(t("pro.nothingToRestore"));
      }
    } catch {
      setRestoreMessage(t("pro.priceUnavailable"));
    } finally {
      setBusy(undefined);
    }
  }, [restorePurchases, t]);

  const handleDone = useCallback(() => {
    router.back();
  }, [router]);

  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height);
  }, []);

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.modalBackground }],
    [colors]
  );
  const contentStyle = useMemo(() => [styles.content, { paddingBottom: footerHeight }], [footerHeight]);
  const scrollIndicatorInsets = useMemo(() => ({ bottom: footerHeight }), [footerHeight]);
  const fadeStyle = useMemo(
    () => [
      styles.fade,
      {
        experimental_backgroundImage: `linear-gradient(180deg, ${colors.modalBackgroundClear}, ${colors.modalBackground})`,
      },
    ],
    [colors]
  );
  const footerBodyStyle = useMemo(
    () => [
      styles.footerBody,
      { backgroundColor: colors.modalBackground, paddingBottom: insets.bottom + MEASUREMENTS.spacing.md },
    ],
    [colors, insets.bottom]
  );

  useEffect(() => {
    if (connected && !product) {
      loadPrice();
    }
  }, [connected, product, loadPrice]);

  const priceBlock = product ? null : priceFailed ? (
    <View style={styles.priceState} accessibilityLiveRegion="polite">
      <AppText variant="meta" center maxFontSizeMultiplier={FOOTER_MAX_SCALE}>
        {t("pro.priceUnavailable")}
      </AppText>
      <AppButton
        title={t("pro.retry")}
        variant="outline"
        onPress={loadPrice}
        maxFontSizeMultiplier={FOOTER_MAX_SCALE}
      />
    </View>
  ) : (
    <View style={styles.priceState}>
      <ActivityIndicator color={colors.textSecondary} />
    </View>
  );

  return (
    <View style={containerStyle}>
      <ScrollView
        contentContainerStyle={contentStyle}
        scrollIndicatorInsets={scrollIndicatorInsets}
        contentInsetAdjustmentBehavior="automatic"
      >
        <AppText variant="title">{t(isPro ? "pro.unlockedTitle" : "pro.title")}</AppText>
        <AppText variant="meta" style={styles.tagline} maxFontSizeMultiplier={LIST_MAX_SCALE}>
          {t(isPro ? "pro.unlockedBody" : "pro.subtitle")}
        </AppText>

        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.key} style={styles.feature}>
              <Ionicons name={feature.icon} size={22} color={colors.primaryText} />
              <AppText variant="body" style={styles.featureText} maxFontSizeMultiplier={LIST_MAX_SCALE}>
                {t(feature.key)}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Pinned over the list: the fade lets the rows scroll out behind the purchase controls */}
      <View style={styles.footer} onLayout={handleFooterLayout} pointerEvents="box-none">
        <View style={fadeStyle} pointerEvents="none" />
        <View style={footerBodyStyle}>
          {isPro ? (
            <AppButton title={t("common.done")} onPress={handleDone} maxFontSizeMultiplier={FOOTER_MAX_SCALE} />
          ) : (
            <>
              {priceBlock}
              <AppButton
                title={product ? t("pro.buy", { price: product.displayPrice }) : t("pro.oneTime")}
                onPress={handleBuy}
                disabled={!product || busy !== undefined}
                maxFontSizeMultiplier={FOOTER_MAX_SCALE}
              />
              <AppText variant="caption" center style={styles.footnote} maxFontSizeMultiplier={FOOTER_MAX_SCALE}>
                {t("pro.footnote")}
              </AppText>
              {restoreMessage ? (
                <AppText
                  variant="meta"
                  center
                  style={styles.restoreMessage}
                  accessibilityLiveRegion="polite"
                  maxFontSizeMultiplier={FOOTER_MAX_SCALE}
                >
                  {restoreMessage}
                </AppText>
              ) : null}
              {busy ? <ActivityIndicator style={styles.busy} color={colors.textSecondary} /> : null}
              <AppButton
                title={t("pro.restore")}
                variant="outline"
                onPress={handleRestore}
                disabled={!connected || busy !== undefined}
                style={styles.secondaryAction}
                maxFontSizeMultiplier={FOOTER_MAX_SCALE}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    paddingTop: MEASUREMENTS.spacing.base,
  },
  tagline: {
    marginTop: MEASUREMENTS.spacing.md,
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  fade: {
    height: FADE_HEIGHT,
  },
  footerBody: {
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
  },
  priceState: {
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
    marginBottom: MEASUREMENTS.spacing.lg,
    minHeight: 24,
  },
  footnote: {
    marginTop: MEASUREMENTS.spacing.base,
    paddingHorizontal: MEASUREMENTS.spacing.md,
  },
  restoreMessage: {
    marginTop: MEASUREMENTS.spacing.base,
  },
  busy: {
    marginTop: MEASUREMENTS.spacing.base,
  },
  secondaryAction: {
    marginTop: MEASUREMENTS.spacing.base,
  },
});

import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useColumns } from "@/hooks/useColumns";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { DIM_ON_PRESS } from "@/constants/press";
import { AppText } from "@/components/AppText";
import { markAllPaidHeaderRight } from "@/components/payDateDetail/MarkAllPaidButton";
import { useStore } from "@/store";
import { getPaycheckBills } from "@/utils/paycheckBills";

interface PayDateParams {
  payDate?: string;
  sourceId?: string;
}

export default function PaychecksLayout() {
  const colors = useColors();
  const router = useRouter();
  // With no top inset (iPhone Duo folded, and unfolded on its side) iOS hides the whole bar as the
  // list scrolls and brings it back with the large title expanded after a fold, over the pinned
  // month pills. The standard bar there keeps the height the pills pin under (HAU-568).
  // On a regular width (Duo unfolded) the picked paycheck sits beside the list under the same bar,
  // and a title that collapses with one of the two would not belong to the other.
  // There the tabs sit in iOS's sidebar, and closing it drops the bar's plain title for good; a title
  // view stays (HAU-706).
  const { top } = useSafeAreaInsets();
  const wide = useColumns() !== undefined;
  const screenOptions = useStackScreenOptions(top > 0 && !wide);
  const t = useT();

  const handleOpenSettings = useCallback(() => {
    router.push("/settings");
  }, [router]);

  const renderSettingsButton = useCallback(
    () => (
      <Pressable
        style={DIM_ON_PRESS}
        onPress={handleOpenSettings}
        hitSlop={MEASUREMENTS.hitSlop}
        accessibilityRole="button"
        accessibilityLabel={t("screens.settings")}
      >
        <Ionicons name="settings-outline" size={22} color={colors.textDefault} />
      </Pressable>
    ),
    [handleOpenSettings, colors, t]
  );

  const renderTitle = useCallback(
    () => (
      <AppText variant="bodyStrong" style={styles.title} accessibilityRole="header" numberOfLines={1} maxFontSizeMultiplier={1}>
        {t("tabs.paychecks")}
      </AppText>
    ),
    [t]
  );

  const indexOptions = useMemo(
    () => ({
      title: t("tabs.paychecks"),
      headerRight: renderSettingsButton,
      ...(wide ? { headerTitle: renderTitle } : {}),
    }),
    [renderSettingsButton, renderTitle, wide, t]
  );

  // Pay date is pushed in this tab's stack, not the root one: the root stack hides its bar for the
  // tabs, and a push that unhides it sometimes left the bar blank until the screen had landed
  // (#191, #204). Here the bar is already up, so its items change with the slide like any push.
  // "Mark all paid" is declared with the route so it slides in too; the screen only adds or
  // removes it when that changes later (PayDateDetail).
  const payDateDetailOptions = useCallback(
    ({ route }: { route: { params?: object } }) => {
      const { payDate = "", sourceId = "" }: PayDateParams = route.params ?? {};
      const hasUnpaid = getPaycheckBills(useStore.getState(), payDate, sourceId).unpaidExpenseIds.length > 0;
      return {
        title: t("screens.payDate"),
        headerLargeTitle: false,
        headerRight: hasUnpaid ? markAllPaidHeaderRight(payDate, sourceId) : undefined,
      };
    },
    [t]
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
      <Stack.Screen name="pay-date-detail" options={payDateDetailOptions} />
    </Stack>
  );
}

// The size of iOS's own navigation bar title
const styles = StyleSheet.create({
  title: { fontSize: MEASUREMENTS.font.lg },
});

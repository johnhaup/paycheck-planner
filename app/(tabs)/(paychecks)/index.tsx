import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, StyleSheet, type FlatList } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import Ionicons from "@expo/vector-icons/Ionicons";
import { toast } from "sonner-native";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { usePaycheckCardRenderer } from "@/hooks/usePaycheckCardRenderer";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppHeroAmount } from "@/components/AppHeroAmount";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { MonthBarChart } from "@/components/paychecks/MonthBarChart";
import { Welcome } from "@/components/paychecks/Welcome";
import { buildMonthGroups } from "@/utils/paycheckMonths";
import { formatShortDate } from "@/utils/dates";
import { buildDemoData } from "@/utils/demoData";
import type { MonthGroup, PaycheckItem } from "@/components/paychecks/types";

const TODAY_ICON_SIZE = 22;
const NO_PAYCHECKS: PaycheckItem[] = [];
// The list header (month overview and chart) stays pinned while the cards scroll under it
const STICKY_HEADER = [0];
// Collapsed portrait iPhone navigation bar; the app is portrait-only and iPhone-only
const NAV_BAR_HEIGHT = 44;

function keyExtractor(item: PaycheckItem) {
  return item.key;
}

/** The first short paycheck outside the month on screen; the chart's red bar is easy to miss. */
function findShortElsewhere(months: MonthGroup[], selectedKey: string | undefined) {
  for (const month of months) {
    if (month.key === selectedKey) continue;
    const paycheck = month.paychecks.find((p) => p.remaining < 0);
    if (paycheck) return { monthKey: month.key, paycheck };
  }
  return undefined;
}

function getCurrentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

export default function PaychecksScreen() {
  const router = useRouter();
  const colors = useColors();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const paycheckOverrides = useStore((s) => s.paycheckOverrides);
  const renderPaycheck = usePaycheckCardRenderer();
  const insets = useSafeAreaInsets();
  const hasIncome = incomeSources.length > 0;

  // The selected month belongs to one dataset: when income comes back after
  // Erase all data (sample data or a new source) the screen opens on this month.
  // The list stays mounted across both states, so the reset is derived here
  // instead of by remounting.
  const [selection, setSelection] = useState(() => ({ monthKey: getCurrentMonthKey(), hasIncome }));
  if (selection.hasIncome !== hasIncome) {
    setSelection({ monthKey: getCurrentMonthKey(), hasIncome });
  }
  const selectedMonthKey = selection.monthKey;

  const setSelectedMonthKey = useCallback((monthKey: string) => {
    setSelection((current) => ({ ...current, monthKey }));
  }, []);

  // The list runs under the navigation bar so iOS can collapse the large title,
  // and React Native pins a sticky header to the list's top edge, which is under
  // that bar. Shift the pinned header down to the collapsed bar's bottom edge
  // once the scroll offset brings it there. Until the first scroll event the
  // offset is unknown, which the math below treats as no shift.
  const pinTop = insets.top + NAV_BAR_HEIGHT;
  const scrollY = useSharedValue(-Infinity);

  // iOS reports the resting offset under the expanded large title as the first
  // scroll event, when it applies the navigation bar inset at mount. That is the
  // offset to return to, since offset 0 is the collapsed-title position.
  const topOffset = useSharedValue<number | undefined>(undefined);

  const handleScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    topOffset.value ??= event.contentOffset.y;
  });

  // The list keeps its scroll offset across Erase all data because it stays
  // mounted, so the welcome screen and the next dataset would open under a
  // collapsed title. Scroll back to the top when income disappears or returns.
  const listRef = useRef<FlatList<PaycheckItem>>(null);
  useEffect(() => {
    if (topOffset.value !== undefined) {
      // From a collapsed title the first scroll expands the title, which grows the
      // top inset and shifts the offset past the top; the second lands on it.
      listRef.current?.scrollToOffset({ offset: topOffset.value, animated: false });
      listRef.current?.scrollToOffset({ offset: topOffset.value, animated: false });
    }
  }, [hasIncome, topOffset]);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.min(Math.max(scrollY.value + pinTop, 0), pinTop) }],
  }));

  const handleAddIncome = useCallback(() => {
    router.push("/income-form");
  }, [router]);

  const handleTrySample = useCallback(() => {
    useStore.setState({ ...buildDemoData(new Date()), paycheckOverrides: [] });
    toast(t("toasts.sampleLoaded"));
  }, [t]);

  const handleOpenHistory = useCallback(() => {
    router.push("/history");
  }, [router]);

  const handleGoToToday = useCallback(() => {
    setSelectedMonthKey(getCurrentMonthKey());
  }, [setSelectedMonthKey]);

  const months = useMemo(
    () => buildMonthGroups(incomeSources, expenses, assignments, paycheckOverrides, new Date()),
    // t changes with the language, which changes the month labels
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incomeSources, expenses, assignments, paycheckOverrides, t]
  );

  const selectedMonth = useMemo(
    () => months.find((m) => m.key === selectedMonthKey) ?? months[0],
    [months, selectedMonthKey]
  );

  // The current month can drop out of the list once its last paycheck passes,
  // so "today" is whichever month comes first.
  const isAwayFromToday = !!selectedMonth && selectedMonth.key !== months[0]?.key;

  const paychecks = useMemo(() => selectedMonth?.paychecks ?? NO_PAYCHECKS, [selectedMonth]);

  const currentMonthKey = getCurrentMonthKey();

  const shortElsewhere = useMemo(
    () => findShortElsewhere(months, selectedMonth?.key),
    [months, selectedMonth]
  );

  const handleShowShort = useCallback(() => {
    if (shortElsewhere) {
      setSelectedMonthKey(shortElsewhere.monthKey);
    }
  }, [shortElsewhere, setSelectedMonthKey]);

  const stickyHeaderStyle = useMemo(
    () => [styles.stickyHeader, { backgroundColor: colors.screenBackground }, pinStyle],
    [colors, pinStyle]
  );

  const listHeader = useMemo(
    () =>
      hasIncome && selectedMonth ? (
        <Animated.View style={stickyHeaderStyle}>
          <View style={styles.heroLabelRow}>
            <AppText variant="meta" style={styles.heroLabel}>
              {t("paychecks.leftAfterBills", { month: selectedMonth.longLabel })}
            </AppText>
            {isAwayFromToday ? (
              <Pressable
                onPress={handleGoToToday}
                hitSlop={MEASUREMENTS.hitSlop}
                accessibilityRole="button"
                accessibilityLabel={t("paychecks.goToThisMonth")}
              >
                <Ionicons name="today-outline" size={TODAY_ICON_SIZE} color={colors.primaryText} />
              </Pressable>
            ) : null}
          </View>
          <AppHeroAmount amount={selectedMonth.remaining} />
          <AppText variant="meta" style={styles.heroMeta}>
            {t("paychecks.heroMeta", {
              income: formatMoney(selectedMonth.income),
              assigned: formatMoney(selectedMonth.assigned),
            })}
          </AppText>
          {shortElsewhere ? (
            <Pressable style={styles.shortRow} onPress={handleShowShort} accessibilityRole="button">
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <AppText variant="meta" color="destructive" style={styles.shortText} numberOfLines={2}>
                {t("paychecks.shortAhead", {
                  date: formatShortDate(shortElsewhere.paycheck.date),
                  source: shortElsewhere.paycheck.sourceName,
                  amount: formatMoney(-shortElsewhere.paycheck.remaining),
                })}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color={colors.destructive} />
            </Pressable>
          ) : null}
          <View style={styles.chart}>
            <MonthBarChart
              months={months}
              selectedKey={selectedMonth.key}
              currentKey={currentMonthKey}
              onSelect={setSelectedMonthKey}
            />
          </View>
        </Animated.View>
      ) : undefined,
    [
      hasIncome,
      selectedMonth,
      months,
      currentMonthKey,
      isAwayFromToday,
      handleGoToToday,
      shortElsewhere,
      handleShowShort,
      setSelectedMonthKey,
      stickyHeaderStyle,
      colors,
      formatMoney,
      t,
    ]
  );

  // The section title scrolls with the first card rather than pinning with the header above it
  const renderItem = useCallback(
    ({ item, index }: { item: PaycheckItem; index: number }) => (
      <>
        {index === 0 && selectedMonth ? (
          <AppSectionHeader
            title={t("paychecks.monthPaychecks", { month: selectedMonth.longLabel })}
            trailing={String(selectedMonth.paychecks.length)}
          />
        ) : null}
        {renderPaycheck({ item })}
      </>
    ),
    [renderPaycheck, selectedMonth, t]
  );

  const listFooter = useMemo(
    () =>
      hasIncome ? (
        <Pressable
          style={styles.historyLink}
          onPress={handleOpenHistory}
          accessibilityRole="button"
          accessibilityLabel={t("paychecks.pastPaychecks")}
        >
          <AppText variant="bodyStrong" color="primaryText">{t("paychecks.pastPaychecks")}</AppText>
          <Ionicons name="chevron-forward" size={16} color={colors.primaryText} />
        </Pressable>
      ) : undefined,
    [hasIncome, handleOpenHistory, colors, t]
  );

  const listEmpty = useMemo(
    () => (hasIncome ? undefined : <Welcome onAddIncome={handleAddIncome} onTrySample={handleTrySample} />),
    [hasIncome, handleAddIncome, handleTrySample]
  );

  // The list is the screen's root in both the welcome and the paychecks state:
  // iOS only collapses the large title into the header when the scroll view
  // is the first view, and swapping roots after the store rehydrates drops it.
  return (
    <Animated.FlatList
      ref={listRef}
      style={styles.list}
      data={paychecks}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={listEmpty}
      stickyHeaderIndices={STICKY_HEADER}
      contentInsetAdjustmentBehavior="automatic"
      scrollToOverflowEnabled
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  stickyHeader: {
    // Bleed past the list gutter so cards never peek out beside the pinned header
    marginHorizontal: -MEASUREMENTS.spacing.gutter,
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    paddingTop: MEASUREMENTS.spacing.md,
    paddingBottom: MEASUREMENTS.spacing.base,
  },
  heroLabelRow: {
    // Reserve the icon's height so the hero does not jump when it appears
    minHeight: TODAY_ICON_SIZE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: MEASUREMENTS.spacing.md,
  },
  heroLabel: {
    flexShrink: 1,
  },
  heroMeta: {
    marginTop: MEASUREMENTS.spacing.xs,
  },
  shortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
    marginTop: MEASUREMENTS.spacing.base,
  },
  shortText: {
    flexShrink: 1,
  },
  historyLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: MEASUREMENTS.spacing.xs,
    paddingVertical: MEASUREMENTS.spacing.base,
  },
  chart: {
    marginTop: MEASUREMENTS.spacing.xl,
    marginHorizontal: -MEASUREMENTS.spacing.gutter,
  },
});

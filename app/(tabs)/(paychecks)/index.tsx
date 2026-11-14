import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, View, Pressable, StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useDerivedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import { format, startOfDay } from "date-fns";
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
import { CHART_STRIP_HEIGHT, MonthBarChart } from "@/components/paychecks/MonthBarChart";
import { PaycheckCell, PaycheckCellLayoutsContext } from "@/components/paychecks/PaycheckCell";
import { PinnedHeader, PinnedHeaderShift } from "@/components/paychecks/PinnedHeader";
import { ProUnlockRow } from "@/components/paychecks/ProUnlockRow";
import { Welcome } from "@/components/paychecks/Welcome";
import { buildMonthGroups, FULL_MONTHS_AHEAD, hasEarlierMonths, PAST_MONTHS } from "@/utils/paycheckMonths";
import { useProGate } from "@/hooks/useProGate";
import { formatShortDate } from "@/utils/dates";
import { buildDemoData } from "@/utils/demoData";
import type { PaycheckRow } from "@/components/paychecks/types";

const TODAY_ICON_SIZE = 22;
// The list header (month overview and chart) stays pinned while the cards scroll under it.
// The index only tells the list which child to wrap in PinnedHeader, which does the pinning.
const STICKY_HEADER = [0];
// Collapsed portrait iPhone navigation bar; the app is portrait-only and iPhone-only
const NAV_BAR_HEIGHT = 44;
// Once collapsed, the pinned header shows the month pills with room above them
// (clear of the navigation bar's edge blur) and its own bottom padding
const COLLAPSED_HEADER_HEIGHT = MEASUREMENTS.spacing.lg + CHART_STRIP_HEIGHT + MEASUREMENTS.spacing.base;
// A jump to a row that is not laid out yet is tried again until the list has mounted it
const JUMP_TRIES = 60;
const JUMP_RETRY_MS = 50;
// A jump that lands is repeated: one from under the expanded large title lands off by the
// title bar, which collapses and shifts the offset on the way, and rows measured since
// the first try move the target
const JUMP_CONFIRMS = 2;
// A hidden list is shown this long after its jump lands, once the repeats are through
const SHOW_AFTER_LANDING_MS = 150;
const SHOW_FALLBACK_MS = 1000;
// A month counts as on top once its title is within this of the header's bottom edge
const MONTH_TOP_SLACK = 2;
const PAYCHECKS_TAB = "(paychecks)";
// Reanimated's own Animated.FlatList takes the cell renderer for itself
const PaycheckList = Animated.createAnimatedComponent(FlatList<PaycheckRow>);
const INITIAL_ROWS_AFTER_HOME = 6;
// In screen heights, the unit of `windowSize`
const ALL_ROWS_WINDOW = 1000;

function keyExtractor(row: PaycheckRow) {
  return row.paycheck.key;
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
  const { isPro, openPaywall } = useProGate();

  // The selected month belongs to one dataset: when income comes back after
  // Erase all data (sample data or a new source) the screen opens on the current
  // paycheck's month, which is what no selection means. The list stays mounted
  // across both states, so the reset is derived here instead of by remounting.
  const [selection, setSelection] = useState<{ monthKey?: string; hasIncome: boolean }>(() => ({ hasIncome }));
  if (selection.hasIncome !== hasIncome) {
    setSelection({ hasIncome });
  }

  const setSelectedMonthKey = useCallback((monthKey: string | undefined) => {
    setSelection((current) => (current.monthKey === monthKey ? current : { ...current, monthKey }));
  }, []);

  const months = useMemo(
    () =>
      buildMonthGroups(
        incomeSources,
        expenses,
        assignments,
        paycheckOverrides,
        new Date(),
        isPro ? FULL_MONTHS_AHEAD.pro : FULL_MONTHS_AHEAD.free,
        isPro ? PAST_MONTHS.pro : PAST_MONTHS.free
      ),
    // t changes with the language, which changes the month labels
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incomeSources, expenses, assignments, paycheckOverrides, isPro, t]
  );

  // One list through every month, oldest first
  const rows = useMemo(() => {
    const all = months.flatMap((month, monthIndex) =>
      month.paychecks.map(
        (paycheck, index): PaycheckRow => ({ paycheck, month, monthIndex, monthStart: index === 0, last: false })
      )
    );
    const last = all.at(-1);
    if (last) last.last = true;
    return all;
  }, [months]);

  // Home is the paycheck nearest today: the next one, or today's. The list opens on it.
  const homeIndex = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    const index = rows.findIndex((row) => row.paycheck.date.getTime() >= today);
    return index < 0 ? rows.length - 1 : index;
  }, [rows]);
  const homeMonth = rows[homeIndex]?.month;

  const selectedMonth = useMemo(
    () => months.find((m) => m.key === selection.monthKey) ?? homeMonth,
    [months, selection.monthKey, homeMonth]
  );

  const isAwayFromToday = selectedMonth !== homeMonth;

  // The list runs under the navigation bar so iOS can collapse the large title,
  // so the header pins against the collapsed bar's bottom edge, not the list's
  // top edge. Until the first scroll event the offset is unknown, which the
  // math below treats as not pinned.
  const pinTop = insets.top + NAV_BAR_HEIGHT;
  const scrollY = useSharedValue(-Infinity);

  // iOS reports the resting offset under the expanded large title as the first
  // scroll event, when it applies the navigation bar inset at mount. That is the
  // offset to return to, since offset 0 is the collapsed-title position.
  const topOffset = useSharedValue<number | undefined>(undefined);

  const headerHeight = useSharedValue(0);
  const collapseDistance = useDerivedValue(() => Math.max(0, headerHeight.value - COLLAPSED_HEADER_HEIGHT));

  // 0 shows the whole header, 1 only the month pills. Scrolling forward in time
  // collapses it and scrolling back brings it out again, anywhere in the list;
  // from the top of the list that is the same as collapsing with the large title.
  const collapse = useSharedValue(0);
  // How far the list was past the collapsed title at the last scroll event
  const lastPastTitle = useSharedValue<number | undefined>(undefined);
  // After a jump the header and the selected month are the jump's, not its scroll events,
  // until the list is dragged again. A timer cannot end it: the scroll a jump asks for
  // is carried out whenever the UI thread gets to it.
  const jumping = useSharedValue(false);
  // The same for this thread: a shared value set here still reads as its old value until the UI thread has it
  const jumpingRef = useRef(false);
  const endJump = useCallback(() => {
    jumpingRef.current = false;
  }, []);
  // The first jump of a dataset happens before anything is laid out; the list stays unseen until it lands
  const hidden = useSharedValue(false);
  const showSoon = useCallback(() => {
    setTimeout(() => hidden.set(false), SHOW_AFTER_LANDING_MS);
  }, [hidden]);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      topOffset.value ??= y;
      // The bounce at either end is not a change of direction
      const end = event.contentSize.height - event.layoutMeasurement.height;
      const pastTitle = Math.max(0, Math.min(y, end) + pinTop);
      const distance = collapseDistance.value;
      if (!jumping.value && distance > 0 && lastPastTitle.value !== undefined) {
        const next = collapse.value + (pastTitle - lastPastTitle.value) / distance;
        collapse.value = Math.min(1, Math.max(0, next));
      }
      lastPastTitle.value = pastTitle;
      if (jumping.value && hidden.value) scheduleOnRN(showSoon);
    },
    onBeginDrag: () => {
      jumping.value = false;
      scheduleOnRN(endJump);
    },
  });

  // Past the collapsed title PinnedHeader pushes the header down the content as
  // fast as the content scrolls up, less whatever part of it has collapsed
  // under the navigation bar.
  const pinShift = useDerivedValue(() => {
    if (scrollY.value === -Infinity) return 0;
    return Math.max(0, scrollY.value + pinTop - collapse.value * collapseDistance.value);
  });

  // The summary slides under the navigation bar as the chart collapses
  const summaryFade = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - collapse.value * 1.5) }));

  // Scrolls a row to just under the whole header. Right after launch the later
  // rows are not mounted yet; the jump is tried again until its row is.
  const listRef = useRef<FlatList<PaycheckRow>>(null);
  const headerHeightRef = useRef(0);
  const jump = useRef<{ index: number; timer?: ReturnType<typeof setTimeout>; failed?: boolean }>(undefined);

  const attemptJump = useCallback(() => {
    const attempt = (triesLeft: number, confirmsLeft: number) => {
      const list = listRef.current;
      const current = jump.current;
      // A drag ends the jump; a repeat that arrived after it would pull the list back
      if (!list || !current || !jumpingRef.current) return;
      clearTimeout(current.timer);
      current.failed = headerHeightRef.current === 0;
      if (current.failed) {
        // Nothing is laid out yet
      } else if (current.index === 0) {
        // The top of a large-title list is the offset iOS first reported, not 0.
        // From a collapsed title the first scroll expands the title, which grows the
        // top inset and shifts the offset past the top; the second lands on it.
        // Not when it is already there, as at launch: the scroll is carried out late
        // while the list mounts its rows, and would undo a scroll made in the meantime.
        const top = topOffset.get();
        if (top !== undefined && scrollY.get() !== top) {
          list.scrollToOffset({ offset: top, animated: false });
          list.scrollToOffset({ offset: top, animated: false });
        }
      } else {
        list.scrollToIndex({ index: current.index, viewOffset: pinTop + headerHeightRef.current, animated: false });
      }
      if (current.failed ? triesLeft > 0 : confirmsLeft > 0) {
        current.timer = setTimeout(
          () => attempt(triesLeft - 1, current.failed ? JUMP_CONFIRMS : confirmsLeft - 1),
          JUMP_RETRY_MS
        );
        return;
      }
      // The scroll is carried out later, much later while the list is still mounting rows.
      // Its scroll event shows the list; this is for a jump to where the list already is.
      current.timer = setTimeout(() => hidden.set(false), SHOW_FALLBACK_MS);
    };
    attempt(JUMP_TRIES, JUMP_CONFIRMS);
  }, [pinTop, topOffset, scrollY, hidden]);

  const jumpTo = useCallback(
    (index: number) => {
      clearTimeout(jump.current?.timer);
      jump.current = { index };
      jumpingRef.current = true;
      jumping.set(true);
      collapse.set(0);
      attemptJump();
    },
    [attemptJump, jumping, collapse]
  );

  const handleScrollToIndexFailed = useCallback(() => {
    if (jump.current) jump.current.failed = true;
  }, []);

  // A tap on the status bar scrolls to the top without a drag
  const handleScrollToTop = useCallback(() => {
    jumpingRef.current = false;
    jumping.set(false);
  }, [jumping]);

  const handleHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      headerHeight.set(height);
      if (headerHeightRef.current === height) return;
      headerHeightRef.current = height;
      // The header can change height with the month a jump selected; land under the new one
      if (jump.current) attemptJump();
    },
    [headerHeight, attemptJump]
  );

  const goHome = useCallback(() => {
    setSelectedMonthKey(undefined);
    jumpTo(homeIndex);
  }, [setSelectedMonthKey, jumpTo, homeIndex]);

  // The list stays mounted across Erase all data and keeps its scroll offset,
  // so the welcome screen opens at the top and every dataset on its current
  // paycheck: at launch, when income returns, and when rows are added before
  // the current paycheck (Pro's earlier months), which moves everything after them.
  useEffect(() => {
    hidden.set(hasIncome && homeIndex > 0);
    jumpTo(hasIncome ? homeIndex : 0);
  }, [hasIncome, homeIndex, jumpTo, hidden]);

  // Coming back from another tab opens on the current paycheck again. Closing a
  // sheet or the pay date screen does not: that leaves the tab without changing it.
  const segments: string[] = useSegments();
  const tab = segments[0] === "(tabs)" ? segments[1] : undefined;
  const lastTab = useRef(tab);
  useEffect(() => {
    if (!tab) return;
    if (tab === PAYCHECKS_TAB && lastTab.current !== PAYCHECKS_TAB) goHome();
    lastTab.current = tab;
  }, [tab, goHome]);

  const handleSelectMonth = useCallback(
    (monthKey: string) => {
      const index = rows.findIndex((row) => row.month.key === monthKey);
      if (index < 0) return;
      setSelectedMonthKey(monthKey);
      jumpTo(index);
    },
    [rows, setSelectedMonthKey, jumpTo]
  );

  // The selected month follows the scroll: it is the last month whose first row
  // has reached the pinned header's bottom edge.
  const monthTops = useSharedValue<number[]>([]);
  const lastBottom = useSharedValue(0);
  const cellLayouts = useMemo(() => ({ monthTops, lastBottom }), [monthTops, lastBottom]);
  const monthCount = months.length;

  const topMonthIndex = useDerivedValue(() => {
    if (jumping.value || scrollY.value === -Infinity) return -1;
    const line = pinShift.value + headerHeight.value + MONTH_TOP_SLACK;
    let index = 0;
    while (index + 1 < monthCount && monthTops.value[index + 1] <= line) index++;
    return index;
  });

  const handleTopMonth = useCallback(
    (index: number) => {
      setSelectedMonthKey(months[index]?.key);
    },
    [months, setSelectedMonthKey]
  );

  useAnimatedReaction(
    () => topMonthIndex.value,
    (index, previous) => {
      if (index >= 0 && index !== previous) scheduleOnRN(handleTopMonth, index);
    }
  );

  // Room after the last month so that it too can scroll up to the pinned pills
  // and become the selected month, however few paychecks it has.
  const listHeight = useSharedValue(0);
  const handleListLayout = useCallback(
    (event: LayoutChangeEvent) => {
      listHeight.set(event.nativeEvent.layout.height);
    },
    [listHeight]
  );
  const tailStyle = useAnimatedStyle(() => {
    const lastTop = monthTops.value[monthCount - 1];
    const lastMonthHeight = lastTop === undefined ? 0 : Math.max(0, lastBottom.value - lastTop);
    return { height: Math.max(0, listHeight.value - pinTop - COLLAPSED_HEADER_HEIGHT - lastMonthHeight) };
  });

  const handleAddIncome = useCallback(() => {
    router.push("/income-form");
  }, [router]);

  const handleTrySample = useCallback(() => {
    useStore.setState({ ...buildDemoData(new Date()), paycheckOverrides: [] });
    toast(t("toasts.sampleLoaded"));
  }, [t]);

  // The first short paycheck still to come outside the month on screen; the chart's red bar is easy to miss
  const shortElsewhereIndex = useMemo(
    () => rows.findIndex((row, index) => index >= homeIndex && row.month !== selectedMonth && row.paycheck.remaining < 0),
    [rows, homeIndex, selectedMonth]
  );
  const shortElsewhere = rows[shortElsewhereIndex];

  const handleShowShort = useCallback(() => {
    if (shortElsewhere) {
      setSelectedMonthKey(shortElsewhere.month.key);
      jumpTo(shortElsewhereIndex);
    }
  }, [shortElsewhere, shortElsewhereIndex, setSelectedMonthKey, jumpTo]);

  const stickyHeaderStyle = useMemo(
    () => [styles.stickyHeader, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  const currentMonthKey = format(new Date(), "yyyy-MM");

  const listHeader = useMemo(
    () =>
      hasIncome && selectedMonth ? (
        <View style={stickyHeaderStyle} onLayout={handleHeaderLayout}>
          <Animated.View style={summaryFade}>
            <View style={styles.heroLabelRow}>
              <AppText variant="meta" style={styles.heroLabel}>
                {t("paychecks.leftAfterBills", { month: selectedMonth.longLabel })}
              </AppText>
              {isAwayFromToday ? (
                <Pressable
                  onPress={goHome}
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
                <AppText variant="meta" color="destructive" style={styles.shortText}>
                  {t("paychecks.shortAhead", {
                    date: formatShortDate(shortElsewhere.paycheck.date),
                    source: shortElsewhere.paycheck.sourceName,
                    amount: formatMoney(-shortElsewhere.paycheck.remaining),
                  })}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.destructive} />
              </Pressable>
            ) : null}
          </Animated.View>
          <View style={styles.chart}>
            <MonthBarChart
              months={months}
              selectedKey={selectedMonth.key}
              currentKey={currentMonthKey}
              onSelect={handleSelectMonth}
              onLockedPress={isPro ? undefined : openPaywall}
              collapse={collapse}
            />
          </View>
        </View>
      ) : undefined,
    [
      hasIncome,
      selectedMonth,
      months,
      currentMonthKey,
      isAwayFromToday,
      goHome,
      shortElsewhere,
      handleShowShort,
      handleSelectMonth,
      isPro,
      openPaywall,
      stickyHeaderStyle,
      handleHeaderLayout,
      summaryFade,
      collapse,
      colors,
      formatMoney,
      t,
    ]
  );

  // Free shows this month and next. Where the months Pro adds would continue,
  // before the first row and after the last, a row opens the paywall instead.
  const showEarlierMonths = useMemo(
    () => !isPro && hasEarlierMonths(incomeSources, new Date(), PAST_MONTHS.free),
    [isPro, incomeSources]
  );

  // Each month's title scrolls with its first card rather than pinning with the header above it
  const renderItem = useCallback(
    ({ item, index }: { item: PaycheckRow; index: number }) => (
      <>
        {index === 0 && showEarlierMonths ? (
          <ProUnlockRow label={t("pro.earlierMonths")} onPress={openPaywall} />
        ) : null}
        {item.monthStart ? (
          <AppSectionHeader
            title={t("paychecks.monthPaychecks", { month: item.month.longLabel })}
            trailing={String(item.month.paychecks.length)}
          />
        ) : null}
        {renderPaycheck({ item: item.paycheck })}
      </>
    ),
    [renderPaycheck, showEarlierMonths, openPaywall, t]
  );

  const listFooter = useMemo(
    () =>
      hasIncome ? (
        <>
          {isPro ? null : <ProUnlockRow label={t("pro.features.projection")} onPress={openPaywall} />}
          <Animated.View style={tailStyle} />
        </>
      ) : undefined,
    [hasIncome, isPro, openPaywall, tailStyle, t]
  );

  const listEmpty = useMemo(
    () => (hasIncome ? undefined : <Welcome onAddIncome={handleAddIncome} onTrySample={handleTrySample} />),
    [hasIncome, handleAddIncome, handleTrySample]
  );

  const hiddenStyle = useAnimatedStyle(() => ({ opacity: hidden.value ? 0 : 1 }));
  const listStyle = useMemo(() => [styles.list, hiddenStyle], [hiddenStyle]);

  // The list is the screen's root in both the welcome and the paychecks state:
  // iOS only collapses the large title into the header when the scroll view
  // is the first view, and swapping roots after the store rehydrates drops it.
  return (
    <PinnedHeaderShift value={pinShift}>
      <PaycheckCellLayoutsContext value={cellLayouts}>
        <PaycheckList
          ref={listRef}
          style={listStyle}
          data={rows}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          CellRendererComponent={PaycheckCell}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          ListEmptyComponent={listEmpty}
          stickyHeaderIndices={STICKY_HEADER}
          StickyHeaderComponent={PinnedHeader}
          // Android clips every row away once the list has a custom sticky header (the screen came up
          // empty under the pinned header); clipping buys little here
          removeClippedSubviews={false}
          // Every row before the current paycheck, so the opening jump knows where it is
          initialNumToRender={homeIndex + INITIAL_ROWS_AFTER_HOME}
          // Every row stays mounted; the list only spreads mounting them over the first second.
          // A row's position is then always measured: with rows left out the list estimates
          // their heights, and what is on screen shifts as the real ones come in.
          windowSize={ALL_ROWS_WINDOW}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          onScrollToTop={handleScrollToTop}
          onLayout={handleListLayout}
          contentInsetAdjustmentBehavior="automatic"
          scrollToOverflowEnabled
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      </PaycheckCellLayoutsContext>
    </PinnedHeaderShift>
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
  chart: {
    marginTop: MEASUREMENTS.spacing.xl,
    marginHorizontal: -MEASUREMENTS.spacing.gutter,
  },
});

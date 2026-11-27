import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, View, Platform, Pressable, StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useDerivedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useSegments } from "expo-router";
import { format, startOfDay } from "date-fns";
import Ionicons from "@expo/vector-icons/Ionicons";
import { toast } from "sonner-native";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { usePaycheckCardRenderer } from "@/hooks/usePaycheckCardRenderer";
import { useFocusedStore } from "@/hooks/useFocusedStore";
import { useGutters } from "@/hooks/useGutters";
import { useColumns } from "@/hooks/useColumns";
import { usePaycheckSelectionStore } from "@/stores/paycheckSelectionStore";
import { hapticSelection } from "@/utils/haptics";
import { PayDateDetail } from "@/components/payDateDetail/PayDateDetail";
import { FORWARD_CHEVRON, LARGE_TITLE_LIST, LARGE_TITLE_LIST_CONTENT } from "@/constants/direction";
import { MEASUREMENTS } from "@/constants/measurements";
import { DIM_ON_PRESS, dimOnPress } from "@/constants/press";
import { AppText } from "@/components/AppText";
import { closeOpenSwipeRow } from "@/components/AppSwipeActions";
import { AppHeroAmount } from "@/components/AppHeroAmount";
import { AppCountUpText } from "@/components/AppCountUpText";
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
import { DURATION, FADE, TIMING } from "@/constants/motion";
import type { PaycheckRow } from "@/components/paychecks/types";

const TODAY_ICON_SIZE = 22;
// The list header (month overview and chart) stays pinned while the cards scroll under it.
// The index only tells the list which child to wrap in PinnedHeader, which does the pinning.
const STICKY_HEADER = [0];
// Collapsed portrait iPhone navigation bar; the app is portrait-only and iPhone-only
const NAV_BAR_HEIGHT = 44;
const REFLOW_SETTLE_MS = 400;
// Points of rows under the pinned header over which its divider fades in
const PINNED_DIVIDER_FADE = 8;
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
// A hidden list is shown this long after its last scroll event, once the repeats are through
const SHOW_AFTER_LANDING_MS = 150;
// How often a hidden list's jump is run again because iOS moved the list after it landed
const MAX_REJUMPS = 5;
const SHOW_FALLBACK_MS = 1000;
// A tapped jump lands unseen, as the opening jump does, but its rows are laid out and there is no
// launch inset to wait for: the list is shown this long after its last scroll event, or after the
// jump's last repeat when it did not move
const SHOW_AFTER_TAPPED_JUMP_MS = 60;
// The list fades out quickly so the tap answers at once, and back in at the usual fade
const JUMP_FADE_OUT = { duration: DURATION.press, reduceMotion: FADE.reduceMotion } as const;
// A part-collapsed header finishing its collapse once the list rests
const HEADER_EXPAND_MS = 300;
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
  const incomeSources = useFocusedStore((s) => s.incomeSources);
  const expenses = useFocusedStore((s) => s.expenses);
  const assignments = useFocusedStore((s) => s.assignments);
  const paycheckOverrides = useFocusedStore((s) => s.paycheckOverrides);
  const insets = useSafeAreaInsets();
  const { width: frameWidth, height: frameHeight } = useSafeAreaFrame();
  const hasIncome = incomeSources.length > 0;
  const { isPro, openPaywall } = useProGate();
  // Regular width (iPhone Duo unfolded): the list keeps to the first column and the picked paycheck is beside it
  const columns = useColumns();
  const picked = usePaycheckSelectionStore((s) => s.selected);
  const select = usePaycheckSelectionStore((s) => s.select);

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

  // The header never shrinks while the data stays the same. It sits above every row, so
  // a month whose header is shorter (fewer lines at a large text size) would move the
  // whole list as it scrolls to the top, and could move the month back out again (HAU-440).
  // The floor belongs to one header width too (see handleHeaderLayout).
  const [headerFloor, setHeaderFloor] = useState({ months, width: 0, height: 0 });
  if (headerFloor.months !== months) {
    setHeaderFloor({ months, width: 0, height: 0 });
  }

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

  // The paycheck beside the list: the one tapped, or the current one until then and when it is gone
  const shownPaycheck = useMemo(() => {
    if (!columns) return undefined;
    const row =
      (picked &&
        rows.find((r) => r.paycheck.payDate === picked.payDate && r.paycheck.sourceId === picked.sourceId)) ??
      rows[homeIndex];
    return row ? { payDate: row.paycheck.payDate, sourceId: row.paycheck.sourceId } : undefined;
  }, [columns, picked, rows, homeIndex]);

  const handleSelectPaycheck = useCallback(
    (payDate: string, sourceId: string) => {
      hapticSelection();
      select(payDate, sourceId);
    },
    [select]
  );

  const renderPaycheck = usePaycheckCardRenderer(shownPaycheck, columns ? handleSelectPaycheck : undefined);

  const selectedMonth = useMemo(
    () => months.find((m) => m.key === selection.monthKey) ?? homeMonth,
    [months, selection.monthKey, homeMonth]
  );

  const isAwayFromToday = selectedMonth !== homeMonth;

  // The list runs under the navigation bar so iOS can collapse the large title,
  // so the header pins against the collapsed bar's bottom edge, not the list's
  // top edge. Until the first scroll event the offset is unknown, which the
  // math below treats as not pinned. Android's toolbar is opaque and the list
  // starts below it, so there the header pins against the list's own top edge;
  // the iOS distance pushed the whole header 90dp down over the first card (HAU-357).
  // With no top inset (iPhone Duo folded, and unfolded on its side) and on a regular width (Duo unfolded,
  // where the paycheck beside the list has no title to collapse) the layout turns the large title off,
  // and the list starts below the standard bar as on Android (HAU-568).
  const pinTop = Platform.OS === "ios" && insets.top > 0 && !columns ? insets.top + NAV_BAR_HEIGHT : 0;
  // A jump reads it when it runs: a fold changes it, and that alone must not send the list home
  const pinTopRef = useRef(pinTop);
  useEffect(() => {
    pinTopRef.current = pinTop;
  }, [pinTop]);
  const scrollY = useSharedValue(-Infinity);

  // iOS reports the resting offset under the expanded large title as the first
  // scroll event, when it applies the navigation bar inset at mount: minus the bar and the
  // large title. The top of the list is minus the bar and that title height, since offset 0 is the
  // collapsed-title position; an iPhone Duo's bar changes with the fold, so the height is kept, not the offset.
  // Without a large title (pinTop 0) the list starts below the bar and its top is 0. A folded iPhone Duo
  // still reports a passing -58 first, from a layout with the large title on (HAU-629), so a session
  // that starts without one (null) learns no height.
  // Undefined until the first scroll event.
  const titleHeight = useSharedValue<number | null | undefined>(undefined);

  const headerHeight = useSharedValue(0);
  const collapseDistance = useDerivedValue(() => Math.max(0, headerHeight.value - COLLAPSED_HEADER_HEIGHT));

  // 0 shows the whole header, 1 only the month pills. Scrolling forward in time collapses it,
  // anywhere in the list; scrolling back leaves it collapsed until the content above it runs out,
  // so it comes out only at the top of the list, as it would with the large title (HAU-854).
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
  // While the opening jump is unseen iOS can still move the list: on a cold launch it can apply
  // the navigation bar's inset after the jump has landed, which takes the offset off it by that
  // inset (HAU-321). A scroll event that moves the list runs the jump again (`rejump`, set below
  // once the jump exists), and the list is shown once the offset holds still.
  const rejump = useRef<() => void>(undefined);
  // A tapped jump (chart, pill, Today, the short paycheck line) fades the rows out, lands unseen and
  // fades them back in under the header, which stays on screen (HAU-900). It scrolled with UIKit's animation before, and the pinned header cannot follow a
  // programmatic scroll: Reanimated's transform reached the screen only once the scroll stopped, so
  // the header rode along with the rows, mid-list, and the large title coming back cut the scroll short
  // into a snap (HAU-867). 1 shows the rows; `hidden` hides them whatever this is.
  const jumpFade = useSharedValue(1);
  // The jump under way: its row, and whether a tap asked for it
  const jump = useRef<{
    index: number;
    animated: boolean;
    timer?: ReturnType<typeof setTimeout>;
    failed?: boolean;
    rejumps?: number;
  }>(undefined);
  const showTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleHiddenScroll = useCallback(
    (moved: boolean) => {
      clearTimeout(showTimer.current);
      if (moved) rejump.current?.();
      showTimer.current = setTimeout(
        () => hidden.set(false),
        jump.current?.animated ? SHOW_AFTER_TAPPED_JUMP_MS : SHOW_AFTER_LANDING_MS
      );
    },
    [hidden]
  );

  // A scroll forward from a jump's landing that stops short of the collapse distance would leave the
  // header part way, and scrolling back keeps it there, so mid-list it would rest lower than every other
  // collapsed state (HAU-858). Once the list comes to rest a part-collapsed header finishes collapsing, as
  // far as the content above it allows; near the top that is where it already is. A header a jump left
  // all the way out stays out.
  const finishCollapse = () => {
    "worklet";
    const distance = collapseDistance.value;
    const current = collapse.value;
    if (jumping.value || distance <= 0 || current <= 0 || lastPastTitle.value === undefined) return;
    const target = Math.min(1, lastPastTitle.value / distance);
    if (target > current) collapse.value = withTiming(target, { duration: HEADER_EXPAND_MS });
  };

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const moved = y !== scrollY.value;
      scrollY.value = y;
      if (titleHeight.value === undefined) titleHeight.value = pinTop > 0 ? -y - pinTop : null;
      // The bounce at either end is not a change of direction
      const end = event.contentSize.height - event.layoutMeasurement.height;
      const pastTitle = Math.max(0, Math.min(y, end) + pinTop);
      const distance = collapseDistance.value;
      if (!jumping.value && distance > 0 && lastPastTitle.value !== undefined) {
        const forward = Math.max(0, pastTitle - lastPastTitle.value);
        const next = Math.min(collapse.value + forward / distance, pastTitle / distance);
        collapse.value = Math.min(1, Math.max(0, next));
      }
      lastPastTitle.value = pastTitle;
      if (jumping.value && hidden.value) scheduleOnRN(handleHiddenScroll, moved);
    },
    onEndDrag: () => {
      finishCollapse();
    },
    onMomentumEnd: () => {
      finishCollapse();
    },
    onBeginDrag: () => {
      jumping.value = false;
      // Nothing else shows a list hidden for a jump once the jump has ended
      hidden.set(false);
      scheduleOnRN(endJump);
      scheduleOnRN(closeOpenSwipeRow);
    },
  });

  // A fold or a turn of the unfolded screen moves the bar and the list under it, which the handler
  // above reads as scrolling and leaves the header part collapsed. Once it has settled the header
  // is put where scrolling down from the top to the same place would have left it.
  const reflowed = useRef(false);
  useEffect(() => {
    if (!reflowed.current) {
      reflowed.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (jumpingRef.current || scrollY.get() === -Infinity) return;
      const pastTitle = Math.max(0, scrollY.get() + pinTop);
      const distance = collapseDistance.get();
      // Not animated: the next scroll event would stop it part way
      collapse.set(distance > 0 ? Math.min(1, pastTitle / distance) : 0);
      lastPastTitle.set(pastTitle);
    }, REFLOW_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [frameWidth, frameHeight, pinTop, scrollY, collapseDistance, collapse, lastPastTitle]);

  // Past the collapsed title PinnedHeader pushes the header down the content as
  // fast as the content scrolls up, less whatever part of it has collapsed
  // under the navigation bar.
  const pinShift = useDerivedValue(() => {
    if (scrollY.value === -Infinity) return 0;
    return Math.max(0, scrollY.value + pinTop - collapse.value * collapseDistance.value);
  });

  // The summary slides under the navigation bar as the chart collapses
  const summaryFade = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - collapse.value * 1.5) }));
  // A hairline under the pinned header once rows scroll beneath it, so they read as passing under it, not cut off
  const pinnedDividerFade = useAnimatedStyle(() => ({ opacity: Math.min(1, pinShift.value / PINNED_DIVIDER_FADE) }));

  // Scrolls a row to just under the whole header. Right after launch the later
  // rows are not mounted yet; the jump is tried again until its row is.
  const listRef = useRef<FlatList<PaycheckRow>>(null);
  const headerHeightRef = useRef(0);

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
        // The top of a large-title list is above 0 by the bar and the title (see titleHeight).
        // From a collapsed title the first scroll expands the title, which grows the
        // top inset and shifts the offset past the top; the second lands on it.
        // Not when it is already there, as at launch: the scroll is carried out late
        // while the list mounts its rows, and would undo a scroll made in the meantime.
        // A list with no scroll event yet is at its top (HAU-631): a fold walk can pass a stale -41 otherwise.
        const height = titleHeight.get();
        const barTop = pinTopRef.current;
        const top = height === undefined ? undefined : barTop > 0 ? -(barTop + (height ?? 0)) : 0;
        const y = scrollY.get();
        if (top !== undefined && y !== -Infinity && y !== top) {
          list.scrollToOffset({ offset: top, animated: false });
          list.scrollToOffset({ offset: top, animated: false });
        }
      } else {
        list.scrollToIndex({ index: current.index, viewOffset: pinTopRef.current + headerHeightRef.current, animated: false });
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
      current.timer = setTimeout(
        () => hidden.set(false),
        current.animated ? SHOW_AFTER_TAPPED_JUMP_MS : SHOW_FALLBACK_MS
      );
    };
    attempt(JUMP_TRIES, JUMP_CONFIRMS);
  }, [titleHeight, scrollY, hidden]);

  // Lands on the row once the rows have faded out; a drag in the meantime ended the jump
  const landTappedJump = useCallback(() => {
    if (!jumpingRef.current) {
      jumpFade.set(withTiming(1, FADE));
      return;
    }
    hidden.set(true);
    attemptJump();
  }, [attemptJump, hidden, jumpFade]);

  // Animated for a tap the user watches (a fade); the opening jump and a tab return land at once
  const jumpTo = useCallback(
    (index: number, animated = false) => {
      clearTimeout(jump.current?.timer);
      jump.current = { index, animated };
      jumpingRef.current = true;
      jumping.set(true);
      if (animated) {
        // The header stays on screen and comes all the way out while the rows fade (HAU-900)
        collapse.set(withTiming(0, TIMING.move));
        jumpFade.set(
          withTiming(0, JUMP_FADE_OUT, (finished) => {
            if (finished) scheduleOnRN(landTappedJump);
          })
        );
        return;
      }
      // Also ends a tapped jump's fade that this one interrupts
      jumpFade.set(1);
      collapse.set(0);
      attemptJump();
    },
    [attemptJump, landTappedJump, jumping, collapse, jumpFade]
  );

  useEffect(() => {
    rejump.current = () => {
      const current = jump.current;
      if (!current || (current.rejumps ?? 0) >= MAX_REJUMPS) return;
      current.rejumps = (current.rejumps ?? 0) + 1;
      attemptJump();
    };
  }, [attemptJump]);

  const handleScrollToIndexFailed = useCallback(() => {
    if (jump.current) jump.current.failed = true;
  }, []);

  // A tap on the status bar scrolls to the top without a drag
  const handleScrollToTop = useCallback(() => {
    jumpingRef.current = false;
    jumping.set(false);
    hidden.set(false);
  }, [jumping, hidden]);

  const handleHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      headerHeight.set(height);
      setHeaderFloor((floor) => {
        if (width === floor.width) return height > floor.height ? { ...floor, height } : floor;
        // A fold lays the header out at a passing narrow width on its way to the new one (iPhone Duo),
        // where its text wraps and it grows. Kept as the floor, that height would make the header
        // collapse past the month pills and pin them under the bar (HAU-625). At a new width a
        // height no taller than the old floor may be the floor itself: drop it and measure again.
        return { ...floor, width, height: height > floor.height ? height : 0 };
      });
      if (headerHeightRef.current === height) return;
      headerHeightRef.current = height;
      // The header can change height with the month a jump selected; land under the new one
      if (jump.current) attemptJump();
    },
    [headerHeight, attemptJump]
  );

  const goHome = useCallback(
    (animated: boolean) => {
      setSelectedMonthKey(undefined);
      jumpTo(homeIndex, animated);
    },
    [setSelectedMonthKey, jumpTo, homeIndex]
  );

  const handleTodayPress = useCallback(() => goHome(true), [goHome]);

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
    if (tab === PAYCHECKS_TAB && lastTab.current !== PAYCHECKS_TAB) goHome(false);
    lastTab.current = tab;
  }, [tab, goHome]);

  const handleSelectMonth = useCallback(
    (monthKey: string) => {
      const index = rows.findIndex((row) => row.month.key === monthKey);
      if (index < 0) return;
      setSelectedMonthKey(monthKey);
      jumpTo(index, true);
    },
    [rows, setSelectedMonthKey, jumpTo]
  );

  // The selected month follows the scroll: it is the last month whose first row
  // has reached the pinned header's bottom edge.
  const monthTops = useSharedValue<number[]>([]);
  const lastBottom = useSharedValue(0);
  // A tapped jump fades the rows and the footer only; the pinned header stays as it is and shows the
  // new month at once. Fading the whole list blanked the header on every month change (HAU-900).
  const rowsFade = useAnimatedStyle(() => ({ opacity: hidden.value ? 0 : jumpFade.value }));
  const cellLayouts = useMemo(
    () => ({ monthTops, lastBottom, fade: rowsFade }),
    [monthTops, lastBottom, rowsFade]
  );
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

  // The first short paycheck still to come, outside the month on screen if there is one; the chart's
  // red bar is easy to miss. The line shows whichever month is on screen, so the header keeps its height.
  const shortElsewhereIndex = useMemo(() => {
    const isShortAhead = (row: PaycheckRow, index: number) => index >= homeIndex && row.paycheck.remaining < 0;
    const elsewhere = rows.findIndex((row, index) => isShortAhead(row, index) && row.month !== selectedMonth);
    return elsewhere >= 0 ? elsewhere : rows.findIndex(isShortAhead);
  }, [rows, homeIndex, selectedMonth]);
  const shortElsewhere = rows[shortElsewhereIndex];

  const handleShowShort = useCallback(() => {
    if (shortElsewhere) {
      setSelectedMonthKey(shortElsewhere.month.key);
      jumpTo(shortElsewhereIndex, true);
    }
  }, [shortElsewhere, shortElsewhereIndex, setSelectedMonthKey, jumpTo]);

  const shortRowStyle = useMemo(() => dimOnPress(styles.shortRow), []);

  const stickyHeaderStyle = useMemo(
    () => [styles.stickyHeader, { backgroundColor: colors.screenBackground, minHeight: headerFloor.height }],
    [colors, headerFloor.height]
  );
  const pinnedDividerStyle = useMemo(
    () => [styles.pinnedDivider, { backgroundColor: colors.border }, pinnedDividerFade],
    [colors, pinnedDividerFade]
  );

  const currentMonthKey = format(new Date(), "yyyy-MM");

  const heroMetaAmounts = useMemo(
    () => [selectedMonth?.income ?? 0, selectedMonth?.assigned ?? 0],
    [selectedMonth?.income, selectedMonth?.assigned]
  );
  const renderHeroMeta = useCallback(
    ([income, assigned]: readonly number[]) =>
      t("paychecks.heroMeta", { income: formatMoney(income), assigned: formatMoney(assigned) }),
    [t, formatMoney]
  );

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
                  style={DIM_ON_PRESS}
                  onPress={handleTodayPress}
                  hitSlop={MEASUREMENTS.hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={t("paychecks.goToThisMonth")}
                >
                  <Ionicons name="today-outline" size={TODAY_ICON_SIZE} color={colors.primaryText} />
                </Pressable>
              ) : null}
            </View>
            <AppHeroAmount amount={selectedMonth.remaining} />
            <AppCountUpText
              variant="meta"
              style={styles.heroMeta}
              amounts={heroMetaAmounts}
              render={renderHeroMeta}
            />
            {shortElsewhere ? (
              <Pressable style={shortRowStyle} onPress={handleShowShort} accessibilityRole="button">
                <Ionicons name="alert-circle" size={16} color={colors.destructive} />
                <AppText variant="meta" color="destructive" style={styles.shortText}>
                  {t("paychecks.shortAhead", {
                    date: formatShortDate(shortElsewhere.paycheck.date),
                    source: shortElsewhere.paycheck.sourceName,
                    amount: formatMoney(-shortElsewhere.paycheck.remaining),
                  })}
                </AppText>
                <Ionicons name={FORWARD_CHEVRON} size={16} color={colors.destructive} />
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
          <Animated.View style={pinnedDividerStyle} pointerEvents="none" />
        </View>
      ) : undefined,
    [
      hasIncome,
      selectedMonth,
      months,
      currentMonthKey,
      isAwayFromToday,
      handleTodayPress,
      shortElsewhere,
      handleShowShort,
      shortRowStyle,
      handleSelectMonth,
      isPro,
      openPaywall,
      stickyHeaderStyle,
      handleHeaderLayout,
      summaryFade,
      pinnedDividerStyle,
      collapse,
      colors,
      formatMoney,
      heroMetaAmounts,
      renderHeroMeta,
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
        <Animated.View style={rowsFade}>
          {isPro ? null : <ProUnlockRow label={t("pro.features.projection")} onPress={openPaywall} />}
          <Animated.View style={tailStyle} />
        </Animated.View>
      ) : undefined,
    [hasIncome, isPro, openPaywall, tailStyle, rowsFade, t]
  );

  const listEmpty = useMemo(
    () => (hasIncome ? undefined : <Welcome onAddIncome={handleAddIncome} onTrySample={handleTrySample} />),
    [hasIncome, handleAddIncome, handleTrySample]
  );

  // A tapped jump's rows fade back in once they are shown again
  useAnimatedReaction(
    () => hidden.value,
    (isHidden, wasHidden) => {
      if (!isHidden && wasHidden && jumpFade.get() < 1) jumpFade.set(withTiming(1, FADE));
    }
  );
  // The opening jump hides the whole list, header too, as it lands before anything is laid out. A tapped
  // jump only hides once its rows have faded out (`jumpFade` 0), and the header stays.
  const hiddenStyle = useAnimatedStyle(() => ({ opacity: hidden.value && jumpFade.value > 0 ? 0 : 1 }));
  const listStyle = useMemo(() => [styles.list, LARGE_TITLE_LIST, hiddenStyle], [hiddenStyle]);
  const gutters = useGutters();
  const showsPaycheck = hasIncome && columns !== undefined && shownPaycheck !== undefined;
  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      gutters,
      showsPaycheck ? { paddingRight: columns.pastMiddle } : undefined,
      LARGE_TITLE_LIST_CONTENT,
    ],
    [gutters, showsPaycheck, columns]
  );
  const paneStyle = useMemo(
    () =>
      columns
        ? [styles.pane, { width: columns.endWidth + gutters.paddingRight, backgroundColor: colors.screenBackground }]
        : undefined,
    [columns, gutters, colors]
  );
  const paneContentStyle = useMemo(
    () => ({
      // The date tile lines up with the first line of the list's header
      paddingTop: MEASUREMENTS.spacing.md,
      paddingLeft: 0,
      paddingRight: gutters.paddingRight,
      paddingBottom: insets.bottom + MEASUREMENTS.spacing.bottom,
    }),
    [gutters, insets.bottom]
  );

  // The list is the screen's root in both the welcome and the paychecks state:
  // iOS only collapses the large title into the header when the scroll view
  // is the first view, and swapping roots after the store rehydrates drops it.
  return (
    <>
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
          // Hands the cells the same renderItem while it is unchanged. Without it FlatList wraps it anew on
          // every render, so a month change (chart, pill, Go to this month) re-rendered every mounted row,
          // about 0.75 s on a dev build, and a tapped jump's list stayed blank until it was through (HAU-867)
          strictMode
          onScrollToIndexFailed={handleScrollToIndexFailed}
          onScrollToTop={handleScrollToTop}
          onLayout={handleListLayout}
          contentInsetAdjustmentBehavior="automatic"
          scrollToOverflowEnabled
          contentContainerStyle={listContentStyle}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        </PaycheckCellLayoutsContext>
      </PinnedHeaderShift>
      {showsPaycheck ? (
        <View style={paneStyle}>
          {/* Keyed: another paycheck is drawn afresh, its rows do not slide in from the last one's */}
          <PayDateDetail
            key={`${shownPaycheck.payDate}|${shownPaycheck.sourceId}`}
            payDate={shownPaycheck.payDate}
            sourceId={shownPaycheck.sourceId}
            contentContainerStyle={paneContentStyle}
            embedded
          />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  // Beside the list, from the window's middle to its end edge; the list is the screen's root view
  pane: {
    position: "absolute",
    top: 0,
    bottom: 0,
    end: 0,
  },
  stickyHeader: {
    // Bleed past the list gutter so cards never peek out beside the pinned header
    marginHorizontal: -MEASUREMENTS.spacing.gutter,
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    paddingTop: MEASUREMENTS.spacing.md,
    paddingBottom: MEASUREMENTS.spacing.base,
  },
  pinnedDivider: {
    position: "absolute",
    start: 0,
    end: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
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

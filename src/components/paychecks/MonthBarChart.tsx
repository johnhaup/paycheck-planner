import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from "react-native";
import Animated, { useAnimatedStyle, useDerivedValue, type SharedValue } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { hapticSelection } from "@/utils/haptics";
import { ProBadge } from "@/components/ProBadge";
import type { MonthGroup } from "@/components/paychecks/types";

const BAR_MAX_HEIGHT = 86;
const BAR_MIN_HEIGHT = 6;
const COLUMN_WIDTH = 46;
const COLUMN_GAP = MEASUREMENTS.spacing.md + 2;
const PILL_HEIGHT = 26;
const DOT_SIZE = 5;
const DOT_GAP = 3;
/** The month pills and the current-month dot under them: all of the chart that stays once it collapses */
export const CHART_STRIP_HEIGHT = PILL_HEIGHT + DOT_GAP + DOT_SIZE;
const COLUMN_HEIGHT = BAR_MAX_HEIGHT + 32 + CHART_STRIP_HEIGHT;
/** Space under the month label's text: the dot row plus the pill's padding below the text */
const LABEL_BOTTOM_INSET = DOT_GAP + DOT_SIZE + (PILL_HEIGHT - Math.ceil(MEASUREMENTS.font.sm * 1.2)) / 2;
/** The locked-months card never shrinks below this */
const LOCKED_MIN_WIDTH = 168;
/** Hex alpha for the tinted pill behind the selected or short month */
const PILL_TINT_ALPHA = "38";
/** Long month abbreviations (fr "janv.", vi "Tháng 10") and large Dynamic Type shrink this far before they would truncate */
const PILL_MIN_FONT_SCALE = 0.5;

interface Props {
  months: MonthGroup[];
  selectedKey: string;
  currentKey: string;
  onSelect: (key: string) => void;
  /** Free tier: a card after the last month opens the paywall for the months Pro adds */
  onLockedPress?: () => void;
  /** 0 shows the bars; 1 leaves only a row of month pills */
  collapse: SharedValue<number>;
}

/** Each bar is a month's money left after bills; tapping one selects that month. */
export function MonthBarChart({ months, selectedKey, currentKey, onSelect, onLockedPress, collapse }: Props) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollOffset = useRef(0);
  // The chart runs edge to edge, so the window is its viewport
  const { width: viewportWidth } = useWindowDimensions();
  const selectedIndex = months.findIndex((m) => m.key === selectedKey);

  const maxMagnitude = useMemo(
    () => Math.max(1, ...months.map((m) => Math.abs(m.remaining))),
    [months]
  );

  // The locked card takes whatever width the free months leave on screen
  const lockedWidth = Math.max(
    LOCKED_MIN_WIDTH,
    viewportWidth - 2 * MEASUREMENTS.spacing.gutter - months.length * (COLUMN_WIDTH + COLUMN_GAP)
  );

  // The bars fade out over the first half of the collapse and the pill fills fade in over the second
  const barsOpacity = useDerivedValue(() => Math.max(0, 1 - collapse.value * 2));
  const pillOpacity = useDerivedValue(() => Math.min(1, Math.max(0, collapse.value * 2 - 1)));

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.current = event.nativeEvent.contentOffset.x;
  }, []);

  // A month selected from elsewhere (Today, the shortfall line) can sit off
  // screen in a year of columns; scroll just enough to show it.
  useEffect(() => {
    if (selectedIndex < 0) return;
    const left = MEASUREMENTS.spacing.gutter + selectedIndex * (COLUMN_WIDTH + COLUMN_GAP);
    const right = left + COLUMN_WIDTH;
    const offset = scrollOffset.current;
    if (left < offset + MEASUREMENTS.spacing.gutter) {
      scrollRef.current?.scrollTo({ x: left - MEASUREMENTS.spacing.gutter, animated: true });
    } else if (right > offset + viewportWidth - MEASUREMENTS.spacing.gutter) {
      scrollRef.current?.scrollTo({ x: right + MEASUREMENTS.spacing.gutter - viewportWidth, animated: true });
    }
  }, [selectedIndex, viewportWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {months.map((month) => (
        <MonthBar
          key={month.key}
          month={month}
          maxMagnitude={maxMagnitude}
          selected={month.key === selectedKey}
          isCurrent={month.key === currentKey}
          onSelect={onSelect}
          barsOpacity={barsOpacity}
          pillOpacity={pillOpacity}
        />
      ))}
      {onLockedPress ? (
        <LockedMonths
          onPress={onLockedPress}
          width={lockedWidth}
          barsOpacity={barsOpacity}
          pillOpacity={pillOpacity}
        />
      ) : null}
    </ScrollView>
  );
}

interface MonthBarProps {
  month: MonthGroup;
  maxMagnitude: number;
  selected: boolean;
  isCurrent: boolean;
  onSelect: (key: string) => void;
  barsOpacity: SharedValue<number>;
  pillOpacity: SharedValue<number>;
}

function MonthBar({ month, maxMagnitude, selected, isCurrent, onSelect, barsOpacity, pillOpacity }: MonthBarProps) {
  const colors = useColors();
  const { compact } = useMoneyFormat();
  const t = useT();

  const handlePress = useCallback(() => {
    if (!selected) {
      hapticSelection();
    }
    onSelect(month.key);
  }, [onSelect, month.key, selected]);

  const barsStyle = useAnimatedStyle(() => ({ opacity: barsOpacity.value }));
  const pillFillStyle = useAnimatedStyle(() => ({ opacity: pillOpacity.value }));

  const barStyle = useMemo(() => {
    const height = Math.max(
      BAR_MIN_HEIGHT,
      Math.round((Math.abs(month.remaining) / maxMagnitude) * BAR_MAX_HEIGHT)
    );
    const fill =
      month.remaining < 0
        ? colors.destructive
        : selected
          ? colors.primary
          : colors.chartBar;
    return [styles.bar, { height, backgroundColor: fill }];
  }, [month.remaining, maxMagnitude, selected, colors]);

  // The collapsed pill keeps the bar's meaning: green tint when selected, red when the month runs short
  const pillFill = useMemo(() => {
    const backgroundColor = selected
      ? colors.primary + PILL_TINT_ALPHA
      : month.remaining < 0
        ? colors.destructive + PILL_TINT_ALPHA
        : colors.cardBackgroundElevated;
    return [styles.pillFill, { backgroundColor }, pillFillStyle];
  }, [selected, month.remaining, colors, pillFillStyle]);

  const barsGroupStyle = useMemo(() => [styles.bars, barsStyle], [barsStyle]);

  // Always rendered so every column keeps the same height
  const dotStyle = useMemo(
    () => [styles.dot, { backgroundColor: isCurrent ? colors.primary : "transparent" }],
    [isCurrent, colors]
  );

  const accessibilityState = useMemo(() => ({ selected }), [selected]);

  const labelColor = selected ? "textDefault" : isCurrent ? "primaryText" : "textMuted";
  const amount = compact(month.remaining);

  return (
    <Pressable
      style={styles.column}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={t(isCurrent ? "paychecks.chartBarCurrentLabel" : "paychecks.chartBarLabel", {
        month: month.longLabel,
        amount,
      })}
    >
      <Animated.View style={barsGroupStyle}>
        <AppText
          variant="caption"
          color={selected ? "textDefault" : "textMuted"}
          style={styles.value}
          numberOfLines={1}
        >
          {amount}
        </AppText>
        <View style={barStyle} />
      </Animated.View>
      <View style={styles.pill}>
        <Animated.View style={pillFill} />
        <AppText
          variant={selected ? "bodyStrong" : "meta"}
          color={labelColor}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={PILL_MIN_FONT_SCALE}
        >
          {month.shortLabel}
        </AppText>
      </View>
      <View style={dotStyle} />
    </Pressable>
  );
}

interface LockedMonthsProps {
  onPress: () => void;
  width: number;
  barsOpacity: SharedValue<number>;
  pillOpacity: SharedValue<number>;
}

/** The free tier's way to the rest of the year: a card beside the bars, a PRO pill once collapsed. */
function LockedMonths({ onPress, width, barsOpacity, pillOpacity }: LockedMonthsProps) {
  const colors = useColors();
  const t = useT();
  const label = t("pro.goProYear");

  const cardOpacity = useAnimatedStyle(() => ({ opacity: barsOpacity.value }));
  const badgeOpacity = useAnimatedStyle(() => ({ opacity: pillOpacity.value }));

  const columnStyle = useMemo(() => [styles.column, { width }], [width]);
  const cardStyle = useMemo(
    () => [
      styles.lockedCard,
      { backgroundColor: colors.cardBackground, borderColor: colors.primary + PILL_TINT_ALPHA },
      cardOpacity,
    ],
    [colors, cardOpacity]
  );
  const badgeStyle = useMemo(() => [styles.pill, badgeOpacity], [badgeOpacity]);

  return (
    <Pressable style={columnStyle} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Animated.View style={cardStyle}>
        <Ionicons name="sparkles" size={20} color={colors.primaryText} />
        <AppText variant="bodyStrong" color="primaryText" center numberOfLines={3}>
          {label}
        </AppText>
      </Animated.View>
      <Animated.View style={badgeStyle}>
        <ProBadge />
      </Animated.View>
      <View style={styles.dot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    gap: COLUMN_GAP,
    alignItems: "flex-end",
  },
  column: {
    width: COLUMN_WIDTH,
    height: COLUMN_HEIGHT,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bars: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    marginBottom: MEASUREMENTS.spacing.md,
  },
  value: {
    fontWeight: "600",
  },
  bar: {
    alignSelf: "stretch",
    borderRadius: MEASUREMENTS.radius.md,
  },
  pill: {
    height: PILL_HEIGHT,
    minWidth: COLUMN_WIDTH,
    paddingHorizontal: MEASUREMENTS.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  pillFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: PILL_HEIGHT / 2,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginTop: DOT_GAP,
  },
  // Spans the column from the top of the tallest bar's value to the bottom of the month labels' text
  lockedCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: LABEL_BOTTOM_INSET,
    alignItems: "center",
    justifyContent: "center",
    gap: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.card,
    borderWidth: 1,
  },
});

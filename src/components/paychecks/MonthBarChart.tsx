import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { hapticSelection } from "@/utils/haptics";
import type { MonthGroup } from "@/components/paychecks/types";

const BAR_MAX_HEIGHT = 86;
const BAR_MIN_HEIGHT = 6;
const COLUMN_WIDTH = 46;

interface Props {
  months: MonthGroup[];
  selectedKey: string;
  currentKey: string;
  onSelect: (key: string) => void;
}

/** Each bar is a month's money left after bills; tapping one selects that month. */
export function MonthBarChart({ months, selectedKey, currentKey, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const firstKey = months[0]?.key;

  const maxMagnitude = useMemo(
    () => Math.max(1, ...months.map((m) => Math.abs(m.remaining))),
    [months]
  );

  useEffect(() => {
    if (selectedKey === firstKey) {
      scrollRef.current?.scrollTo({ x: 0, animated: true });
    }
  }, [selectedKey, firstKey]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {months.map((month) => (
        <MonthBar
          key={month.key}
          month={month}
          maxMagnitude={maxMagnitude}
          selected={month.key === selectedKey}
          isCurrent={month.key === currentKey}
          onSelect={onSelect}
        />
      ))}
    </ScrollView>
  );
}

interface MonthBarProps {
  month: MonthGroup;
  maxMagnitude: number;
  selected: boolean;
  isCurrent: boolean;
  onSelect: (key: string) => void;
}

function MonthBar({ month, maxMagnitude, selected, isCurrent, onSelect }: MonthBarProps) {
  const colors = useColors();
  const { compact } = useMoneyFormat();
  const t = useT();

  const handlePress = useCallback(() => {
    if (!selected) {
      hapticSelection();
    }
    onSelect(month.key);
  }, [onSelect, month.key, selected]);

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
      <AppText
        variant="caption"
        color={selected ? "textDefault" : "textMuted"}
        style={styles.value}
        numberOfLines={1}
      >
        {amount}
      </AppText>
      <View style={barStyle} />
      <AppText variant={selected ? "bodyStrong" : "meta"} color={labelColor}>
        {month.shortLabel}
      </AppText>
      <View style={dotStyle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    gap: MEASUREMENTS.spacing.md + 2,
    alignItems: "flex-end",
  },
  column: {
    width: COLUMN_WIDTH,
    height: BAR_MAX_HEIGHT + 66,
    justifyContent: "flex-end",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: -MEASUREMENTS.spacing.sm,
  },
  value: {
    fontWeight: "600",
  },
  bar: {
    alignSelf: "stretch",
    borderRadius: MEASUREMENTS.radius.md,
  },
});

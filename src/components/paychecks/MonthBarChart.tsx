import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { formatCompactMoney } from "@/utils/money";
import type { MonthGroup } from "@/components/paychecks/types";

const BAR_MAX_HEIGHT = 86;
const BAR_MIN_HEIGHT = 6;
const COLUMN_WIDTH = 46;

interface Props {
  months: MonthGroup[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

/** Each bar is a month's money left after bills; tapping one selects that month. */
export function MonthBarChart({ months, selectedKey, onSelect }: Props) {
  const maxMagnitude = useMemo(
    () => Math.max(1, ...months.map((m) => Math.abs(m.remaining))),
    [months]
  );

  return (
    <ScrollView
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
  onSelect: (key: string) => void;
}

function MonthBar({ month, maxMagnitude, selected, onSelect }: MonthBarProps) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onSelect(month.key);
  }, [onSelect, month.key]);

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

  const accessibilityState = useMemo(() => ({ selected }), [selected]);

  return (
    <Pressable
      style={styles.column}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel={`${month.longLabel}, ${formatCompactMoney(month.remaining)} left`}
    >
      <AppText
        variant="caption"
        color={selected ? "textDefault" : "textMuted"}
        style={styles.value}
        numberOfLines={1}
      >
        {formatCompactMoney(month.remaining)}
      </AppText>
      <View style={barStyle} />
      <AppText
        variant={selected ? "bodyStrong" : "meta"}
        color={selected ? "textDefault" : "textMuted"}
      >
        {month.shortLabel}
      </AppText>
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
    height: BAR_MAX_HEIGHT + 56,
    justifyContent: "flex-end",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
  },
  value: {
    fontWeight: "600",
  },
  bar: {
    alignSelf: "stretch",
    borderRadius: MEASUREMENTS.radius.md,
  },
});

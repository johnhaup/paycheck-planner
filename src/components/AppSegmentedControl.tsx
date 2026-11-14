import { useCallback, useMemo } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { hapticSelection } from "@/utils/haptics";
import { ProBadge } from "@/components/ProBadge";

export interface SegmentOption<T> {
  value: T;
  label: string;
  /** Pro-only choice: shows the badge; the caller routes the selection to the paywall */
  pro?: boolean;
}

interface Props<T> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function AppSegmentedControl<T>({ options, value, onChange }: Props<T>) {
  const colors = useColors();
  // At accessibility text sizes the labels no longer fit side by side, so the segments stack
  const stacked = useAccessibilityTextSize();

  const trackStyle = useMemo(
    () => [styles.track, stacked ? styles.trackStacked : undefined, { backgroundColor: colors.segmentTrack }],
    [colors, stacked]
  );

  return (
    <View style={trackStyle} accessibilityRole="tablist">
      {options.map((option) => (
        <Segment
          key={String(option.value)}
          option={option}
          selected={option.value === value}
          stacked={stacked}
          onSelect={onChange}
        />
      ))}
    </View>
  );
}

interface SegmentProps<T> {
  option: SegmentOption<T>;
  selected: boolean;
  stacked: boolean;
  onSelect: (value: T) => void;
}

function Segment<T>({ option, selected, stacked, onSelect }: SegmentProps<T>) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    if (!selected) {
      hapticSelection();
    }
    onSelect(option.value);
  }, [onSelect, option.value, selected]);

  const segmentStyle = useMemo(
    () => [
      styles.segment,
      stacked ? undefined : styles.segmentInRow,
      selected ? { backgroundColor: colors.segmentSelected } : undefined,
    ],
    [selected, stacked, colors]
  );

  const accessibilityState = useMemo(() => ({ selected }), [selected]);

  return (
    <Pressable
      style={segmentStyle}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
    >
      <AppText
        variant="bodyStrong"
        color={selected ? "textDefault" : "textMuted"}
        numberOfLines={1}
        // Stacked, a label has the whole row; a word still wider than that shrinks instead of ending in "…"
        adjustsFontSizeToFit={stacked}
        minimumFontScale={0.5}
        style={stacked ? styles.labelStacked : undefined}
      >
        {option.label}
      </AppText>
      {option.pro ? <ProBadge /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: MEASUREMENTS.spacing.sm,
    gap: MEASUREMENTS.spacing.sm,
    borderRadius: MEASUREMENTS.radius.track,
  },
  trackStacked: {
    flexDirection: "column",
  },
  segmentInRow: {
    flex: 1,
  },
  labelStacked: {
    flexShrink: 1,
  },
  segment: {
    // Grows with the text: a fixed height clipped the labels at large text sizes
    minHeight: 36,
    paddingVertical: MEASUREMENTS.spacing.sm,
    borderRadius: MEASUREMENTS.radius.lg,
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: MEASUREMENTS.spacing.sm,
  },
});

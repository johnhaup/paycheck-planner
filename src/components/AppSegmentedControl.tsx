import { useCallback, useMemo } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { hapticSelection } from "@/utils/haptics";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
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
  // Side by side, a label at an accessibility size is cut to "Set-asi…" and a PRO badge is pushed out of its segment
  const stacked = useAccessibilityTextSize();

  const trackStyle = useMemo(
    () => [styles.track, stacked ? styles.trackStacked : undefined, { backgroundColor: colors.segmentTrack }],
    [stacked, colors]
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
      stacked ? styles.segmentStacked : styles.segmentInline,
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
        numberOfLines={stacked ? undefined : 1}
        center={stacked}
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
  segment: {
    borderRadius: MEASUREMENTS.radius.lg,
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: MEASUREMENTS.spacing.sm,
  },
  segmentInline: {
    flex: 1,
    height: 36,
  },
  // One option per line; a badge that does not fit beside its label drops under it
  segmentStacked: {
    minHeight: 36,
    flexWrap: "wrap",
    paddingVertical: MEASUREMENTS.spacing.sm,
  },
  labelStacked: {
    flexShrink: 1,
  },
});

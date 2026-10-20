import { useCallback, useMemo } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

export interface SegmentOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function AppSegmentedControl<T>({ options, value, onChange }: Props<T>) {
  const colors = useColors();

  const trackStyle = useMemo(
    () => [styles.track, { backgroundColor: colors.segmentTrack }],
    [colors]
  );

  return (
    <View style={trackStyle} accessibilityRole="tablist">
      {options.map((option) => (
        <Segment
          key={String(option.value)}
          option={option}
          selected={option.value === value}
          onSelect={onChange}
        />
      ))}
    </View>
  );
}

interface SegmentProps<T> {
  option: SegmentOption<T>;
  selected: boolean;
  onSelect: (value: T) => void;
}

function Segment<T>({ option, selected, onSelect }: SegmentProps<T>) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onSelect(option.value);
  }, [onSelect, option.value]);

  const segmentStyle = useMemo(
    () => [styles.segment, selected ? { backgroundColor: colors.segmentSelected } : undefined],
    [selected, colors]
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
      >
        {option.label}
      </AppText>
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
  segment: {
    flex: 1,
    height: 36,
    borderRadius: MEASUREMENTS.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: MEASUREMENTS.spacing.sm,
  },
});

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View, StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
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

const TRACK_PADDING = MEASUREMENTS.spacing.sm;
const SEGMENT_GAP = MEASUREMENTS.spacing.sm;
const SLIDE_TIMING = { duration: 250, easing: Easing.out(Easing.cubic) };

export function AppSegmentedControl<T>({ options, value, onChange }: Props<T>) {
  const colors = useColors();
  const [trackWidth, setTrackWidth] = useState(0);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const segmentWidth =
    trackWidth > 0
      ? (trackWidth - TRACK_PADDING * 2 - SEGMENT_GAP * (options.length - 1)) / options.length
      : 0;

  // The selected pill is one view that slides between segments instead of each segment
  // switching its own background (HAU-119). Reanimated honours Reduce Motion by default.
  const position = useSharedValue(selectedIndex);
  useEffect(() => {
    position.value = withTiming(selectedIndex, SLIDE_TIMING);
  }, [position, selectedIndex]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const trackStyle = useMemo(
    () => [styles.track, { backgroundColor: colors.segmentTrack }],
    [colors]
  );

  const indicatorColorStyle = useMemo(
    () => ({ backgroundColor: colors.segmentSelected }),
    [colors]
  );

  const indicatorMotionStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    opacity: selectedIndex < 0 ? 0 : 1,
    transform: [{ translateX: position.value * (segmentWidth + SEGMENT_GAP) }],
  }));

  return (
    <View style={trackStyle} accessibilityRole="tablist" onLayout={handleLayout}>
      <Animated.View
        style={[styles.indicator, indicatorColorStyle, indicatorMotionStyle]}
        pointerEvents="none"
      />
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
  const handlePress = useCallback(() => {
    if (!selected) {
      hapticSelection();
    }
    onSelect(option.value);
  }, [onSelect, option.value, selected]);

  const accessibilityState = useMemo(() => ({ selected }), [selected]);

  return (
    <Pressable
      style={styles.segment}
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
      {option.pro ? <ProBadge /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: TRACK_PADDING,
    gap: SEGMENT_GAP,
    borderRadius: MEASUREMENTS.radius.track,
  },
  indicator: {
    position: "absolute",
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    borderRadius: MEASUREMENTS.radius.lg,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: MEASUREMENTS.radius.lg,
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: MEASUREMENTS.spacing.sm,
  },
});

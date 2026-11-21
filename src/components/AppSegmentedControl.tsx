import { useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, View, StyleSheet, type LayoutChangeEvent, type LayoutRectangle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { hapticSelection } from "@/utils/haptics";
import { ProBadge } from "@/components/ProBadge";
import { SPRING } from "@/constants/motion";
import { dimOnPress } from "@/constants/press";

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

  // One pill slides between the measured segments, in a row or stacked
  const layouts = useRef(new Map<T, LayoutRectangle>());
  const pillX = useSharedValue(0);
  const pillY = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillHeight = useSharedValue(0);

  const placePill = useCallback(
    (layout: LayoutRectangle, animated: boolean) => {
      const place = (target: number) => (animated ? withSpring(target, SPRING.snap) : target);
      pillX.set(place(layout.x));
      pillY.set(place(layout.y));
      pillWidth.set(place(layout.width));
      pillHeight.set(place(layout.height));
    },
    [pillX, pillY, pillWidth, pillHeight]
  );

  const handleSegmentLayout = useCallback(
    (segmentValue: T, layout: LayoutRectangle) => {
      layouts.current.set(segmentValue, layout);
      // A first layout, a new text size or a fold moves the pill at once
      if (segmentValue === value) {
        placePill(layout, false);
      }
    },
    [value, placePill]
  );

  const trackStyle = useMemo(
    () => [styles.track, stacked ? styles.trackStacked : undefined, { backgroundColor: colors.segmentTrack }],
    [colors, stacked]
  );

  const pillAnimatedStyle = useAnimatedStyle(() => ({
    left: pillX.get(),
    top: pillY.get(),
    width: pillWidth.get(),
    height: pillHeight.get(),
  }));

  const pillStyle = useMemo(
    () => [styles.pill, { backgroundColor: colors.segmentSelected }, pillAnimatedStyle],
    [colors, pillAnimatedStyle]
  );

  useEffect(() => {
    const layout = layouts.current.get(value);
    if (layout) {
      placePill(layout, true);
    }
  }, [value, placePill]);

  return (
    <View style={trackStyle} accessibilityRole="tablist">
      <Animated.View style={pillStyle} pointerEvents="none" />
      {options.map((option) => (
        <Segment
          key={String(option.value)}
          option={option}
          selected={option.value === value}
          stacked={stacked}
          onSelect={onChange}
          onLayout={handleSegmentLayout}
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
  onLayout: (value: T, layout: LayoutRectangle) => void;
}

function Segment<T>({ option, selected, stacked, onSelect, onLayout }: SegmentProps<T>) {

  const handlePress = useCallback(() => {
    if (!selected) {
      hapticSelection();
    }
    onSelect(option.value);
  }, [onSelect, option.value, selected]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => onLayout(option.value, event.nativeEvent.layout),
    [onLayout, option.value]
  );

  const segmentStyle = useMemo(
    () => dimOnPress([styles.segment, stacked ? undefined : styles.segmentInRow]),
    [stacked]
  );

  const accessibilityState = useMemo(() => ({ selected }), [selected]);

  return (
    <Pressable
      style={segmentStyle}
      onPress={handlePress}
      onLayout={handleLayout}
      accessibilityRole="tab"
      accessibilityState={accessibilityState}
    >
      <AppText
        variant="bodyStrong"
        color={selected ? "textDefault" : "textMuted"}
        numberOfLines={1}
        // A label still wider than its segment shrinks instead of ending in "…"
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        style={styles.label}
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
  // Side by side, each segment starts at its label's width and shares the spare room equally,
  // so a long label ("Wiederkehrend") takes space from short ones ("Alle") before it shrinks
  segmentInRow: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
  },
  pill: {
    position: "absolute",
    borderRadius: MEASUREMENTS.radius.lg,
  },
  label: {
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

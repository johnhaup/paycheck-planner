import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, type LayoutChangeEvent } from "react-native";
import Animated, {
  measure,
  ReduceMotion,
  useAnimatedRef,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppText } from "@/components/AppText";
import { useColors } from "@/hooks/useColors";
import { FORWARD_CHEVRON } from "@/constants/direction";
import { MEASUREMENTS } from "@/constants/measurements";
import { dimOnPress } from "@/constants/press";
import { DURATION, FADE, SPRING } from "@/constants/motion";

type Props = {
  /** The line's text; undefined hides it */
  label: string | undefined;
  onPress: () => void;
  /** The Paychecks header's collapse, 0 out to 1 down to its pills */
  collapse: SharedValue<number>;
  /** The line keeps its tallest height until this changes, as the header does (HAU-440) */
  floorKey: unknown;
};

/**
 * The Paychecks header's "short by" line. It fades in and out, and its height springs open and shut so
 * the chart and cards below glide to their place instead of jumping (paycheck-planner-211). Under Reduce
 * Motion, or with the header down to its pills (whose place follows the header's measured height, a
 * frame behind), the height changes at once: on the way in before the fade, on the way out after it.
 */
export function ShortfallLine({ label, onPress, collapse, floorKey }: Props) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  // The text stays while the line fades out
  const [shown, setShown] = useState(label);
  if (label !== undefined && label !== shown) setShown(label);
  const [floor, setFloor] = useState({ key: floorKey, width: 0, height: 0 });
  if (floor.key !== floorKey) setFloor({ key: floorKey, width: 0, height: 0 });

  const present = label !== undefined;
  const presentRef = useRef(present);
  const contentRef = useAnimatedRef<Animated.View>();
  const open = useSharedValue(present ? 1 : 0);
  const opacity = useSharedValue(present ? 1 : 0);

  const clear = useCallback(() => {
    if (!presentRef.current) setShown(undefined);
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setFloor((current) => {
      if (width === current.width) return height > current.height ? { ...current, height } : current;
      return { ...current, width, height };
    });
  }, []);

  // Settled open, the text sits in the layout and the clip takes its height. While the line opens or shuts
  // the text is taken out of the layout, so the clip's height does not squeeze it to nothing, and measured
  // on the UI thread each frame: its onLayout reaches JS only once the counts running alongside let go.
  const clipStyle = useAnimatedStyle(() => {
    if (open.value >= 1) return { opacity: opacity.value, height: "auto" as const };
    const height = open.value > 0 ? (measure(contentRef)?.height ?? 0) : 0;
    return { opacity: opacity.value, height: height * open.value };
  });
  const contentStyle = useAnimatedStyle(() => ({
    position: open.value >= 1 ? ("relative" as const) : ("absolute" as const),
  }));
  const clip = useMemo(() => [styles.clip, clipStyle], [clipStyle]);
  const content = useMemo(
    () => [styles.content, { minHeight: floor.height }, contentStyle],
    [floor.height, contentStyle]
  );

  useEffect(() => {
    presentRef.current = present;
    const glides = !reduceMotion && collapse.get() === 0;
    if (present) {
      opacity.set(withTiming(1, FADE));
      open.set(glides ? withSpring(1, SPRING.snap) : 1);
      return;
    }
    opacity.set(withTiming(0, FADE));
    const done = (finished?: boolean) => {
      "worklet";
      if (finished) scheduleOnRN(clear);
    };
    // Under Reduce Motion the height waits for the fade; withDelay would otherwise skip the wait
    const shut = withDelay(DURATION.fade, withTiming(0, { duration: 0 }, done), ReduceMotion.Never);
    open.set(glides ? withSpring(0, SPRING.snap, done) : shut);
  }, [present, reduceMotion, collapse, clear, opacity, open]);

  if (shown === undefined) return null;

  return (
    <Animated.View style={clip} pointerEvents={present ? "auto" : "none"}>
      <Animated.View ref={contentRef} style={content} onLayout={handleLayout}>
        <Pressable style={rowStyle} onPress={onPress} accessibilityRole="button">
          <Ionicons name="alert-circle" size={16} color={colors.destructive} />
          <AppText variant="meta" color="destructive" style={styles.text}>
            {shown}
          </AppText>
          <Ionicons name={FORWARD_CHEVRON} size={16} color={colors.destructive} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
  // Offsets for while the text is out of the layout; in it they move nothing
  content: {
    top: 0,
    start: 0,
    end: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.sm + 2,
    // Inside the clip, so the gap above the line opens and shuts with it
    marginTop: MEASUREMENTS.spacing.base,
  },
  text: {
    flexShrink: 1,
  },
});

const rowStyle = dimOnPress(styles.row);

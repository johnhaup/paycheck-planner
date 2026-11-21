import { useCallback, useEffect, useMemo } from "react";
import { I18nManager, Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { hapticTap } from "@/utils/haptics";
import { DIM_ON_PRESS } from "@/constants/press";
import { FADE, SPRING } from "@/constants/motion";

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const TRACK_WIDTH = 48;
/** Also the floor for rows that sit beside a toggle (Settings link rows match toggle rows) */
export const TOGGLE_HEIGHT = 28;
const TRACK_HEIGHT = TOGGLE_HEIGHT;
const THUMB_SIZE = 22;
/** Transforms do not mirror in RTL, so the thumb travels the other way there */
const THUMB_TRAVEL = (TRACK_WIDTH - THUMB_SIZE - 6) * (I18nManager.isRTL ? -1 : 1);

export function AppToggle({ value, onValueChange }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    hapticTap();
    onValueChange(!value);
  }, [value, onValueChange]);

  // The thumb springs across (a jump under Reduce Motion) while the track colour fades
  const thumbX = useSharedValue(value ? THUMB_TRAVEL : 0);
  const on = useSharedValue(value ? 1 : 0);

  const trackAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.get(), [0, 1], [colors.toggleTrackOff, colors.primary]),
  }));
  const thumbAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: thumbX.get() }] }));

  const trackStyle = useMemo(() => [styles.track, trackAnimatedStyle], [trackAnimatedStyle]);
  const thumbStyle = useMemo(
    () => [styles.thumb, { backgroundColor: colors.onPrimary }, thumbAnimatedStyle],
    [colors, thumbAnimatedStyle]
  );

  useEffect(() => {
    thumbX.set(withSpring(value ? THUMB_TRAVEL : 0, SPRING.snap));
    on.set(withTiming(value ? 1 : 0, FADE));
  }, [value, thumbX, on]);

  return (
    <Pressable style={DIM_ON_PRESS} onPress={handlePress} hitSlop={MEASUREMENTS.hitSlop}>
      <Animated.View style={trackStyle}>
        <Animated.View style={thumbStyle} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
});

import { useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { hapticTap } from "@/utils/haptics";
import { dimOnPress } from "@/constants/press";
import { FADE, SPRING, TIMING } from "@/constants/motion";

interface Props {
  checked: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Diameter; scaled with the text where rows stack at accessibility sizes */
  size?: number;
}

const DEFAULT_SIZE = 22;

export function AppCheckCircle({ checked, onPress, accessibilityLabel, size = DEFAULT_SIZE }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    hapticTap();
    onPress();
  }, [onPress]);

  // The fill fades in or out (also under Reduce Motion) and the mark pops in (a jump under Reduce Motion)
  const fill = useSharedValue(checked ? 1 : 0);
  const markScale = useSharedValue(checked ? 1 : 0);

  const fillAnimatedStyle = useAnimatedStyle(() => ({ opacity: fill.get() }));
  const markAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: markScale.get() }] }));

  const circleStyle = useMemo(
    () =>
      dimOnPress([
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        { borderColor: checked ? colors.primary : colors.textMuted },
      ]),
    [checked, colors, size]
  );

  const fillStyle = useMemo(
    () => [styles.fill, { borderRadius: size / 2, backgroundColor: colors.primary }, fillAnimatedStyle],
    [size, colors, fillAnimatedStyle]
  );

  useEffect(() => {
    fill.set(withTiming(checked ? 1 : 0, FADE));
    markScale.set(checked ? withSpring(1, SPRING.pop) : withTiming(0, TIMING.press));
  }, [checked, fill, markScale]);

  const accessibilityState = useMemo(() => ({ checked }), [checked]);

  return (
    <Pressable
      style={circleStyle}
      onPress={handlePress}
      hitSlop={MEASUREMENTS.hitSlop}
      accessibilityRole="checkbox"
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={fillStyle} />
      <Animated.View style={markAnimatedStyle}>
        <Ionicons name="checkmark" size={(size * 14) / DEFAULT_SIZE} color={colors.screenBackground} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: "absolute",
    // Under the border, so the fill covers it the way a filled circle did
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
  },
  circle: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

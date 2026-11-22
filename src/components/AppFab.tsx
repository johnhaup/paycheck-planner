import { useCallback, useEffect, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useIsFocused } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useGutters } from "@/hooks/useGutters";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { hapticTap } from "@/utils/haptics";
import { ProBadge } from "@/components/ProBadge";
import { IS_STORE_DEMO } from "@/services/pro";
import { DURATION, PRESSED_SCALE, SPRING, TIMING } from "@/constants/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A small swell before it shrinks away: the bounce out
const SWELL_SCALE = 1.1;

interface Props {
  accessibilityLabel: string;
  onPress: () => void;
  /** Marks the action as Pro-only; the caller routes the press to the paywall */
  pro?: boolean;
}

export function AppFab({ accessibilityLabel, onPress, pro }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // The same distance inside the content's edge on every screen width
  const { paddingRight } = useGutters(MEASUREMENTS.spacing.lg);
  const t = useT();
  // Native tabs keep every tab mounted, so the FAB follows its screen's focus: it bounces in when the
  // tab (or the screen under a closing sheet) comes to the front and bounces out when it leaves.
  // Reanimated skips to the end value when Reduce Motion is on.
  const isFocused = useIsFocused();
  const scale = useSharedValue(0);
  // Shrinks while held and pops back on release
  const pressScale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() * pressScale.get() }] }));

  const handlePress = useCallback(() => {
    hapticTap();
    onPress();
  }, [onPress]);

  const handlePressIn = useCallback(() => {
    pressScale.set(withTiming(PRESSED_SCALE, TIMING.press));
  }, [pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.set(withSpring(1, SPRING.pop));
  }, [pressScale]);

  const fabStyle = useMemo(
    () => [
      styles.fab,
      {
        backgroundColor: colors.primary,
        shadowColor: colors.shadow,
        bottom: insets.bottom + MEASUREMENTS.spacing.lg,
        right: paddingRight,
      },
      scaleStyle,
    ],
    [colors, insets.bottom, paddingRight, scaleStyle]
  );

  useEffect(() => {
    scale.set(
      isFocused
        ? withSpring(1, SPRING.bounce)
        : withSequence(withTiming(SWELL_SCALE, TIMING.press), withTiming(0, { duration: DURATION.fade }))
    );
  }, [isFocused, scale]);

  // A ring in the screen colour cuts the badge out of the button so it reads as a separate tag
  const badgeStyle = useMemo(() => [styles.badge, { borderColor: colors.screenBackground }], [colors]);

  // Store screenshots (EXPO_PUBLIC_STORE_DEMO builds) show the lists whole: the button would cover the last row
  if (IS_STORE_DEMO) return null;

  return (
    <AnimatedPressable
      style={fabStyle}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={MEASUREMENTS.hitSlop}
      accessibilityRole="button"
      // The badge is inside the button, so VoiceOver and Maestro read it from the label
      accessibilityLabel={pro ? `${accessibilityLabel} · ${t("pro.badge")}` : accessibilityLabel}
    >
      <Ionicons name="add" size={28} color={colors.onPrimary} />
      {pro ? <ProBadge style={badgeStyle} fixed /> : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: MEASUREMENTS.fabSize,
    height: MEASUREMENTS.fabSize,
    borderRadius: MEASUREMENTS.fabSize / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    position: "absolute",
    top: -MEASUREMENTS.spacing.sm,
    left: -MEASUREMENTS.spacing.md,
    borderWidth: 2,
  },
});

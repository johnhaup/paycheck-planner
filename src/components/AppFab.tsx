import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { hapticTap } from "@/utils/haptics";
import { ProBadge } from "@/components/ProBadge";

interface Props {
  accessibilityLabel: string;
  onPress: () => void;
  /** Marks the action as Pro-only; the caller routes the press to the paywall */
  pro?: boolean;
}

export function AppFab({ accessibilityLabel, onPress, pro }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(() => {
    hapticTap();
    onPress();
  }, [onPress]);

  const fabStyle = useMemo(
    () => [
      styles.fab,
      {
        backgroundColor: colors.primary,
        shadowColor: colors.shadow,
        bottom: insets.bottom + MEASUREMENTS.spacing.lg,
      },
    ],
    [colors, insets.bottom]
  );

  return (
    <Pressable
      style={fabStyle}
      onPress={handlePress}
      hitSlop={MEASUREMENTS.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="add" size={28} color={colors.onPrimary} />
      {pro ? <ProBadge style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: MEASUREMENTS.spacing.lg,
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
    borderColor: "transparent",
  },
});

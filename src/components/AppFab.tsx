import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";

interface Props {
  accessibilityLabel: string;
  onPress: () => void;
}

export function AppFab({ accessibilityLabel, onPress }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

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
      onPress={onPress}
      hitSlop={MEASUREMENTS.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name="add" size={28} color={colors.onPrimary} />
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
});

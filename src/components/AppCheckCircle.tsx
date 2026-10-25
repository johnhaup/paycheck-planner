import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { hapticTap } from "@/utils/haptics";

interface Props {
  checked: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

export function AppCheckCircle({ checked, onPress, accessibilityLabel }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    hapticTap();
    onPress();
  }, [onPress]);

  const circleStyle = useMemo(
    () => [
      styles.circle,
      checked
        ? { backgroundColor: colors.primary, borderColor: colors.primary }
        : { borderColor: colors.textMuted },
    ],
    [checked, colors]
  );

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
      {checked ? <Ionicons name="checkmark" size={14} color={colors.screenBackground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

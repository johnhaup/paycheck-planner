import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { hapticTap } from "@/utils/haptics";
import { dimOnPress } from "@/constants/press";

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

  const circleStyle = useMemo(
    () => dimOnPress([
      styles.circle,
      { width: size, height: size, borderRadius: size / 2 },
      checked
        ? { backgroundColor: colors.primary, borderColor: colors.primary }
        : { borderColor: colors.textMuted },
    ]),
    [checked, colors, size]
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
      {checked ? <Ionicons name="checkmark" size={(size * 14) / DEFAULT_SIZE} color={colors.screenBackground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

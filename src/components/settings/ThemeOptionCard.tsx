import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import type { ThemeMode } from "@/stores/themeStore";

interface Props {
  label: string;
  value: ThemeMode;
  selected: boolean;
  onSelect: (mode: ThemeMode) => void;
}

export function ThemeOptionCard({ label, value, selected, onSelect }: Props) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onSelect(value);
  }, [onSelect, value]);

  const cardStyle = useMemo(
    () => [
      styles.option,
      { backgroundColor: colors.cardBackgroundElevated },
      selected && { borderColor: colors.primary, borderWidth: 2 },
    ],
    [selected, colors]
  );

  const checkmarkStyle = useMemo(
    () => [styles.checkmark, { backgroundColor: colors.primary }],
    [colors]
  );

  const checkmarkTextStyle = useMemo(
    () => [styles.checkmarkText, { color: colors.onPrimary }],
    [colors]
  );

  return (
    <Pressable style={cardStyle} onPress={handlePress}>
      <AppText variant="regular-bold">{label}</AppText>
      {selected ? (
        <View style={checkmarkStyle}>
          <AppText variant="caption" style={checkmarkTextStyle}>
            ✓
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flex: 1,
    paddingVertical: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: MEASUREMENTS.spacing.md,
  },
  checkmarkText: {
    fontWeight: "700",
    fontSize: 12,
  },
});

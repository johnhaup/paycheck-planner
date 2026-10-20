import { useCallback, useMemo } from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props<T> {
  label: string;
  value: T;
  selected: boolean;
  onSelect: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function AppChip<T>({ label, value, selected, onSelect, style }: Props<T>) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    onSelect(value);
  }, [onSelect, value]);

  const chipStyle = useMemo(
    () => [
      styles.chip,
      {
        backgroundColor: selected ? colors.primary : colors.inputBackground,
        borderColor: selected ? colors.primary : colors.border,
      },
      style,
    ],
    [selected, style, colors]
  );

  const textStyle = useMemo(
    () =>
      selected
        ? { color: colors.onPrimary, fontWeight: "600" as const }
        : undefined,
    [selected, colors]
  );

  return (
    <Pressable style={chipStyle} onPress={handlePress}>
      <AppText variant="subtext" style={textStyle}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: MEASUREMENTS.spacing.base + 2,
    paddingVertical: MEASUREMENTS.spacing.md + 2,
    borderRadius: MEASUREMENTS.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

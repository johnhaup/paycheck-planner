import { useMemo } from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useColors } from "../hooks/useColors";
import { MEASUREMENTS } from "../constants/measurements";
import { AppText } from "./AppText";

interface Props {
  label: string;
  selected: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AppChip({ label, selected, style, ...rest }: Props) {
  const colors = useColors();

  const chipStyle = useMemo(
    () => [
      styles.chip,
      {
        backgroundColor: selected ? colors.primary : colors.cardBackground,
        borderColor: selected ? colors.primary : colors.border,
      },
      style,
    ],
    [selected, style, colors]
  );

  const textStyle = useMemo(
    () =>
      selected
        ? { color: colors.textDefault, fontWeight: "600" as const }
        : undefined,
    [selected, colors]
  );

  return (
    <Pressable style={chipStyle} {...rest}>
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

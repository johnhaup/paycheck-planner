import { useMemo } from "react";
import { TextInput, TextInputProps, StyleSheet } from "react-native";
import { useColors } from "../hooks/useColors";
import { MEASUREMENTS } from "../constants/measurements";

export function AppInput({ style, ...rest }: TextInputProps) {
  const colors = useColors();

  const inputStyle = useMemo(
    () => [
      styles.input,
      {
        backgroundColor: colors.cardBackground,
        color: colors.textDefault,
        borderColor: colors.border,
      },
      style,
    ],
    [colors, style]
  );

  return (
    <TextInput
      style={inputStyle}
      placeholderTextColor={colors.textMuted}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: MEASUREMENTS.font.md,
    padding: MEASUREMENTS.spacing.base + 2,
    borderRadius: MEASUREMENTS.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

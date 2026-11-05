import { useMemo } from "react";
import { I18nManager, TextInput, TextInputProps, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";

/**
 * With no alignment set, an iOS text field aligns by the device language, which
 * the in-app language can contradict. "start" is no help: a TextInput does not
 * know the layout direction, so it always means left there.
 */
const TEXT_ALIGN = I18nManager.isRTL ? "right" : "left";

export function AppInput({ style, ...rest }: TextInputProps) {
  const colors = useColors();

  const inputStyle = useMemo(
    () => [
      styles.input,
      {
        backgroundColor: colors.inputBackground,
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
    textAlign: TEXT_ALIGN,
    padding: MEASUREMENTS.spacing.base + 2,
    borderRadius: MEASUREMENTS.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

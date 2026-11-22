import { useMemo, type Ref } from "react";
import {
  I18nManager,
  TextInput,
  StyleSheet,
  type TextInputInstance,
  type TextInputProps,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

/**
 * With no alignment set, an iOS text field aligns by the device language, which
 * the in-app language can contradict. "start" is no help: a TextInput does not
 * know the layout direction, so it always means left there.
 */
const TEXT_ALIGN = I18nManager.isRTL ? "right" : "left";

type AppInputProps = TextInputProps & {
  /** Shown in red under the field, which gets a red outline; inline so no toast covers a sheet's header. */
  error?: string;
  ref?: Ref<TextInputInstance>;
};

export function AppInput({ style, error, ref, ...rest }: AppInputProps) {
  const colors = useColors();

  const inputStyle = useMemo(
    () => [
      styles.input,
      {
        backgroundColor: colors.inputBackground,
        color: colors.textDefault,
        borderColor: error ? colors.destructive : colors.border,
      },
      error ? styles.inputError : undefined,
      style,
    ],
    [colors, error, style]
  );

  return (
    <>
      <TextInput
        ref={ref}
        style={inputStyle}
        placeholderTextColor={colors.textMuted}
        {...rest}
      />
      {error ? (
        <AppText
          variant="caption"
          color="destructive"
          style={styles.error}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {error}
        </AppText>
      ) : null}
    </>
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
  inputError: {
    borderWidth: 1,
  },
  error: {
    marginTop: MEASUREMENTS.spacing.sm + 2,
  },
});

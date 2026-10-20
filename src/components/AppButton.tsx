import { useMemo } from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

type Variant = "primary" | "destructive" | "outline";

interface Props {
  title: string;
  variant?: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function AppButton({ title, variant = "primary", style, ...rest }: Props) {
  const colors = useColors();

  const buttonStyle = useMemo(() => {
    const variantStyle =
      variant === "primary"
        ? { backgroundColor: colors.primary }
        : variant === "destructive"
          ? { backgroundColor: colors.destructive }
          : {
              backgroundColor: "transparent",
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            };
    return [styles.base, variantStyle, style];
  }, [variant, style, colors]);

  return (
    <Pressable style={buttonStyle} {...rest}>
      <AppText variant="regular-bold" color={variant === "outline" ? "textDefault" : "onPrimary"}>
        {title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: MEASUREMENTS.spacing.base,
    paddingHorizontal: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});

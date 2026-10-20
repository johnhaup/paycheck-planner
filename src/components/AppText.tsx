import { useMemo } from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import type { PaletteColor } from "@/constants/palette";

type Variant = "h1" | "h2" | "h3" | "regular" | "regular-bold" | "subtext" | "caption" | "label";

interface Props extends TextProps {
  variant?: Variant;
  color?: PaletteColor;
  center?: boolean;
}

export function AppText({
  variant = "regular",
  color,
  center,
  style,
  ...rest
}: Props) {
  const colors = useColors();

  const textStyles = useMemo(() => {
    const baseColor =
      variant === "subtext" || variant === "caption" || variant === "label"
        ? colors.textSecondary
        : colors.textDefault;
    const resolvedColor = color ? colors[color] : baseColor;
    const textAlign = center ? ("center" as const) : undefined;
    return [
      variantStyles[variant],
      { color: resolvedColor },
      textAlign ? { textAlign } : undefined,
      style,
    ];
  }, [variant, color, center, style, colors]);

  return <Text style={textStyles} {...rest} />;
}

const variantStyles = StyleSheet.create({
  h1: {
    fontSize: MEASUREMENTS.font.h1,
    fontWeight: "700",
  },
  h2: {
    fontSize: MEASUREMENTS.font.xl,
    fontWeight: "700",
  },
  h3: {
    fontSize: MEASUREMENTS.font.lg,
    fontWeight: "600",
  },
  regular: {
    fontSize: MEASUREMENTS.font.md,
  },
  "regular-bold": {
    fontSize: MEASUREMENTS.font.md,
    fontWeight: "600",
  },
  subtext: {
    fontSize: MEASUREMENTS.font.base,
  },
  caption: {
    fontSize: MEASUREMENTS.font.sm,
  },
  label: {
    fontSize: MEASUREMENTS.font.sm,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

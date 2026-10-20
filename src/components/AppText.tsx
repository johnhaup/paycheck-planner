import { useMemo } from "react";
import { Text, TextProps, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import type { PaletteColor } from "@/constants/palette";

type Variant =
  | "hero"
  | "title"
  | "rowTitle"
  | "body"
  | "bodyStrong"
  | "meta"
  | "caption"
  | "section";

const VARIANT_COLORS: Record<Variant, PaletteColor> = {
  hero: "textDefault",
  title: "textDefault",
  rowTitle: "textDefault",
  body: "textDefault",
  bodyStrong: "textDefault",
  meta: "textSecondary",
  caption: "textMuted",
  section: "textMuted",
};

interface Props extends TextProps {
  variant?: Variant;
  color?: PaletteColor;
  center?: boolean;
}

export function AppText({
  variant = "body",
  color,
  center,
  style,
  ...rest
}: Props) {
  const colors = useColors();

  const textStyles = useMemo(
    () => [
      variantStyles[variant],
      { color: colors[color ?? VARIANT_COLORS[variant]] },
      center ? styles.center : undefined,
      style,
    ],
    [variant, color, center, style, colors]
  );

  return <Text style={textStyles} {...rest} />;
}

const styles = StyleSheet.create({
  center: {
    textAlign: "center",
  },
});

const variantStyles = StyleSheet.create({
  hero: {
    fontSize: MEASUREMENTS.font.hero,
    fontWeight: "700",
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
  title: {
    fontSize: MEASUREMENTS.font.xl,
    fontWeight: "700",
  },
  rowTitle: {
    fontSize: MEASUREMENTS.font.md,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  body: {
    fontSize: MEASUREMENTS.font.body,
    fontVariant: ["tabular-nums"],
  },
  bodyStrong: {
    fontSize: MEASUREMENTS.font.body,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  meta: {
    fontSize: MEASUREMENTS.font.sm,
    fontVariant: ["tabular-nums"],
  },
  caption: {
    fontSize: MEASUREMENTS.font.xs,
  },
  section: {
    fontSize: MEASUREMENTS.font.sm,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});

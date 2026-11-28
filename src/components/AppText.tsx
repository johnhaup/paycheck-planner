import { useCallback, useMemo, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type TextLayoutEvent,
  type TextProps,
  type TextStyle,
} from "react-native";
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
      styles.start,
      variantStyles[variant],
      { color: colors[color ?? VARIANT_COLORS[variant]] },
      center ? styles.center : undefined,
      style,
    ],
    [variant, color, center, style, colors]
  );

  const flat = useMemo<TextStyle | undefined>(
    () => (Platform.OS === "android" ? (StyleSheet.flatten(textStyles as TextProps["style"]) ?? undefined) : undefined),
    [textStyles]
  );

  if (Platform.OS === "android") {
    if (flat?.textDecorationLine?.includes("line-through")) {
      return <StruckText style={textStyles} lineStyle={flat} {...rest} />;
    }
    if (rest.adjustsFontSizeToFit) {
      return <RefittedText style={textStyles} {...rest} />;
    }
  }
  return <Text style={textStyles} {...rest} />;
}

/**
 * Android's text view draws a strike-through itself after the text, and only when it already holds
 * a text layout. A draw after a mount or an update can go out without one, and the line is then
 * missing until something else redraws it: paid bills on Paychecks turned grey with no line, a
 * different set on every launch (#206). React Native is prebuilt there, so Android draws the line
 * as a view instead: across the middle of the laid-out line, in the text's colour, where the native
 * one sits. Every struck text holds one line (`numberOfLines={1}` or a single word).
 */
function StruckText({ style, lineStyle, onTextLayout, ...rest }: TextProps & { lineStyle: TextStyle }) {
  // The view can be wider than its glyphs (a fitted word), so the line takes the laid-out line's extent
  const [extent, setExtent] = useState<{ left: number; width: number }>();

  const handleTextLayout = useCallback(
    (event: TextLayoutEvent) => {
      const line = event.nativeEvent.lines[0];
      if (line) {
        setExtent((prev) =>
          prev && prev.left === line.x && prev.width === line.width ? prev : { left: line.x, width: line.width }
        );
      }
      onTextLayout?.(event);
    },
    [onTextLayout]
  );

  const fontSize = lineStyle.fontSize ?? MEASUREMENTS.font.body;
  const lineViewStyle = [
    styles.strike,
    extent ?? styles.strikeFull,
    {
      height: Math.max(1, fontSize / STRIKE_THICKNESS_RATIO),
      backgroundColor: lineStyle.textDecorationColor ?? lineStyle.color,
    },
  ];
  const textStyle = [style, styles.noDecoration];

  return (
    <View style={styles.strikeWrapper}>
      {rest.adjustsFontSizeToFit ? (
        <RefittedText style={textStyle} onTextLayout={handleTextLayout} {...rest} />
      ) : (
        <Text style={textStyle} onTextLayout={handleTextLayout} {...rest} />
      )}
      <View pointerEvents="none" style={lineViewStyle} />
    </View>
  );
}

/** The line's thickness as a share of the font size, about Roboto's own strike-through */
const STRIKE_THICKNESS_RATIO = 18;

/**
 * Android shrinks a fitted text while a fold resizes the window and never grows it back: after a fold
 * or an unfold the amounts were drawn at a quarter of their size. A new window width draws it afresh,
 * which fits it again (HAU-669). Only the text remounts; it holds no state.
 */
function RefittedText(props: TextProps) {
  const { width } = useWindowDimensions();
  return <Text key={width} {...props} />;
}

const styles = StyleSheet.create({
  // With no alignment set, iOS aligns text in an LTR layout by the device
  // language, which the in-app language can contradict
  start: {
    textAlign: "start",
  },
  center: {
    textAlign: "center",
  },
  noDecoration: {
    textDecorationLine: "none",
  },
  strikeWrapper: {
    flexShrink: 1,
    justifyContent: "center",
  },
  strike: {
    position: "absolute",
  },
  strikeFull: {
    left: 0,
    right: 0,
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

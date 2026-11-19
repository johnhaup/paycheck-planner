import { useMemo, type ReactNode } from "react";
import { I18nManager, View, StyleSheet, useWindowDimensions, type StyleProp, type TextStyle } from "react-native";
import { MEASUREMENTS } from "@/constants/measurements";
import type { PaletteColor } from "@/constants/palette";
import { AppText } from "@/components/AppText";

/** A word wider than the row shrinks this far before it is cut with "…" */
const WORD_MIN_FONT_SCALE = 0.5;

/** Scripts written without spaces (Thai, Lao, Myanmar, Khmer, CJK, kana): they may break anywhere, so they keep plain wrapping */
const UNSPACED_SCRIPT = /[฀-໿က-႟ក-៿⺀-鿿豈-﫿＀-￯]/;

/** Hebrew, Arabic and their presentation forms */
const RTL_SCRIPT = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

interface Props {
  children: string;
  variant: "title" | "rowTitle" | "body" | "section";
  color?: PaletteColor;
  /** Applied to every word */
  style?: StyleProp<TextStyle>;
  /** An icon kept on the first word's line, before it */
  leading?: ReactNode;
  /** An icon kept on the last word's line, after it */
  trailing?: ReactNode;
}

/**
 * A user-entered name at accessibility text sizes: wraps between words only.
 * React Native cannot hyphenate and iOS breaks a word that is wider than its
 * row at a letter ("Registratio / n"), so each word is its own one-line text
 * that shrinks to the row's width; words that fit keep their full size.
 */
export function AppWordWrapText({ children, variant, color, style, leading, trailing }: Props) {
  const { fontScale } = useWindowDimensions();

  const words = useMemo(() => children.split(/\s+/).filter(Boolean), [children]);
  const wordStyle = useMemo(() => [styles.shrink, style], [style]);
  // The words are separate views, so the row's direction orders them instead
  // of the text's own: an English name in an Arabic layout would read backwards
  // A space is about a quarter of the font size, and scales with it
  const gap = MEASUREMENTS.spacing.sm * fontScale;
  const attachedStyle = useMemo(() => [styles.attached, { columnGap: gap }], [gap]);
  const rowStyle = useMemo(() => {
    const rtl = RTL_SCRIPT.test(children);
    return [
      styles.row,
      rtl ? styles.rtl : styles.ltr,
      rtl === I18nManager.isRTL ? undefined : styles.end,
      { columnGap: gap },
    ];
  }, [children, gap]);

  if (words.length === 0 || UNSPACED_SCRIPT.test(children)) {
    const text = (
      <AppText variant={variant} color={color} style={wordStyle}>
        {children}
      </AppText>
    );
    if (!leading && !trailing) return text;
    return (
      <View style={attachedStyle}>
        {leading}
        {text}
        {trailing}
      </View>
    );
  }

  return (
    <View style={rowStyle} accessible accessibilityRole="text" accessibilityLabel={children}>
      {words.map((word, index) => {
        const lead = index === 0 ? leading : undefined;
        const trail = index === words.length - 1 ? trailing : undefined;
        const text = (
          <AppText
            key={index}
            variant={variant}
            color={color}
            style={wordStyle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={WORD_MIN_FONT_SCALE}
          >
            {word}
          </AppText>
        );
        if (!lead && !trail) return text;
        // The icon wraps with its word instead of being left alone on a line
        return (
          <View key={index} style={attachedStyle}>
            {lead}
            {text}
            {trail}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexShrink: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ltr: {
    direction: "ltr",
  },
  rtl: {
    direction: "rtl",
  },
  end: {
    justifyContent: "flex-end",
  },
  shrink: {
    flexShrink: 1,
  },
  attached: {
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
  },
});

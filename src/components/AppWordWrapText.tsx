import { useMemo } from "react";
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
  variant: "rowTitle" | "body";
  color?: PaletteColor;
  /** Applied to every word */
  style?: StyleProp<TextStyle>;
}

/**
 * A user-entered name at accessibility text sizes: wraps between words only.
 * React Native cannot hyphenate and iOS breaks a word that is wider than its
 * row at a letter ("Registratio / n"), so each word is its own one-line text
 * that shrinks to the row's width; words that fit keep their full size.
 */
export function AppWordWrapText({ children, variant, color, style }: Props) {
  const { fontScale } = useWindowDimensions();

  const words = useMemo(() => children.split(/\s+/).filter(Boolean), [children]);
  const wordStyle = useMemo(() => [styles.shrink, style], [style]);
  // The words are separate views, so the row's direction orders them instead
  // of the text's own: an English name in an Arabic layout would read backwards
  const rowStyle = useMemo(() => {
    const rtl = RTL_SCRIPT.test(children);
    return [
      styles.row,
      rtl ? styles.rtl : styles.ltr,
      rtl === I18nManager.isRTL ? undefined : styles.end,
      // A space is about a quarter of the font size, and scales with it
      { columnGap: MEASUREMENTS.spacing.sm * fontScale },
    ];
  }, [children, fontScale]);

  if (words.length === 0 || UNSPACED_SCRIPT.test(children)) {
    return (
      <AppText variant={variant} color={color} style={wordStyle}>
        {children}
      </AppText>
    );
  }

  return (
    <View style={rowStyle} accessible accessibilityRole="text" accessibilityLabel={children}>
      {words.map((word, index) => (
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
      ))}
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
});

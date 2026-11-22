import { useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

/** Same cap as the date tile: past this the text no longer fits inside a fixed-size control's corner tag */
const FIXED_TEXT_PROPS = {
  numberOfLines: 1,
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.7,
  maxFontSizeMultiplier: 1.3,
} as const;

interface Props {
  style?: StyleProp<ViewStyle>;
  /** Sits on a fixed-size control (the FAB): stays one short line at every text size. Inline badges keep scaling. */
  fixed?: boolean;
}

/**
 * Small "PRO" pill placed next to a control that opens the paywall for free users.
 * Gold gradient with dark text, deliberately unlike the app's green so it never reads as part of the control.
 */
export function ProBadge({ style, fixed }: Props) {
  const colors = useColors();
  const t = useT();

  const badgeStyle = useMemo(() => [styles.badge, style], [style]);
  // The border-box size, measured: an absolutely filled Svg can keep its first, smaller frame when the label scales (large text sizes)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View style={badgeStyle} onLayout={onLayout} accessibilityLabel={t("pro.badge")}>
      {size && (
        <Svg width={size.width} height={size.height} style={styles.gradient}>
          <Defs>
            <LinearGradient id="proBadgeGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.proGradientStart} />
              <Stop offset="1" stopColor={colors.proGradientEnd} />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill="url(#proBadgeGradient)" />
        </Svg>
      )}
      <AppText variant="caption" color="onPro" style={styles.text} {...(fixed ? FIXED_TEXT_PROPS : undefined)}>
        {t("pro.badge")}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: MEASUREMENTS.spacing.sm + 2,
    paddingVertical: 1,
    borderRadius: MEASUREMENTS.radius.sm,
    overflow: "hidden",
    alignSelf: "center",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  text: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});

import { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  style?: StyleProp<ViewStyle>;
}

/**
 * Small "PRO" pill placed next to a control that opens the paywall for free users.
 * Gold gradient with dark text, deliberately unlike the app's green so it never reads as part of the control.
 */
export function ProBadge({ style }: Props) {
  const colors = useColors();
  const t = useT();

  const badgeStyle = useMemo(() => [styles.badge, style], [style]);

  return (
    <View style={badgeStyle} accessibilityLabel={t("pro.badge")}>
      {/* No width/height props: Yoga resolves an absolute child's percent size without the parent's padding, so the gold stops short */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="proBadgeGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.proGradientStart} />
            <Stop offset="1" stopColor={colors.proGradientEnd} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#proBadgeGradient)" />
      </Svg>
      <AppText variant="caption" color="onPro" style={styles.text}>
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
  text: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});

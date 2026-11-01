import { useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useT } from "@/hooks/useLocale";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

interface Props {
  style?: StyleProp<ViewStyle>;
}

/** Small "PRO" pill placed next to a control that opens the paywall for free users. */
export function ProBadge({ style }: Props) {
  const colors = useColors();
  const t = useT();

  const badgeStyle = useMemo(() => [styles.badge, { backgroundColor: colors.primary }, style], [colors, style]);

  return (
    <View style={badgeStyle} accessibilityLabel={t("pro.badge")}>
      <AppText variant="caption" color="onPrimary" style={styles.text}>
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
    alignSelf: "center",
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
});

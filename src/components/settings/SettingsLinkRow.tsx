import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppWordWrapText } from "@/components/AppWordWrapText";
import { ProBadge } from "@/components/ProBadge";

interface Props {
  label: string;
  value?: string;
  /** Red label for actions that remove data */
  destructive?: boolean;
  /** Pro-only row: shows the badge; the caller routes the press to the paywall */
  pro?: boolean;
  onPress: () => void;
}

export function SettingsLinkRow({ label, value, destructive, pro, onPress }: Props) {
  const colors = useColors();
  const stacked = useAccessibilityTextSize();

  const rowStyle = useMemo(
    () => [styles.row, { backgroundColor: colors.cardBackgroundElevated }],
    [colors]
  );

  // At accessibility text sizes the value goes under the label and both wrap between words:
  // side by side the value squeezed the label to a few letters per line and was cut with "…"
  if (stacked) {
    return (
      <Pressable style={rowStyle} onPress={onPress} accessibilityRole="button">
        <View style={styles.stack}>
          <AppWordWrapText variant="body" color={destructive ? "destructive" : undefined}>
            {label}
          </AppWordWrapText>
          {pro ? <ProBadge style={styles.badgeStacked} /> : null}
          {value ? (
            <AppWordWrapText variant="body" color="textSecondary">
              {value}
            </AppWordWrapText>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    );
  }

  return (
    <Pressable style={rowStyle} onPress={onPress} accessibilityRole="button">
      <AppText variant="body" color={destructive ? "destructive" : undefined} style={styles.label}>
        {label}
      </AppText>
      {pro ? <ProBadge /> : null}
      {value ? (
        <AppText variant="body" color="textSecondary" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.md,
    padding: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
    marginTop: MEASUREMENTS.spacing.base,
  },
  label: {
    flex: 1,
  },
  value: {
    flexShrink: 1,
  },
  stack: {
    flex: 1,
    alignItems: "flex-start",
    gap: MEASUREMENTS.spacing.sm,
  },
  badgeStacked: {
    alignSelf: "flex-start",
  },
});

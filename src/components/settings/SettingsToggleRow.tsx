import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useAccessibilityTextSize } from "@/hooks/useAccessibilityTextSize";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppToggle } from "@/components/AppToggle";
import { AppWordWrapText } from "@/components/AppWordWrapText";
import { ProBadge } from "@/components/ProBadge";

interface Props {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Pro-only toggle: shows the badge; the caller routes the change to the paywall */
  pro?: boolean;
}

export function SettingsToggleRow({ label, hint, value, onValueChange, pro }: Props) {
  const colors = useColors();
  const stacked = useAccessibilityTextSize();

  const cardStyle = useMemo(
    () => [
      stacked ? styles.stack : styles.row,
      { backgroundColor: colors.cardBackgroundElevated },
    ],
    [colors, stacked]
  );

  return (
    <>
      {stacked ? (
        // At accessibility text sizes the label gets the whole row and wraps between words:
        // beside the switch and the badge it broke inside words ("remind / er")
        <AppCard style={cardStyle}>
          <AppWordWrapText variant="body">{label}</AppWordWrapText>
          <View style={styles.controls}>
            {pro ? <ProBadge /> : <View />}
            <AppToggle value={value} onValueChange={onValueChange} />
          </View>
        </AppCard>
      ) : (
        <AppCard style={cardStyle}>
          <AppText variant="body" style={styles.label}>{label}</AppText>
          {pro ? <ProBadge /> : null}
          <AppToggle value={value} onValueChange={onValueChange} />
        </AppCard>
      )}
      {hint ? (
        <AppText variant="caption" style={styles.hint}>{hint}</AppText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
    padding: MEASUREMENTS.spacing.lg,
    marginTop: MEASUREMENTS.spacing.base,
  },
  stack: {
    gap: MEASUREMENTS.spacing.base,
    padding: MEASUREMENTS.spacing.lg,
    marginTop: MEASUREMENTS.spacing.base,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    flex: 1,
  },
  hint: {
    marginTop: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
});

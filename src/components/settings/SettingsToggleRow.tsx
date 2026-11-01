import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppToggle } from "@/components/AppToggle";
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

  const cardStyle = useMemo(
    () => [styles.row, { backgroundColor: colors.cardBackgroundElevated }],
    [colors]
  );

  return (
    <>
      <AppCard style={cardStyle}>
        <AppText variant="body" style={styles.label}>{label}</AppText>
        {pro ? <ProBadge /> : null}
        <AppToggle value={value} onValueChange={onValueChange} />
      </AppCard>
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
  label: {
    flex: 1,
  },
  hint: {
    marginTop: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
});

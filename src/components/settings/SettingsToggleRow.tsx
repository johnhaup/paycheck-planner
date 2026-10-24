import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppToggle } from "@/components/AppToggle";

interface Props {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingsToggleRow({ label, hint, value, onValueChange }: Props) {
  const colors = useColors();

  const cardStyle = useMemo(
    () => [styles.row, { backgroundColor: colors.cardBackgroundElevated }],
    [colors]
  );

  return (
    <>
      <AppCard style={cardStyle}>
        <AppText variant="body" style={styles.label}>{label}</AppText>
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

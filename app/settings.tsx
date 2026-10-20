import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useThemeStore, ThemeMode } from "@/stores/themeStore";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppToggle } from "@/components/AppToggle";
import { ThemeOptionCard } from "@/components/settings/ThemeOptionCard";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const themeMode = useThemeStore((s) => s.themeMode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const autoMarkPaid = useThemeStore((s) => s.autoMarkPaidOnLinkTap);
  const setAutoMarkPaid = useThemeStore((s) => s.setAutoMarkPaidOnLinkTap);

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.screenBackground }],
    [colors]
  );

  const toggleRowStyle = useMemo(
    () => [styles.toggleRow, { backgroundColor: colors.cardBackground }],
    [colors]
  );

  return (
    <View style={containerStyle}>
      <AppText variant="label" style={styles.sectionLabel}>
        Appearance
      </AppText>
      <View style={styles.optionsRow}>
        {THEME_OPTIONS.map((option) => (
          <ThemeOptionCard
            key={option.value}
            label={option.label}
            value={option.value}
            selected={themeMode === option.value}
            onSelect={setThemeMode}
          />
        ))}
      </View>

      <AppText variant="label" style={styles.sectionLabel}>
        Behavior
      </AppText>
      <View style={toggleRowStyle}>
        <AppText variant="regular">Auto-mark paid on link tap</AppText>
        <AppToggle value={autoMarkPaid} onValueChange={setAutoMarkPaid} />
      </View>
      <AppText variant="caption" color="textMuted" style={styles.toggleHint}>
        When enabled, tapping a payment link automatically marks the expense as paid.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: MEASUREMENTS.spacing.lg,
  },
  sectionLabel: {
    marginBottom: MEASUREMENTS.spacing.md,
    marginTop: MEASUREMENTS.spacing.md,
  },
  optionsRow: {
    flexDirection: "row",
    gap: MEASUREMENTS.spacing.md,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
  },
  toggleHint: {
    marginTop: MEASUREMENTS.spacing.sm,
    paddingHorizontal: MEASUREMENTS.spacing.sm,
  },
});

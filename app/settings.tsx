import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useThemeStore, ThemeMode } from "@/stores/themeStore";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppCard } from "@/components/AppCard";
import { AppToggle } from "@/components/AppToggle";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { AppSegmentedControl, type SegmentOption } from "@/components/AppSegmentedControl";

const THEME_OPTIONS: SegmentOption<ThemeMode>[] = [
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
    () => [styles.container, { backgroundColor: colors.modalBackground }],
    [colors]
  );

  const toggleCardStyle = useMemo(
    () => [styles.toggleRow, { backgroundColor: colors.cardBackgroundElevated }],
    [colors]
  );

  return (
    <View style={containerStyle}>
      <AppSectionHeader title="Appearance" />
      <AppSegmentedControl options={THEME_OPTIONS} value={themeMode} onChange={setThemeMode} />

      <AppSectionHeader title="Behavior" />
      <AppCard style={toggleCardStyle}>
        <AppText variant="body" style={styles.toggleLabel}>Auto-mark paid on link tap</AppText>
        <AppToggle value={autoMarkPaid} onValueChange={setAutoMarkPaid} />
      </AppCard>
      <AppText variant="caption" style={styles.toggleHint}>
        Tapping a payment link also marks that bill paid.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: MEASUREMENTS.spacing.base,
    padding: MEASUREMENTS.spacing.lg,
  },
  toggleLabel: {
    flex: 1,
  },
  toggleHint: {
    marginTop: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
});

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
  const hideCents = useThemeStore((s) => s.hideCents);
  const setHideCents = useThemeStore((s) => s.setHideCents);

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.modalBackground }],
    [colors]
  );

  const toggleCardStyle = useMemo(
    () => [styles.toggleRow, { backgroundColor: colors.cardBackgroundElevated }],
    [colors]
  );

  const spacedToggleCardStyle = useMemo(
    () => [toggleCardStyle, styles.spacedCard],
    [toggleCardStyle]
  );

  return (
    <View style={containerStyle}>
      <AppSectionHeader title="Appearance" />
      <AppSegmentedControl options={THEME_OPTIONS} value={themeMode} onChange={setThemeMode} />
      <AppCard style={spacedToggleCardStyle}>
        <AppText variant="body" style={styles.toggleLabel}>Hide cents</AppText>
        <AppToggle value={hideCents} onValueChange={setHideCents} />
      </AppCard>
      <AppText variant="caption" style={styles.toggleHint}>
        Show amounts rounded to the nearest dollar.
      </AppText>

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
  spacedCard: {
    marginTop: MEASUREMENTS.spacing.base,
  },
  toggleLabel: {
    flex: 1,
  },
  toggleHint: {
    marginTop: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
});

import { useCallback, useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useColors } from "../src/hooks/useColors";
import { useThemeStore, ThemeMode } from "../src/stores/themeStore";
import { MEASUREMENTS } from "../src/constants/measurements";
import { AppText } from "../src/components/AppText";
import { AppToggle } from "../src/components/AppToggle";

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

  const handleSelect = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode);
    },
    [setThemeMode]
  );

  const options = useMemo(
    () =>
      THEME_OPTIONS.map((option) => {
        const isSelected = themeMode === option.value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              { backgroundColor: colors.cardBackground },
              isSelected && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => handleSelect(option.value)}
          >
            <AppText variant="regular-bold">{option.label}</AppText>
            {isSelected ? (
              <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                <AppText variant="caption" style={styles.checkmarkText}>
                  ✓
                </AppText>
              </View>
            ) : null}
          </Pressable>
        );
      }),
    [themeMode, colors, handleSelect]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <AppText variant="label" style={styles.sectionLabel}>
        Appearance
      </AppText>
      <View style={styles.optionsRow}>{options}</View>

      <AppText variant="label" style={styles.sectionLabel}>
        Behavior
      </AppText>
      <View style={[styles.toggleRow, { backgroundColor: colors.cardBackground }]}>
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
  option: {
    flex: 1,
    paddingVertical: MEASUREMENTS.spacing.lg,
    borderRadius: MEASUREMENTS.radius.lg,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: MEASUREMENTS.spacing.md,
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
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

import { useCallback, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useLocale, useT } from "@/hooks/useLocale";
import { useThemeStore, ThemeMode } from "@/stores/themeStore";
import { useLocaleStore, SYSTEM } from "@/stores/localeStore";
import { REMINDER_OFFSETS, useNotificationStore, type ReminderOffset } from "@/stores/notificationStore";
import { LANGUAGES } from "@/localization/languages";
import { requestReminderPermission } from "@/utils/paydayReminders";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { AppChip } from "@/components/AppChip";
import { AppDatePicker } from "@/components/AppDatePicker";
import { AppSectionHeader } from "@/components/AppSectionHeader";
import { AppSegmentedControl, type SegmentOption } from "@/components/AppSegmentedControl";
import { SettingsToggleRow } from "@/components/settings/SettingsToggleRow";
import { SettingsLinkRow } from "@/components/settings/SettingsLinkRow";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const t = useT();
  const { currency } = useLocale();
  const themeMode = useThemeStore((s) => s.themeMode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const autoMarkPaid = useThemeStore((s) => s.autoMarkPaidOnLinkTap);
  const setAutoMarkPaid = useThemeStore((s) => s.setAutoMarkPaidOnLinkTap);
  const hideCents = useThemeStore((s) => s.hideCents);
  const setHideCents = useThemeStore((s) => s.setHideCents);
  const languageSetting = useLocaleStore((s) => s.language);
  const currencySetting = useLocaleStore((s) => s.currency);
  const remindersEnabled = useNotificationStore((s) => s.enabled);
  const setRemindersEnabled = useNotificationStore((s) => s.setEnabled);
  const daysBefore = useNotificationStore((s) => s.daysBefore);
  const setDaysBefore = useNotificationStore((s) => s.setDaysBefore);
  const hour = useNotificationStore((s) => s.hour);
  const minute = useNotificationStore((s) => s.minute);
  const setTime = useNotificationStore((s) => s.setTime);

  const handleOpenLanguage = useCallback(() => {
    router.push("/language");
  }, [router]);

  const handleOpenCurrency = useCallback(() => {
    router.push("/currency");
  }, [router]);

  const handleToggleReminders = useCallback(
    async (value: boolean) => {
      if (!value) {
        setRemindersEnabled(false);
        return;
      }
      const granted = await requestReminderPermission();
      if (granted) {
        setRemindersEnabled(true);
      } else {
        Alert.alert(t("settings.permissionDeniedTitle"), t("settings.permissionDeniedBody"));
      }
    },
    [setRemindersEnabled, t]
  );

  const handleTimeChange = useCallback(
    (date: Date) => {
      setTime(date.getHours(), date.getMinutes());
    },
    [setTime]
  );

  const themeOptions = useMemo<SegmentOption<ThemeMode>[]>(
    () => [
      { value: "light", label: t("settings.light") },
      { value: "dark", label: t("settings.dark") },
      { value: "system", label: t("settings.system") },
    ],
    [t]
  );

  const offsetLabels = useMemo(
    () =>
      REMINDER_OFFSETS.map((offset) => ({
        value: offset,
        label:
          offset === 0
            ? t("settings.offsets.dayOf")
            : offset === 1
              ? t("settings.offsets.dayBefore")
              : offset === 7
                ? t("settings.offsets.weekBefore")
                : t("settings.offsets.daysBefore", { count: offset }),
      })),
    [t]
  );

  const languageValue = useMemo(
    () =>
      languageSetting === SYSTEM
        ? t("common.systemDefault")
        : LANGUAGES.find((l) => l.code === languageSetting)?.nativeName ?? languageSetting,
    [languageSetting, t]
  );

  const currencyValue = currencySetting === SYSTEM ? `${t("common.systemDefault")} · ${currency}` : currency;

  const reminderTime = useMemo(() => new Date(2000, 0, 1, hour, minute), [hour, minute]);

  const containerStyle = useMemo(() => ({ backgroundColor: colors.modalBackground }), [colors]);

  return (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <AppSectionHeader title={t("settings.appearance")} />
      <AppSegmentedControl options={themeOptions} value={themeMode} onChange={setThemeMode} />
      <SettingsToggleRow
        label={t("settings.hideCents")}
        hint={t("settings.hideCentsHint")}
        value={hideCents}
        onValueChange={setHideCents}
      />

      <AppSectionHeader title={t("settings.region")} />
      <SettingsLinkRow label={t("settings.language")} value={languageValue} onPress={handleOpenLanguage} />
      <SettingsLinkRow label={t("settings.currency")} value={currencyValue} onPress={handleOpenCurrency} />

      <AppSectionHeader title={t("settings.notifications")} />
      <SettingsToggleRow
        label={t("settings.paydayReminder")}
        hint={t("settings.paydayReminderHint")}
        value={remindersEnabled}
        onValueChange={handleToggleReminders}
      />
      {remindersEnabled ? (
        <>
          <AppText variant="section" style={styles.label}>{t("settings.remindWhen")}</AppText>
          <View style={styles.chipRow}>
            {offsetLabels.map((option) => (
              <AppChip<ReminderOffset>
                key={option.value}
                label={option.label}
                value={option.value}
                selected={daysBefore === option.value}
                onSelect={setDaysBefore}
              />
            ))}
          </View>
          <AppText variant="section" style={styles.label}>{t("settings.remindTime")}</AppText>
          <AppDatePicker mode="time" value={reminderTime} onChange={handleTimeChange} />
        </>
      ) : null}

      <AppSectionHeader title={t("settings.behavior")} />
      <SettingsToggleRow
        label={t("settings.autoMarkPaid")}
        hint={t("settings.autoMarkPaidHint")}
        value={autoMarkPaid}
        onValueChange={setAutoMarkPaid}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: MEASUREMENTS.spacing.gutter,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  label: {
    marginBottom: MEASUREMENTS.spacing.sm + 2,
    marginTop: MEASUREMENTS.spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MEASUREMENTS.spacing.md,
  },
});

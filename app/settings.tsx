import { useCallback, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { toast } from "sonner-native";
import { useStore } from "@/store";
import { useColors } from "@/hooks/useColors";
import { useLocale, useT } from "@/hooks/useLocale";
import { useThemeStore, ThemeMode } from "@/stores/themeStore";
import { useLocaleStore, SYSTEM } from "@/stores/localeStore";
import { REMINDER_OFFSETS, useNotificationStore, type ReminderOffset } from "@/stores/notificationStore";
import { LANGUAGES } from "@/localization/languages";
import { requestReminderPermission } from "@/utils/paydayReminders";
import { pickBackup, shareBackup, shareExpensesCsv } from "@/utils/backup";
import { withUndo } from "@/utils/undo";
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
  const unpaidEnabled = useNotificationStore((s) => s.unpaidEnabled);
  const setUnpaidEnabled = useNotificationStore((s) => s.setUnpaidEnabled);
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
        toast.success(t("toasts.remindersOn"));
      } else {
        Alert.alert(t("settings.permissionDeniedTitle"), t("settings.permissionDeniedBody"));
      }
    },
    [setRemindersEnabled, t]
  );

  const handleToggleUnpaid = useCallback(
    async (value: boolean) => {
      if (!value) {
        setUnpaidEnabled(false);
        return;
      }
      const granted = await requestReminderPermission();
      if (granted) {
        setUnpaidEnabled(true);
        toast.success(t("toasts.unpaidOn"));
      } else {
        Alert.alert(t("settings.permissionDeniedTitle"), t("settings.permissionDeniedBody"));
      }
    },
    [setUnpaidEnabled, t]
  );

  const handleBackup = useCallback(() => {
    const { incomeSources, expenses, assignments, paycheckOverrides } = useStore.getState();
    shareBackup({ incomeSources, expenses, assignments, paycheckOverrides }).catch(() => {});
  }, []);

  const handleExportCsv = useCallback(() => {
    const { expenses, incomeSources } = useStore.getState();
    shareExpensesCsv(expenses, incomeSources).catch(() => {});
  }, []);

  const handleRestore = useCallback(async () => {
    const result = await pickBackup();
    if (result.status === "canceled") return;
    if (result.status === "invalid") {
      toast.error(t("settings.data.invalidBackup"));
      return;
    }
    Alert.alert(t("settings.data.restoreTitle"), t("settings.data.restoreBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.data.restoreConfirm"),
        style: "destructive",
        onPress: () => withUndo(t("toasts.restored"), () => useStore.setState(result.data)),
      },
    ]);
  }, [t]);

  const handleErase = useCallback(() => {
    Alert.alert(t("settings.data.eraseTitle"), t("settings.data.eraseBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () =>
          withUndo(t("toasts.erased"), () =>
            useStore.setState({ incomeSources: [], expenses: [], assignments: [], paycheckOverrides: [] })
          ),
      },
    ]);
  }, [t]);

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
        </>
      ) : null}
      <SettingsToggleRow
        label={t("settings.unpaidReminder")}
        hint={t("settings.unpaidReminderHint")}
        value={unpaidEnabled}
        onValueChange={handleToggleUnpaid}
      />
      {remindersEnabled || unpaidEnabled ? (
        <>
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

      <AppSectionHeader title={t("settings.data.title")} />
      <SettingsLinkRow label={t("settings.data.backup")} onPress={handleBackup} />
      <SettingsLinkRow label={t("settings.data.restore")} onPress={handleRestore} />
      <SettingsLinkRow label={t("settings.data.exportCsv")} onPress={handleExportCsv} />
      <SettingsLinkRow label={t("settings.data.erase")} destructive onPress={handleErase} />
      <AppText variant="caption" style={styles.hint}>
        {t("settings.data.hint")}
      </AppText>
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
  hint: {
    marginTop: MEASUREMENTS.spacing.md,
    paddingHorizontal: MEASUREMENTS.spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MEASUREMENTS.spacing.md,
  },
});

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { addDays, setHours, setMinutes, startOfDay, subDays } from "date-fns";
import { t } from "@/localization/i18n";
import { formatMoney } from "@/utils/money";
import { formatWeekday } from "@/utils/dates";
import { buildMonthGroups } from "@/utils/paycheckMonths";
import type { PaycheckItem } from "@/components/paychecks/types";
import type { Expense, ExpenseAssignment, IncomeSource, PaycheckOverride } from "@/types";

const CHANNEL_ID = "payday-reminders";
// iOS keeps at most 64 pending local notifications per app
const MAX_SCHEDULED = 50;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface ReminderPrefs {
  enabled: boolean;
  daysBefore: number;
  hour: number;
  minute: number;
  unpaidEnabled: boolean;
}

interface SyncInput {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assignments: ExpenseAssignment[];
  overrides: PaycheckOverride[];
  prefs: ReminderPrefs;
  hideCents: boolean;
}

function isGranted(permissions: Notifications.NotificationPermissionsStatus): boolean {
  return (
    permissions.granted ||
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

async function ensureChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: t("notifications.channelName"),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Prompt for permission if needed; resolves to whether reminders may be scheduled. */
export async function requestReminderPermission(): Promise<boolean> {
  // Android 13+ only shows the prompt once a channel exists
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (isGranted(current)) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return isGranted(requested);
}

function buildContent(paycheck: PaycheckItem, daysBefore: number, hideCents: boolean) {
  const source = paycheck.sourceName;
  const title =
    daysBefore === 0
      ? t("notifications.titleToday", { source })
      : daysBefore === 1
        ? t("notifications.titleTomorrow", { source })
        : t("notifications.titleOnDay", { source, weekday: formatWeekday(paycheck.date) });
  const income = formatMoney(paycheck.payAmount, hideCents);
  const left = formatMoney(paycheck.remaining, hideCents);
  const bills = paycheck.expenses.filter((e) => !e.isSetAside);
  const setAsideTotal = paycheck.expenses.reduce((sum, e) => sum + (e.isSetAside ? e.amount : 0), 0);
  const billsText = t("notifications.bills", {
    count: bills.length,
    amount: formatMoney(paycheck.totalExpenses - setAsideTotal, hideCents),
  });
  const setAside = formatMoney(setAsideTotal, hideCents);
  let body: string;
  if (paycheck.expenses.length === 0) {
    body = t("notifications.bodyNoBills", { income });
  } else if (setAsideTotal === 0) {
    body = t("notifications.body", { income, bills: billsText, left });
  } else if (bills.length === 0) {
    body = t("notifications.bodySetAsideOnly", { income, setAside, left });
  } else {
    body = t("notifications.bodyWithSetAside", { income, bills: billsText, setAside, left });
  }
  return { title, body };
}

function buildUnpaidContent(paycheck: PaycheckItem, hideCents: boolean) {
  const unpaid = paycheck.expenses.filter((e) => !e.paid);
  if (unpaid.length === 0) return undefined;
  const bills = t("notifications.bills", {
    count: unpaid.length,
    amount: formatMoney(unpaid.reduce((sum, e) => sum + e.amount, 0), hideCents),
  });
  return {
    title: t("notifications.unpaidTitle", { source: paycheck.sourceName }),
    body: t("notifications.unpaidBody", { bills, date: formatWeekday(paycheck.date) }),
  };
}

function atReminderTime(day: Date, prefs: ReminderPrefs): Date {
  return setMinutes(setHours(startOfDay(day), prefs.hour), prefs.minute);
}

/** Replace every pending reminder with ones for upcoming paychecks, per the current prefs. */
export async function syncPaydayReminders({
  incomeSources,
  expenses,
  assignments,
  overrides,
  prefs,
  hideCents,
}: SyncInput): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if ((!prefs.enabled && !prefs.unpaidEnabled) || incomeSources.length === 0) return;
  if (!isGranted(await Notifications.getPermissionsAsync())) return;
  await ensureChannel();

  const now = new Date();
  // Start a day back so yesterday's paycheck can still get its unpaid-bills nudge today
  const paychecks = buildMonthGroups(incomeSources, expenses, assignments, overrides, subDays(now, 1)).flatMap(
    (month) => month.paychecks
  );

  let scheduled = 0;
  const schedule = async (identifier: string, fireAt: Date, content: { title: string; body: string }) => {
    await Notifications.scheduleNotificationAsync({
      identifier,
      content,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: CHANNEL_ID,
      },
    });
    scheduled++;
  };

  for (const paycheck of paychecks) {
    const paydayAt = atReminderTime(subDays(paycheck.date, prefs.daysBefore), prefs);
    if (prefs.enabled && paydayAt > now) {
      await schedule(`payday-${paycheck.key}`, paydayAt, buildContent(paycheck, prefs.daysBefore, hideCents));
    }
    const unpaidAt = atReminderTime(addDays(paycheck.date, 1), prefs);
    const unpaidContent = prefs.unpaidEnabled ? buildUnpaidContent(paycheck, hideCents) : undefined;
    if (unpaidContent && unpaidAt > now) {
      await schedule(`unpaid-${paycheck.key}`, unpaidAt, unpaidContent);
    }
    if (scheduled >= MAX_SCHEDULED) break;
  }
}

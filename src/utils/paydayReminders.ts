import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { setHours, setMinutes, startOfDay, subDays } from "date-fns";
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

/** Replace every pending reminder with one per upcoming paycheck, per the current prefs. */
export async function syncPaydayReminders({
  incomeSources,
  expenses,
  assignments,
  overrides,
  prefs,
  hideCents,
}: SyncInput): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.enabled || incomeSources.length === 0) return;
  if (!isGranted(await Notifications.getPermissionsAsync())) return;
  await ensureChannel();

  const now = new Date();
  const paychecks = buildMonthGroups(incomeSources, expenses, assignments, overrides, now).flatMap(
    (month) => month.paychecks
  );

  let scheduled = 0;
  for (const paycheck of paychecks) {
    const fireAt = setMinutes(
      setHours(startOfDay(subDays(paycheck.date, prefs.daysBefore)), prefs.hour),
      prefs.minute
    );
    if (fireAt <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `payday-${paycheck.key}`,
      content: buildContent(paycheck, prefs.daysBefore, hideCents),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: CHANNEL_ID,
      },
    });
    if (++scheduled >= MAX_SCHEDULED) break;
  }
}

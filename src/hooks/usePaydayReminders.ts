import { useEffect } from "react";
import { useStore } from "@/store";
import { useNotificationStore } from "@/stores/notificationStore";
import { useThemeStore } from "@/stores/themeStore";
import { useLocale } from "@/hooks/useLocale";
import { syncPaydayReminders } from "@/utils/paydayReminders";

const SYNC_DELAY_MS = 500;

/** Keeps scheduled payday reminders in step with the budget, prefs, and locale. */
export function usePaydayReminders() {
  const incomeSources = useStore((s) => s.incomeSources);
  const expenses = useStore((s) => s.expenses);
  const assignments = useStore((s) => s.assignments);
  const overrides = useStore((s) => s.paycheckOverrides);
  const enabled = useNotificationStore((s) => s.enabled);
  const daysBefore = useNotificationStore((s) => s.daysBefore);
  const hour = useNotificationStore((s) => s.hour);
  const minute = useNotificationStore((s) => s.minute);
  const unpaidEnabled = useNotificationStore((s) => s.unpaidEnabled);
  const hideCents = useThemeStore((s) => s.hideCents);
  const { language, currency } = useLocale();

  useEffect(() => {
    const timer = setTimeout(() => {
      syncPaydayReminders({
        incomeSources,
        expenses,
        assignments,
        overrides,
        prefs: { enabled, daysBefore, hour, minute, unpaidEnabled },
        hideCents,
      }).catch(() => {});
    }, SYNC_DELAY_MS);
    return () => clearTimeout(timer);
    // language and currency change the notification text
  }, [incomeSources, expenses, assignments, overrides, enabled, daysBefore, hour, minute, unpaidEnabled, hideCents, language, currency]);
}

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Days ahead of payday the reminder fires */
export type ReminderOffset = 0 | 1 | 2 | 3 | 7;

export const REMINDER_OFFSETS: ReminderOffset[] = [0, 1, 2, 3, 7];

interface NotificationState {
  enabled: boolean;
  daysBefore: ReminderOffset;
  hour: number;
  minute: number;
  /** Nudge the day after payday when that paycheck still has unpaid bills */
  unpaidEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  setUnpaidEnabled: (unpaidEnabled: boolean) => void;
  setDaysBefore: (daysBefore: ReminderOffset) => void;
  setTime: (hour: number, minute: number) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      enabled: false,
      daysBefore: 1,
      hour: 18,
      minute: 0,
      unpaidEnabled: false,
      setEnabled: (enabled) => set({ enabled }),
      setUnpaidEnabled: (unpaidEnabled) => set({ unpaidEnabled }),
      setDaysBefore: (daysBefore) => set({ daysBefore }),
      setTime: (hour, minute) => set({ hour, minute }),
    }),
    {
      name: "paycheck-planner-notifications",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

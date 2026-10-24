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
  setEnabled: (enabled: boolean) => void;
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
      setEnabled: (enabled) => set({ enabled }),
      setDaysBefore: (daysBefore) => set({ daysBefore }),
      setTime: (hour, minute) => set({ hour, minute }),
    }),
    {
      name: "paycheck-planner-notifications",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

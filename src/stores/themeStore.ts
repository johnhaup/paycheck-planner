import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  autoMarkPaidOnLinkTap: boolean;
  setAutoMarkPaidOnLinkTap: (value: boolean) => void;
  hideCents: boolean;
  setHideCents: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  (set) => ({
    themeMode: "dark",
    setThemeMode: (mode) => set({ themeMode: mode }),
    autoMarkPaidOnLinkTap: false,
    setAutoMarkPaidOnLinkTap: (value) => set({ autoMarkPaidOnLinkTap: value }),
    hideCents: false,
    setHideCents: (value) => set({ hideCents: value }),
  })
);

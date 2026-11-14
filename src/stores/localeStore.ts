import { I18nManager } from "react-native";
import { reloadAppAsync } from "expo";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_LANGUAGE,
  getDeviceCurrency,
  getDeviceLanguage,
  getDeviceRegion,
  i18n,
  type LanguageCode,
} from "@/localization/i18n";
import { RTL_LANGUAGES } from "@/localization/languages";

export const SYSTEM = "system";
const STORAGE_KEY = "paycheck-planner-locale";

interface LocaleState {
  language: LanguageCode | typeof SYSTEM;
  currency: string | typeof SYSTEM;
  setLanguage: (language: LanguageCode | typeof SYSTEM) => void;
  setCurrency: (currency: string | typeof SYSTEM) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      language: SYSTEM,
      currency: SYSTEM,
      setLanguage: (language) => {
        set({ language });
        void applyLayoutDirection(language);
      },
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function resolveLanguage(language: LocaleState["language"]): LanguageCode {
  return language === SYSTEM ? getDeviceLanguage() : language;
}

export function resolveCurrency(currency: LocaleState["currency"]): string {
  return currency === SYSTEM ? getDeviceCurrency() : currency;
}

/** Language plus the device region, so "en" on a UK phone formats as en-GB. */
export function toLocaleTag(language: LanguageCode): string {
  if (language.includes("-")) return language;
  const region = getDeviceRegion();
  if (!region) return language;
  const tag = `${language}-${region}`;
  try {
    new Intl.DateTimeFormat(tag);
    return tag;
  } catch {
    return language;
  }
}

export function getLanguage(): LanguageCode {
  return resolveLanguage(useLocaleStore.getState().language);
}

export function getLocaleTag(): string {
  return toLocaleTag(getLanguage());
}

export function getCurrency(): string {
  return resolveCurrency(useLocaleStore.getState().currency);
}

export function isRTLLanguage(language: LanguageCode): boolean {
  return RTL_LANGUAGES.has(language);
}

function applyLanguage(language: LocaleState["language"]) {
  i18n.locale = resolveLanguage(language);
}

/**
 * iOS picks the layout direction from the device language, but the in-app
 * language can differ from it, and React Native reads the direction only at
 * startup. So when they disagree, store the new direction and reload.
 */
async function applyLayoutDirection(language: LocaleState["language"]) {
  const rtl = isRTLLanguage(resolveLanguage(language));
  if (rtl === I18nManager.isRTL) return;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  // AsyncStorage runs on a serial queue, so this returns after the language's
  // write. Reloading sooner could lose it and flip the direction straight back.
  await AsyncStorage.getItem(STORAGE_KEY);
  await reloadAppAsync("Layout direction changed");
}

applyLanguage(DEFAULT_LANGUAGE);
applyLanguage(useLocaleStore.getState().language);
useLocaleStore.subscribe((state) => applyLanguage(state.language));
// Picks up a device language changed in iOS Settings while the app was closed
useLocaleStore.persist.onFinishHydration((state) => void applyLayoutDirection(state.language));

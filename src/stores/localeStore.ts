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
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: "paycheck-planner-locale",
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

applyLanguage(DEFAULT_LANGUAGE);
applyLanguage(useLocaleStore.getState().language);
useLocaleStore.subscribe((state) => applyLanguage(state.language));

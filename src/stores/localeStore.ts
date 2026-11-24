import { I18nManager } from "react-native";
import { reloadAppAsync } from "expo";
import { create } from "zustand";
import {
  DEFAULT_LANGUAGE,
  getDeviceCurrency,
  getDeviceLanguage,
  getDeviceRegion,
  i18n,
  type LanguageCode,
} from "@/localization/i18n";
import { RTL_LANGUAGES } from "@/localization/languages";
import { pickLocaleTag } from "@/utils/localeTag";

export const SYSTEM = "system";

interface LocaleState {
  language: LanguageCode | typeof SYSTEM;
  currency: string | typeof SYSTEM;
  setLanguage: (language: LanguageCode | typeof SYSTEM) => void;
  setCurrency: (currency: string | typeof SYSTEM) => void;
}

export const useLocaleStore = create<LocaleState>()(
  (set) => ({
    language: SYSTEM,
    currency: SYSTEM,
    setLanguage: (language) => {
      set({ language });
      void applyLayoutDirection(language);
    },
    setCurrency: (currency) => set({ currency }),
  })
);

export function resolveLanguage(language: LocaleState["language"]): LanguageCode {
  return language === SYSTEM ? getDeviceLanguage() : language;
}

export function resolveCurrency(currency: LocaleState["currency"]): string {
  return currency === SYSTEM ? getDeviceCurrency() : currency;
}

/** Language plus the device region ("en" on a UK phone formats as en-GB), or the bare language when Intl has no such pair: Hermes on Android then formats in the device default instead of throwing (HAU-785). */
export function toLocaleTag(language: LanguageCode): string {
  return pickLocaleTag(language, getDeviceRegion());
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
  // The language's settings row is written synchronously by its subscriber in
  // src/db/init.ts, so the reload cannot lose it.
  await reloadAppAsync("Layout direction changed");
}

applyLanguage(DEFAULT_LANGUAGE);
applyLanguage(useLocaleStore.getState().language);
useLocaleStore.subscribe((state) => applyLanguage(state.language));
/** Called once the saved language is loaded; picks up a device language changed in iOS Settings while the app was closed. */
export const syncLayoutDirection = () => applyLayoutDirection(useLocaleStore.getState().language);

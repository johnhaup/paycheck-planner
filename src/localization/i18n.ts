import { I18n } from "i18n-js";
import type { TranslateOptions } from "i18n-js";
import { getLocales } from "expo-localization";
import * as cardinals from "make-plural/cardinals";
import * as ordinals from "make-plural/ordinals";
import en from "@/localization/locales/en.json";
import { LANGUAGES, type Language } from "@/localization/languages";

/** One entry per translated language; add a line here when a new JSON lands in ./locales. */
const TRANSLATIONS = {
  en,
} as const;

export type LanguageCode = keyof typeof TRANSLATIONS;
export const DEFAULT_LANGUAGE: LanguageCode = "en";

/** A group of plural forms is addressed by its parent key and picked by `count` */
type PluralForms = { other: string };

type Leaves<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : T extends PluralForms
    ? Prefix
    : {
        [K in keyof T & string]: Leaves<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>;
      }[keyof T & string];

/** Dotted path to a string in en.json, e.g. "settings.language" */
export type TranslationKey = Leaves<typeof en>;

export const AVAILABLE_LANGUAGES: Language[] = LANGUAGES.filter((l) => l.code in TRANSLATIONS);

export const i18n = new I18n(TRANSLATIONS, {
  defaultLocale: DEFAULT_LANGUAGE,
  locale: DEFAULT_LANGUAGE,
  enableFallback: true,
});

type PluralRule = (n: number | string) => string;

// Hermes on iOS has no Intl.PluralRules, so CLDR rules come from make-plural instead
const CARDINALS: Record<string, PluralRule> = { ...cardinals };
const ORDINALS: Record<string, PluralRule> = { ...ordinals };

/** "pt-PT" → pt_PT, "zh-Hans" → zh, unknown → en */
function pluralRule(table: Record<string, PluralRule>, code: string): PluralRule {
  return table[code.replace("-", "_")] ?? table[code.split("-")[0]] ?? table.en;
}

for (const code of Object.keys(TRANSLATIONS)) {
  const rule = pluralRule(CARDINALS, code);
  i18n.pluralization.register(code, (_i18n, count) => [rule(count), "other"]);
}

export function t(key: TranslationKey, options?: TranslateOptions): string {
  return i18n.t(key, options);
}

export function isLanguageCode(code: string): code is LanguageCode {
  return code in TRANSLATIONS;
}

/** The device's preferred language, when we have a translation for it. */
export function getDeviceLanguage(): LanguageCode {
  for (const locale of getLocales()) {
    if (locale.languageTag && isLanguageCode(locale.languageTag)) return locale.languageTag;
    // "zh-Hans-CN" → "zh-Hans"
    const script = locale.languageScriptCode
      ? `${locale.languageCode}-${locale.languageScriptCode}`
      : undefined;
    if (script && isLanguageCode(script)) return script;
    const regional = locale.regionCode ? `${locale.languageCode}-${locale.regionCode}` : undefined;
    if (regional && isLanguageCode(regional)) return regional;
    if (locale.languageCode && isLanguageCode(locale.languageCode)) return locale.languageCode;
  }
  return DEFAULT_LANGUAGE;
}

export function getDeviceCurrency(): string {
  return getLocales()[0]?.currencyCode ?? "USD";
}

export function getDeviceRegion(): string | undefined {
  return getLocales()[0]?.regionCode ?? undefined;
}

/** "%{n}st" / "%{n}nd" … chosen by the language's ordinal plural rules. */
export function formatOrdinal(n: number): string {
  const category = pluralRule(ORDINALS, i18n.locale)(n);
  return i18n.t(`ordinal.${category}`, { n, defaultValue: i18n.t("ordinal.other", { n }) });
}

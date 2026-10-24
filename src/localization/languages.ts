/**
 * Every language the store listings ship in (see ship/listing). A language is
 * selectable in-app only once its JSON lands in ./locales and is registered in
 * ./i18n.ts, so this table can stay ahead of the translations.
 */
export interface Language {
  /** BCP 47 tag used for the translation file and for Intl formatting */
  code: string;
  nativeName: string;
}

export const LANGUAGES: Language[] = [
  { code: "ar", nativeName: "العربية" },
  { code: "bn", nativeName: "বাংলা" },
  { code: "ca", nativeName: "Català" },
  { code: "cs", nativeName: "Čeština" },
  { code: "da", nativeName: "Dansk" },
  { code: "de", nativeName: "Deutsch" },
  { code: "el", nativeName: "Ελληνικά" },
  { code: "en", nativeName: "English" },
  { code: "es", nativeName: "Español" },
  { code: "fi", nativeName: "Suomi" },
  { code: "fr", nativeName: "Français" },
  { code: "gu", nativeName: "ગુજરાતી" },
  { code: "he", nativeName: "עברית" },
  { code: "hi", nativeName: "हिन्दी" },
  { code: "hr", nativeName: "Hrvatski" },
  { code: "hu", nativeName: "Magyar" },
  { code: "id", nativeName: "Bahasa Indonesia" },
  { code: "it", nativeName: "Italiano" },
  { code: "ja", nativeName: "日本語" },
  { code: "kn", nativeName: "ಕನ್ನಡ" },
  { code: "ko", nativeName: "한국어" },
  { code: "ml", nativeName: "മലയാളം" },
  { code: "mr", nativeName: "मराठी" },
  { code: "ms", nativeName: "Bahasa Melayu" },
  { code: "nl", nativeName: "Nederlands" },
  { code: "no", nativeName: "Norsk" },
  { code: "or", nativeName: "ଓଡ଼ିଆ" },
  { code: "pa", nativeName: "ਪੰਜਾਬੀ" },
  { code: "pl", nativeName: "Polski" },
  { code: "pt-BR", nativeName: "Português (Brasil)" },
  { code: "pt-PT", nativeName: "Português (Portugal)" },
  { code: "ro", nativeName: "Română" },
  { code: "ru", nativeName: "Русский" },
  { code: "sk", nativeName: "Slovenčina" },
  { code: "sl", nativeName: "Slovenščina" },
  { code: "sv", nativeName: "Svenska" },
  { code: "ta", nativeName: "தமிழ்" },
  { code: "te", nativeName: "తెలుగు" },
  { code: "th", nativeName: "ไทย" },
  { code: "tr", nativeName: "Türkçe" },
  { code: "uk", nativeName: "Українська" },
  { code: "ur", nativeName: "اردو" },
  { code: "vi", nativeName: "Tiếng Việt" },
  { code: "zh-Hans", nativeName: "简体中文" },
  { code: "zh-Hant", nativeName: "繁體中文" },
];

export const RTL_LANGUAGES = new Set(["ar", "he", "ur"]);

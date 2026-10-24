import { useCallback, useMemo } from "react";
import type { TranslateOptions } from "i18n-js";
import { t as translate, type TranslationKey } from "@/localization/i18n";
import {
  isRTLLanguage,
  resolveCurrency,
  resolveLanguage,
  toLocaleTag,
  useLocaleStore,
} from "@/stores/localeStore";

/** The active language, Intl locale tag, and currency; re-renders when any change. */
export function useLocale() {
  const language = useLocaleStore((s) => s.language);
  const currency = useLocaleStore((s) => s.currency);

  return useMemo(() => {
    const resolved = resolveLanguage(language);
    return {
      language: resolved,
      localeTag: toLocaleTag(resolved),
      currency: resolveCurrency(currency),
      isRTL: isRTLLanguage(resolved),
    };
  }, [language, currency]);
}

/**
 * Translate by key. The returned function changes identity with the language,
 * so listing it in memo deps keeps derived strings fresh.
 */
export function useT() {
  const { language } = useLocale();
  return useCallback(
    (key: TranslationKey, options?: TranslateOptions) => translate(key, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );
}

// ICU names some languages differently from our language codes.
const ALIASES: Record<string, string[]> = { no: ["nb"] };

// iOS formats Arabic on a non-Arabic-region phone (ar-US) with Latin digits; the bare language
// would switch to Arabic-Indic ones, so keep Latin digits when falling back to it.
const LATIN_DIGITS: Record<string, string> = { ar: "ar-u-nu-latn" };

const primary = (tag: string) => tag.split("-")[0].toLowerCase();

/** The locale Intl actually formats in for a requested tag. */
export type ResolveLocale = (tag: string) => string;

export const intlResolve: ResolveLocale = (tag) => new Intl.DateTimeFormat(tag).resolvedOptions().locale;

const cache = new Map<string, string>();

/**
 * The Intl tag for an app language on a device in `region`: the language plus the region
 * ("en" on a UK phone formats as en-GB) when Intl formats that pair in the language, else the
 * bare language. Hermes on Android does not throw for a pair it has no data for (de-US, ar-US):
 * it silently formats in the device default, so only the resolved locale tells (HAU-785).
 */
export function pickLocaleTag(language: string, region: string | undefined, resolve: ResolveLocale = intlResolve): string {
  if (language.includes("-")) return language;
  const key = `${language}|${region ?? ""}`;
  const memoise = resolve === intlResolve;
  if (memoise) {
    const cached = cache.get(key);
    if (cached) return cached;
  }
  const accepted = [language, ...(ALIASES[language] ?? [])];
  const candidates = [...(region ? [`${language}-${region}`] : []), ...accepted];
  let picked = language;
  for (const candidate of candidates) {
    try {
      if (accepted.includes(primary(resolve(candidate)))) {
        picked = candidate === language ? (LATIN_DIGITS[language] ?? candidate) : candidate;
        break;
      }
    } catch {
      // An invalid tag: try the next one.
    }
  }
  if (memoise) cache.set(key, picked);
  return picked;
}

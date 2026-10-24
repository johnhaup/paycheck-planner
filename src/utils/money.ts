import { getCurrency, getLocaleTag } from "@/stores/localeStore";

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(hideCents: boolean, currency = getCurrency()): Intl.NumberFormat {
  const tag = getLocaleTag();
  const key = `${tag}|${currency}|${hideCents}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(tag, {
      style: "currency",
      currency,
      ...(hideCents ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    });
    formatters.set(key, cached);
  }
  return cached;
}

export function formatMoney(amount: number, hideCents = false): string {
  return formatter(hideCents).format(amount);
}

/** Preview of how `currency` renders in the current language, for the currency picker. */
export function formatMoneyIn(amount: number, currency: string): string {
  return formatter(false, currency).format(amount);
}

// Hermes on iOS lacks formatToParts, so the decimal separator is sniffed from a sample
const DIGITS = /\p{Nd}/gu;
const LAST_DIGIT = /(\p{Nd})(?!.*\p{Nd})/u;

function decimalSeparator(): string {
  const sample = new Intl.NumberFormat(getLocaleTag(), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(1.1);
  return sample.replace(DIGITS, "") || ".";
}

/** "$1,284.50" → { whole: "$1,284", cents: ".50" } for the large-dollars, small-cents treatment. */
export function splitMoney(amount: number, hideCents = false): { whole: string; cents: string } {
  if (hideCents) {
    return { whole: formatter(true).format(amount), cents: "" };
  }
  const full = formatter(false).format(amount);
  const index = full.lastIndexOf(decimalSeparator());
  if (index === -1) {
    return { whole: full, cents: "" };
  }
  // A trailing symbol ("1.284,50 €") stays with the cents so the big number reads cleanly
  return { whole: full.slice(0, index), cents: full.slice(index) };
}

/** Short labels for chart axes: $940, $1.3k, -$120, with the currency's own placement. */
export function formatCompactMoney(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs < 1000) {
    return sign + formatter(true).format(abs);
  }
  const thousands = Math.round(abs / 100) / 10;
  const formatted = new Intl.NumberFormat(getLocaleTag(), {
    style: "currency",
    currency: getCurrency(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(thousands);
  return sign + formatted.replace(LAST_DIGIT, "$1k");
}

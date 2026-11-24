// Marks the formatter puts into right-to-left amounts ("‏4.8 US$" in Arabic)
const RTL_MARK = /[‏؜]/;
const LAST_DIGIT = /(\p{Nd})(?!.*\p{Nd})/u;
// "US$", "CA$", "R$": Latin letters, then symbols up to the end of the string
const LATIN_THEN_SYMBOL = /[A-Za-z][\p{Sc}\p{P}]+$/u;

/**
 * Ends the number of a right-to-left amount with a right-to-left mark. Anything left-to-right
 * on the number (the mark Arabic puts on a minus sign, a "k") makes it a left-to-right run that
 * takes the letters of a Latin currency symbol with it ("$-292.84 US", "$4.8k US"); the mark
 * ends the run at the number. Other amounts come back unchanged, apart from `suffix`.
 *
 * A symbol after Latin letters at the end of a right-to-left amount would be drawn on the far
 * side of the letters ("$US"); a left-to-right mark after it keeps it with them ("US$").
 */
export function closeAmount(formatted: string, suffix = ""): string {
  if (!RTL_MARK.test(formatted)) {
    return suffix ? formatted.replace(LAST_DIGIT, `$1${suffix}`) : formatted;
  }
  const closed = formatted.replace(LAST_DIGIT, `$1${suffix}‏`);
  return LATIN_THEN_SYMBOL.test(closed) ? `${closed}‎` : closed;
}

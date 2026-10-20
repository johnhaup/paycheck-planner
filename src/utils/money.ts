const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatMoney(amount: number): string {
  return CURRENCY.format(amount);
}

/** "$1,284.50" → { whole: "$1,284", cents: ".50" } for the large-dollars, small-cents treatment. */
export function splitMoney(amount: number): { whole: string; cents: string } {
  const formatted = CURRENCY.format(amount);
  const dot = formatted.lastIndexOf(".");
  return { whole: formatted.slice(0, dot), cents: formatted.slice(dot) };
}

/** Short labels for chart axes: $940, $1.3k, -$120. */
export function formatCompactMoney(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1000) {
    return `${sign}$${(abs / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `${sign}$${Math.round(abs)}`;
}

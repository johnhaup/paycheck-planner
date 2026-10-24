import { useMemo } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { useLocale } from "@/hooks/useLocale";
import { formatCompactMoney, formatMoney, splitMoney } from "@/utils/money";

/** Money formatters bound to the "Hide cents" setting and the active locale and currency. */
export function useMoneyFormat() {
  const hideCents = useThemeStore((s) => s.hideCents);
  const { localeTag, currency } = useLocale();

  return useMemo(
    () => ({
      format: (amount: number) => formatMoney(amount, hideCents),
      split: (amount: number) => splitMoney(amount, hideCents),
      whole: (amount: number) => formatMoney(amount, true),
      compact: (amount: number) => formatCompactMoney(amount),
    }),
    // localeTag and currency drive the module-level formatters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hideCents, localeTag, currency]
  );
}

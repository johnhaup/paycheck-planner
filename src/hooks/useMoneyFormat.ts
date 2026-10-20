import { useMemo } from "react";
import { useThemeStore } from "@/stores/themeStore";
import { formatMoney, splitMoney } from "@/utils/money";

/** Money formatters bound to the "Hide cents" setting. */
export function useMoneyFormat() {
  const hideCents = useThemeStore((s) => s.hideCents);

  return useMemo(
    () => ({
      format: (amount: number) => formatMoney(amount, hideCents),
      split: (amount: number) => splitMoney(amount, hideCents),
    }),
    [hideCents]
  );
}

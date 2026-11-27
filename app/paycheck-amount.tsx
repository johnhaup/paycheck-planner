import { useCallback, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStore } from "@/store";
import { useMoneyFormat } from "@/hooks/useMoneyFormat";
import { useT } from "@/hooks/useLocale";
import { AmountSheet } from "@/components/AmountSheet";
import { parseLocalDate } from "@/utils/payDates";
import { formatShortDate } from "@/utils/dates";
import { toastError } from "@/utils/toastError";
import { hapticSuccess } from "@/utils/haptics";
import { useWriteOnClose } from "@/hooks/useWriteOnClose";

export default function PaycheckAmountScreen() {
  const router = useRouter();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const { payDate, sourceId } = useLocalSearchParams<{ payDate: string; sourceId: string }>();
  const source = useStore((s) => s.incomeSources.find((e) => e.id === sourceId));
  const override = useStore((s) =>
    s.paycheckOverrides.find((o) => o.sourceId === sourceId && o.payDate === payDate)
  );
  const setPaycheckAmount = useStore((s) => s.setPaycheckAmount);
  const writeOnClose = useWriteOnClose();
  const [amount, setAmount] = useState(() =>
    String(override?.payAmount ?? source?.payAmount ?? "")
  );

  const handleSave = useCallback(() => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      toastError(t("payAmountSheet.invalidAmount"));
      return;
    }
    writeOnClose(() =>
      setPaycheckAmount(sourceId, payDate, parsed === source?.payAmount ? undefined : parsed)
    );
    hapticSuccess();
    router.back();
  }, [amount, writeOnClose, setPaycheckAmount, sourceId, payDate, source, router, t]);

  const handleReset = useCallback(() => {
    writeOnClose(() => setPaycheckAmount(sourceId, payDate, undefined));
    hapticSuccess();
    router.back();
  }, [writeOnClose, setPaycheckAmount, sourceId, payDate, router]);

  const subtitle = payDate
    ? t("payAmountSheet.subtitle", { date: formatShortDate(parseLocalDate(payDate)) })
    : "";

  return (
    <AmountSheet
      title={source?.name ?? t("screens.incomeSource")}
      subtitle={subtitle}
      hint={t("payAmountSheet.hint", { amount: formatMoney(source?.payAmount ?? 0) })}
      amount={amount}
      onChangeAmount={setAmount}
      onSave={handleSave}
      resetTitle={override ? t("payAmountSheet.useDefault") : undefined}
      onReset={handleReset}
    />
  );
}

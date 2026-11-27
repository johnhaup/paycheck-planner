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

export default function ExpenseAmountScreen() {
  const router = useRouter();
  const { format: formatMoney } = useMoneyFormat();
  const t = useT();
  const { expenseId, payDate, sourceId } = useLocalSearchParams<{
    expenseId: string;
    payDate: string;
    sourceId: string;
  }>();
  const expense = useStore((s) => s.expenses.find((e) => e.id === expenseId));
  const assignment = useStore((s) =>
    s.assignments.find(
      (a) => a.expenseId === expenseId && a.payDate === payDate && a.employerId === sourceId
    )
  );
  const assignExpense = useStore((s) => s.assignExpense);
  const setAssignmentAmount = useStore((s) => s.setAssignmentAmount);
  const writeOnClose = useWriteOnClose();
  const [amount, setAmount] = useState(() =>
    String(assignment?.amount ?? expense?.amount ?? "")
  );

  const handleSave = useCallback(() => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      toastError(t("expenses.form.invalidAmount"));
      return;
    }
    // Linked bills have no assignment until something on this paycheck is changed
    writeOnClose(() => {
      const id = assignment?.id || assignExpense(expenseId, payDate, sourceId);
      setAssignmentAmount(id, parsed === expense?.amount ? undefined : parsed);
    });
    hapticSuccess();
    router.back();
  }, [amount, writeOnClose, assignment, assignExpense, expenseId, payDate, sourceId, setAssignmentAmount, expense, router, t]);

  const handleReset = useCallback(() => {
    if (assignment) {
      writeOnClose(() => setAssignmentAmount(assignment.id, undefined));
    }
    hapticSuccess();
    router.back();
  }, [writeOnClose, assignment, setAssignmentAmount, router]);

  const subtitle = payDate
    ? t("amountSheet.subtitle", { date: formatShortDate(parseLocalDate(payDate)) })
    : "";
  const isCustom = assignment?.amount !== undefined;

  return (
    <AmountSheet
      title={expense?.payee ?? t("screens.expense")}
      subtitle={subtitle}
      hint={t("amountSheet.hint", { amount: formatMoney(expense?.amount ?? 0) })}
      amount={amount}
      onChangeAmount={setAmount}
      onSave={handleSave}
      resetTitle={isCustom ? t("amountSheet.useDefault") : undefined}
      onReset={handleReset}
    />
  );
}

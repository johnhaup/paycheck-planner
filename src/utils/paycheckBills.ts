import { getPaycheck, isExpenseLinkedToPaycheck } from "@/utils/payDates";
import type { Expense, ExpenseAssignment, IncomeSource } from "@/types";

interface Budget {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assignments: ExpenseAssignment[];
}

export function billsFirst(a: Expense, b: Expense) {
  return Number(a.kind === "set-aside") - Number(b.kind === "set-aside");
}

/** The bills on one paycheck: those assigned to it and those linked to its source, bills before set-asides. */
export function getPaycheckBills({ incomeSources, expenses, assignments }: Budget, payDate: string, sourceId: string) {
  const incomeSource = incomeSources.find((e) => e.id === sourceId);
  const paycheck = incomeSource ? getPaycheck(incomeSource, payDate) : undefined;
  const paycheckAssignments = assignments.filter((a) => a.payDate === payDate && a.employerId === sourceId);

  const assignedExpenseIds = new Map(
    paycheckAssignments
      .filter((a) => !a.skipped)
      .map((a) => [a.expenseId, { assignmentId: a.id, paid: !!a.paid, amount: a.amount }])
  );
  // Linked bills moved off this paycheck; they show under Available instead
  const skippedExpenseIds = new Set(paycheckAssignments.filter((a) => a.skipped).map((a) => a.expenseId));

  const linkedExpenseIds = new Set<string>();
  for (const e of expenses) {
    if (
      !assignedExpenseIds.has(e.id) &&
      !skippedExpenseIds.has(e.id) &&
      isExpenseLinkedToPaycheck(e, sourceId, paycheck, incomeSource)
    ) {
      linkedExpenseIds.add(e.id);
    }
  }

  const assignedExpenses = expenses
    .filter((e) => assignedExpenseIds.has(e.id) || linkedExpenseIds.has(e.id))
    .sort(billsFirst);
  const unpaidExpenseIds = assignedExpenses.filter((e) => !assignedExpenseIds.get(e.id)?.paid).map((e) => e.id);

  return { incomeSource, assignedExpenseIds, linkedExpenseIds, assignedExpenses, unpaidExpenseIds };
}

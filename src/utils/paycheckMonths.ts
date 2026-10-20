import { format, isSameYear } from "date-fns";
import { getPaychecks, formatPayDate, isExpenseLinkedToPaycheck } from "@/utils/payDates";
import type { Expense, ExpenseAssignment, IncomeSource } from "@/types";
import type { MonthGroup, PaycheckExpense, PaycheckItem } from "@/components/paychecks/types";

const PAY_DATE_COUNT = 12;

/** Upcoming paychecks for every source, with their bills, grouped by calendar month. */
export function buildMonthGroups(
  incomeSources: IncomeSource[],
  expenses: Expense[],
  assignments: ExpenseAssignment[],
  now: Date
): MonthGroup[] {
  const expensesById = new Map(expenses.map((e) => [e.id, e]));
  const allPaychecks: PaycheckItem[] = [];

  for (const source of incomeSources) {
    for (const { date, ordinal } of getPaychecks(source, now, PAY_DATE_COUNT)) {
      const payDate = formatPayDate(date);
      const matched = assignments.filter(
        (a) => a.payDate === payDate && a.employerId === source.id
      );
      const assignedIds = new Set(matched.map((a) => a.expenseId));
      const items: PaycheckExpense[] = matched.map((a) => {
        const expense = expensesById.get(a.expenseId);
        return {
          expenseId: a.expenseId,
          payee: expense?.payee ?? "Unknown",
          amount: expense?.amount ?? 0,
          assignmentId: a.id,
          link: expense?.link,
          paid: a.paid,
        };
      });
      for (const expense of expenses) {
        if (
          !assignedIds.has(expense.id) &&
          isExpenseLinkedToPaycheck(expense, source.id, ordinal, source)
        ) {
          items.push({
            expenseId: expense.id,
            payee: expense.payee,
            amount: expense.amount,
            assignmentId: "",
            link: expense.link,
          });
        }
      }
      const totalExpenses = items.reduce((sum, e) => sum + e.amount, 0);

      allPaychecks.push({
        key: `${source.id}-${payDate}`,
        date,
        payDate,
        sourceName: source.name,
        sourceId: source.id,
        payAmount: source.payAmount,
        expenses: items,
        paidCount: items.filter((e) => e.paid).length,
        totalExpenses,
        remaining: source.payAmount - totalExpenses,
      });
    }
  }

  allPaychecks.sort((a, b) => a.date.getTime() - b.date.getTime());

  const grouped = new Map<string, MonthGroup>();
  for (const paycheck of allPaychecks) {
    const key = format(paycheck.date, "yyyy-MM");
    let group = grouped.get(key);
    if (!group) {
      group = {
        key,
        shortLabel: format(paycheck.date, "MMM"),
        longLabel: format(paycheck.date, isSameYear(paycheck.date, now) ? "MMMM" : "MMMM yyyy"),
        income: 0,
        assigned: 0,
        remaining: 0,
        paychecks: [],
      };
      grouped.set(key, group);
    }
    group.paychecks.push(paycheck);
    group.income += paycheck.payAmount;
    group.assigned += paycheck.totalExpenses;
    group.remaining += paycheck.remaining;
  }

  return Array.from(grouped.values());
}

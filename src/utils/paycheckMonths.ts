import { addMonths, endOfMonth, format, isSameYear } from "date-fns";
import { formatMonthLong, formatMonthShort } from "@/utils/dates";
import {
  getPaychecksThrough,
  formatPayDate,
  isExpenseLinkedToPaycheck,
  type Paycheck,
} from "@/utils/payDates";
import type { Expense, ExpenseAssignment, IncomeSource, PaycheckOverride } from "@/types";
import type { MonthGroup, PaycheckExpense, PaycheckItem } from "@/components/paychecks/types";

/** The current month plus this many full months after it. */
const FULL_MONTHS_AHEAD = 5;

/** This paycheck's pay amount: its override if one was set, else the source's usual amount. */
export function getPayAmount(
  source: IncomeSource,
  payDate: string,
  overrides: PaycheckOverride[]
): number {
  return (
    overrides.find((o) => o.sourceId === source.id && o.payDate === payDate)?.payAmount ??
    source.payAmount
  );
}

/** One paycheck with its bills: explicit assignments first, then linked bills not yet assigned. */
export function buildPaycheckItem(
  source: IncomeSource,
  paycheck: Paycheck,
  expenses: Expense[],
  assignments: ExpenseAssignment[],
  overrides: PaycheckOverride[]
): PaycheckItem {
  const expensesById = new Map(expenses.map((e) => [e.id, e]));
  const payDate = formatPayDate(paycheck.date);
  const matched = assignments.filter((a) => a.payDate === payDate && a.employerId === source.id);
  // Skip markers hide a moved linked bill, so they count as assigned but add no row
  const assignedIds = new Set(matched.map((a) => a.expenseId));
  const items: PaycheckExpense[] = matched
    .filter((a) => !a.skipped)
    .map((a) => {
      const expense = expensesById.get(a.expenseId);
      return {
        expenseId: a.expenseId,
        payee: expense?.payee ?? "Unknown",
        amount: a.amount ?? expense?.amount ?? 0,
        assignmentId: a.id,
        link: expense?.link,
        paid: a.paid,
        isSetAside: expense?.kind === "set-aside",
      };
    });
  for (const expense of expenses) {
    if (
      !assignedIds.has(expense.id) &&
      isExpenseLinkedToPaycheck(expense, source.id, paycheck, source)
    ) {
      items.push({
        expenseId: expense.id,
        payee: expense.payee,
        amount: expense.amount,
        assignmentId: "",
        link: expense.link,
        isSetAside: expense.kind === "set-aside",
      });
    }
  }
  // Bills first, then set-asides
  items.sort((a, b) => Number(!!a.isSetAside) - Number(!!b.isSetAside));
  const totalExpenses = items.reduce((sum, e) => sum + e.amount, 0);
  const payAmount = getPayAmount(source, payDate, overrides);

  return {
    key: `${source.id}-${payDate}`,
    date: paycheck.date,
    payDate,
    sourceName: source.name,
    sourceId: source.id,
    payAmount,
    expenses: items,
    paidCount: items.filter((e) => e.paid).length,
    totalExpenses,
    remaining: payAmount - totalExpenses,
  };
}

/** Upcoming paychecks for every source, with their bills, grouped by calendar month. */
export function buildMonthGroups(
  incomeSources: IncomeSource[],
  expenses: Expense[],
  assignments: ExpenseAssignment[],
  overrides: PaycheckOverride[],
  now: Date
): MonthGroup[] {
  const until = endOfMonth(addMonths(now, FULL_MONTHS_AHEAD));
  const allPaychecks = incomeSources.flatMap((source) =>
    getPaychecksThrough(source, now, until).map((paycheck) =>
      buildPaycheckItem(source, paycheck, expenses, assignments, overrides)
    )
  );

  allPaychecks.sort((a, b) => a.date.getTime() - b.date.getTime());

  const grouped = new Map<string, MonthGroup>();
  for (const paycheck of allPaychecks) {
    const key = format(paycheck.date, "yyyy-MM");
    let group = grouped.get(key);
    if (!group) {
      group = {
        key,
        shortLabel: formatMonthShort(paycheck.date),
        longLabel: formatMonthLong(paycheck.date, !isSameYear(paycheck.date, now)),
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

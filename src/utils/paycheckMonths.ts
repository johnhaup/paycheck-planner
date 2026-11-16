import { addMonths, endOfMonth, format, isAfter, isBefore, isSameYear, startOfMonth, subMonths } from "date-fns";
import { formatMonthLong, formatMonthShort } from "@/utils/dates";
import {
  getPaychecks,
  getPaychecksThrough,
  formatPayDate,
  parseLocalDate,
  isExpenseLinkedToPaycheck,
  getDueDayInMonth,
  type Paycheck,
} from "@/utils/payDates";
import type { Expense, ExpenseAssignment, IncomeSource, PaycheckOverride } from "@/types";
import type { MonthGroup, PaycheckExpense, PaycheckItem } from "@/components/paychecks/types";

/**
 * The month of the next paycheck plus this many full months after it: a year for Pro, two months
 * for free (this month and next, until this month's last paycheck has passed).
 */
export const FULL_MONTHS_AHEAD = { pro: 11, free: 1 } as const;
/** How far back the Paychecks list goes, in whole months before the current one; free stays within this month. */
export const PAST_MONTHS = { pro: 6, free: 0 } as const;

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
  const dueDay = (expense: Expense | undefined) =>
    expense?.dueDay !== undefined ? getDueDayInMonth(expense.dueDay, paycheck.date) : undefined;
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
        dueDay: dueDay(expense),
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
        dueDay: dueDay(expense),
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

/**
 * Paychecks for every source, with their bills, oldest first and grouped by calendar month. They
 * start today, or with `monthsBack` at the start of the month that many before this one, and run
 * through the end of the month `monthsAhead` after the first month that has a paycheck to show:
 * the month of the next paycheck, or with `monthsBack` this month when it has had one.
 */
export function buildMonthGroups(
  incomeSources: IncomeSource[],
  expenses: Expense[],
  assignments: ExpenseAssignment[],
  overrides: PaycheckOverride[],
  now: Date,
  monthsAhead: number = FULL_MONTHS_AHEAD.pro,
  monthsBack?: number
): MonthGroup[] {
  // Counted from the first paycheck shown, not from today: a month with nothing to show (no
  // paycheck left, and its past ones not listed) would leave the window a month short
  const firstPayDates = incomeSources.flatMap((source) =>
    getPaychecks(source, monthsBack === undefined ? now : getStart(source, now, 0), 1).map((p) => p.date.getTime())
  );
  const until = endOfMonth(addMonths(firstPayDates.length > 0 ? Math.min(...firstPayDates) : now, monthsAhead));
  const allPaychecks = incomeSources.flatMap((source) =>
    getPaychecksThrough(source, getStart(source, now, monthsBack), until).map((paycheck) =>
      buildPaycheckItem(source, paycheck, expenses, assignments, overrides)
    )
  );
  allPaychecks.sort((a, b) => a.date.getTime() - b.date.getTime());
  return groupByMonth(allPaychecks, now);
}

function getStart(source: IncomeSource, now: Date, monthsBack: number | undefined): Date {
  if (monthsBack === undefined) return now;
  const from = startOfMonth(subMonths(now, monthsBack));
  // Monthly and semi-monthly schedules would otherwise invent past paychecks before the first one
  const firstPayDate = parseLocalDate(source.firstPayDate);
  const start = isAfter(firstPayDate, from) ? firstPayDate : from;
  return isAfter(start, now) ? now : start;
}

/** Whether any source was already paying before the earliest month `monthsBack` reaches. */
export function hasEarlierMonths(incomeSources: IncomeSource[], now: Date, monthsBack: number): boolean {
  const from = startOfMonth(subMonths(now, monthsBack));
  return incomeSources.some((source) => isBefore(parseLocalDate(source.firstPayDate), from));
}

/** Groups already-sorted paychecks by calendar month, keeping their order. */
function groupByMonth(paychecks: PaycheckItem[], now: Date): MonthGroup[] {
  const grouped = new Map<string, MonthGroup>();
  for (const paycheck of paychecks) {
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

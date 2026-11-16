import {
  formatDueDay,
  getLinkedSlot,
  getExpenseRepeatMonths,
  getMonthlyCost,
  getPaycheckSlotLabel,
  isRepeatMonth,
  parseLocalDate,
} from "@/utils/payDates";
import { formatMonthDay, formatMonthLong, formatMonthShort } from "@/utils/dates";
import { t } from "@/localization/i18n";
import type { Expense, ExpenseAssignment, IncomeSource } from "@/types";

export type ExpenseFilter = "all" | "recurring" | "one-time";
export type ExpenseSort = "default" | "amount" | "name";

export interface ExpenseListItem {
  expense: Expense;
  meta: string;
  cadence: string;
  tintIndex?: number;
  /** Set-asides with a goal: what's been set aside so far */
  goalProgress?: { saved: number; goal: number };
}

export interface ExpenseSection {
  key: string;
  title: string;
  /** Formatted total shown beside the section title */
  total: string;
  data: ExpenseListItem[];
}

interface Summary {
  monthlyTotal: number;
  recurringCount: number;
}

/** What a recurring expense costs per month, given how often it lands. */
function monthlyCost(expense: Expense, source: IncomeSource | undefined): number {
  return source ? getMonthlyCost(expense, source) : expense.amount;
}

/** Every paycheck this set-aside was marked set aside on. */
function savedSoFar(expense: Expense, assignments: ExpenseAssignment[]): number {
  return assignments
    .filter((a) => a.expenseId === expense.id && a.paid && !a.skipped)
    .reduce((sum, a) => sum + (a.amount ?? expense.amount), 0);
}

function isSetAside(expense: Expense) {
  return expense.kind === "set-aside";
}

export function summarizeExpenses(expenses: Expense[], incomeSources: IncomeSource[]): Summary {
  const sourcesById = new Map(incomeSources.map((s) => [s.id, s]));
  const recurring = expenses.filter((e) => e.isRecurring && !isSetAside(e));
  return {
    monthlyTotal: recurring.reduce(
      (sum, e) =>
        sum + monthlyCost(e, e.incomeSourceId ? sourcesById.get(e.incomeSourceId) : undefined),
      0
    ),
    recurringCount: recurring.length,
  };
}

/** "March", or "Mar, Jun, Sep, Dec": the months a bill repeating every `months` months lands in. */
function repeatMonthList(expense: Expense, source: IncomeSource, months: number): string {
  const start = parseLocalDate(expense.repeatStart ?? source.firstPayDate);
  const inMonths = Array.from({ length: 12 }, (_, month) => new Date(2024, month, 1)).filter((date) =>
    isRepeatMonth(date, months, start)
  );
  return inMonths.length === 1
    ? formatMonthLong(inMonths[0])
    : inMonths.map(formatMonthShort).join(t("expenses.meta.monthSeparator"));
}

/**
 * "Every paycheck", "2nd paycheck each month", "1st paycheck in Mar, Jun, Sep, Dec", "Due the 18th",
 * "Due the 15th in March"
 */
export function describeLinkSchedule(expense: Expense, source: IncomeSource): string {
  // A due day goes by month; the schedule under it is kept only for when the day is cleared
  if (expense.linkSchedule === "every-other-paycheck" && expense.dueDay === undefined) {
    return t("expenses.form.everyOtherPaycheck");
  }
  const months = getExpenseRepeatMonths(expense);
  // A due day picks the paycheck in place of the slot
  const slot = getLinkedSlot(expense, source);
  const slotLabel =
    expense.dueDay !== undefined
      ? formatDueDay(expense.dueDay)
      : slot === undefined
        ? undefined
        : getPaycheckSlotLabel(source, slot);
  if (months === undefined || (months === 1 && slotLabel === undefined)) return t("expenses.meta.everyPaycheck");
  if (months === 1) {
    return expense.dueDay !== undefined ? formatDueDay(expense.dueDay) : t("expenses.meta.slotEachMonth", { slot: slotLabel });
  }
  const monthList = repeatMonthList(expense, source, months);
  return slotLabel ? t("expenses.meta.inMonths", { slot: slotLabel, months: monthList }) : monthList;
}

export function cadenceLabel(expense: Expense, source: IncomeSource) {
  // Under a due day every other paycheck is kept only for when the day is cleared; it goes by month
  const schedule =
    expense.dueDay !== undefined && expense.linkSchedule === "every-other-paycheck" ? undefined : expense.linkSchedule;
  switch (schedule) {
    case "every-other-paycheck":
      return t("expenses.cadence.everyOther");
    case "quarterly":
      return t("expenses.cadence.quarterly");
    case "semiannual":
      return t("expenses.cadence.semiannual");
    case "yearly":
      return t("expenses.cadence.yearly");
    default:
      return getLinkedSlot(expense, source) === undefined && expense.dueDay === undefined
        ? t("expenses.cadence.perCheck")
        : t("expenses.cadence.monthly");
  }
}

function compareItems(sort: ExpenseSort) {
  return (a: ExpenseListItem, b: ExpenseListItem) =>
    sort === "amount"
      ? b.expense.amount - a.expense.amount
      : a.expense.payee.localeCompare(b.expense.payee);
}

/**
 * Recurring set-asides, then recurring bills by linked income source, then unlinked, then one-time.
 * Sorting reorders rows within each section; the sections themselves stay put.
 */
export function buildExpenseSections(
  allExpenses: Expense[],
  incomeSources: IncomeSource[],
  assignments: ExpenseAssignment[],
  filter: ExpenseFilter,
  sort: ExpenseSort,
  formatMoney: (amount: number) => string
): ExpenseSection[] {
  const sections: ExpenseSection[] = [];
  const sourcesById = new Map(incomeSources.map((s) => [s.id, s]));
  // Recurring set-asides get their own section; one-time ones stay with the other one-time items
  const expenses = allExpenses.filter((e) => !(e.isRecurring && isSetAside(e)));

  if (filter !== "one-time") {
    const setAsides = allExpenses.filter((e) => e.isRecurring && isSetAside(e));
    if (setAsides.length > 0) {
      const sourceIndex = new Map(incomeSources.map((s, i) => [s.id, i]));
      sections.push({
        key: "set-asides",
        title: t("expenses.sections.setAsides"),
        total: t("expenses.perMonthTotal", {
          amount: formatMoney(
            setAsides.reduce(
              (sum, e) =>
                sum + monthlyCost(e, e.incomeSourceId ? sourcesById.get(e.incomeSourceId) : undefined),
              0
            )
          ),
        }),
        data: setAsides.map((expense) => {
          const source = expense.incomeSourceId ? sourcesById.get(expense.incomeSourceId) : undefined;
          return {
            expense,
            goalProgress: expense.goal
              ? { saved: savedSoFar(expense, assignments), goal: expense.goal }
              : undefined,
            tintIndex: source ? sourceIndex.get(source.id) : undefined,
            meta: source
              ? t("expenses.meta.withSource", { source: source.name, meta: describeLinkSchedule(expense, source) })
              : t("expenses.meta.assignPerPaycheck"),
            cadence: source ? cadenceLabel(expense, source) : t("expenses.cadence.recurring"),
          };
        }),
      });
    }

    incomeSources.forEach((source, tintIndex) => {
      const linked = expenses.filter((e) => e.isRecurring && e.incomeSourceId === source.id);
      if (linked.length === 0) return;
      sections.push({
        key: source.id,
        title: source.name,
        total: t("expenses.perMonthTotal", {
          amount: formatMoney(linked.reduce((sum, e) => sum + monthlyCost(e, source), 0)),
        }),
        data: linked.map((expense) => ({
          expense,
          tintIndex,
          meta: describeLinkSchedule(expense, source),
          cadence: cadenceLabel(expense, source),
        })),
      });
    });

    const unlinked = expenses.filter(
      (e) => e.isRecurring && (!e.incomeSourceId || !sourcesById.has(e.incomeSourceId))
    );
    if (unlinked.length > 0) {
      sections.push({
        key: "unlinked",
        title: t("expenses.sections.notLinked"),
        total: t("expenses.perMonthTotal", {
          amount: formatMoney(unlinked.reduce((sum, e) => sum + e.amount, 0)),
        }),
        data: unlinked.map((expense) => ({
          expense,
          meta: t("expenses.meta.assignPerPaycheck"),
          cadence: t("expenses.cadence.recurring"),
        })),
      });
    }
  }

  if (filter !== "recurring") {
    const oneTime = expenses.filter((e) => !e.isRecurring);
    if (oneTime.length > 0) {
      sections.push({
        key: "one-time",
        title: t("expenses.sections.oneTime"),
        total: formatMoney(oneTime.reduce((sum, e) => sum + e.amount, 0)),
        data: oneTime.map((expense) => ({
          expense,
          meta: expense.dueDate
            ? t("expenses.meta.due", { date: formatMonthDay(parseLocalDate(expense.dueDate)) })
            : t("expenses.meta.oneTime"),
          cadence: t("expenses.cadence.oneTime"),
        })),
      });
    }
  }

  if (sort !== "default") {
    for (const section of sections) {
      section.data.sort(compareItems(sort));
    }
  }

  return sections;
}

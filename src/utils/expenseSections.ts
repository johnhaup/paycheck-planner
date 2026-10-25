import {
  getLinkedSlot,
  getPaycheckSlotLabel,
  getPaychecksPerMonth,
  parseLocalDate,
} from "@/utils/payDates";
import { formatMonthDay } from "@/utils/dates";
import { t } from "@/localization/i18n";
import type { Expense, IncomeSource } from "@/types";

export type ExpenseFilter = "all" | "recurring" | "one-time";

export interface ExpenseListItem {
  expense: Expense;
  meta: string;
  cadence: string;
  tintIndex?: number;
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
  if (!source) return expense.amount;
  return getLinkedSlot(expense, source) === undefined
    ? expense.amount * getPaychecksPerMonth(source)
    : expense.amount;
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

function scheduleMeta(expense: Expense, source: IncomeSource) {
  const slot = getLinkedSlot(expense, source);
  return slot === undefined
    ? t("expenses.meta.everyPaycheck")
    : t("expenses.meta.slotEachMonth", { slot: getPaycheckSlotLabel(source, slot) });
}

function cadenceLabel(expense: Expense, source: IncomeSource) {
  return getLinkedSlot(expense, source) === undefined
    ? t("expenses.cadence.perCheck")
    : t("expenses.cadence.monthly");
}

/** Recurring set-asides, then recurring bills by linked income source, then unlinked, then one-time. */
export function buildExpenseSections(
  allExpenses: Expense[],
  incomeSources: IncomeSource[],
  filter: ExpenseFilter,
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
            tintIndex: source ? sourceIndex.get(source.id) : undefined,
            meta: source
              ? t("expenses.meta.withSource", { source: source.name, meta: scheduleMeta(expense, source) })
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
          meta: scheduleMeta(expense, source),
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

  return sections;
}

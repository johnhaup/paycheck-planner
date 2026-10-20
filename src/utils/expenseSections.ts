import { format } from "date-fns";
import {
  getLinkedOrdinal,
  getPaycheckSlotLabel,
  getPaychecksPerMonth,
  parseLocalDate,
} from "@/utils/payDates";
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
  return getLinkedOrdinal(expense, source) === undefined
    ? expense.amount * getPaychecksPerMonth(source)
    : expense.amount;
}

export function summarizeExpenses(expenses: Expense[], incomeSources: IncomeSource[]): Summary {
  const sourcesById = new Map(incomeSources.map((s) => [s.id, s]));
  const recurring = expenses.filter((e) => e.isRecurring);
  return {
    monthlyTotal: recurring.reduce(
      (sum, e) =>
        sum + monthlyCost(e, e.incomeSourceId ? sourcesById.get(e.incomeSourceId) : undefined),
      0
    ),
    recurringCount: recurring.length,
  };
}

/** Recurring expenses grouped by linked income source, then unlinked, then one-time. */
export function buildExpenseSections(
  expenses: Expense[],
  incomeSources: IncomeSource[],
  filter: ExpenseFilter,
  formatMoney: (amount: number) => string
): ExpenseSection[] {
  const sections: ExpenseSection[] = [];

  if (filter !== "one-time") {
    incomeSources.forEach((source, tintIndex) => {
      const linked = expenses.filter((e) => e.isRecurring && e.incomeSourceId === source.id);
      if (linked.length === 0) return;
      sections.push({
        key: source.id,
        title: source.name,
        total: `${formatMoney(linked.reduce((sum, e) => sum + monthlyCost(e, source), 0))}/mo`,
        data: linked.map((expense) => {
          const ordinal = getLinkedOrdinal(expense, source);
          return {
            expense,
            tintIndex,
            meta:
              ordinal === undefined
                ? "Every paycheck"
                : `${getPaycheckSlotLabel(source, ordinal)} each month`,
            cadence: ordinal === undefined ? "per check" : "monthly",
          };
        }),
      });
    });

    const sourceIds = new Set(incomeSources.map((s) => s.id));
    const unlinked = expenses.filter(
      (e) => e.isRecurring && (!e.incomeSourceId || !sourceIds.has(e.incomeSourceId))
    );
    if (unlinked.length > 0) {
      sections.push({
        key: "unlinked",
        title: "Not linked",
        total: `${formatMoney(unlinked.reduce((sum, e) => sum + e.amount, 0))}/mo`,
        data: unlinked.map((expense) => ({
          expense,
          meta: "Assign per paycheck",
          cadence: "recurring",
        })),
      });
    }
  }

  if (filter !== "recurring") {
    const oneTime = expenses.filter((e) => !e.isRecurring);
    if (oneTime.length > 0) {
      sections.push({
        key: "one-time",
        title: "One-time",
        total: formatMoney(oneTime.reduce((sum, e) => sum + e.amount, 0)),
        data: oneTime.map((expense) => ({
          expense,
          meta: expense.dueDate
            ? `Due ${format(parseLocalDate(expense.dueDate), "MMM d")}`
            : "One-time",
          cadence: "one-time",
        })),
      });
    }
  }

  return sections;
}

export type PayFrequency = "weekly" | "biweekly" | "semi-monthly" | "monthly";

export interface IncomeSource {
  id: string;
  name: string;
  payAmount: number;
  payFrequency: PayFrequency;
  /** Anchor date (ISO string) used to calculate future pay dates */
  firstPayDate: string;
  /** For semi-monthly: two days of the month, e.g. [1, 15] */
  semiMonthlyDays?: [number, number];
  /** If true, weekend pay dates shift to the preceding Friday */
  adjustToWorkday?: boolean;
}

export interface Expense {
  id: string;
  payee: string;
  amount: number;
  /** Optional URL to open for payment */
  link?: string;
  isRecurring: boolean;
  /** For one-time expenses: specific date (ISO string) */
  dueDate?: string;
  /** If set, this expense auto-assigns to paychecks from this income source */
  incomeSourceId?: string;
  /** Which linked paychecks it lands on; defaults to every paycheck */
  linkSchedule?: LinkSchedule;
  /** For monthly links: which paycheck within the month */
  paycheckOrdinal?: PaycheckSlot;
}

export type LinkSchedule = "every-paycheck" | "monthly";

/** 0-based paycheck within the month, or the month's final paycheck (whatever its position) */
export type PaycheckSlot = number | "last";

export interface ExpenseAssignment {
  id: string;
  expenseId: string;
  /** ISO date string of the pay date this expense is assigned to */
  payDate: string;
  /** Which income source's paycheck covers this */
  employerId: string;
  paid?: boolean;
  /** Overrides the expense's default amount for this paycheck only */
  amount?: number;
}

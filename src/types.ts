import type { ExpenseIcon } from "@/constants/expenseIcons";

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

export type ExpenseKind = "bill" | "set-aside";

export interface Expense {
  id: string;
  /** Set-asides are money kept from a paycheck (spending cash, savings); unset means a bill */
  kind?: ExpenseKind;
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
  /** For links by month (monthly, every 3 or 6 months, yearly): which paycheck within the month */
  paycheckOrdinal?: PaycheckSlot;
  /**
   * Where the repeat starts (YYYY-MM-DD). Every other paycheck: the pay date it lands on, counting
   * every other one from there in both directions. Every 3 or 6 months and yearly: the 1st of a
   * month it lands in; it repeats in both directions from there.
   */
  repeatStart?: string;
  /**
   * Linked recurring bills: day of the month it is due (1–31, clamped to short months). When set
   * it replaces paycheckOrdinal and the schedule goes by month (monthly, every 3 or 6 months,
   * yearly): in each month it lands in, the bill lands on the source's last paycheck on or
   * before this day, or the month's first paycheck when none is.
   */
  dueDay?: number;
  /** Shown on the tile in place of the payee's first letter */
  icon?: ExpenseIcon;
  /** Set-asides only: the total to save, tracked by paychecks marked set aside */
  goal?: number;
}

export type LinkSchedule =
  | "every-paycheck"
  | "every-other-paycheck"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "yearly";

/** A one-off pay amount for a single paycheck, replacing the source's usual amount */
export interface PaycheckOverride {
  sourceId: string;
  payDate: string;
  payAmount: number;
}

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
  /** A linked bill moved off this paycheck; the marker keeps it from reappearing */
  skipped?: boolean;
}

export interface PaycheckRef {
  payDate: string;
  sourceId: string;
}

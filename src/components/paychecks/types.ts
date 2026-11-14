export interface PaycheckExpense {
  expenseId: string;
  payee: string;
  amount: number;
  /** Empty for a linked expense that has no assignment on this pay date yet */
  assignmentId: string;
  link?: string;
  paid?: boolean;
  isSetAside?: boolean;
}

export interface PaycheckItem {
  key: string;
  date: Date;
  payDate: string;
  sourceName: string;
  sourceId: string;
  payAmount: number;
  expenses: PaycheckExpense[];
  paidCount: number;
  totalExpenses: number;
  remaining: number;
}

export interface MonthGroup {
  key: string;
  /** "Oct" for the chart axis */
  shortLabel: string;
  /** "October", or "January 2027" outside the current year */
  longLabel: string;
  income: number;
  assigned: number;
  remaining: number;
  paychecks: PaycheckItem[];
}

/** One row of the Paychecks list, which runs through every month in order. */
export interface PaycheckRow {
  paycheck: PaycheckItem;
  month: MonthGroup;
  monthIndex: number;
  /** The month's first paycheck: its row starts with the month's title */
  monthStart: boolean;
  /** The list's last row */
  last: boolean;
}

export type TogglePaidHandler = (
  assignmentId: string,
  expenseId: string,
  payDate: string,
  sourceId: string
) => void;

export type EditAmountHandler = (expenseId: string, payDate: string, sourceId: string) => void;

export type LinkTapHandler = (
  link: string,
  assignmentId: string,
  expenseId: string,
  payDate: string,
  sourceId: string
) => void;

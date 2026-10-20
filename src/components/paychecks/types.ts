export interface PaycheckExpense {
  expenseId: string;
  payee: string;
  amount: number;
  /** Empty for a linked expense that has no assignment on this pay date yet */
  assignmentId: string;
  link?: string;
  paid?: boolean;
}

export interface PaycheckItem {
  key: string;
  title: string;
  payDate: string;
  sourceName: string;
  sourceId: string;
  payAmount: number;
  expenses: PaycheckExpense[];
  totalExpenses: number;
  remaining: number;
}

export interface MonthGroup {
  key: string;
  label: string;
  paychecks: PaycheckItem[];
}

export type TogglePaidHandler = (
  assignmentId: string,
  expenseId: string,
  payDate: string,
  sourceId: string
) => void;

export type LinkTapHandler = (
  link: string,
  assignmentId: string,
  expenseId: string,
  payDate: string,
  sourceId: string
) => void;

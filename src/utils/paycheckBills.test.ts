import { expect, mock, test } from "bun:test";
import type { Expense, ExpenseAssignment, IncomeSource } from "@/types";

// The pay date helpers import the app's i18n and locale store, which load React Native; these tests need no strings
mock.module("@/localization/i18n", () => ({ t: (key: string) => key, formatOrdinal: String }));
mock.module("@/stores/localeStore", () => ({ getLocaleTag: () => "en-US" }));
const { getPaycheckBills } = await import("@/utils/paycheckBills");

const PAY_DATE = "2026-11-27";
const source: IncomeSource = {
  id: "job",
  name: "Job",
  payAmount: 2000,
  payFrequency: "biweekly",
  firstPayDate: PAY_DATE,
};
const linked: Expense = { id: "rent", payee: "Rent", amount: 900, isRecurring: true, incomeSourceId: "job" };
const saving: Expense = { id: "save", kind: "set-aside", payee: "Savings", amount: 100, isRecurring: true, incomeSourceId: "job" };
const loose: Expense = { id: "gym", payee: "Gym", amount: 30, isRecurring: true };

function assignment(expenseId: string, extra: Partial<ExpenseAssignment> = {}): ExpenseAssignment {
  return { id: `a-${expenseId}`, expenseId, payDate: PAY_DATE, employerId: "job", ...extra };
}

function bills(assignments: ExpenseAssignment[]) {
  return getPaycheckBills({ incomeSources: [source], expenses: [saving, linked, loose], assignments }, PAY_DATE, "job");
}

test("linked and assigned bills are on the paycheck, bills before set-asides, and all start unpaid", () => {
  const result = bills([assignment("gym")]);
  expect(result.assignedExpenses.map((e) => e.id)).toEqual(["rent", "gym", "save"]);
  expect(result.unpaidExpenseIds).toEqual(["rent", "gym", "save"]);
});

test("paid bills drop out of the unpaid ones; with all paid there are none (no Mark all paid)", () => {
  expect(bills([assignment("rent", { paid: true })]).unpaidExpenseIds).toEqual(["save"]);
  const allPaid = bills([assignment("rent", { paid: true }), assignment("save", { paid: true })]);
  expect(allPaid.unpaidExpenseIds).toEqual([]);
});

test("a linked bill moved off the paycheck is not on it", () => {
  const result = bills([assignment("rent", { skipped: true })]);
  expect(result.assignedExpenses.map((e) => e.id)).toEqual(["save"]);
});

test("another source's paycheck or an unknown source has none of these bills", () => {
  const budget = { incomeSources: [source], expenses: [linked], assignments: [assignment("rent")] };
  expect(getPaycheckBills(budget, PAY_DATE, "other").assignedExpenses).toEqual([]);
  expect(getPaycheckBills(budget, "2026-12-11", "job").unpaidExpenseIds).toEqual(["rent"]);
});

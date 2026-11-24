import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";

import { loadBudget, saveBudgetChanges } from "@/db/budget";
import { migrate } from "@/db/migrations";
import { openTestDatabase } from "@/db/testDatabase";
import type { BudgetData } from "@/utils/backup";

const EMPTY: BudgetData = { incomeSources: [], expenses: [], assignments: [], paycheckOverrides: [] };

const BUDGET: BudgetData = {
  incomeSources: [
    { id: "job", name: "Job", payAmount: 2000, payFrequency: "semi-monthly", firstPayDate: "2026-11-01", semiMonthlyDays: [1, 15] },
  ],
  expenses: [
    { id: "rent", payee: "Rent", amount: 1200, isRecurring: true, incomeSourceId: "job", linkSchedule: "monthly", paycheckOrdinal: "last" },
    { id: "gift", kind: "set-aside", payee: "Gift", amount: 50, isRecurring: false, dueDate: "2026-12-01", goal: 300 },
  ],
  assignments: [
    { id: "a1", expenseId: "rent", payDate: "2026-11-15", employerId: "job", paid: true },
    { id: "a2", expenseId: "gift", payDate: "2026-12-01", employerId: "job", amount: 40 },
  ],
  paycheckOverrides: [{ sourceId: "job", payDate: "2026-11-15", payAmount: 2100 }],
};

let file: Database;
let db: ReturnType<typeof openTestDatabase>;

const rows = (table: string) =>
  file.query(`SELECT id, created_at, updated_at, deleted_at FROM ${table} ORDER BY rowid`).all() as {
    id: string;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
  }[];

const count = () =>
  ["income_sources", "expenses", "assignments", "paycheck_overrides"].reduce((sum, table) => sum + rows(table).length, 0);

beforeEach(async () => {
  file = new Database(":memory:");
  db = openTestDatabase(file);
  await migrate(db);
  saveBudgetChanges(db, EMPTY, BUDGET, 1000);
});

test("a saved budget loads back the same, in order", () => {
  expect(loadBudget(db)).toEqual(BUDGET);
  expect(rows("expenses").map((r) => r.created_at)).toEqual([1001, 1002]);
});

test("deleting a bill and its assignment keeps both rows as tombstones", () => {
  const deleted: BudgetData = {
    ...BUDGET,
    expenses: BUDGET.expenses.filter((e) => e.id !== "rent"),
    assignments: BUDGET.assignments.filter((a) => a.expenseId !== "rent"),
  };
  saveBudgetChanges(db, BUDGET, deleted, 2000);

  expect(rows("expenses").find((r) => r.id === "rent")).toMatchObject({ deleted_at: 2000, updated_at: 2000 });
  expect(rows("assignments").find((r) => r.id === "a1")).toMatchObject({ deleted_at: 2000 });
  expect(count()).toBe(6);
  expect(loadBudget(db)).toEqual(deleted);

  // Undo puts the old state back: the rows lose their tombstones and keep their place
  saveBudgetChanges(db, deleted, BUDGET, 3000);
  expect(rows("expenses").find((r) => r.id === "rent")).toMatchObject({ deleted_at: null, updated_at: 3000, created_at: 1001 });
  expect(loadBudget(db)).toEqual(BUDGET);
  expect(count()).toBe(6);
});

test("erasing everything never deletes a row", () => {
  saveBudgetChanges(db, BUDGET, EMPTY, 2000);
  expect(loadBudget(db)).toEqual(EMPTY);
  expect(count()).toBe(6);
  expect(file.query("SELECT count(*) AS n FROM expenses WHERE deleted_at IS NULL").get()).toEqual({ n: 0 });
});

test("an edit stamps only the row that changed", () => {
  const edited: BudgetData = {
    ...BUDGET,
    // A copy with nothing changed must not be stamped either
    expenses: [{ ...BUDGET.expenses[0], amount: 1250 }, { ...BUDGET.expenses[1] }],
  };
  saveBudgetChanges(db, BUDGET, edited, 2000);
  expect(rows("expenses").map((r) => [r.id, r.updated_at])).toEqual([
    ["rent", 2000],
    ["gift", 1000],
  ]);
  expect(loadBudget(db).expenses[0].amount).toBe(1250);
});

test("a paycheck override is one row per paycheck, keyed source|date", () => {
  expect(rows("paycheck_overrides").map((r) => r.id)).toEqual(["job|2026-11-15"]);

  const changed: BudgetData = { ...BUDGET, paycheckOverrides: [{ sourceId: "job", payDate: "2026-11-15", payAmount: 1900 }] };
  saveBudgetChanges(db, BUDGET, changed, 2000);
  const cleared: BudgetData = { ...BUDGET, paycheckOverrides: [] };
  saveBudgetChanges(db, changed, cleared, 3000);

  expect(rows("paycheck_overrides")).toEqual([{ id: "job|2026-11-15", created_at: 1005, updated_at: 3000, deleted_at: 3000 }]);
  expect(loadBudget(db).paycheckOverrides).toEqual([]);
});

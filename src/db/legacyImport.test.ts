import { Database } from "bun:sqlite";
import { beforeEach, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { loadBudget, saveBudgetChanges } from "@/db/budget";
import { IMPORTED_SETTING, importLegacyStore, LEGACY_BUDGET_KEY, legacyValue } from "@/db/legacyImport";
import { migrate } from "@/db/migrations";
import { readSettings } from "@/db/settings";
import { openTestDatabase } from "@/db/testDatabase";
import type { BudgetData } from "@/utils/backup";

/**
 * AsyncStorage's files from the 1.1.0 build (main @ 0624fd1) on an iOS simulator: sample data, Pro
 * bought, two paycheck overrides, bills marked paid, a bill's own amount on one paycheck, a linked bill
 * moved (its skip marker), Light, Hide cents, Spanish and a payday reminder two days before.
 */
const FIXTURE = join(import.meta.dir, "__fixtures__", "RCTAsyncLocalStorage_V1");

const md5 = (key: string) => createHash("md5").update(key).digest("hex");
const readFixture = async (key: string) =>
  legacyValue(
    key,
    readFileSync(join(FIXTURE, "manifest.json"), "utf8"),
    (name) => (existsSync(join(FIXTURE, name)) ? readFileSync(join(FIXTURE, name), "utf8") : null),
    md5
  );

const fixtureBudget = async () => {
  const { state } = JSON.parse((await readFixture(LEGACY_BUDGET_KEY))!) as { state: BudgetData };
  return {
    incomeSources: state.incomeSources,
    expenses: state.expenses,
    assignments: state.assignments,
    paycheckOverrides: state.paycheckOverrides,
  };
};

let file: Database;
let db: ReturnType<typeof openTestDatabase>;

const count = (table: string) => (file.query(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n;

beforeEach(async () => {
  file = new Database(":memory:");
  db = openTestDatabase(file);
  await migrate(db);
});

test("the long budget value is in its md5-named file, short ones are inline", async () => {
  expect(existsSync(join(FIXTURE, md5(LEGACY_BUDGET_KEY)))).toBe(true);
  expect(await readFixture("paycheck-planner-pro")).toBe('{"state":{"isPro":true},"version":0}');
  expect(await readFixture("missing")).toBeNull();
  expect(legacyValue("anything", null, () => "x", md5)).toBeNull();
});

test("the 1.1.0 store imports every entity and setting", async () => {
  const budget = await fixtureBudget();
  expect(budget.incomeSources.length).toBe(2);
  expect(budget.paycheckOverrides.length).toBe(2);
  expect(budget.assignments.some((a) => a.skipped)).toBe(true);
  expect(budget.assignments.some((a) => a.paid)).toBe(true);
  expect(budget.assignments.some((a) => a.amount !== undefined)).toBe(true);

  await importLegacyStore(db, readFixture, 5000);

  expect(loadBudget(db)).toEqual(budget);
  expect(readSettings(db)).toEqual({
    themeMode: "light",
    autoMarkPaidOnLinkTap: false,
    hideCents: true,
    "reminders.enabled": true,
    "reminders.daysBefore": 2,
    "reminders.hour": 18,
    "reminders.minute": 0,
    "reminders.unpaidEnabled": false,
    language: "es",
    currency: "system",
    pro: true,
    [IMPORTED_SETTING]: 5000,
  });
});

test("the import runs once: a deleted bill stays deleted", async () => {
  await importLegacyStore(db, readFixture, 5000);
  const budget = loadBudget(db);
  const deleted = { ...budget, expenses: budget.expenses.slice(1) };
  saveBudgetChanges(db, budget, deleted, 6000);
  const counts = ["income_sources", "expenses", "assignments", "paycheck_overrides"].map(count);

  let reads = 0;
  await importLegacyStore(db, (key) => {
    reads++;
    return readFixture(key);
  });

  expect(reads).toBe(0);
  expect(loadBudget(db)).toEqual(deleted);
  expect(["income_sources", "expenses", "assignments", "paycheck_overrides"].map(count)).toEqual(counts);
});

test("a fresh install with no old store only marks the import done", async () => {
  await importLegacyStore(db, async () => null, 5000);
  expect(readSettings(db)).toEqual({ [IMPORTED_SETTING]: 5000 });
  expect(count("expenses")).toBe(0);
});

test("an unreadable old store writes nothing and is tried again next launch", async () => {
  const warn = console.warn;
  console.warn = () => {};
  await importLegacyStore(db, async (key) => {
    if (key === "paycheck-planner-pro") throw new Error("disk");
    return readFixture(key);
  });
  console.warn = warn;
  expect(count("expenses")).toBe(0);
  expect(count("settings")).toBe(0);

  await importLegacyStore(db, readFixture, 7000);
  expect(loadBudget(db)).toEqual(await fixtureBudget());
});

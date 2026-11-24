import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
import type { SQLiteDatabase } from "expo-sqlite";
import { runCycle } from "@johnhaup/expo-cloud-sync/build/cycle";
import { installSyncWith } from "@johnhaup/expo-cloud-sync/build/install";
import { createMemoryCloud, memoryTransport, type MemoryCloud } from "@johnhaup/expo-cloud-sync/build/testing/memoryTransport";

import { loadBudget, saveBudgetChanges, stampBudget } from "@/db/budget";
import { IMPORTED_SETTING } from "@/db/legacyImport";
import { migrate } from "@/db/migrations";
import { readSettings, SETTINGS_STORES, writeSetting } from "@/db/settings";
import { DEVICE_SETTINGS, SYNC_CONFIG, SYNCED_SETTINGS } from "@/db/sync";
import { openTestDatabase } from "@/db/testDatabase";
import type { BudgetData } from "@/utils/backup";

const EMPTY: BudgetData = { incomeSources: [], expenses: [], assignments: [], paycheckOverrides: [] };

const BUDGET: BudgetData = {
  incomeSources: [{ id: "job", name: "Job", payAmount: 2000, payFrequency: "monthly", firstPayDate: "2026-11-01" }],
  expenses: [{ id: "rent", payee: "Rent", amount: 1200, isRecurring: true, incomeSourceId: "job", linkSchedule: "monthly" }],
  assignments: [{ id: "a1", expenseId: "rent", payDate: "2026-12-01", employerId: "job", paid: true }],
  paycheckOverrides: [{ sourceId: "job", payDate: "2026-12-01", payAmount: 2100 }],
};

let file: Database;
let db: ReturnType<typeof openTestDatabase>;

const dirty = () =>
  (file.query("SELECT table_name, row_id FROM _sync_changes ORDER BY table_name, row_id").all() as {
    table_name: string;
    row_id: string;
  }[]).map((row) => `${row.table_name}/${row.row_id}`);

beforeEach(async () => {
  file = new Database(":memory:");
  db = openTestDatabase(file);
  await migrate(db);
  await installSyncWith(db, SYNC_CONFIG, "test-device");
  file.exec("DELETE FROM _sync_changes");
});

test("every table of the schema is synced", () => {
  const tables = (
    file
      .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE '\\_sync\\_%' ESCAPE '\\'")
      .all() as { name: string }[]
  ).map((row) => row.name);
  expect(tables.sort()).toEqual(SYNC_CONFIG.tables.map((table) => table.name).sort());
});

test("every settings key is either synced or kept on the device, never both", () => {
  const keys = [...Object.values(SETTINGS_STORES).flatMap((store) => Object.values(store.fields)), IMPORTED_SETTING];
  expect([...DEVICE_SETTINGS, ...SYNCED_SETTINGS].sort()).toEqual(keys.sort());
});

test("Pro and the other device settings never sync; budget settings do", () => {
  writeSetting(db, "pro", true);
  writeSetting(db, "language", "ar");
  writeSetting(db, "reminders.enabled", true);
  expect(dirty()).toEqual([]);
  writeSetting(db, "currency", "EUR");
  writeSetting(db, "pro", false);
  expect(dirty()).toEqual(["settings/currency"]);
});

test("adds, edits and removals are marked for sync, and a removal is never a hard delete", () => {
  saveBudgetChanges(db, EMPTY, BUDGET, 1000);
  expect(dirty()).toEqual([
    "assignments/a1",
    "expenses/rent",
    "income_sources/job",
    "paycheck_overrides/job|2026-12-01",
  ]);

  file.exec("DELETE FROM _sync_changes");
  const edited = { ...BUDGET, expenses: [{ ...BUDGET.expenses[0], amount: 1300 }] };
  saveBudgetChanges(db, BUDGET, edited, 2000);
  expect(dirty()).toEqual(["expenses/rent"]);

  file.exec("DELETE FROM _sync_changes");
  saveBudgetChanges(db, edited, { ...edited, expenses: [], assignments: [] }, 3000);
  expect(dirty()).toEqual(["assignments/a1", "expenses/rent"]);
  expect(file.query("SELECT deleted_at FROM expenses WHERE id = 'rent'").get()).toEqual({ deleted_at: 3000 });
});

test("a restore stamps every live row so it wins over older copies", () => {
  saveBudgetChanges(db, EMPTY, BUDGET, 1000);
  saveBudgetChanges(db, BUDGET, { ...BUDGET, expenses: [] }, 2000);
  file.exec("DELETE FROM _sync_changes");

  stampBudget(db, 5000);
  expect(dirty()).toEqual(["assignments/a1", "income_sources/job", "paycheck_overrides/job|2026-12-01"]);
  expect(file.query("SELECT updated_at FROM income_sources").get()).toEqual({ updated_at: 5000 });
  expect(file.query("SELECT updated_at FROM expenses").get()).toEqual({ updated_at: 2000 });
});

/**
 * Two devices on one account through the module's memory cloud, over the app's real schema and config.
 * iOS runs CKSyncEngine instead of this cycle, but both merge through the same code (`apply.ts`).
 */
describe("two devices", () => {
  async function openDevice(id: string) {
    const deviceFile = new Database(":memory:");
    const deviceDb = openTestDatabase(deviceFile);
    await migrate(deviceDb);
    await installSyncWith(deviceDb, SYNC_CONFIG, id);
    return deviceDb;
  }

  /** Syncs each device in turn until nothing is left to send. */
  async function settle(cloud: MemoryCloud, ...devices: SQLiteDatabase[]) {
    for (let i = 0; i < 3; i++) {
      for (const device of devices) expect((await runCycle(device, SYNC_CONFIG, memoryTransport(cloud))).state).toBe("idle");
    }
  }

  const amounts = (device: SQLiteDatabase) => loadBudget(device).expenses.map((e) => `${e.payee}:${e.amount}`);

  const TWO_BILLS: BudgetData = {
    ...BUDGET,
    expenses: [...BUDGET.expenses, { id: "phone", payee: "Phone", amount: 60, isRecurring: true, incomeSourceId: "job" }],
  };

  async function twoDevices() {
    const cloud = createMemoryCloud();
    const a = await openDevice("device-a");
    const b = await openDevice("device-b");
    saveBudgetChanges(a, EMPTY, TWO_BILLS, 1000);
    await settle(cloud, a, b);
    return { cloud, a, b };
  }

  test("sources, bills, assignments and overrides reach the other device", async () => {
    const { a, b } = await twoDevices();
    expect(loadBudget(b)).toEqual(loadBudget(a));
    expect(loadBudget(b).paycheckOverrides).toEqual(BUDGET.paycheckOverrides);
  });

  test("the later edit of one bill wins on both", async () => {
    const { cloud, a, b } = await twoDevices();
    const edit = (amount: number) => ({ ...TWO_BILLS, expenses: [{ ...TWO_BILLS.expenses[0], amount }, TWO_BILLS.expenses[1]] });
    saveBudgetChanges(b, TWO_BILLS, edit(1250), 3000);
    saveBudgetChanges(a, TWO_BILLS, edit(1300), 2000);
    await settle(cloud, a, b);
    expect(amounts(a)).toEqual(["Rent:1250", "Phone:60"]);
    expect(amounts(b)).toEqual(["Rent:1250", "Phone:60"]);
  });

  test("edits to two different bills on two devices both survive", async () => {
    const { cloud, a, b } = await twoDevices();
    const [rent, phone] = TWO_BILLS.expenses;
    saveBudgetChanges(a, TWO_BILLS, { ...TWO_BILLS, expenses: [{ ...rent, amount: 1300 }, phone] }, 2000);
    saveBudgetChanges(b, TWO_BILLS, { ...TWO_BILLS, expenses: [rent, { ...phone, amount: 70 }] }, 2001);
    await settle(cloud, a, b);
    expect(amounts(a)).toEqual(["Rent:1300", "Phone:70"]);
    expect(amounts(b)).toEqual(["Rent:1300", "Phone:70"]);
  });

  test("a delete on one device removes the bill on the other", async () => {
    const { cloud, a, b } = await twoDevices();
    saveBudgetChanges(a, TWO_BILLS, { ...TWO_BILLS, expenses: [TWO_BILLS.expenses[0]] }, 2000);
    await settle(cloud, a, b);
    expect(amounts(b)).toEqual(["Rent:1200"]);
  });

  test("a restore from a backup file survives the next sync, even against a newer edit not yet fetched", async () => {
    const { cloud, a, b } = await twoDevices();
    const backup = loadBudget(a);
    const [rent, phone] = TWO_BILLS.expenses;
    // B changes one bill and adds another; A has not fetched them when it restores
    saveBudgetChanges(b, TWO_BILLS, { ...TWO_BILLS, expenses: [{ ...rent, amount: 999 }, phone, { ...phone, id: "gym", payee: "Gym" }] }, 2000);
    await settle(cloud, b);
    const before = loadBudget(a);
    saveBudgetChanges(a, before, backup, 3000);
    stampBudget(a, 3000);
    await settle(cloud, a, b);
    expect(amounts(a)).toEqual(["Rent:1200", "Phone:60", "Gym:60"]);
    expect(amounts(b)).toEqual(["Rent:1200", "Phone:60", "Gym:60"]);
  });

  test("Pro and device settings stay on their device; budget settings sync", async () => {
    const { cloud, a, b } = await twoDevices();
    writeSetting(a, "pro", true, 2000);
    writeSetting(a, "language", "ar", 2000);
    writeSetting(a, "themeMode", "light", 2000);
    writeSetting(a, "currency", "EUR", 2000);
    writeSetting(a, "hideCents", true, 2000);
    await settle(cloud, a, b);
    expect(readSettings(b)).toEqual({ currency: "EUR", hideCents: true });
  });
});

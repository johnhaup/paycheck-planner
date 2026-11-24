import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";

import { migrate, SCHEMA_VERSION } from "@/db/migrations";
import { readSettings, writeSetting } from "@/db/settings";
import { openTestDatabase } from "@/db/testDatabase";

test("a new database migrates to the latest version and keeps settings", async () => {
  const file = new Database(":memory:");
  const db = openTestDatabase(file);
  await migrate(db);
  expect(file.query("PRAGMA user_version").get()).toEqual({ user_version: SCHEMA_VERSION });

  writeSetting(db, "hideCents", true);
  writeSetting(db, "hideCents", false);
  writeSetting(db, "reminders.daysBefore", 2);
  expect(readSettings(db)).toEqual({ hideCents: false, "reminders.daysBefore": 2 });
});

test("migrating twice changes nothing", async () => {
  const file = new Database(":memory:");
  const db = openTestDatabase(file);
  await migrate(db);
  await migrate(db);
  expect(file.query("PRAGMA user_version").get()).toEqual({ user_version: SCHEMA_VERSION });
});

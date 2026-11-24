import type { SQLiteDatabase } from "expo-sqlite";

const ENTITY_STAMPS = `created_at INTEGER NOT NULL,
     updated_at INTEGER NOT NULL,
     deleted_at INTEGER`;

/**
 * One entry per schema version; append, never edit a shipped entry.
 *
 * One table per entity, each row with a stable `id`, `updated_at` (ms) and `deleted_at` (a tombstone,
 * never a hard delete), so two devices' edits to different rows can merge when sync arrives. No foreign
 * keys: the store cascades deletes itself, and the AsyncStorage import must accept dangling references.
 */
export const MIGRATIONS: string[] = [
  `CREATE TABLE income_sources (
     id TEXT PRIMARY KEY NOT NULL,
     name TEXT NOT NULL,
     pay_amount REAL NOT NULL,
     pay_frequency TEXT NOT NULL,
     first_pay_date TEXT NOT NULL,
     semi_monthly_days TEXT,
     adjust_to_workday INTEGER,
     ${ENTITY_STAMPS}
   );
   CREATE TABLE expenses (
     id TEXT PRIMARY KEY NOT NULL,
     kind TEXT,
     payee TEXT NOT NULL,
     amount REAL NOT NULL,
     link TEXT,
     is_recurring INTEGER NOT NULL,
     due_date TEXT,
     income_source_id TEXT,
     link_schedule TEXT,
     paycheck_ordinal TEXT,
     repeat_start TEXT,
     due_day INTEGER,
     icon TEXT,
     goal REAL,
     ${ENTITY_STAMPS}
   );
   CREATE TABLE assignments (
     id TEXT PRIMARY KEY NOT NULL,
     expense_id TEXT NOT NULL,
     pay_date TEXT NOT NULL,
     income_source_id TEXT NOT NULL,
     paid INTEGER,
     amount REAL,
     skipped INTEGER,
     ${ENTITY_STAMPS}
   );
   CREATE TABLE paycheck_overrides (
     id TEXT PRIMARY KEY NOT NULL,
     income_source_id TEXT NOT NULL,
     pay_date TEXT NOT NULL,
     pay_amount REAL NOT NULL,
     ${ENTITY_STAMPS}
   );
   CREATE TABLE settings (
     key TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL,
     updated_at INTEGER NOT NULL
   );`,
];

/** The schema version a database is at once every migration has run. */
export const SCHEMA_VERSION = MIGRATIONS.length;

export async function migrate(db: SQLiteDatabase, to = SCHEMA_VERSION) {
  await db.execAsync("PRAGMA journal_mode = WAL");
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  for (let version = row?.user_version ?? 0; version < to; version++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}

import type { SQLiteDatabase } from "expo-sqlite";
import { upsertSql } from "@/db/budget";
import { SETTINGS_STORES, writeSetting } from "@/db/settings";
import { TABLES, toRow, type BudgetEntity } from "@/db/tables";

/** Up to 1.1.0 the budget was zustand `persist` on AsyncStorage under this key. */
export const LEGACY_BUDGET_KEY = "paycheck-planner-storage";
/** Set once the old store has been imported, so it is never imported again. */
export const IMPORTED_SETTING = "legacyImportedAt";

type LegacyState = Record<string, unknown>;

function parseState(json: string | null): LegacyState | undefined {
  if (!json) return undefined;
  const state = (JSON.parse(json) as { state?: unknown }).state;
  return state && typeof state === "object" ? (state as LegacyState) : undefined;
}

/**
 * Copies the budget and settings the app kept in AsyncStorage into SQLite, once. Rows already in
 * SQLite win. When the old store cannot be read nothing is written, and the next launch tries again.
 */
export async function importLegacyStore(
  db: SQLiteDatabase,
  read: (key: string) => Promise<string | null>,
  now = Date.now()
) {
  if (db.getFirstSync("SELECT 1 FROM settings WHERE key = ?", IMPORTED_SETTING)) return;

  const stores = Object.values(SETTINGS_STORES);
  let budget: LegacyState | undefined;
  let settings: (LegacyState | undefined)[];
  try {
    budget = parseState(await read(LEGACY_BUDGET_KEY));
    settings = [];
    for (const store of stores) settings.push(parseState(await read(store.legacyKey)));
  } catch (error) {
    console.warn("Could not read the old AsyncStorage data; trying again next launch", error);
    return;
  }

  db.withTransactionSync(() => {
    let created = 0;
    for (const spec of TABLES) {
      const entities = budget?.[spec.stateKey];
      if (!Array.isArray(entities)) continue;
      const insert = upsertSql(spec, "ignore");
      for (const entity of entities as BudgetEntity[]) {
        db.runSync(insert, spec.id(entity), ...toRow(spec, entity), now + created++, now);
      }
    }
    stores.forEach((store, i) => {
      const state = settings[i];
      if (!state) return;
      for (const [field, key] of Object.entries(store.fields)) {
        if (state[field] !== undefined) writeSetting(db, key, state[field], now);
      }
    });
    writeSetting(db, IMPORTED_SETTING, now, now);
  });
}

/**
 * One value from AsyncStorage's iOS files: `manifest.json` holds short values inline and `null`
 * for a value too long for it, which is then in a file named after the key's MD5.
 */
export function legacyValue(
  key: string,
  manifestJson: string | null,
  readFile: (name: string) => string | null,
  md5: (key: string) => string
): string | null {
  if (!manifestJson) return null;
  const manifest = JSON.parse(manifestJson) as Record<string, string | null>;
  if (!(key in manifest)) return null;
  return manifest[key] ?? readFile(md5(key));
}

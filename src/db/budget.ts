import type { SQLiteDatabase } from "expo-sqlite";
import type { BudgetData } from "@/utils/backup";
import { fromRow, TABLES, toRow, type BudgetEntity, type TableSpec } from "@/db/tables";

type Row = Record<string, string | number | null>;

/** Every live row, in the order the user added them. */
export function loadBudget(db: SQLiteDatabase): BudgetData {
  const data: Record<string, unknown[]> = {};
  for (const spec of TABLES) {
    const rows = db.getAllSync<Row>(
      `SELECT * FROM ${spec.table} WHERE deleted_at IS NULL ORDER BY created_at, rowid`
    );
    data[spec.stateKey] = rows.map((row) => fromRow(spec, row));
  }
  return data as unknown as BudgetData;
}

/** Inserts one entity; with `ignoreExisting`, a row that is already there is left as it is. */
export function insertSql(spec: TableSpec, ignoreExisting = false) {
  const columns = spec.columns.map(([column]) => column);
  const placeholders = ["?", ...columns.map(() => "?"), "?", "?"].join(", ");
  const insert = `INSERT INTO ${spec.table} (id, ${columns.join(", ")}, created_at, updated_at) VALUES (${placeholders})`;
  return ignoreExisting ? `${insert} ON CONFLICT(id) DO NOTHING` : insert;
}

/**
 * Overwrites one entity; a row that comes back (undo, restore) loses its tombstone and keeps its created_at.
 * Never an `ON CONFLICT … DO UPDATE` upsert: its conflict policy overrides the `INSERT OR REPLACE` in
 * cloud-sync's update trigger, which then aborts on a row already queued in `_sync_changes` (HAU-791).
 */
function updateSql(spec: TableSpec) {
  const updates = spec.columns.map(([column]) => `${column} = ?`).join(", ");
  return `UPDATE ${spec.table} SET ${updates}, updated_at = ?, deleted_at = NULL WHERE id = ?`;
}

const sameRow = (a: unknown[], b: unknown[]) => a.every((value, i) => value === b[i]);

/**
 * Writes what changed between two store states: new or edited entities are upserted, removed
 * ones get a tombstone. Nothing is ever deleted, so sync can tell a removal from a row it never saw.
 */
export function saveBudgetChanges(db: SQLiteDatabase, prev: BudgetData, next: BudgetData, now = Date.now()) {
  db.withTransactionSync(() => {
    let created = 0;
    for (const spec of TABLES) {
      const before: BudgetEntity[] = prev[spec.stateKey];
      const after: BudgetEntity[] = next[spec.stateKey];
      if (before === after) continue;
      const previous = new Map(before.map((entity) => [spec.id(entity), entity]));
      const kept = new Set<string>();
      const insert = insertSql(spec);
      const update = updateSql(spec);
      for (const entity of after) {
        const id = spec.id(entity);
        kept.add(id);
        const old = previous.get(id);
        if (old === entity) continue;
        const row = toRow(spec, entity);
        if (old && sameRow(row, toRow(spec, old))) continue;
        if (db.runSync(update, ...row, now, id).changes === 0) db.runSync(insert, id, ...row, now + created, now);
        created++;
      }
      for (const id of previous.keys()) {
        if (!kept.has(id)) {
          db.runSync(
            `UPDATE ${spec.table} SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
            now,
            now,
            id
          );
        }
      }
    }
  });
}

/**
 * Stamps every live row as changed now. After a restore from a backup file, so the restored budget wins
 * over the copies other devices hold, including rows the restore left as they were.
 */
export function stampBudget(db: SQLiteDatabase, now = Date.now()) {
  db.withTransactionSync(() => {
    for (const spec of TABLES) {
      db.runSync(`UPDATE ${spec.table} SET updated_at = ? WHERE deleted_at IS NULL`, now);
    }
  });
}

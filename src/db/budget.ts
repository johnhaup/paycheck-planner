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

/** Upserts one entity; a row that comes back (undo, restore) loses its tombstone and keeps its created_at. */
export function upsertSql(spec: TableSpec, conflict: "update" | "ignore") {
  const columns = spec.columns.map(([column]) => column);
  const placeholders = ["?", ...columns.map(() => "?"), "?", "?"].join(", ");
  const insert = `INSERT INTO ${spec.table} (id, ${columns.join(", ")}, created_at, updated_at) VALUES (${placeholders})`;
  if (conflict === "ignore") return `${insert} ON CONFLICT(id) DO NOTHING`;
  const updates = columns.map((column) => `${column} = excluded.${column}`).join(", ");
  return `${insert} ON CONFLICT(id) DO UPDATE SET ${updates}, updated_at = excluded.updated_at, deleted_at = NULL`;
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
      const upsert = upsertSql(spec, "update");
      for (const entity of after) {
        const id = spec.id(entity);
        kept.add(id);
        const old = previous.get(id);
        if (old === entity) continue;
        const row = toRow(spec, entity);
        if (old && sameRow(row, toRow(spec, old))) continue;
        db.runSync(upsert, id, ...row, now + created++, now);
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

import type { BudgetData } from "@/utils/backup";

type ColumnKind = "text" | "number" | "bool" | "json";
type SqlValue = string | number | null;

export type BudgetKey = keyof BudgetData;
type Entity<K extends BudgetKey> = BudgetData[K][number];
export type BudgetEntity = Entity<BudgetKey>;

export interface TableSpec<K extends BudgetKey = BudgetKey> {
  table: string;
  stateKey: K;
  id: (entity: Entity<K>) => string;
  /** Whether the entity carries its own `id` field (a paycheck override's id is derived) */
  hasIdField: boolean;
  /** Column, entity field, how the value is stored. `id` and the stamps are not listed. */
  columns: [string, string, ColumnKind][];
}

const incomeSources: TableSpec<"incomeSources"> = {
  table: "income_sources",
  stateKey: "incomeSources",
  id: (s) => s.id,
  hasIdField: true,
  columns: [
    ["name", "name", "text"],
    ["pay_amount", "payAmount", "number"],
    ["pay_frequency", "payFrequency", "text"],
    ["first_pay_date", "firstPayDate", "text"],
    ["semi_monthly_days", "semiMonthlyDays", "json"],
    ["adjust_to_workday", "adjustToWorkday", "bool"],
  ],
};

const expenses: TableSpec<"expenses"> = {
  table: "expenses",
  stateKey: "expenses",
  id: (e) => e.id,
  hasIdField: true,
  columns: [
    ["kind", "kind", "text"],
    ["payee", "payee", "text"],
    ["amount", "amount", "number"],
    ["link", "link", "text"],
    ["is_recurring", "isRecurring", "bool"],
    ["due_date", "dueDate", "text"],
    ["income_source_id", "incomeSourceId", "text"],
    ["link_schedule", "linkSchedule", "text"],
    ["paycheck_ordinal", "paycheckOrdinal", "json"],
    ["repeat_start", "repeatStart", "text"],
    ["due_day", "dueDay", "number"],
    ["icon", "icon", "text"],
    ["goal", "goal", "number"],
  ],
};

const assignments: TableSpec<"assignments"> = {
  table: "assignments",
  stateKey: "assignments",
  id: (a) => a.id,
  hasIdField: true,
  columns: [
    ["expense_id", "expenseId", "text"],
    ["pay_date", "payDate", "text"],
    ["income_source_id", "employerId", "text"],
    ["paid", "paid", "bool"],
    ["amount", "amount", "number"],
    ["skipped", "skipped", "bool"],
  ],
};

/** One row per paycheck, so two devices overriding the same paycheck merge into one row. */
export const overrideId = (sourceId: string, payDate: string) => `${sourceId}|${payDate}`;

const paycheckOverrides: TableSpec<"paycheckOverrides"> = {
  table: "paycheck_overrides",
  stateKey: "paycheckOverrides",
  id: (o) => overrideId(o.sourceId, o.payDate),
  hasIdField: false,
  columns: [
    ["income_source_id", "sourceId", "text"],
    ["pay_date", "payDate", "text"],
    ["pay_amount", "payAmount", "number"],
  ],
};

export const TABLES = [incomeSources, expenses, assignments, paycheckOverrides] as TableSpec[];

/** The column values in `spec.columns` order; a missing field is NULL. */
export function toRow(spec: TableSpec, entity: object): SqlValue[] {
  const fields = entity as Record<string, unknown>;
  return spec.columns.map(([, field, kind]) => {
    const value = fields[field];
    if (value === undefined || value === null) return null;
    if (kind === "bool") return value ? 1 : 0;
    if (kind === "json") return JSON.stringify(value);
    return value as string | number;
  });
}

/** The entity for a row; a NULL column leaves its field out, as the store never sets one to undefined on purpose. */
export function fromRow<K extends BudgetKey>(spec: TableSpec<K>, row: Record<string, SqlValue>): Entity<K> {
  const entity: Record<string, unknown> = spec.hasIdField ? { id: row.id } : {};
  for (const [column, field, kind] of spec.columns) {
    const value = row[column];
    if (value === null || value === undefined) continue;
    entity[field] = kind === "bool" ? value === 1 : kind === "json" ? JSON.parse(String(value)) : value;
  }
  return entity as unknown as Entity<K>;
}

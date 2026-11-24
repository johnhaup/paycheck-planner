import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Where each settings store's fields live: one `settings` row per field, so two devices changing
 * different settings both keep their change. `legacyKey` is the store's old AsyncStorage key.
 */
export const SETTINGS_STORES = {
  theme: {
    legacyKey: "paycheck-planner-theme",
    fields: { themeMode: "themeMode", autoMarkPaidOnLinkTap: "autoMarkPaidOnLinkTap", hideCents: "hideCents" },
  },
  notifications: {
    legacyKey: "paycheck-planner-notifications",
    fields: {
      enabled: "reminders.enabled",
      daysBefore: "reminders.daysBefore",
      hour: "reminders.hour",
      minute: "reminders.minute",
      unpaidEnabled: "reminders.unpaidEnabled",
    },
  },
  locale: {
    legacyKey: "paycheck-planner-locale",
    fields: { language: "language", currency: "currency" },
  },
  pro: {
    legacyKey: "paycheck-planner-pro",
    fields: { isPro: "pro" },
  },
} as const satisfies Record<string, { legacyKey: string; fields: Record<string, string> }>;

export type SettingsStoreName = keyof typeof SETTINGS_STORES;

export function readSettings(db: SQLiteDatabase): Record<string, unknown> {
  const rows = db.getAllSync<{ key: string; value: string }>("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((row) => [row.key, JSON.parse(row.value)]));
}

/** Update, then insert: an `ON CONFLICT … DO UPDATE` upsert aborts in cloud-sync's trigger (see `updateSql` in `@/db/budget`). */
export function writeSetting(db: SQLiteDatabase, key: string, value: unknown, now = Date.now()) {
  const json = JSON.stringify(value);
  if (db.runSync("UPDATE settings SET value = ?, updated_at = ? WHERE key = ?", json, now, key).changes > 0) return;
  db.runSync("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)", key, json, now);
}

/** A store's fields that have a row, ready for its `setState`. */
export function storeSettings(settings: Record<string, unknown>, store: SettingsStoreName) {
  const state: Record<string, unknown> = {};
  for (const [field, key] of Object.entries(SETTINGS_STORES[store].fields)) {
    if (key in settings) state[field] = settings[key];
  }
  return state;
}

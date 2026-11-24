import type { SyncConfig } from "@johnhaup/expo-cloud-sync";
import { IMPORTED_SETTING } from "@/db/legacyImport";
import { SCHEMA_VERSION } from "@/db/migrations";

/**
 * Settings that belong to this phone and never sync: Pro is re-asked from the store on every device,
 * reminders need this phone's notification permission, the language reloads into RTL, the theme
 * follows the phone, and the legacy import ran once on this install.
 */
export const DEVICE_SETTINGS = [
  "pro",
  IMPORTED_SETTING,
  "language",
  "themeMode",
  "reminders.enabled",
  "reminders.daysBefore",
  "reminders.hour",
  "reminders.minute",
  "reminders.unpaidEnabled",
];

/** Settings that describe the budget and follow it to every device. */
export const SYNCED_SETTINGS = ["currency", "hideCents", "autoMarkPaidOnLinkTap"];

/** What syncs through iCloud. Parents before children. Migrations on these tables are additive only. */
export const SYNC_CONFIG: SyncConfig = {
  app: "paycheck-planner",
  schemaVersion: SCHEMA_VERSION,
  tables: [
    { name: "income_sources" },
    { name: "expenses" },
    { name: "assignments" },
    { name: "paycheck_overrides" },
    { name: "settings", key: "key", tombstone: null, excludeKeys: DEVICE_SETTINGS },
  ],
};

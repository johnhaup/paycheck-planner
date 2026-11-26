import type { SQLiteDatabase } from "expo-sqlite";
import { installSync } from "@johnhaup/expo-cloud-sync";
import type { StoreApi } from "zustand";
import { loadBudget, saveBudgetChanges } from "@/db/budget";
import { readLegacyValue } from "@/db/legacyAsyncStorage";
import { importLegacyStore } from "@/db/legacyImport";
import { migrate } from "@/db/migrations";
import { readSettings, SETTINGS_STORES, storeSettings, writeSetting, type SettingsStoreName } from "@/db/settings";
import { SYNC_CONFIG } from "@/db/sync";
import { useProStore } from "@/services/pro";
import { useStore } from "@/store";
import { syncLayoutDirection, useLocaleStore } from "@/stores/localeStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useThemeStore } from "@/stores/themeStore";

const SETTINGS_STORE_APIS: Record<SettingsStoreName, StoreApi<object>> = {
  theme: useThemeStore,
  notifications: useNotificationStore,
  locale: useLocaleStore,
  pro: useProStore,
};

let unsubscribers: (() => void)[] = [];
/** True while the stores are filled from the database, so the fill is not written back and re-stamped. */
let loading = false;

function guarded(write: () => void) {
  try {
    write();
  } catch (error) {
    console.warn("Could not save to the database", error);
  }
}

/**
 * `SQLiteProvider`'s `onInit`. Keep it module-level: the provider reruns `onInit` whenever its identity
 * changes, on the same connection, and two runs at once crash with "cannot start a transaction within a
 * transaction". Fills the stores before the first screen renders, then writes every change through.
 */
export async function initDatabase(db: SQLiteDatabase) {
  await migrate(db);
  await installSync(db, SYNC_CONFIG);
  await importLegacyStore(db, readLegacyValue);

  loadStores(db);

  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [
    useStore.subscribe((next, prev) => {
      if (!loading) guarded(() => saveBudgetChanges(db, prev, next));
    }),
    ...Object.entries(SETTINGS_STORE_APIS).map(([name, store]) =>
      store.subscribe((next, prev) => {
        if (loading) return;
        const nextFields = next as Record<string, unknown>;
        const prevFields = prev as Record<string, unknown>;
        for (const [field, key] of Object.entries(SETTINGS_STORES[name as SettingsStoreName].fields)) {
          if (nextFields[field] !== prevFields[field]) guarded(() => writeSetting(db, key, nextFields[field]));
        }
      })
    ),
  ];

  void syncLayoutDirection();
}

/**
 * Fills the stores from the database: at launch, and again when sync has written rows from another
 * device. Never written back: re-stamping synced rows would send them back and forth between devices.
 */
export function loadStores(db: SQLiteDatabase) {
  loading = true;
  try {
    useStore.setState(loadBudget(db));
    const settings = readSettings(db);
    for (const [name, store] of Object.entries(SETTINGS_STORE_APIS)) {
      store.setState(storeSettings(settings, name as SettingsStoreName));
    }
  } finally {
    loading = false;
  }
}

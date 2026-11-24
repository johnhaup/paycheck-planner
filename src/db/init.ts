import type { SQLiteDatabase } from "expo-sqlite";
import type { StoreApi } from "zustand";
import { loadBudget, saveBudgetChanges } from "@/db/budget";
import { readLegacyValue } from "@/db/legacyAsyncStorage";
import { importLegacyStore } from "@/db/legacyImport";
import { migrate } from "@/db/migrations";
import { readSettings, SETTINGS_STORES, storeSettings, writeSetting, type SettingsStoreName } from "@/db/settings";
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
  await importLegacyStore(db, readLegacyValue);

  // Load before subscribing, or the load itself is written back and stamps every row
  useStore.setState(loadBudget(db));
  const settings = readSettings(db);
  for (const [name, store] of Object.entries(SETTINGS_STORE_APIS)) {
    store.setState(storeSettings(settings, name as SettingsStoreName));
  }

  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [
    useStore.subscribe((next, prev) => guarded(() => saveBudgetChanges(db, prev, next))),
    ...Object.entries(SETTINGS_STORE_APIS).map(([name, store]) =>
      store.subscribe((next, prev) => {
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

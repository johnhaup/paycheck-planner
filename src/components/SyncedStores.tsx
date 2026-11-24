import { useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useCloudSync } from "@johnhaup/expo-cloud-sync";
import { loadStores } from "@/db/init";

/** Reloads the stores each time sync has written another device's rows. Renders nothing. */
export function SyncedStores() {
  const db = useSQLiteContext();
  const { revision } = useCloudSync();
  useEffect(() => {
    if (revision > 0) loadStores(db);
  }, [db, revision]);
  return null;
}

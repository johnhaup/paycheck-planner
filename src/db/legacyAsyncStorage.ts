import { Platform } from "react-native";
import Constants from "expo-constants";
import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { openDatabaseAsync } from "expo-sqlite";
import { legacyValue } from "@/db/legacyImport";

const BUNDLE_ID = Constants.expoConfig?.ios?.bundleIdentifier ?? "com.johnhaup.paycheckplanner";

function readText(file: File): string | null {
  return file.exists ? file.textSync() : null;
}

/** AsyncStorage 2 on iOS: Library/Application Support/<bundle id>/RCTAsyncLocalStorage_V1. */
async function readIos(key: string): Promise<string | null> {
  const dir = new Directory(
    Paths.document.parentDirectory,
    "Library",
    "Application Support",
    BUNDLE_ID,
    "RCTAsyncLocalStorage_V1"
  );
  if (!dir.exists) return null;
  const hash = await digestStringAsync(CryptoDigestAlgorithm.MD5, key);
  return legacyValue(
    key,
    readText(new File(dir, "manifest.json")),
    (name) => readText(new File(dir, name)),
    () => hash
  );
}

/** AsyncStorage 2 on Android: the SQLite database `databases/RKStorage`, table `catalystLocalStorage`. */
async function readAndroid(key: string): Promise<string | null> {
  const dir = new Directory(Paths.document.parentDirectory, "databases");
  if (!new File(dir, "RKStorage").exists) return null;
  const db = await openDatabaseAsync("RKStorage", undefined, decodeURI(dir.uri.replace(/^file:\/\//, "")));
  try {
    const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM catalystLocalStorage WHERE key = ?", key);
    return row?.value ?? null;
  } finally {
    await db.closeAsync();
  }
}

/** A value the app kept in AsyncStorage up to 1.1.0. The old files stay where they are. */
export function readLegacyValue(key: string): Promise<string | null> {
  return Platform.OS === "ios" ? readIos(key) : readAndroid(key);
}

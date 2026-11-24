import { type Database } from "bun:sqlite";
import { type SQLiteDatabase } from "expo-sqlite";

type Params = (string | number | null)[];

function transaction<T>(file: Database, task: () => T): T {
  file.exec("BEGIN");
  try {
    const result = task();
    file.exec("COMMIT");
    return result;
  } catch (error) {
    file.exec("ROLLBACK");
    throw error;
  }
}

/** For tests: the part of expo-sqlite's database the app calls, over bun's SQLite, so the real statements run. */
export function openTestDatabase(file: Database): SQLiteDatabase {
  const db = {
    execAsync: async (sql: string) => void file.exec(sql),
    runAsync: async (sql: string, ...params: Params) => {
      const result = file.query(sql).run(...params);
      return { changes: result.changes, lastInsertRowId: Number(result.lastInsertRowid) };
    },
    getAllAsync: async (sql: string, ...params: Params) => file.query(sql).all(...params),
    getFirstAsync: async (sql: string, ...params: Params) => file.query(sql).get(...params),
    withTransactionAsync: async (task: () => Promise<void>) => {
      file.exec("BEGIN");
      try {
        await task();
        file.exec("COMMIT");
      } catch (error) {
        file.exec("ROLLBACK");
        throw error;
      }
    },
    execSync: (sql: string) => void file.exec(sql),
    runSync: (sql: string, ...params: Params) => file.query(sql).run(...params),
    getFirstSync: (sql: string, ...params: Params) => file.query(sql).get(...params),
    getAllSync: (sql: string, ...params: Params) => file.query(sql).all(...params),
    withTransactionSync: (task: () => void) => transaction(file, task),
    // cloud-sync writes remote rows in one; here it runs on the same connection
    withExclusiveTransactionAsync: async (task: (txn: SQLiteDatabase) => Promise<void>) =>
      db.withTransactionAsync(() => task(db as unknown as SQLiteDatabase)),
  };
  return db as unknown as SQLiteDatabase;
}

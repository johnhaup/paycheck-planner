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
export const openTestDatabase = (file: Database) =>
  ({
    execAsync: async (sql: string) => void file.exec(sql),
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
  }) as unknown as SQLiteDatabase;

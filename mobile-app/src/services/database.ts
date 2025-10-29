import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'mobile_scaffold.db';
const KEY_VALUE_TABLE = 'kv_store';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDatabase = () => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
};

export const initializeDatabase = async () => {
  const db = await getDatabase();
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS ${KEY_VALUE_TABLE} (key TEXT PRIMARY KEY NOT NULL, value TEXT)`
  );
};

export const setItem = async (key: string, value: string) => {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO ${KEY_VALUE_TABLE} (key, value) VALUES (?, ?)`,
    key,
    value
  );
};

export const getItem = async (key: string) => {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM ${KEY_VALUE_TABLE} WHERE key = ?`,
    key
  );

  return result?.value ?? null;
};

export const deleteItem = async (key: string) => {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM ${KEY_VALUE_TABLE} WHERE key = ?`, key);
};

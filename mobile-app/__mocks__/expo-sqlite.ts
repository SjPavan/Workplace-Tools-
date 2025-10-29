class MockSQLiteDatabase {
  private store = new Map<string, string>();

  async execAsync(_query: string) {
    return Promise.resolve();
  }

  async runAsync(query: string, key: string, value?: string) {
    if (query.toUpperCase().includes('DELETE')) {
      this.store.delete(key);
      return;
    }

    if (query.toUpperCase().includes('INSERT')) {
      if (typeof value !== 'string') {
        throw new Error('Expected value when inserting into the mock SQLite store.');
      }

      this.store.set(key, value);
      return;
    }

    if (query.toUpperCase().includes('UPDATE')) {
      if (typeof value !== 'string') {
        throw new Error('Expected value when updating the mock SQLite store.');
      }

      this.store.set(key, value);
      return;
    }

    throw new Error(`Unsupported query for the SQLite mock: ${query}`);
  }

  async getFirstAsync<T extends Record<string, unknown>>(_query: string, key: string) {
    if (!this.store.has(key)) {
      return undefined as T | undefined;
    }

    return { value: this.store.get(key) } as unknown as T;
  }
}

export type SQLiteDatabase = MockSQLiteDatabase;

export const openDatabaseAsync = async () => new MockSQLiteDatabase();

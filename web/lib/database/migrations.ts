// Migration utilities for database setup
// This file provides utilities for running database migrations

import { createServerStorage } from './server';
import type { ServerStorage } from './server';
import { MIGRATIONS, getMigrationSQL } from './schema';

export interface MigrationResult {
  success: boolean;
  error?: string;
  migration?: string;
}

export class MigrationRunner {
  private storage: ServerStorage;

  constructor(storage: ServerStorage) {
    this.storage = storage;
  }

  // Check if migrations table exists
  private async migrationsTableExists(): Promise<boolean> {
    try {
      const { error } = await this.storage.supabase
        .from('schema_migrations')
        .select('version')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  // Create migrations table
  private async createMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Use raw SQL execution - this might need to be adapted based on your Supabase setup
    try {
      await this.storage.supabase.rpc('exec_sql', { sql });
    } catch (error) {
      console.warn('Could not create migrations table automatically:', error);
      // The table might need to be created manually via Supabase dashboard
    }
  }

  // Get applied migrations
  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const { data, error } = await this.storage.supabase
        .from('schema_migrations')
        .select('version')
        .order('applied_at', { ascending: true });
      
      if (error) throw error;
      return data?.map((m: any) => m.version) || [];
    } catch {
      return [];
    }
  }

  // Apply a single migration
  private async applyMigration(version: string, sql: string): Promise<void> {
    // Execute the migration SQL
    try {
      await this.storage.supabase.rpc('exec_sql', { sql });
    } catch (error) {
      console.warn('Could not execute migration SQL automatically:', error);
      throw new Error(`Migration ${version} needs to be applied manually via Supabase dashboard`);
    }

    // Record the migration
    const { error: insertError } = await this.storage.supabase
      .from('schema_migrations')
      .insert({ version });
    
    if (insertError) throw insertError;
  }

  // Run all pending migrations
  async runMigrations(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    try {
      // Ensure migrations table exists
      if (!(await this.migrationsTableExists())) {
        await this.createMigrationsTable();
      }

      const appliedMigrations = await this.getAppliedMigrations();

      for (const migration of MIGRATIONS) {
        if (appliedMigrations.includes(migration.version)) {
          results.push({
            success: true,
            migration: migration.version,
          });
          continue;
        }

        try {
          await this.applyMigration(migration.version, migration.sql);
          results.push({
            success: true,
            migration: migration.version,
          });
        } catch (error) {
          results.push({
            success: false,
            migration: migration.version,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run migrations',
      });
    }

    return results;
  }

  // Get migration status
  async getMigrationStatus(): Promise<{
    applied: string[];
    pending: string[];
    total: number;
  }> {
    try {
      const appliedMigrations = await this.getAppliedMigrations();
      const pendingMigrations = MIGRATIONS
        .filter(m => !appliedMigrations.includes(m.version))
        .map(m => m.version);

      return {
        applied: appliedMigrations,
        pending: pendingMigrations,
        total: MIGRATIONS.length,
      };
    } catch {
      return {
        applied: [],
        pending: MIGRATIONS.map(m => m.version),
        total: MIGRATIONS.length,
      };
    }
  }
}

// Factory function
export async function createMigrationRunner(): Promise<MigrationRunner> {
  const storage = await createServerStorage();
  return new MigrationRunner(storage);
}

// Utility function to run migrations from API routes
export async function runMigrations(): Promise<MigrationResult[]> {
  const runner = await createMigrationRunner();
  return runner.runMigrations();
}

// Utility function to get migration status
export async function getMigrationStatus() {
  const runner = await createMigrationRunner();
  return runner.getMigrationStatus();
}
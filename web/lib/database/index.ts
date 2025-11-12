// Database module exports
// This file provides a convenient way to import all database-related functionality

// Types
export type {
  Database,
  UserProfile,
  InsertUserProfile,
  UpdateUserProfile,
  Project,
  InsertProject,
  UpdateProject,
  ToolUsage,
  InsertToolUsage,
  UpdateToolUsage,
  UserSetting,
  InsertUserSetting,
  UpdateUserSetting,
  StorageResult,
  StorageListResult,
  QueryOptions,
  UserProfileWithStats,
  ProjectWithUsage,
} from './types';

// Storage classes
export { ServerStorage } from './server';
export { ClientStorage } from './client';

// Factory functions
export { createServerStorage } from './server';
export { createClientStorage } from './client';

// Schema and migrations
export { SCHEMA_SQL, getMigrationSQL, MIGRATIONS } from './schema';
export { 
  MigrationRunner, 
  createMigrationRunner, 
  runMigrations, 
  getMigrationStatus,
  type MigrationResult 
} from './migrations';

// Utilities and analytics
export { 
  StorageAnalytics, 
  StorageUtils, 
  TOOL_TYPES, 
  PROJECT_STATUS, 
  SETTING_CATEGORIES,
  StorageError,
  ERROR_CODES,
  type ToolType,
  type ProjectStatus,
  type SettingCategory,
  type ErrorCode,
} from './utils';

// Re-export for convenience
export * from '@/lib/database/types';
export * from '@/lib/database/schema';
export * from '@/lib/database/server';
export * from '@/lib/database/client';
export * from '@/lib/database/migrations';
export * from '@/lib/database/utils';
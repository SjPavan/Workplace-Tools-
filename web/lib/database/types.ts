// Database types for the workplace tools application
// This file defines the TypeScript interfaces that match our Supabase database schema

export type ProjectStatus = 'active' | 'archived' | 'deleted';
export type ToolType = 'title-converter' | 'case-converter' | 'virtual-browser' | 'ai-assistant';
export type SettingCategory = 'general' | 'appearance' | 'notifications' | 'privacy';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: InsertUserProfile;
        Update: UpdateUserProfile;
      };
      projects: {
        Row: Project;
        Insert: InsertProject;
        Update: UpdateProject;
      };
      tool_usage: {
        Row: ToolUsage;
        Insert: InsertToolUsage;
        Update: UpdateToolUsage;
      };
      user_settings: {
        Row: UserSetting;
        Insert: InsertUserSetting;
        Update: UpdateUserSetting;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      project_status: ProjectStatus;
      tool_type: ToolType;
      setting_category: SettingCategory;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Base interfaces
export interface BaseUserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends BaseUserProfile {
  // Additional computed fields can be added here
}

export interface InsertUserProfile extends Omit<BaseUserProfile, 'id' | 'created_at' | 'updated_at'> {}

export interface UpdateUserProfile extends Partial<Omit<BaseUserProfile, 'id' | 'created_at' | 'user_id'>> {}

export interface BaseProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  tool_type: ToolType;
  data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Project extends BaseProject {}

export interface InsertProject extends Omit<BaseProject, 'id' | 'created_at' | 'updated_at'> {}

export interface UpdateProject extends Partial<Omit<BaseProject, 'id' | 'created_at' | 'user_id'>> {}

export interface BaseToolUsage {
  id: string;
  user_id: string;
  tool_type: ToolType;
  action: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface ToolUsage extends BaseToolUsage {}

export interface InsertToolUsage extends Omit<BaseToolUsage, 'id' | 'created_at'> {}

export interface UpdateToolUsage extends Partial<Omit<BaseToolUsage, 'id' | 'created_at' | 'user_id'>> {}

export interface BaseUserSetting {
  id: string;
  user_id: string;
  category: SettingCategory;
  key: string;
  value: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserSetting extends BaseUserSetting {}

export interface InsertUserSetting extends Omit<BaseUserSetting, 'id' | 'created_at' | 'updated_at'> {}

export interface UpdateUserSetting extends Partial<Omit<BaseUserSetting, 'id' | 'created_at' | 'user_id'>> {}

// Utility types for common operations
export type UserProfileWithStats = UserProfile & {
  project_count: number;
  tool_usage_count: number;
  last_active: string | null;
};

export type ProjectWithUsage = Project & {
  usage_count: number;
  last_used: string | null;
};

// Storage operation results
export interface StorageResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface StorageListResult<T> extends StorageResult<T[]> {
  count: number | null;
  hasMore: boolean;
}

// Query options
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}
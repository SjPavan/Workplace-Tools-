// Server-side storage utilities
// This file contains server-side storage operations using Supabase

import type { SupabaseClient } from '@supabase/supabase-js';
import type { 
  UserProfile, 
  InsertUserProfile, 
  UpdateUserProfile,
  Project,
  InsertProject,
  UpdateProject,
  ToolUsage,
  InsertToolUsage,
  UserSetting,
  InsertUserSetting,
  QueryOptions,
  StorageResult,
  StorageListResult
} from './types';

type SupabaseTable = 'user_profiles' | 'projects' | 'tool_usage' | 'user_settings';

export class ServerStorage {
  constructor(public supabase: SupabaseClient) {}

  // User Profile operations
  async getUserProfile(userId: string): Promise<StorageResult<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to fetch user profile'),
        loading: false 
      };
    }
  }

  async createUserProfile(profile: InsertUserProfile): Promise<StorageResult<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert(profile)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to create user profile'),
        loading: false 
      };
    }
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<StorageResult<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to update user profile'),
        loading: false 
      };
    }
  }

  async upsertUserProfile(profile: InsertUserProfile): Promise<StorageResult<UserProfile>> {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .upsert(profile, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      
      return { data, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to upsert user profile'),
        loading: false 
      };
    }
  }

  // Project operations
  async getProjects(userId: string, options: QueryOptions = {}): Promise<StorageListResult<Project>> {
    try {
      let query = this.supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection !== 'desc' 
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const hasMore = options.limit ? 
        (options.offset || 0) + (data?.length || 0) < (count || 0) : false;

      return { 
        data: (data as Project[]) || [], 
        error: null, 
        loading: false,
        count,
        hasMore
      };
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error('Failed to fetch projects'),
        loading: false,
        count: null,
        hasMore: false
      };
    }
  }

  async getProject(projectId: string, userId: string): Promise<StorageResult<Project>> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      return { data: data as Project, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to fetch project'),
        loading: false 
      };
    }
  }

  async createProject(project: InsertProject): Promise<StorageResult<Project>> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .insert(project)
        .select()
        .single();

      if (error) throw error;
      
      return { data: data as Project, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to create project'),
        loading: false 
      };
    }
  }

  async updateProject(projectId: string, userId: string, updates: UpdateProject): Promise<StorageResult<Project>> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      return { data: data as Project, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to update project'),
        loading: false 
      };
    }
  }

  async deleteProject(projectId: string, userId: string): Promise<StorageResult<void>> {
    try {
      const { error } = await this.supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
      
      return { data: null, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to delete project'),
        loading: false 
      };
    }
  }

  // Tool Usage operations
  async recordToolUsage(usage: InsertToolUsage): Promise<StorageResult<ToolUsage>> {
    try {
      const { data, error } = await this.supabase
        .from('tool_usage')
        .insert(usage)
        .select()
        .single();

      if (error) throw error;
      
      return { data: data as ToolUsage, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to record tool usage'),
        loading: false 
      };
    }
  }

  async getToolUsage(userId: string, options: QueryOptions = {}): Promise<StorageListResult<ToolUsage>> {
    try {
      let query = this.supabase
        .from('tool_usage')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy, { 
          ascending: options.orderDirection !== 'desc' 
        });
      } else {
        // Default ordering by created_at desc
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const hasMore = options.limit ? 
        (options.offset || 0) + (data?.length || 0) < (count || 0) : false;

      return { 
        data: (data as ToolUsage[]) || [], 
        error: null, 
        loading: false,
        count,
        hasMore
      };
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error('Failed to fetch tool usage'),
        loading: false,
        count: null,
        hasMore: false
      };
    }
  }

  // User Settings operations
  async getUserSettings(userId: string, category?: string): Promise<StorageListResult<UserSetting>> {
    try {
      let query = this.supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { 
        data: (data as UserSetting[]) || [], 
        error: null, 
        loading: false,
        count: data?.length || null,
        hasMore: false
      };
    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error('Failed to fetch user settings'),
        loading: false,
        count: null,
        hasMore: false
      };
    }
  }

  async getUserSetting(userId: string, category: string, key: string): Promise<StorageResult<UserSetting>> {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      
      return { data: data as UserSetting || null, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to fetch user setting'),
        loading: false 
      };
    }
  }

  async upsertUserSetting(setting: InsertUserSetting): Promise<StorageResult<UserSetting>> {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .upsert(setting, { onConflict: 'user_id,category,key' })
        .select()
        .single();

      if (error) throw error;
      
      return { data: data as UserSetting, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to upsert user setting'),
        loading: false 
      };
    }
  }

  async deleteUserSetting(userId: string, category: string, key: string): Promise<StorageResult<void>> {
    try {
      const { error } = await this.supabase
        .from('user_settings')
        .delete()
        .eq('user_id', userId)
        .eq('category', category)
        .eq('key', key);

      if (error) throw error;
      
      return { data: null, error: null, loading: false };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to delete user setting'),
        loading: false 
      };
    }
  }
}

// Factory function to create server storage instance
export async function createServerStorage(): Promise<ServerStorage> {
  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await createSupabaseServerClient();
  return new ServerStorage(supabase);
}
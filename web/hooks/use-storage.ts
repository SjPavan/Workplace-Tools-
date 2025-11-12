// React hooks for storage operations
// This file provides React hooks that wrap the storage utilities with state management

import { useCallback, useEffect, useState } from 'react';
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
  StorageListResult,
  SettingCategory
} from '@/lib/database/types';
import { createClientStorage } from '@/lib/database/client';

// Hook for user profile operations
export function useUserProfile(userId: string | null) {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const storage = createClientStorage();

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.getUserProfile(userId);
      setData(result.data);
      setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  }, [userId, storage]);

  const createProfile = useCallback(async (profile: InsertUserProfile): Promise<StorageResult<UserProfile>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.createUserProfile(profile);
      setData(result.data);
      setError(result.error);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create profile');
      setError(error);
      return { data: null, error, loading: false };
    } finally {
      setLoading(false);
    }
  }, [storage]);

  const updateProfile = useCallback(async (updates: UpdateUserProfile): Promise<StorageResult<UserProfile>> => {
    if (!userId) return { data: null, error: new Error('User ID required'), loading: false };
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.updateUserProfile(userId, updates);
      setData(result.data);
      setError(result.error);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      return { data: null, error, loading: false };
    } finally {
      setLoading(false);
    }
  }, [userId, storage]);

  const upsertProfile = useCallback(async (profile: InsertUserProfile): Promise<StorageResult<UserProfile>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.upsertUserProfile(profile);
      setData(result.data);
      setError(result.error);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upsert profile');
      setError(error);
      return { data: null, error, loading: false };
    } finally {
      setLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    data,
    loading,
    error,
    refetch: fetchProfile,
    create: createProfile,
    update: updateProfile,
    upsert: upsertProfile,
  };
}

// Hook for projects operations
export function useProjects(userId: string | null, options: QueryOptions = {}) {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const storage = createClientStorage();

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.getProjects(userId, options);
      setData(result.data || []);
      setError(result.error);
      setCount(result.count);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch projects'));
    } finally {
      setLoading(false);
    }
  }, [userId, options, storage]);

  const createProject = useCallback(async (project: InsertProject): Promise<StorageResult<Project>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.createProject(project);
      if (result.data) {
        setData(prev => [result.data!, ...prev]);
      }
      setError(result.error);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create project');
      setError(error);
      return { data: null, error, loading: false };
    } finally {
      setLoading(false);
    }
  }, [storage]);

  const updateProject = useCallback(async (projectId: string, updates: UpdateProject): Promise<StorageResult<Project>> => {
    if (!userId) return { data: null, error: new Error('User ID required'), loading: false };
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.updateProject(projectId, userId, updates);
      if (result.data) {
        setData(prev => prev.map(p => p.id === projectId ? result.data! : p));
      }
      setError(result.error);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update project');
      setError(error);
      return { data: null, error, loading: false };
    } finally {
      setLoading(false);
    }
  }, [userId, storage]);

  const deleteProject = useCallback(async (projectId: string): Promise<StorageResult<void>> => {
    if (!userId) return { data: null, error: new Error('User ID required'), loading: false };
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.deleteProject(projectId, userId);
      if (!result.error) {
        setData(prev => prev.filter(p => p.id !== projectId));
      }
      setError(result.error);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete project');
      setError(error);
      return { data: null, error, loading: false };
    } finally {
      setLoading(false);
    }
  }, [userId, storage]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    data,
    loading,
    error,
    count,
    hasMore,
    refetch: fetchProjects,
    create: createProject,
    update: updateProject,
    delete: deleteProject,
  };
}

// Hook for single project
export function useProject(projectId: string | null, userId: string | null) {
  const [data, setData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const storage = createClientStorage();

  const fetchProject = useCallback(async () => {
    if (!projectId || !userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.getProject(projectId, userId);
      setData(result.data);
      setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch project'));
    } finally {
      setLoading(false);
    }
  }, [projectId, userId, storage]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    data,
    loading,
    error,
    refetch: fetchProject,
  };
}

// Hook for tool usage operations
export function useToolUsage(userId: string | null, options: QueryOptions = {}) {
  const [data, setData] = useState<ToolUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const storage = createClientStorage();

  const fetchToolUsage = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.getToolUsage(userId, options);
      setData(result.data || []);
      setError(result.error);
      setCount(result.count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch tool usage'));
    } finally {
      setLoading(false);
    }
  }, [userId, options, storage]);

  const recordUsage = useCallback(async (usage: InsertToolUsage): Promise<StorageResult<ToolUsage>> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.recordToolUsage(usage);
      if (result.data) {
        setData(prev => [result.data!, ...prev]);
      }
      setError(result.error);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to record tool usage');
      setError(error);
      return { data: null, error, loading: false };
    } finally {
      setLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    fetchToolUsage();
  }, [fetchToolUsage]);

  return {
    data,
    loading,
    error,
    count,
    refetch: fetchToolUsage,
    record: recordUsage,
  };
}

// Hook for user settings operations
export function useUserSettings(userId: string | null, category?: string) {
  const [data, setData] = useState<UserSetting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const storage = createClientStorage();

  const fetchSettings = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.getUserSettings(userId, category);
      setData(result.data || []);
      setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user settings'));
    } finally {
      setLoading(false);
    }
  }, [userId, category, storage]);

  const getSetting = useCallback(async (key: string): Promise<StorageResult<UserSetting>> => {
    if (!userId || !category) return { data: null, error: new Error('User ID and category required'), loading: false };
    
    try {
      const result = await storage.getUserSetting(userId, category, key);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch user setting');
      return { data: null, error, loading: false };
    }
  }, [userId, category, storage]);

  const setSetting = useCallback(async (key: string, value: Record<string, any>): Promise<StorageResult<UserSetting>> => {
    if (!userId || !category) return { data: null, error: new Error('User ID and category required'), loading: false };
    
    setLoading(true);
    setError(null);
    
    try {
      const setting: InsertUserSetting = {
        user_id: userId,
        category: category as SettingCategory,
        key,
        value,
      };
      
      const result = await storage.upsertUserSetting(setting);
      if (result.data) {
        setData(prev => {
          const filtered = prev.filter(s => !(s.category === category && s.key === key));
          return [...filtered, result.data!];
        });
      }
      setError(result.error);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to set user setting');
      setError(error);
      return { data: null, error, loading: false };
    } finally {
      setLoading(false);
    }
  }, [userId, category, storage]);

  const deleteSetting = useCallback(async (key: string): Promise<StorageResult<void>> => {
    if (!userId || !category) return { data: null, error: new Error('User ID and category required'), loading: false };
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await storage.deleteUserSetting(userId, category, key);
      if (!result.error) {
        setData(prev => prev.filter(s => !(s.category === category && s.key === key)));
      }
      setError(result.error);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete user setting');
      setError(error);
      return { data: null, error, loading: false };
    } finally {
      setLoading(false);
    }
  }, [userId, category, storage]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    data,
    loading,
    error,
    refetch: fetchSettings,
    get: getSetting,
    set: setSetting,
    delete: deleteSetting,
  };
}

// Hook for real-time updates
export function useRealtimeProjects(userId: string | null) {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const storage = createClientStorage();

  useEffect(() => {
    if (!userId) return;

    const subscription = storage.subscribeToProjects(userId, () => {
      setUpdateTrigger(prev => prev + 1);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, storage]);

  return updateTrigger;
}

export function useRealtimeUserProfile(userId: string | null) {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const storage = createClientStorage();

  useEffect(() => {
    if (!userId) return;

    const subscription = storage.subscribeToUserProfile(userId, () => {
      setUpdateTrigger(prev => prev + 1);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, storage]);

  return updateTrigger;
}
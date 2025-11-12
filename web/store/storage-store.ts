// Zustand store for storage state management
// This store manages global storage state and provides actions for storage operations

import { create } from 'zustand';
import type { 
  UserProfile, 
  Project, 
  ToolUsage, 
  UserSetting,
  QueryOptions,
  StorageResult,
  StorageListResult
} from '@/lib/database/types';

interface StorageState {
  // User Profile
  userProfile: UserProfile | null;
  userProfileLoading: boolean;
  userProfileError: Error | null;
  
  // Projects
  projects: Project[];
  projectsLoading: boolean;
  projectsError: Error | null;
  projectsCount: number | null;
  projectsHasMore: boolean;
  
  // Current Project
  currentProject: Project | null;
  currentProjectLoading: boolean;
  currentProjectError: Error | null;
  
  // Tool Usage
  toolUsage: ToolUsage[];
  toolUsageLoading: boolean;
  toolUsageError: Error | null;
  toolUsageCount: number | null;
  
  // User Settings
  userSettings: UserSetting[];
  userSettingsLoading: boolean;
  userSettingsError: Error | null;

  // Actions
  setUserProfile: (profile: UserProfile | null) => void;
  setUserProfileLoading: (loading: boolean) => void;
  setUserProfileError: (error: Error | null) => void;
  
  setProjects: (projects: Project[]) => void;
  setProjectsLoading: (loading: boolean) => void;
  setProjectsError: (error: Error | null) => void;
  setProjectsCount: (count: number | null) => void;
  setProjectsHasMore: (hasMore: boolean) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
  
  setCurrentProject: (project: Project | null) => void;
  setCurrentProjectLoading: (loading: boolean) => void;
  setCurrentProjectError: (error: Error | null) => void;
  
  setToolUsage: (usage: ToolUsage[]) => void;
  setToolUsageLoading: (loading: boolean) => void;
  setToolUsageError: (error: Error | null) => void;
  setToolUsageCount: (count: number | null) => void;
  addToolUsage: (usage: ToolUsage) => void;
  
  setUserSettings: (settings: UserSetting[]) => void;
  setUserSettingsLoading: (loading: boolean) => void;
  setUserSettingsError: (error: Error | null) => void;
  upsertUserSetting: (setting: UserSetting) => void;
  removeUserSetting: (category: string, key: string) => void;
  
  // Reset functions
  resetUserProfile: () => void;
  resetProjects: () => void;
  resetCurrentProject: () => void;
  resetToolUsage: () => void;
  resetUserSettings: () => void;
  resetAll: () => void;
}

export const useStorageStore = create<StorageState>((set, get) => ({
  // Initial state
  userProfile: null,
  userProfileLoading: false,
  userProfileError: null,
  
  projects: [],
  projectsLoading: false,
  projectsError: null,
  projectsCount: null,
  projectsHasMore: false,
  
  currentProject: null,
  currentProjectLoading: false,
  currentProjectError: null,
  
  toolUsage: [],
  toolUsageLoading: false,
  toolUsageError: null,
  toolUsageCount: null,
  
  userSettings: [],
  userSettingsLoading: false,
  userSettingsError: null,

  // User Profile actions
  setUserProfile: (profile) => set({ userProfile: profile }),
  setUserProfileLoading: (loading) => set({ userProfileLoading: loading }),
  setUserProfileError: (error) => set({ userProfileError: error }),
  
  // Projects actions
  setProjects: (projects) => set({ projects }),
  setProjectsLoading: (loading) => set({ projectsLoading: loading }),
  setProjectsError: (error) => set({ projectsError: error }),
  setProjectsCount: (count) => set({ projectsCount: count }),
  setProjectsHasMore: (hasMore: boolean) => set({ projectsHasMore: hasMore }),
  addProject: (project) => set((state) => ({ 
    projects: [project, ...state.projects],
    projectsCount: state.projectsCount ? state.projectsCount + 1 : 1
  })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
    currentProject: state.currentProject?.id === id 
      ? { ...state.currentProject, ...updates } 
      : state.currentProject
  })),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id),
    projectsCount: state.projectsCount ? state.projectsCount - 1 : 0,
    currentProject: state.currentProject?.id === id ? null : state.currentProject
  })),
  
  // Current Project actions
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentProjectLoading: (loading) => set({ currentProjectLoading: loading }),
  setCurrentProjectError: (error) => set({ currentProjectError: error }),
  
  // Tool Usage actions
  setToolUsage: (usage) => set({ toolUsage: usage }),
  setToolUsageLoading: (loading) => set({ toolUsageLoading: loading }),
  setToolUsageError: (error) => set({ toolUsageError: error }),
  setToolUsageCount: (count) => set({ toolUsageCount: count }),
  addToolUsage: (usage) => set((state) => ({ 
    toolUsage: [usage, ...state.toolUsage],
    toolUsageCount: state.toolUsageCount ? state.toolUsageCount + 1 : 1
  })),
  
  // User Settings actions
  setUserSettings: (settings) => set({ userSettings: settings }),
  setUserSettingsLoading: (loading) => set({ userSettingsLoading: loading }),
  setUserSettingsError: (error) => set({ userSettingsError: error }),
  upsertUserSetting: (setting) => set((state) => {
    const filtered = state.userSettings.filter(
      s => !(s.category === setting.category && s.key === setting.key)
    );
    return { userSettings: [...filtered, setting] };
  }),
  removeUserSetting: (category, key) => set((state) => ({
    userSettings: state.userSettings.filter(
      s => !(s.category === category && s.key === key)
    )
  })),
  
  // Reset functions
  resetUserProfile: () => set({
    userProfile: null,
    userProfileLoading: false,
    userProfileError: null,
  }),
  
  resetProjects: () => set({
    projects: [],
    projectsLoading: false,
    projectsError: null,
    projectsCount: null,
    projectsHasMore: false,
  }),
  
  resetCurrentProject: () => set({
    currentProject: null,
    currentProjectLoading: false,
    currentProjectError: null,
  }),
  
  resetToolUsage: () => set({
    toolUsage: [],
    toolUsageLoading: false,
    toolUsageError: null,
    toolUsageCount: null,
  }),
  
  resetUserSettings: () => set({
    userSettings: [],
    userSettingsLoading: false,
    userSettingsError: null,
  }),
  
  resetAll: () => set({
    userProfile: null,
    userProfileLoading: false,
    userProfileError: null,
    projects: [],
    projectsLoading: false,
    projectsError: null,
    projectsCount: null,
    projectsHasMore: false,
    currentProject: null,
    currentProjectLoading: false,
    currentProjectError: null,
    toolUsage: [],
    toolUsageLoading: false,
    toolUsageError: null,
    toolUsageCount: null,
    userSettings: [],
    userSettingsLoading: false,
    userSettingsError: null,
  }),
}));

// Selectors for common use cases
export const useUserProfile = () => useStorageStore((state) => ({
  userProfile: state.userProfile,
  loading: state.userProfileLoading,
  error: state.userProfileError,
}));

export const useProjects = () => useStorageStore((state) => ({
  projects: state.projects,
  loading: state.projectsLoading,
  error: state.projectsError,
  count: state.projectsCount,
  hasMore: state.projectsHasMore,
}));

export const useCurrentProject = () => useStorageStore((state) => ({
  project: state.currentProject,
  loading: state.currentProjectLoading,
  error: state.currentProjectError,
}));

export const useToolUsage = () => useStorageStore((state) => ({
  toolUsage: state.toolUsage,
  loading: state.toolUsageLoading,
  error: state.toolUsageError,
  count: state.toolUsageCount,
}));

export const useUserSettings = () => useStorageStore((state) => ({
  settings: state.userSettings,
  loading: state.userSettingsLoading,
  error: state.userSettingsError,
}));
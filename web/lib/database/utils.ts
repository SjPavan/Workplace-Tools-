// Storage utilities and analytics helpers
// This file provides utility functions for common storage operations and analytics

import type { 
  ToolUsage, 
  Project, 
  UserProfile,
  Database 
} from '@/lib/database/types';

// Tool type constants
export const TOOL_TYPES = {
  TITLE_CONVERTER: 'title-converter',
  CASE_CONVERTER: 'case-converter',
  VIRTUAL_BROWSER: 'virtual-browser',
  AI_ASSISTANT: 'ai-assistant',
} as const;

export type ToolType = typeof TOOL_TYPES[keyof typeof TOOL_TYPES];

// Project status constants
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// Setting category constants
export const SETTING_CATEGORIES = {
  GENERAL: 'general',
  APPEARANCE: 'appearance',
  NOTIFICATIONS: 'notifications',
  PRIVACY: 'privacy',
} as const;

export type SettingCategory = typeof SETTING_CATEGORIES[keyof typeof SETTING_CATEGORIES];

// Analytics utilities
export class StorageAnalytics {
  // Get tool usage statistics
  static getToolUsageStats(usage: ToolUsage[]) {
    const stats = usage.reduce((acc, item) => {
      const toolType = item.tool_type;
      acc[toolType] = (acc[toolType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: usage.length,
      byTool: stats,
      mostUsed: Object.entries(stats).sort(([,a], [,b]) => b - a)[0]?.[0] || null,
    };
  }

  // Get project statistics
  static getProjectStats(projects: Project[]) {
    const stats = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      acc[project.tool_type] = (acc[project.tool_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: projects.length,
      byStatus: {
        active: stats.active || 0,
        archived: stats.archived || 0,
        deleted: stats.deleted || 0,
      },
      byTool: Object.fromEntries(
        Object.entries(stats).filter(([key]) => !['active', 'archived', 'deleted'].includes(key))
      ),
    };
  }

  // Get recent activity
  static getRecentActivity(usage: ToolUsage[], limit: number = 10) {
    return usage
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
      .map(item => ({
        id: item.id,
        tool: item.tool_type,
        action: item.action,
        timestamp: item.created_at,
        metadata: item.metadata,
      }));
  }

  // Get usage over time (last 7 days)
  static getUsageOverTime(usage: ToolUsage[], days: number = 7) {
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const filtered = usage.filter(item => 
      new Date(item.created_at) >= startDate
    );

    const dailyStats = filtered.reduce((acc, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Fill in missing days
    const result: Array<{ date: string; count: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000))
        .toISOString().split('T')[0];
      result.push({
        date,
        count: dailyStats[date] || 0,
      });
    }

    return result;
  }
}

// Storage utilities
export class StorageUtils {
  // Create a new project with default values
  static createProject(
    userId: string,
    name: string,
    toolType: ToolType,
    description?: string,
    data?: Record<string, any>
  ) {
    return {
      user_id: userId,
      name,
      description: description || null,
      status: PROJECT_STATUS.ACTIVE,
      tool_type: toolType,
      data: data || null,
    };
  }

  // Record tool usage
  static recordToolUsage(
    userId: string,
    toolType: ToolType,
    action: string,
    metadata?: Record<string, any>
  ) {
    return {
      user_id: userId,
      tool_type: toolType,
      action,
      metadata: metadata || null,
    };
  }

  // Create or update user setting
  static createUserSetting(
    userId: string,
    category: SettingCategory,
    key: string,
    value: Record<string, any>
  ) {
    return {
      user_id: userId,
      category,
      key,
      value,
    };
  }

  // Create or update user profile
  static createUserProfile(
    userId: string,
    displayName?: string,
    avatarUrl?: string,
    bio?: string
  ) {
    return {
      user_id: userId,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
      bio: bio || null,
    };
  }

  // Validate tool type
  static isValidToolType(toolType: string): toolType is ToolType {
    return Object.values(TOOL_TYPES).includes(toolType as ToolType);
  }

  // Validate project status
  static isValidProjectStatus(status: string): status is ProjectStatus {
    return Object.values(PROJECT_STATUS).includes(status as ProjectStatus);
  }

  // Validate setting category
  static isValidSettingCategory(category: string): category is SettingCategory {
    return Object.values(SETTING_CATEGORIES).includes(category as SettingCategory);
  }

  // Get tool display name
  static getToolDisplayName(toolType: ToolType): string {
    const displayNames: Record<ToolType, string> = {
      [TOOL_TYPES.TITLE_CONVERTER]: 'Title Converter',
      [TOOL_TYPES.CASE_CONVERTER]: 'Case Converter',
      [TOOL_TYPES.VIRTUAL_BROWSER]: 'Virtual Browser',
      [TOOL_TYPES.AI_ASSISTANT]: 'AI Assistant',
    };
    return displayNames[toolType] || toolType;
  }

  // Get status display name
  static getStatusDisplayName(status: ProjectStatus): string {
    const displayNames: Record<ProjectStatus, string> = {
      [PROJECT_STATUS.ACTIVE]: 'Active',
      [PROJECT_STATUS.ARCHIVED]: 'Archived',
      [PROJECT_STATUS.DELETED]: 'Deleted',
    };
    return displayNames[status] || status;
  }

  // Format date for display
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Format relative time
  static formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return this.formatDate(dateString);
  }

  // Generate a unique project name
  static generateProjectName(toolType: ToolType, existingNames: string[]): string {
    const baseName = `${this.getToolDisplayName(toolType)} Project`;
    let counter = 1;
    let name = baseName;

    while (existingNames.includes(name)) {
      name = `${baseName} ${counter}`;
      counter++;
    }

    return name;
  }

  // Sanitize project name
  static sanitizeProjectName(name: string): string {
    return name
      .trim()
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .substring(0, 255); // Limit length
  }

  // Check if project data is valid
  static validateProjectData(data: Record<string, any>): boolean {
    try {
      // Basic validation - data should be serializable
      JSON.stringify(data);
      return true;
    } catch {
      return false;
    }
  }

  // Merge project data safely
  static mergeProjectData(existing: Record<string, any> | null, updates: Record<string, any>): Record<string, any> {
    const base = existing || {};
    return { ...base, ...updates };
  }

  // Extract file extension from project data
  static getFileExtension(project: Project): string {
    if (project.tool_type === TOOL_TYPES.TITLE_CONVERTER) return '.txt';
    if (project.tool_type === TOOL_TYPES.CASE_CONVERTER) return '.txt';
    if (project.tool_type === TOOL_TYPES.VIRTUAL_BROWSER) return '.html';
    if (project.tool_type === TOOL_TYPES.AI_ASSISTANT) return '.md';
    return '.json';
  }

  // Generate export filename
  static generateExportFilename(project: Project): string {
    const safeName = this.sanitizeProjectName(project.name);
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = this.getFileExtension(project);
    return `${safeName}_${timestamp}${extension}`;
  }
}

// Error handling utilities
export class StorageError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

// Common error codes
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
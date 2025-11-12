# Storage Layer Documentation

This document describes the storage layer implementation for the Workplace Tools application.

## Overview

The storage layer provides a comprehensive abstraction for database operations using Supabase as the backend. It includes:

- **Type-safe database operations** with TypeScript interfaces
- **Server and client utilities** for different contexts
- **React hooks** for seamless integration with components
- **Real-time subscriptions** for live updates
- **Migration system** for database schema management
- **Analytics utilities** for usage tracking and insights

## Architecture

### Core Components

```
lib/database/
├── types.ts          # TypeScript interfaces and types
├── schema.ts         # Database schema and migrations
├── server.ts         # Server-side storage operations
├── client.ts         # Client-side storage operations
├── migrations.ts     # Migration management
├── utils.ts          # Utilities and analytics helpers
└── index.ts          # Module exports
```

### Data Models

#### User Profiles
- User profile information and preferences
- Linked to Supabase auth users
- Supports display name, avatar, and bio

#### Projects
- User-created projects for different tools
- Supports multiple tool types (title converter, case converter, virtual browser, AI assistant)
- Status tracking (active, archived, deleted)
- Flexible JSON data storage

#### Tool Usage
- Analytics tracking for tool interactions
- Action-based logging with metadata
- Time-series data for usage patterns

#### User Settings
- Categorized user preferences
- JSON value storage for flexibility
- Categories: general, appearance, notifications, privacy

## Usage Examples

### Server-Side Usage

```typescript
import { createServerStorage } from '@/lib/database';

// In API routes or server components
const storage = await createServerStorage();

// Get user profile
const result = await storage.getUserProfile(userId);

// Create a project
const project = await storage.createProject({
  user_id: userId,
  name: 'My Project',
  tool_type: 'title-converter',
  status: 'active',
  data: { content: 'example' }
});

// Get projects with pagination
const projects = await storage.getProjects(userId, {
  limit: 10,
  offset: 0,
  orderBy: 'created_at',
  orderDirection: 'desc'
});
```

### Client-Side Usage

```typescript
import { createClientStorage } from '@/lib/database';

// In client components
const storage = createClientStorage();

// Real-time subscription
const subscription = storage.subscribeToProjects(userId, (payload) => {
  console.log('Project changed:', payload);
});

// Clean up on unmount
return () => subscription.unsubscribe();
```

### React Hooks

```typescript
import { 
  useUserProfile, 
  useProjects, 
  useToolUsage,
  useUserSettings 
} from '@/hooks/use-storage';

// User profile hook
const { data: profile, loading, error, update } = useUserProfile(userId);

// Projects hook
const { 
  data: projects, 
  loading, 
  error, 
  create, 
  update, 
  delete: deleteProject 
} = useProjects(userId, { limit: 10 });

// Tool usage hook
const { data: usage, record } = useToolUsage(userId);

// Settings hook
const { data: settings, set: setSetting } = useUserSettings(userId, 'general');
```

### Zustand Store

```typescript
import { useStorageStore } from '@/store/storage-store';

// Direct store access
const { 
  projects, 
  setProjects, 
  addProject, 
  updateProject 
} = useStorageStore();

// Selectors for specific data
const { projects, loading } = useProjects();
```

## Database Schema

### Tables

#### user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

#### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status project_status DEFAULT 'active',
  tool_type tool_type NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### tool_usage
```sql
CREATE TABLE tool_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type tool_type NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### user_settings
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category setting_category NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category, key)
);
```

### Enums

```sql
CREATE TYPE project_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE tool_type AS ENUM ('title-converter', 'case-converter', 'virtual-browser', 'ai-assistant');
CREATE TYPE setting_category AS ENUM ('general', 'appearance', 'notifications', 'privacy');
```

## Security

### Row Level Security (RLS)

All tables have RLS policies enabled to ensure users can only access their own data:

- Users can view, insert, update, and delete their own profiles
- Users can view, insert, update, and delete their own projects
- Users can view and insert their own tool usage
- Users can view, insert, update, and delete their own settings

### API Security

- All API routes require authentication
- User ID is extracted from the session, not from request parameters
- Server-side operations validate user ownership

## Migrations

### Running Migrations

```typescript
import { runMigrations } from '@/lib/database/migrations';

// Run all pending migrations
const results = await runMigrations();
console.log('Migration results:', results);
```

### Migration Status

```typescript
import { getMigrationStatus } from '@/lib/database/migrations';

const status = await getMigrationStatus();
console.log('Applied:', status.applied);
console.log('Pending:', status.pending);
```

### API Endpoint

```bash
# Get migration status
GET /api/storage/migrate

# Run migrations (development or with admin key)
POST /api/storage/migrate
```

## Analytics

### Usage Analytics

```typescript
import { StorageAnalytics } from '@/lib/database';

// Get tool usage statistics
const stats = StorageAnalytics.getToolUsageStats(usageData);
console.log('Total usage:', stats.total);
console.log('Most used tool:', stats.mostUsed);

// Get project statistics
const projectStats = StorageAnalytics.getProjectStats(projectsData);
console.log('Active projects:', projectStats.byStatus.active);

// Get recent activity
const recent = StorageAnalytics.getRecentActivity(usageData, 10);

// Get usage over time
const timeline = StorageAnalytics.getUsageOverTime(usageData, 7);
```

## Utilities

### Storage Utils

```typescript
import { StorageUtils, TOOL_TYPES } from '@/lib/database';

// Create a project with defaults
const project = StorageUtils.createProject(
  userId,
  'My Project',
  TOOL_TYPES.TITLE_CONVERTER,
  'Project description',
  { content: 'example data' }
);

// Record tool usage
const usage = StorageUtils.recordToolUsage(
  userId,
  TOOL_TYPES.AI_ASSISTANT,
  'chat_message',
  { messageLength: 150 }
);

// Validate and sanitize data
const safeName = StorageUtils.sanitizeProjectName(userInput);
const isValid = StorageUtils.validateProjectData(dataObject);

// Format dates
const formatted = StorageUtils.formatDate(project.created_at);
const relative = StorageUtils.formatRelativeTime(project.created_at);
```

## Error Handling

### Storage Errors

```typescript
import { StorageError, ERROR_CODES } from '@/lib/database';

try {
  await storage.createProject(projectData);
} catch (error) {
  if (error instanceof StorageError) {
    console.error('Storage error:', error.code, error.message);
    if (error.code === ERROR_CODES.QUOTA_EXCEEDED) {
      // Handle quota exceeded
    }
  }
}
```

## Best Practices

### Performance

1. **Use pagination** for large datasets
2. **Filter on the server** rather than client-side
3. **Select only needed columns** when possible
4. **Use indexes** for frequently queried fields
5. **Cache frequently accessed data** with React Query or Zustand

### Security

1. **Always validate user ownership** on the server
2. **Use RLS policies** for data access control
3. **Sanitize user inputs** before storage
4. **Never expose sensitive data** to the client

### Real-time Updates

1. **Subscribe only to needed data**
2. **Unsubscribe on component unmount**
3. **Handle connection errors gracefully**
4. **Use debouncing** for rapid updates

## API Endpoints

### Storage API

- `GET /api/storage/profile` - Get user profile
- `POST /api/storage/profile` - Create/update user profile
- `PUT /api/storage/profile` - Update user profile

- `GET /api/storage/projects` - List projects
- `POST /api/storage/projects` - Create project
- `GET /api/storage/projects/[id]` - Get project
- `PUT /api/storage/projects/[id]` - Update project
- `DELETE /api/storage/projects/[id]` - Delete project

- `GET /api/storage/usage` - List tool usage
- `POST /api/storage/usage` - Record tool usage

- `GET /api/storage/settings` - List user settings
- `POST /api/storage/settings` - Create/update setting

- `GET /api/storage/migrate` - Migration status
- `POST /api/storage/migrate` - Run migrations

## Health Check

The health check endpoint (`/api/health`) now includes storage layer status:

```json
{
  "storage": {
    "available": true,
    "migrations": {
      "applied": ["001_initial"],
      "pending": [],
      "total": 1
    }
  }
}
```

## Development

### Setting up the Database

1. **Create a Supabase project** if you haven't already
2. **Set environment variables** for Supabase URL and anon key
3. **Run migrations** using the API endpoint or migration utilities
4. **Enable RLS** policies are included in the migration

### Testing

```typescript
// Test storage operations
import { createServerStorage } from '@/lib/database';

const storage = await createServerStorage();
const result = await storage.getUserProfile('test-user-id');
console.log('Test result:', result);
```

### Debugging

- Check the browser console for client-side errors
- Monitor the Network tab for API requests
- Use Supabase dashboard to inspect database state
- Check health endpoint for storage status

## Future Enhancements

1. **File storage integration** for attachments
2. **Advanced analytics** with aggregation queries
3. **Data export/import** functionality
4. **Backup and restore** utilities
5. **Multi-tenant support** for organizations
6. **Offline support** with service workers
7. **Data retention policies** for old usage data
# Supabase Schema

This directory contains the database schema for the application's Supabase backend.

## Files

- `schema.sql` - Complete database schema with tables, indexes, RLS policies, and triggers

## Tables

The schema defines three main tables:

### `conversations`
- Stores chat conversations with metadata
- UUID primary key with auto-generation
- User-scoped with RLS policies
- Includes metadata JSONB for flexible data storage

### `messages`
- Stores individual messages within conversations
- UUID primary key with auto-generation
- Foreign key to conversations and auth.users
- Role-based messages (user, assistant, system)
- Metadata JSONB for citations and additional data

### `research_entries`
- Stores research notes and entries
- UUID primary key with auto-generation
- User-scoped with RLS policies
- Citations and metadata stored as JSONB

## Features

- **Row Level Security (RLS)**: All tables are protected with RLS policies ensuring users can only access their own data
- **UUID Primary Keys**: Using `gen_random_uuid()` from pgcrypto for secure UUID generation
- **Auto-updating timestamps**: Triggers automatically update `updated_at` columns
- **Optimized Indexes**: Strategic indexes on user_id, timestamps, and JSONB columns for performance
- **JSONB Support**: Metadata and citations stored as JSONB with GIN indexes for efficient querying

## Setup Instructions

### 1. Apply the Schema

In the Supabase Dashboard:

1. Navigate to **SQL Editor**
2. Copy the contents of `schema.sql`
3. Paste and run the SQL script

Alternatively, using the Supabase CLI:

```bash
# Apply the schema to your project
supabase db push
```

### 2. Generate TypeScript Types

After applying the schema, generate TypeScript types for type safety:

```bash
# Generate types using Supabase CLI
supabase gen types typescript --project-id YOUR_PROJECT_ID > web/lib/supabase/types.ts
```

Or in the Supabase Dashboard:

1. Navigate to **Settings** > **API**
2. Find the "TypeScript" section
3. Copy the generated types to `web/lib/supabase/types.ts`

### 3. Update Environment Variables

Ensure your environment variables are configured in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage Examples

### Basic Queries

```typescript
import { createSupabaseClient } from '@/lib/supabase/browser';
import type { Database } from '@/lib/supabase/types';

const supabase = createSupabaseClient<Database>();

// Get user's conversations
const { data: conversations } = await supabase
  .from('conversations')
  .select('*')
  .order('updated_at', { ascending: false });

// Create a new message
const { data: message } = await supabase
  .from('messages')
  .insert({
    conversation_id: 'uuid-here',
    role: 'user',
    content: 'Hello, world!',
    metadata: { source: 'web' }
  })
  .select()
  .single();
```

### JSONB Queries

```typescript
// Query conversations with specific metadata
const { data } = await supabase
  .from('conversations')
  .select('*')
  .contains('metadata', { category: 'work' });

// Search research entries by citations
const { data } = await supabase
  .from('research_entries')
  .select('*')
  .contains('citations', { author: 'John Doe' });
```

## Security Notes

- All tables have RLS enabled with strict user isolation
- Users can only access their own data via `auth.uid() = user_id` policies
- The `authenticated` role has appropriate permissions
- No public access is granted to sensitive data

## Maintenance

- The schema includes `IF NOT EXISTS` clauses for safe re-application
- Triggers and functions are created with `OR REPLACE` for easy updates
- Indexes are optimized for common query patterns
- Consider adding foreign key constraints for additional data integrity if needed
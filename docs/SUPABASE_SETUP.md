# Supabase Setup Guide

This guide will help you set up Supabase for session persistence in the AI Workspace Assistant.

## Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `ai-workspace-assistant`
   - Database password: (generate a strong password)
   - Region: (choose closest to your users)
5. Click "Create new project"
6. Wait for the project to be provisioned (~2 minutes)

## Step 2: Create the Database Schema

1. In your Supabase project dashboard, go to the SQL Editor
2. Click "New query"
3. Paste the following SQL:

```sql
-- Create chat sessions table
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX idx_sessions_created ON chat_sessions(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (development mode)
-- Note: In production, you should restrict this to authenticated users
CREATE POLICY "Allow anonymous insert on chat_sessions" 
  ON chat_sessions FOR INSERT 
  TO anon 
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on chat_sessions" 
  ON chat_sessions FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "Allow anonymous insert on chat_messages" 
  ON chat_messages FOR INSERT 
  TO anon 
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select on chat_messages" 
  ON chat_messages FOR SELECT 
  TO anon 
  USING (true);

-- Optional: Create a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click "Run"
5. Verify the tables were created by checking the "Table Editor" section

## Step 3: Get Your API Credentials

1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Click "API" in the sidebar
3. You'll see:
   - **Project URL**: Your Supabase URL
   - **Project API keys**: 
     - `anon` / `public` key (safe to use in browser)
     - `service_role` key (keep secret, server-side only)

4. Copy the **Project URL** and **anon public key**

## Step 4: Configure the Workspace

You have two options:

### Option A: Browser localStorage (Recommended for Development)

1. Open the AI Workspace in your browser: http://localhost:3000
2. Open the browser console (F12)
3. Run these commands (replace with your actual values):

```javascript
localStorage.setItem('SUPABASE_URL', 'https://your-project.supabase.co');
localStorage.setItem('SUPABASE_ANON_KEY', 'your-anon-key-here');
```

4. Reload the page
5. Your sessions will now persist to Supabase!

### Option B: Environment Variables (For Production)

Create a `.env` file in the project root:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

Then update `workspace.html` to read from environment (requires build process).

## Step 5: Verify It's Working

1. Open the workspace and send a message
2. Go to your Supabase dashboard
3. Click "Table Editor"
4. Check the `chat_sessions` and `chat_messages` tables
5. You should see your session and messages!

## Production Security Considerations

For production deployment, you should:

1. **Enable Authentication**: 
   - Use Supabase Auth for user authentication
   - Update RLS policies to restrict access to authenticated users only

```sql
-- Example: Restrict to authenticated users
DROP POLICY "Allow anonymous insert on chat_sessions" ON chat_sessions;
DROP POLICY "Allow anonymous select on chat_sessions" ON chat_sessions;

CREATE POLICY "Users can create their own sessions" 
  ON chat_sessions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can view their own sessions" 
  ON chat_sessions FOR SELECT 
  TO authenticated 
  USING (auth.uid()::text = substring(id from 9 for 36));
```

2. **Add User ID to Sessions**:
   - Modify schema to include `user_id` column
   - Link sessions to authenticated users

3. **Enable SSL**:
   - Supabase handles this automatically

4. **Rate Limiting**:
   - Implement rate limiting on the backend
   - Use Supabase's built-in rate limiting features

5. **Data Retention**:
   - Set up automatic cleanup of old sessions
   - Implement data retention policies

```sql
-- Example: Delete sessions older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_sessions 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available)
-- Or call from your backend on a schedule
```

## Troubleshooting

### Error: "Failed to initialize Supabase"

- Check that your URL and API key are correct
- Make sure there are no extra spaces or quotes
- Verify the URL starts with `https://`

### Error: "Failed to persist message"

- Check your RLS policies allow the operation
- Verify the tables were created correctly
- Check browser console for detailed error messages

### Messages not appearing after reload

- Make sure you're using the same session ID
- Check that `currentSessionId` is stored in localStorage
- Verify data exists in Supabase Table Editor

### Network errors

- Check your internet connection
- Verify Supabase project is running (not paused)
- Check browser console for CORS or network issues

## Advanced Features

### Realtime Subscriptions

Enable realtime updates across devices:

```javascript
// In workspace.html
const subscription = supabase
  .channel('chat_messages')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_messages',
      filter: `session_id=eq.${currentSessionId}`
    }, 
    (payload) => {
      // Handle new message from another device/tab
      addMessage(payload.new);
    }
  )
  .subscribe();
```

### Export Chat History

Add functionality to export conversations:

```javascript
async function exportChatHistory() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', currentSessionId)
    .order('created_at', { ascending: true });
  
  if (data) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${currentSessionId}.json`;
    a.click();
  }
}
```

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Project README: See main README.md for more info

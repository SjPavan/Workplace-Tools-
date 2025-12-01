-- ==========================================
-- Workplace Tools Database Schema
-- ==========================================
-- This schema creates the necessary tables for the AI chat application
-- with conversation management, message storage, and citation tracking

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Conversations Table
-- ==========================================
-- Stores chat sessions/conversations for each user
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- Messages Table
-- ==========================================
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT, -- AI model used for assistant messages
    tokens_used INTEGER DEFAULT 0, -- Token count for cost tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- Citations Table
-- ==========================================
-- Stores source citations for AI-generated responses
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    title TEXT NOT NULL,
    snippet TEXT,
    relevance_score DECIMAL(3,2) DEFAULT 0.0, -- 0.00 to 1.00
    source_type TEXT DEFAULT 'web' CHECK (source_type IN ('web', 'academic', 'news', 'documentation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- User Preferences Table
-- ==========================================
-- Stores user-specific settings and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    default_model TEXT DEFAULT 'gemini-pro',
    export_format TEXT DEFAULT 'json' CHECK (export_format IN ('json', 'csv', 'markdown')),
    enable_citations BOOLEAN DEFAULT true,
    enable_search BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- API Usage Tracking Table
-- ==========================================
-- Tracks API usage for monitoring and quota management
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    service TEXT NOT NULL CHECK (service IN ('gemini', 'brave_search')),
    endpoint TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0, -- Cost in cents
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error', 'rate_limited')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- Indexes for Performance
-- ==========================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

-- Citations indexes
CREATE INDEX IF NOT EXISTS idx_citations_message_id ON citations(message_id);
CREATE INDEX IF NOT EXISTS idx_citations_source_url ON citations(source_url);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- API usage indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Conversations RLS policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Messages RLS policies
CREATE POLICY "Users can view messages in own conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.uid()
        )
    );

-- Citations RLS policies
CREATE POLICY "Users can view citations for own messages" ON citations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN conversations c ON c.id = m.conversation_id
            WHERE m.id = citations.message_id 
            AND c.user_id = auth.uid()
        )
    );

-- User preferences RLS policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- API usage RLS policies
CREATE POLICY "Users can view own API usage" ON api_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API usage records" ON api_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- Triggers and Functions
-- ==========================================

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp when messages are added
CREATE TRIGGER trigger_update_conversation_updated_at
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Function to update user preferences updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update preferences timestamp
CREATE TRIGGER trigger_update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_user_preferences_updated_at();

-- ==========================================
-- Initial Data and Defaults
-- ==========================================

-- Function to create default user preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences for new auth users
CREATE TRIGGER trigger_create_default_user_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_preferences();

-- ==========================================
-- Views for Common Queries
-- ==========================================

-- View for conversations with message counts and last activity
CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
    c.id,
    c.user_id,
    c.title,
    c.created_at,
    c.updated_at,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_message_at
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY c.id, c.user_id, c.title, c.created_at, c.updated_at;

-- View for messages with citations
CREATE OR REPLACE VIEW messages_with_citations AS
SELECT 
    m.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', cit.id,
                'source_url', cit.source_url,
                'title', cit.title,
                'snippet', cit.snippet,
                'relevance_score', cit.relevance_score,
                'source_type', cit.source_type
            ) ORDER BY cit.relevance_score DESC
        ) FILTER (WHERE cit.id IS NOT NULL),
        '[]'::json
    ) as citations
FROM messages m
LEFT JOIN citations cit ON m.id = cit.message_id
GROUP BY m.id, m.conversation_id, m.role, m.content, m.model, m.tokens_used, m.created_at;

-- ==========================================
-- Comments and Documentation
-- ==========================================

COMMENT ON TABLE conversations IS 'Stores chat sessions for each user';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON TABLE citations IS 'Stores source citations for AI-generated responses';
COMMENT ON TABLE user_preferences IS 'Stores user-specific settings and preferences';
COMMENT ON TABLE api_usage IS 'Tracks API usage for monitoring and quota management';

COMMENT ON COLUMN conversations.title IS 'Display title for the conversation';
COMMENT ON COLUMN messages.role IS 'Message role: user, assistant, or system';
COMMENT ON COLUMN messages.tokens_used IS 'Number of tokens used for cost tracking';
COMMENT ON COLUMN citations.relevance_score IS 'Relevance score from 0.00 to 1.00';
COMMENT ON COLUMN citations.source_type IS 'Type of source: web, academic, news, documentation';
COMMENT ON COLUMN api_usage.tokens_used IS 'Tokens used for this API call';
COMMENT ON COLUMN api_usage.cost_cents IS 'Cost in cents for this API call';

-- ==========================================
-- Schema Version
-- ==========================================

-- Create a table to track schema version for migrations
CREATE TABLE IF NOT EXISTS schema_version (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert current schema version
INSERT INTO schema_version (version) 
VALUES ('1.0.0') 
ON CONFLICT (version) DO NOTHING;
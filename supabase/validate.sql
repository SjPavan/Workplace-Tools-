-- Schema validation script
-- Run this script to verify that the schema was applied correctly

-- Check if extensions are enabled
SELECT 
    extname as extension_name,
    extversion as extension_version
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- Check if tables exist and have the correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('conversations', 'messages', 'research_entries')
ORDER BY table_name, ordinal_position;

-- Check if indexes exist
SELECT 
    indexname as index_name,
    tablename as table_name,
    indexdef as index_definition
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('conversations', 'messages', 'research_entries')
ORDER BY tablename, indexname;

-- Check if RLS is enabled
SELECT 
    schemaname as schema_name,
    tablename as table_name,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('conversations', 'messages', 'research_entries')
ORDER BY tablename;

-- Check if RLS policies exist
SELECT 
    schemaname as schema_name,
    tablename as table_name,
    policyname as policy_name,
    permissive as is_permissive,
    roles as applicable_roles,
    cmd as command_type,
    qual as qualification
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('conversations', 'messages', 'research_entries')
ORDER BY tablename, policyname;

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation as event_type,
    event_object_table as table_name,
    action_timing as trigger_timing,
    action_condition as trigger_condition,
    action_statement as trigger_function
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND event_object_table IN ('conversations', 'messages', 'research_entries')
ORDER BY event_object_table, trigger_name;

-- Check if the update_updated_at_column function exists
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Sample data test (optional - uncomment to test)
-- This will insert test data to verify the schema works
-- Remove the '--' comments to run the test

/*
-- Test inserting a conversation
INSERT INTO conversations (user_id, title, metadata) 
VALUES ('00000000-0000-0000-0000-000000000000', 'Test Conversation', '{"test": true}')
ON CONFLICT DO NOTHING;

-- Test inserting a message
INSERT INTO messages (conversation_id, user_id, role, content, metadata) 
VALUES (
    (SELECT id FROM conversations WHERE title = 'Test Conversation' LIMIT 1),
    '00000000-0000-0000-0000-000000000000', 
    'user', 
    'Hello, this is a test message',
    '{"test": true}'
)
ON CONFLICT DO NOTHING;

-- Test inserting a research entry
INSERT INTO research_entries (user_id, title, content, citations, metadata) 
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Test Research Entry',
    'This is a test research entry content.',
    '{"author": "Test Author", "year": 2024}',
    '{"test": true}'
)
ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT 'conversations' as table_name, COUNT(*) as row_count FROM conversations WHERE title = 'Test Conversation'
UNION ALL
SELECT 'messages', COUNT(*) FROM messages WHERE content LIKE '%test message%'
UNION ALL
SELECT 'research_entries', COUNT(*) FROM research_entries WHERE title = 'Test Research Entry';
*/
# Chat API Implementation

This document describes the chat API implementation that provides secure, real-time conversations with AI assistance, web search integration, and persistent storage.

## Overview

The chat system consists of several API endpoints that work together to provide:

- **Secure Authentication**: All endpoints require a valid Supabase session
- **Real-time Streaming**: AI responses are streamed using Server-Sent Events (SSE)
- **Web Search Integration**: Brave Search API provides up-to-date information
- **Persistent Storage**: Conversations, messages, citations, and research data are stored in Supabase
- **Export Functionality**: Full conversation export with research context

## API Endpoints

### 1. Chat Completion
```
POST /api/ai/complete
```

**Request Body:**
```json
{
  "message": "What is the latest news about AI?",
  "conversation_id": "optional-existing-conversation-id",
  "model": "gemini-1.5-flash"
}
```

**Response:** Server-Sent Events stream with events:
- `connected`: Initial connection
- `message`: Streaming AI response chunks
- `complete`: Final response with citations
- `error`: Error information

### 2. Available Models
```
GET /api/ai/models
```

**Response:**
```json
{
  "models": [
    {
      "id": "gemini-1.5-flash",
      "name": "Gemini 1.5 Flash",
      "description": "Fast and efficient model for most tasks",
      "maxTokens": 1048576
    }
  ],
  "default": "gemini-1.5-flash"
}
```

### 3. List Conversations
```
GET /api/conversations
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "conversation-id",
      "user_id": "user-id",
      "title": "Conversation title",
      "model": "gemini-1.5-flash",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### 4. Create Conversation
```
POST /api/conversations
```

**Request Body:**
```json
{
  "title": "New conversation title",
  "model": "gemini-1.5-flash",
  "metadata": {}
}
```

### 5. Get Conversation Messages
```
GET /api/conversations/[id]/messages
```

**Response:**
```json
{
  "conversation": {...},
  "messages": [
    {
      "id": "message-id",
      "conversation_id": "conversation-id",
      "role": "user|assistant",
      "content": "Message content",
      "created_at": "2024-01-01T00:00:00Z",
      "citations": [
        {
          "title": "Source title",
          "url": "https://example.com",
          "snippet": "Source snippet"
        }
      ]
    }
  ]
}
```

### 6. Export Conversation
```
GET /api/conversations/[id]/export?format=json|download
```

**Formats:**
- `json`: JSON response with full conversation data
- `download`: Markdown file download

## Database Schema

The system uses four main tables:

### conversations
- `id`: UUID primary key
- `user_id`: Foreign key to auth.users
- `title`: Conversation title
- `model`: AI model used
- `metadata`: JSONB for additional data
- `created_at`, `updated_at`: Timestamps

### messages
- `id`: UUID primary key
- `conversation_id`: Foreign key to conversations
- `role`: 'user' or 'assistant'
- `content`: Message content
- `metadata`: JSONB for additional data
- `created_at`: Timestamp

### citations
- `id`: UUID primary key
- `message_id`: Foreign key to messages
- `title`: Source title
- `url`: Source URL
- `snippet`: Source snippet
- `created_at`: Timestamp

### research_entries
- `id`: UUID primary key
- `conversation_id`: Foreign key to conversations
- `query`: Search query
- `results`: JSONB with search results
- `created_at`: Timestamp

## Security

- **Authentication**: All endpoints require valid Supabase session
- **Row Level Security**: RLS policies ensure users can only access their own data
- **Service Role**: Admin operations use service role key with proper validation
- **Input Validation**: All inputs are validated and sanitized

## Environment Variables

Required environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Brave Search (optional)
BRAVE_SEARCH_API_KEY=your-brave-search-api-key
```

## Setup Instructions

1. **Database Setup**: Run the SQL schema in `supabase-schema.sql` in your Supabase SQL editor

2. **Environment Configuration**: Copy `.env.example` to `.env.local` and fill in the required values

3. **Install Dependencies**: The implementation requires `@google/generative-ai` package

4. **Test the APIs**: Use the endpoints to test chat functionality

## Features

### Streaming Responses
- Real-time AI response streaming using Server-Sent Events
- Progressive content delivery for better user experience
- Error handling and recovery

### Web Search Integration
- Brave Search API integration for up-to-date information
- Automatic citation extraction and storage
- Fallback to mock results when API is unavailable

### Conversation Management
- Persistent conversation storage
- Message history with citations
- Export functionality in multiple formats

### Security
- Session-based authentication
- Row-level security policies
- Service role admin operations with validation

## Error Handling

All endpoints include comprehensive error handling:
- Authentication errors (401)
- Validation errors (400)
- Not found errors (404)
- Server errors (500)
- Graceful degradation when external services are unavailable

## Future Enhancements

Potential improvements:
- File upload support
- Conversation sharing
- Advanced search filters
- Message editing/deletion
- Conversation archiving
- Analytics and usage tracking
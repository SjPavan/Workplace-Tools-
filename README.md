# AI Workspace Assistant MVP

A web-based AI workspace with streaming chat capabilities, session persistence, and comprehensive E2E testing.

## Features

- ✅ **Streaming Chat UI**: Real-time streaming responses with visual feedback
- ✅ **Session Persistence**: Chat sessions saved to localStorage (Supabase integration ready)
- ✅ **Safety Filtering**: Basic content filtering for inappropriate requests
- ✅ **Feature Flags**: Attachment features disabled by default
- ✅ **Error Handling**: Graceful error handling with user-friendly messages
- ✅ **E2E Testing**: Comprehensive Playwright test suite
- ✅ **Responsive Design**: Modern, polished UI with smooth animations

## Architecture

### Frontend (`workspace.html`)
- Standalone HTML file with inline CSS and JavaScript
- Uses ES6 modules for Supabase integration
- Implements Server-Sent Events (SSE) for streaming
- Feature flag system for attachments (disabled by default)

### Backend (`server.js`)
- Express server with `/ai/chat` streaming endpoint
- Mock AI responses for MVP (ready for AI orchestration integration)
- Safety filter implementation
- Health check endpoint

### Testing (`tests/e2e/`)
- Playwright E2E tests covering:
  - Send/receive messages
  - Streaming response handling
  - History persistence
  - Safety filters
  - Error handling
  - UI interactions

## Setup

### Prerequisites
- Node.js 18+ (ES modules support)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Variables (Optional)

For Supabase integration, set these in localStorage via browser console:

```javascript
localStorage.setItem('SUPABASE_URL', 'your-supabase-url');
localStorage.setItem('SUPABASE_ANON_KEY', 'your-supabase-anon-key');
```

### Supabase Schema (Optional)

If using Supabase, create these tables:

```sql
-- Chat sessions table
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_session ON chat_messages(session_id, created_at);
```

## Usage

### Development Server

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

### Running Tests

```bash
# Run all E2E tests
npm test

# Run tests with UI mode
npm run test:ui

# Debug tests
npm run test:debug
```

## API Endpoints

### `POST /ai/chat`

Stream chat responses using Server-Sent Events (SSE).

**Request:**
```json
{
  "message": "User message text",
  "sessionId": "session_123_abc",
  "history": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:** SSE stream
```
data: {"content": "Hello", "done": false}

data: {"content": " there!", "done": true}
```

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Feature Flags

### File/URL Attachments

Disabled by default. To enable, modify `workspace.html`:

```javascript
const CONFIG = {
  // ...
  FEATURE_FLAGS: {
    ATTACHMENTS_ENABLED: true  // Change to true
  }
};
```

## Safety Filters

Basic safety filtering is implemented in both frontend and backend:

- Blocks requests containing harmful keywords (hack, exploit, malware, etc.)
- Blocks requests containing sensitive data patterns
- Returns safe error messages to users

## Integration with AI Orchestration Backend

To connect to the full AI orchestration backend (from `feat/ai-orchestration-multi-model-routing` branch):

1. Update `server.js` to proxy requests to the orchestration service
2. Replace mock response with actual API call to `/ai/complete`
3. Handle provider routing, caching, and advanced features

Example integration:

```javascript
// In server.js
app.post('/ai/chat', async (req, res) => {
  // Forward to AI orchestration backend
  const response = await fetch('http://orchestration-service/ai/complete', {
    method: 'POST',
    body: JSON.stringify(req.body)
  });
  
  // Stream response back to client
  response.body.pipe(res);
});
```

## E2E Test Coverage

✅ Page load and initialization  
✅ Empty state display  
✅ Send message and receive response  
✅ Streaming response handling  
✅ Multiple message sequences  
✅ Button state management  
✅ Keyboard shortcuts (Enter to send)  
✅ Empty message validation  
✅ Session persistence  
✅ Feature flag verification  
✅ Safety filter enforcement  
✅ Auto-scroll behavior  
✅ History loading on reload  
✅ Error handling  

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Requires ES6 module support

## Development Roadmap

- [ ] Full AI orchestration backend integration
- [ ] File upload support (behind feature flag)
- [ ] URL attachment support (behind feature flag)
- [ ] Markdown rendering in messages
- [ ] Code syntax highlighting
- [ ] Export chat history
- [ ] Dark mode
- [ ] Multi-language support

## License

MIT

## Workplace Tools Collection

This AI workspace is part of a collection of workplace productivity tools. See the repository for other utilities including:
- Title case converter
- Sentence case converter
- Data extraction assistants

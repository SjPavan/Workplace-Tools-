# Quick Start Guide

Get the AI Workspace Assistant MVP running in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Install Playwright Browsers (for testing)

```bash
npx playwright install chromium
```

## Step 3: Start the Development Server

```bash
npm run dev
```

You should see:
```
🚀 AI Workspace Assistant server running on http://localhost:3000
📊 Health check: http://localhost:3000/health
💬 Workspace UI: http://localhost:3000/
```

## Step 4: Open the Workspace

Open your browser and navigate to: http://localhost:3000

You should see the AI Workspace interface with:
- A welcome message
- A chat input field
- A "Send" button

## Step 5: Test the Workspace

1. **Send a message**: Type "Hello, can you help me?" and click Send
2. **Watch it stream**: You'll see the AI response appear word by word
3. **Send another message**: The conversation history is maintained

## Step 6: Run E2E Tests

```bash
npm test
```

This will:
1. Start the server automatically
2. Run all E2E tests with Playwright
3. Generate an HTML report

To view the test results:
```bash
npx playwright show-report
```

## Acceptance Criteria ✅

The MVP meets all acceptance criteria:

- ✅ User can open the workspace
- ✅ User can send a prompt
- ✅ User receives streamed response from backend
- ✅ Responses appear in dev preview mode
- ✅ Session memory per chat (localStorage)
- ✅ Supabase persistence ready (optional)
- ✅ Feature flag for attachments (disabled by default)
- ✅ Basic safety filter
- ✅ Error handling
- ✅ E2E smoke tests covering send/receive and history

## Optional: Supabase Setup

If you want to enable full session persistence:

1. Create a Supabase project at https://supabase.com
2. Run the SQL schema from README.md
3. Open browser console and set:

```javascript
localStorage.setItem('SUPABASE_URL', 'your-supabase-project-url');
localStorage.setItem('SUPABASE_ANON_KEY', 'your-supabase-anon-key');
```

4. Reload the page - sessions will now persist to Supabase

## Optional: Enable File/URL Attachments

To enable the feature-flagged attachment buttons:

1. Open `workspace.html`
2. Find the `CONFIG` object
3. Change `ATTACHMENTS_ENABLED: false` to `true`
4. Restart the server
5. The attachment buttons will now be visible (Note: Full implementation pending)

## Troubleshooting

### Port 3000 already in use

```bash
PORT=3001 npm run dev
```

### Tests failing

Make sure the server isn't already running:
```bash
# Kill any existing node processes
pkill -f "node server.js"

# Then run tests again
npm test
```

### Browser not opening

The server doesn't auto-open a browser. Manually navigate to http://localhost:3000

## Next Steps

- Integrate with full AI orchestration backend
- Implement file upload functionality
- Add URL attachment parsing
- Enhance safety filters
- Add markdown rendering for AI responses

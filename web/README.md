# Web application scaffold

This project is a Next.js App Router application preconfigured with Supabase authentication, Tailwind CSS, TanStack Query, Zustand state management, theming, and an offline-ready service worker. It lives inside the `web/` directory of the monorepo and is ready to deploy to Vercel.

## Prerequisites

- Node.js 20+
- A Supabase project with an email/password authentication provider enabled

## Getting started

1. Copy the example environment file and supply your credentials:

    ```bash
     cd web
     cp .env.example .env.local
     # Configure Supabase, Gemini, and Brave Search API keys
     # See "Getting API Keys" section below for detailed instructions
     ```

2. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

3. Visit [http://localhost:3000](http://localhost:3000) and sign in with a Supabase user account. Successful authentication redirects you to the protected dashboard where you can access the AI chat, data export, and other features.

## Getting API Keys

### Supabase (Free Tier)
1. Go to [supabase.com](https://supabase.com) and sign up for free
2. Create a new project
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
5. Copy the **anon/public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
6. Copy the **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`) - keep this secret!

### Google Gemini (Free Tier)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key to `GEMINI_API_KEY`
5. Free tier includes 60 requests per minute

### Brave Search (Free Tier)
1. Go to [Brave Search API](https://brave.com/search/api/)
2. Sign up for a free account
3. Generate an API key
4. Copy your API key to `BRAVE_API_KEY`
5. Free tier includes 2,000 searches per month

## Database Setup

If using Supabase for data persistence:

1. **Apply Schema:**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** → **New query**
   - Copy and paste the contents of `supabase/schema.sql` (when available)
   - Execute to create required tables

2. **Required Tables:**
   - `conversations` - Stores chat sessions
   - `messages` - Stores individual messages
   - `citations` - Stores source citations for AI responses

3. **Verify Setup:**
   - Check **Table Editor** to confirm tables exist
   - Ensure Row Level Security (RLS) policies are enabled

## Available scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the Next.js development server. |
| `npm run lint` | Run ESLint via `next lint`. |
| `npm run typecheck` | Check TypeScript types without emitting output. |
| `npm run test` | Convenience script that runs the lint and type-check steps. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Start the production server after building. |

## Architecture overview

- **Authentication** — Server actions handle login/logout flows backed by Supabase. Route groups and layouts guard protected routes.
- **State & data fetching** — Zustand stores the authenticated user and TanStack Query powers client-side data access to Supabase.
- **Styling & theming** — Tailwind CSS powers design primitives and the UI supports light/dark themes via `next-themes`.
- **Offline support** — A progressive service worker caches the app shell and provides graceful offline fallbacks.

## Deployment

### Vercel (Recommended)

This project is optimized for deployment on Vercel's free tier:

1. Import your repository to Vercel
2. Vercel will auto-detect the Next.js framework
3. The root `vercel.json` configuration automatically sets the correct build directory
4. Set environment variables in Vercel dashboard:
   - **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - **AI Services:** `GEMINI_API_KEY`, `BRAVE_API_KEY`
   - **Feature Flags:** `NEXT_PUBLIC_ENABLE_AI_CHAT`, `NEXT_PUBLIC_ENABLE_DATA_EXPORT`, etc.
   - **Optional:** `NEXT_PUBLIC_API_URL`
5. Deploy! Preview deployments are automatically created for PRs

#### Environment Variables for Production

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Environment |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) | All |
| `GEMINI_API_KEY` | Google Gemini API key (secret) | All |
| `BRAVE_API_KEY` | Brave Search API key (secret) | All |
| `NEXT_PUBLIC_ENABLE_AI_CHAT` | Enable AI chat features | All |
| `NEXT_PUBLIC_ENABLE_DATA_EXPORT` | Enable data export | All |
| `NEXT_PUBLIC_ENABLE_CITATIONS` | Enable citation tracking | All |
| `NEXT_PUBLIC_ENABLE_BRAVE_SEARCH` | Enable Brave Search | All |
| `NEXT_PUBLIC_API_URL` | External API URL (optional) | All |

**Important:** Secret keys (without `NEXT_PUBLIC_` prefix) are only available on the server and should be marked as "secret" in Vercel.

#### Health Check

After deployment, verify the app is running:
```
GET https://your-app.vercel.app/api/health
```

Expected response (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "app": {
    "name": "Workplace Tools Web",
    "version": "0.1.0",
    "environment": "production"
  },
  "config": {
    "supabaseConfigured": true,
    "aiApiConfigured": true,
    "aiApiUrl": "http://localhost:8000",
    "url": "https://your-app.vercel.app"
  },
  "features": {
    "authentication": true,
    "aiChat": true,
    "dataExport": true,
    "citations": true,
    "braveSearch": true
  }
}
```

#### Testing API Endpoints

After deployment, test these endpoints:

1. **Health Check:** `GET /api/health`
2. **AI Models:** `GET /api/ai/models`
3. **Auth Status:** `GET /api/auth/me`
4. **AI Completion:** `POST /api/ai/complete`
5. **Conversations:** `GET /api/conversations` (when implemented)
6. **Export Data:** `GET /api/conversations/{id}/export` (when implemented)

## Feature Overview

### AI Chat with Gemini
- Powered by Google Gemini API
- Supports conversational AI interactions
- Includes citation tracking for source verification
- Rate limited to respect API quotas

### Data Export
- Export conversation history in multiple formats
- Includes citations and metadata
- Server-side processing for security
- Configurable export options

### Citation Tracking
- Automatic source citation for AI responses
- Links to original sources when available
- Helps verify AI-generated content
- Configurable citation formats

### Brave Search Integration
- Web search capabilities powered by Brave Search API
- Real-time information retrieval
- Integrated into AI chat responses
- Monthly quota management

### Authentication & Security
- Supabase-based user authentication
- Row Level Security (RLS) for data protection
- Secure API key handling
- Session management

### Environment Variables

The app supports the following environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No (placeholder) | `https://demo.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | No (placeholder) | Demo key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | No (placeholder) | Demo key |
| `GEMINI_API_KEY` | Google Gemini API key | No (mock responses) | Mock responses |
| `BRAVE_API_KEY` | Brave Search API key | No (search disabled) | Disabled |
| `NEXT_PUBLIC_API_URL` | External API URL | No | `http://localhost:8000` |
| `NEXT_PUBLIC_ENABLE_AI_CHAT` | Enable AI chat | No | `true` |
| `NEXT_PUBLIC_ENABLE_DATA_EXPORT` | Enable data export | No | `true` |
| `NEXT_PUBLIC_ENABLE_CITATIONS` | Enable citations | No | `true` |
| `NEXT_PUBLIC_ENABLE_BRAVE_SEARCH` | Enable Brave Search | No | `true` |

The app will boot and run with placeholder values, but authentication and AI features will be limited until real credentials are configured.

## Troubleshooting

### Common Issues

#### AI Chat Returns Mock Responses
- **Cause:** Missing or invalid `GEMINI_API_KEY`
- **Fix:** Verify API key is set and valid in environment variables

#### Search Not Working
- **Cause:** Missing or invalid `BRAVE_API_KEY` or feature disabled
- **Fix:** Check API key and ensure `NEXT_PUBLIC_ENABLE_BRAVE_SEARCH=true`

#### Export Fails
- **Cause:** Missing `SUPABASE_SERVICE_ROLE_KEY` or database tables not created
- **Fix:** Apply schema and configure service role key

#### Authentication Issues
- **Cause:** Incorrect Supabase configuration
- **Fix:** Verify URL and keys, check Supabase project settings

### API Quota Management

#### Gemini API
- **Free Tier:** 60 requests/minute
- **Monitoring:** Check Google AI Studio dashboard
- **Solutions:** Implement rate limiting, use caching

#### Brave Search API
- **Free Tier:** 2,000 searches/month
- **Monitoring:** Check Brave Search API dashboard
- **Solutions:** Cache results, implement search optimization

For further customization, extend the dashboard and query Supabase tables inside the protected routes.

## Continuous Integration

- GitHub Actions workflow (`.github/workflows/ci.yml`) installs dependencies, runs tests (lint + typecheck), and builds the app on every push and pull request.

For further customization, extend the dashboard and query Supabase tables inside the protected routes.

# Vercel Deployment Guide

This guide explains how to deploy the Workplace Tools web application to Vercel's free tier.

## Project Overview

The web application is a Next.js App Router application located in the `web/` directory. It includes:
- Server-side authentication with Supabase (optional)
- Protected dashboard routes
- Health check endpoint at `/api/health`
- Offline-ready service worker
- Light/dark theme support

## Prerequisites

- GitHub account
- Vercel account (free tier) - [Sign up at vercel.com](https://vercel.com)
- GitHub repository with this code

## Quick Start - Deploy to Vercel

### Option 1: Using the Vercel Dashboard

1. **Connect Repository:**
   - Log in to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Project Settings:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `web` (auto-configured via `vercel.json`)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

3. **Set Environment Variables (Required for Full Features):**

    Navigate to "Environment Variables" and add:

    #### Supabase Configuration
    | Variable | Value | Environment |
    |----------|-------|-------------|
    | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | All |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | All |
    | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (secret) | All |

    #### AI Service Configuration
    | Variable | Value | Environment |
    |----------|-------|-------------|
    | `GEMINI_API_KEY` | Google Gemini API key (secret) | All |
    | `BRAVE_API_KEY` | Brave Search API key (secret) | All |

    #### Feature Flags
    | Variable | Value | Environment |
    |----------|-------|-------------|
    | `NEXT_PUBLIC_ENABLE_AI_CHAT` | `true` | All |
    | `NEXT_PUBLIC_ENABLE_DATA_EXPORT` | `true` | All |
    | `NEXT_PUBLIC_ENABLE_CITATIONS` | `true` | All |
    | `NEXT_PUBLIC_ENABLE_BRAVE_SEARCH` | `true` | All |

    #### Optional Configuration
    | Variable | Value | Environment |
    |----------|-------|-------------|
    | `NEXT_PUBLIC_API_URL` | Base URL for external AI backend (optional) | All |

    **Important:**
    - Mark secret keys (without `NEXT_PUBLIC_` prefix) as "secret" in Vercel
    - The app will work with placeholder values, but features will be limited
    - Real API keys are required for full functionality

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete (typically 1-2 minutes)
   - Your app will be available at `https://your-project.vercel.app`

5. **Setup Database (Required for Full Features):**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** → **New query**
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute to create required tables (`conversations`, `messages`, `citations`)
   - Verify tables are created in **Table Editor**

6. **Test Features:**
   - Visit your deployment URL
   - Test authentication flow
   - Try AI chat functionality
   - Verify data export works
   - Check citation tracking

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project root
cd /path/to/Workplace-Tools-

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: workplace-tools
# - Directory: web (already configured in vercel.json)

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GEMINI_API_KEY
vercel env add BRAVE_API_KEY
vercel env add NEXT_PUBLIC_ENABLE_AI_CHAT
vercel env add NEXT_PUBLIC_ENABLE_DATA_EXPORT
vercel env add NEXT_PUBLIC_ENABLE_CITATIONS
vercel env add NEXT_PUBLIC_ENABLE_BRAVE_SEARCH

# Redeploy with new environment variables
vercel --prod
```

## Configuration Files

### vercel.json (Root Directory)

The project includes a `vercel.json` configuration file at the repository root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd web && npm install && npm run build",
  "devCommand": "cd web && npm run dev",
  "installCommand": "cd web && npm install",
  "outputDirectory": "web/.next",
  "framework": "nextjs",
  "rootDirectory": "web"
}
```

This configuration:
- Sets the correct build directory for the monorepo structure
- Configures build and install commands
- Enables automatic framework detection

### next.config.ts (web/next.config.ts)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@supabase/supabase-js'],
};

export default nextConfig;
```

## Environment Variables

### Required for Full Functionality

| Variable | Description | Where to Find | Type |
|----------|-------------|---------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API → Project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API → Project API keys (anon/public) | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Settings → API → Project API keys (service_role) | Secret |
| `GEMINI_API_KEY` | Google Gemini API key | Google AI Studio → Create API Key | Secret |
| `BRAVE_API_KEY` | Brave Search API key | Brave Search API Dashboard → Generate API Key | Secret |

### Optional Feature Flags

| Variable | Description | Default | Type |
|----------|-------------|---------|------|
| `NEXT_PUBLIC_ENABLE_AI_CHAT` | Enable AI chat features | `true` | Public |
| `NEXT_PUBLIC_ENABLE_DATA_EXPORT` | Enable conversation export functionality | `true` | Public |
| `NEXT_PUBLIC_ENABLE_CITATIONS` | Enable citation tracking | `true` | Public |
| `NEXT_PUBLIC_ENABLE_BRAVE_SEARCH` | Enable Brave Search integration | `true` | Public |
| `NEXT_PUBLIC_API_URL` | Base URL for external AI assistant backend | `http://localhost:8000` | Public |

### Getting API Keys from Free Tiers

#### Supabase (Free Tier)
1. Go to [supabase.com](https://supabase.com) and sign up for free
2. Create a new project
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
5. Copy the **anon/public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
6. Copy the **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`) - keep this secret!

**Free Tier Limits:**
- 500 MB database storage
- 50,000 active users/month
- 2 GB bandwidth/month
- Unlimited API calls

#### Google Gemini (Free Tier)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key to `GEMINI_API_KEY`

**Free Tier Limits:**
- 60 requests per minute
- 15 requests per minute for newer models
- Perfect for development and testing

#### Brave Search (Free Tier)
1. Go to [Brave Search API](https://brave.com/search/api/)
2. Sign up for a free account
3. Generate an API key
4. Copy your API key to `BRAVE_API_KEY`

**Free Tier Limits:**
- 2,000 searches per month
- Real-time web search results
- API-based integration

### Setting Environment Variables in Vercel

#### Via Dashboard:
1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Public variables** (with `NEXT_PUBLIC_` prefix):
     - Name: `NEXT_PUBLIC_SUPABASE_URL`
     - Value: `https://your-project.supabase.co`
     - Environment: Select all (Production, Preview, Development)
   - **Secret variables** (without `NEXT_PUBLIC_` prefix):
     - Name: `SUPABASE_SERVICE_ROLE_KEY`
     - Value: `your-service-role-key`
     - Environment: Select all
     - Check "Secret" box
4. Repeat for all variables
5. Redeploy for changes to take effect

#### Via CLI:
```bash
# Public variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_ENABLE_AI_CHAT
vercel env add NEXT_PUBLIC_ENABLE_DATA_EXPORT
vercel env add NEXT_PUBLIC_ENABLE_CITATIONS
vercel env add NEXT_PUBLIC_ENABLE_BRAVE_SEARCH
vercel env add NEXT_PUBLIC_API_URL

# Secret variables
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GEMINI_API_KEY
vercel env add BRAVE_API_KEY

# Redeploy to apply changes
vercel --prod
```

## Database Setup

### Applying the Schema

After setting up Supabase, apply the database schema:

1. **Navigate to Supabase Dashboard:**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Open SQL Editor:**
   - Click on **SQL Editor** in the left sidebar
   - Click **"New query"**

3. **Apply Schema:**
   - Copy the contents of `supabase/schema.sql` from the repository
   - Paste into the SQL Editor
   - Click **"Run"** to execute the schema

4. **Verify Tables:**
   - Go to **Table Editor**
   - Verify these tables exist:
     - `conversations` - Stores chat sessions
     - `messages` - Stores individual messages
     - `citations` - Stores source citations for AI responses

### Required Tables Structure

#### conversations
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to auth.users)
- title (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### messages
```sql
- id (uuid, primary key)
- conversation_id (uuid, foreign key)
- role (text: 'user' | 'assistant' | 'system')
- content (text)
- created_at (timestamp)
```

#### citations
```sql
- id (uuid, primary key)
- message_id (uuid, foreign key)
- source_url (text)
- title (text)
- snippet (text)
- created_at (timestamp)
```

### Row Level Security (RLS)

The schema includes RLS policies to ensure:
- Users can only access their own conversations
- Messages are tied to their conversations
- Citations are properly linked to messages

### Testing Database Setup

1. **Test via API:**
   ```bash
   # Test health endpoint (should show supabaseConfigured: true)
   curl https://your-project.vercel.app/api/health
   ```

2. **Test via UI:**
   - Visit your deployment
   - Try signing in/up
   - Create a test conversation
   - Verify data appears in Supabase Table Editor
## Preview Deployments

Vercel automatically creates preview deployments for:
- Every pull request
- Every push to non-production branches

Each preview deployment gets a unique URL:
```
https://project-name-git-branch-username.vercel.app
```

Preview deployments:
- Have the same environment variables as production (or can be configured separately)
- Are automatically updated on each push
- Are deleted when the PR is merged or closed

## Health Check and API Testing

### Health Check Endpoint

After deployment, verify the application is running:

```bash
curl https://your-project.vercel.app/api/health
```

Expected response (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "responseTime": "45ms",
  "app": {
    "name": "Workplace Tools Web",
    "version": "0.1.0",
    "environment": "production",
    "nodeVersion": "v20.0.0"
  },
  "config": {
    "supabaseConfigured": true,
    "aiApiConfigured": true,
    "aiApiUrl": "http://localhost:8000",
    "url": "https://your-project.vercel.app"
  },
  "endpoints": [
    {
      "name": "AI Models",
      "path": "/api/ai/models",
      "status": "ok",
      "statusCode": 200
    },
    {
      "name": "Auth Status",
      "path": "/api/auth/me",
      "status": "ok",
      "statusCode": 200
    }
  ],
  "features": {
    "authentication": true,
    "aiChat": true,
    "dataExport": true,
    "citations": true,
    "braveSearch": true,
    "themeToggle": true,
    "serviceWorker": true
  }
}
```

### Testing API Endpoints

After deployment, test these endpoints:

#### 1. Health Check
```bash
curl https://your-project.vercel.app/api/health
```

#### 2. AI Models
```bash
curl https://your-project.vercel.app/api/ai/models
```

#### 3. Authentication Status
```bash
curl https://your-project.vercel.app/api/auth/me
```

#### 4. AI Chat Completion
```bash
curl -X POST https://your-project.vercel.app/api/ai/complete \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?", "model": "gpt-3.5-turbo"}'
```

#### 5. Conversation Management (when implemented)
```bash
# List conversations
curl https://your-project.vercel.app/api/conversations

# Create conversation
curl -X POST https://your-project.vercel.app/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Chat"}'

# Export conversation
curl https://your-project.vercel.app/api/conversations/{id}/export
```

### Local Development Testing

To test the chat functionality locally:

1. **Start Development Server:**
   ```bash
   cd web
   npm install
   npm run dev
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Test Local Endpoints:**
   ```bash
   # Health check
   curl http://localhost:3000/api/health
   
   # AI models
   curl http://localhost:3000/api/ai/models
   
   # AI completion
   curl -X POST http://localhost:3000/api/ai/complete \
     -H "Content-Type: application/json" \
     -d '{"message": "Test message"}'
   ```

## Deployment Checklist

- [ ] Repository connected to Vercel
- [ ] Project created with correct framework (Next.js)
- [ ] Root directory set to `web` (auto-configured)
- [ ] Supabase project created and configured
- [ ] Database schema applied (`supabase/schema.sql`)
- [ ] Environment variables added:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (secret)
  - [ ] `GEMINI_API_KEY` (secret)
  - [ ] `BRAVE_API_KEY` (secret)
  - [ ] Feature flags configured
- [ ] First deployment successful
- [ ] Health endpoint returns 200 OK
- [ ] Database tables verified in Supabase
- [ ] Authentication flow tested
- [ ] AI chat functionality tested
- [ ] Data export tested
- [ ] Citation tracking tested
- [ ] Preview deployments enabled (automatic)
- [ ] Custom domain configured (optional)

## Common Issues and Troubleshooting

### Build and Deployment Issues

#### Build Fails on Vercel
**Problem:** Build fails with module not found errors

**Solutions:**
- Ensure all dependencies are in `web/package.json` and committed to the repository
- Check build logs in Vercel dashboard for specific errors
- Verify TypeScript compilation: `npm run typecheck`
- Ensure `vercel.json` is present in repository root

#### Environment Variables Not Working
**Problem:** App runs but features don't work as expected

**Solutions:**
- Ensure variables are set in Vercel dashboard with correct names
- Variables must be prefixed with `NEXT_PUBLIC_` for client-side access
- Mark secret variables (without `NEXT_PUBLIC_`) as "secret" in Vercel
- Redeploy after adding/changing environment variables
- Use `/api/health` endpoint to verify configuration

### API Key and Service Issues

#### Gemini API Quota Exceeded
**Problem:** Receiving 429 or quota exceeded errors from Gemini

**Solutions:**
- Free tier allows 60 requests per minute
- Implement rate limiting in your application code
- Use response caching to reduce API calls
- Monitor usage in Google AI Studio dashboard
- Consider upgrading to paid tier for higher limits

#### Brave Search API Quota Exceeded
**Problem:** Search functionality stops working or returns errors

**Solutions:**
- Free tier includes 2,000 searches per month
- Monitor usage in your Brave Search API dashboard
- Implement search result caching
- Optimize search queries to reduce unnecessary calls
- Consider upgrading to paid tier if needed

#### Invalid API Keys
**Problem:** API returns authentication errors

**Solutions:**
- Verify API keys are copied correctly without extra spaces
- Check that API keys are active and not expired
- Ensure environment variables are properly set in Vercel
- Test API keys directly using curl or Postman

### Database and Authentication Issues

#### Authentication Fails
**Problem:** Users cannot sign in or authentication errors occur

**Solutions:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that email/password auth is enabled in Supabase settings
- Ensure Row Level Security (RLS) policies are properly configured
- Check Supabase logs for detailed error messages
- Verify CORS settings in Supabase project

#### Database Schema Not Applied
**Problem:** Features requiring database tables don't work

**Solutions:**
- Apply the schema using `supabase/schema.sql` in the SQL Editor
- Verify all tables are created: `conversations`, `messages`, `citations`
- Check that RLS policies are enabled and properly configured
- Test database connectivity via health endpoint

#### Data Export Not Working
**Problem:** Export functionality is disabled or returns errors

**Solutions:**
- Verify `NEXT_PUBLIC_ENABLE_DATA_EXPORT` is set to `true`
- Check that `SUPABASE_SERVICE_ROLE_KEY` is configured for server operations
- Ensure database tables exist and are accessible
- Check browser console for JavaScript errors
- Verify export API endpoints are functioning

### Feature-Specific Issues

#### AI Chat Returns Mock Responses
**Problem:** AI chat returns placeholder responses instead of real AI responses

**Solutions:**
- Verify `GEMINI_API_KEY` is set and valid
- Check that `NEXT_PUBLIC_ENABLE_AI_CHAT` is set to `true`
- Test the API key directly using curl or Postman
- Monitor Gemini API usage dashboard
- Check for rate limiting or quota issues

#### Citation Tracking Not Working
**Problem:** Citations are not being tracked or displayed

**Solutions:**
- Verify `NEXT_PUBLIC_ENABLE_CITATIONS` is set to `true`
- Check that citations table exists in database
- Ensure AI responses include citation metadata
- Verify frontend citation rendering components
- Check browser console for JavaScript errors

#### Brave Search Integration Not Working
**Problem:** Web search functionality is disabled or returns errors

**Solutions:**
- Verify `NEXT_PUBLIC_ENABLE_BRAVE_SEARCH` is set to `true`
- Check that `BRAVE_API_KEY` is valid and active
- Monitor Brave Search API usage dashboard
- Test search API directly
- Implement proper error handling for search failures

### Monitoring and Debugging

#### Using the Health Endpoint
The `/api/health` endpoint provides comprehensive status information:

```json
{
  "status": "ok",
  "config": {
    "supabaseConfigured": true,
    "aiApiConfigured": true
  },
  "features": {
    "authentication": true,
    "aiChat": true,
    "dataExport": true,
    "citations": true,
    "braveSearch": true
  },
  "endpoints": [...]
}
```

**Key indicators:**
- `supabaseConfigured`: `false` means Supabase credentials are missing/invalid
- `aiApiConfigured`: `false` means AI service credentials are missing
- `features`: Shows which features are enabled/disabled
- `endpoints`: Shows status of internal API endpoints

#### Checking Logs
- **Vercel:** Check deployment and runtime logs in Vercel dashboard
- **Supabase:** Check authentication and database logs in Supabase dashboard
- **Browser:** Use browser dev tools to check console errors
- **Network:** Use browser network tab to inspect API requests

#### Testing API Keys Directly
```bash
# Test Gemini API
curl -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_GEMINI_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

# Test Brave Search API
curl "https://api.search.brave.com/res/v1/web/search?q=test&count=10" \
  -H "Accept: application/json" \
  -H "Accept-Encoding: gzip" \
  -H "X-Subscription-Token: YOUR_BRAVE_API_KEY"
```

## Free Tier Limits and Quotas

### Vercel (Hosting)
- **Bandwidth:** 100 GB/month
- **Build Minutes:** 6000 minutes/month (personal), 400 minutes/month (team)
- **Deployments:** Unlimited
- **Preview Deployments:** Unlimited
- **Custom Domains:** Yes
- **SSL Certificates:** Yes (automatic)
- **Serverless Functions:** 100 GB-Hours/month
- **Edge Functions:** 500k invocations/month

### Supabase (Database & Auth)
- **Database Storage:** 500 MB
- **Active Users:** 50,000/month
- **Bandwidth:** 2 GB/month
- **API Calls:** Unlimited
- **Auth Providers:** Email/password and social providers included
- **Realtime Connections:** 100 concurrent connections

### Google Gemini (AI Services)
- **Requests:** 60 requests per minute
- **Models:** Access to Gemini Pro and other models
- **Usage:** Perfect for development and testing
- **Rate Limiting:** Automatic rate limiting enforced
- **Monitoring:** Usage dashboard available

### Brave Search (Web Search)
- **Searches:** 2,000 searches per month
- **Real-time Results:** Up-to-date web search results
- **API Access:** Full API access with JSON responses
- **Rate Limits:** Configurable rate limits
- **Monitoring:** Usage dashboard available

### Cost Optimization Tips

#### Reducing API Usage
- **Caching:** Implement response caching for AI and search results
- **Batching:** Combine multiple requests when possible
- **Rate Limiting:** Implement client-side rate limiting
- **Smart Requests:** Only make API calls when necessary

#### Database Optimization
- **Connection Pooling:** Use Supabase connection pooling
- **Efficient Queries:** Optimize database queries
- **Data Retention:** Implement data cleanup policies
- **Indexing:** Add database indexes for common queries

#### Monitoring Usage
- **Health Endpoint:** Use `/api/health` to monitor configuration
- **Vercel Analytics:** Monitor deployment and usage metrics
- **Supabase Dashboard:** Track database usage and performance
- **API Dashboards:** Monitor Gemini and Brave Search usage

For most small to medium projects, these free tier limits are sufficient. Consider upgrading when approaching limits.

## Continuous Deployment

With Vercel connected to your GitHub repository:

1. **Production Deployments:**
   - Triggered by pushes to `main` branch
   - Accessible at production URL

2. **Preview Deployments:**
   - Triggered by pushes to feature branches or PRs
   - Each gets a unique preview URL
   - Automatically cleaned up when PR is closed

3. **Rollbacks:**
   - Available in Vercel dashboard
   - Can instantly rollback to any previous deployment

## Monitoring and Logs

Access logs and monitoring in the Vercel dashboard:

1. **Deployment Logs:**
   - Click on any deployment
   - View build logs and runtime logs

2. **Runtime Logs:**
   - Real-time logs from your serverless functions
   - Includes API routes and server-side rendering

3. **Analytics (Paid Feature):**
   - Available on paid plans
   - Provides Web Vitals and performance metrics

## Custom Domain (Optional)

To add a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as shown
4. Wait for SSL certificate to be issued (automatic)

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Brave Search API Documentation](https://brave.com/search/api/)
- [Vercel Community](https://vercel.com/community)
- [Supabase Community](https://github.com/supabase/supabase/discussions)

## Next Steps

After successful deployment:

1. ✅ Verify health endpoint returns all features as enabled
2. ✅ Test authentication flow with Supabase
3. ✅ Test AI chat functionality with Gemini
4. ✅ Verify data export works correctly
5. ✅ Test citation tracking in AI responses
6. ✅ Verify Brave Search integration
7. ✅ Test conversation management endpoints
8. ✅ Set up custom domain (optional)
9. ✅ Configure monitoring and alerts
10. ✅ Share preview URLs with your team

## Feature Overview

### AI Chat with Gemini Integration
- **Powered by:** Google Gemini API
- **Features:** Conversational AI with context awareness
- **Citations:** Automatic source citation for verification
- **Rate Limiting:** Respects API quotas (60 requests/minute)
- **Fallback:** Mock responses when API key not configured

### Data Export Functionality
- **Formats:** JSON, CSV, and markdown export options
- **Content:** Includes conversation history, messages, and citations
- **Security:** Server-side processing with authentication
- **Options:** Configurable date ranges and filters
- **Privacy:** User can only export their own conversations

### Citation Tracking System
- **Automatic:** Tracks sources for AI-generated responses
- **Verification:** Links to original web sources when available
- **Display:** Formatted citations with titles and snippets
- **Reliability:** Helps verify AI-generated content accuracy
- **Configurable:** Multiple citation formats available

### Brave Search Integration
- **Real-time:** Up-to-date web search results
- **API-based:** Direct integration with Brave Search API
- **Quota Managed:** Respects monthly limits (2,000 searches/month)
- **Quality:** High-quality search results from Brave's index
- **Fallback:** Graceful handling when quota exceeded

### Authentication & Security
- **Provider:** Supabase Auth with secure session management
- **Methods:** Email/password authentication
- **Security:** Row Level Security (RLS) for data protection
- **Sessions:** Secure session management with automatic refresh
- **Privacy:** User data isolation and protection

### Additional Features
- **Responsive Design:** Works on desktop and mobile devices
- **Dark/Light Theme:** User preference support
- **Offline Support:** Progressive Web App capabilities
- **Health Monitoring:** Comprehensive health check endpoint
- **API Documentation:** Self-documenting API endpoints

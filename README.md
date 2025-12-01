# Workplace Tools

Collection of workplace productivity tools including a Next.js web application.

## Quick Start

Get up and running in minutes:

```bash
cd web
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

**Need detailed setup instructions?** See the [Complete Installation Guide](./docs/docs/getting-started/installation.md)

## 📚 Documentation

Comprehensive documentation is available at:

- **[User Guide](./docs/docs/user-guide/overview.md)** - Features and workflows
- **[Getting Started](./docs/docs/getting-started/quick-start.md)** - Quick start and setup
- **[Tutorials](./docs/docs/tutorials/basic-usage.md)** - Step-by-step guides
- **[Troubleshooting](./docs/docs/support/troubleshooting.md)** - Common issues and solutions
- **[FAQ](./docs/docs/support/faq.md)** - Frequently asked questions
- **[Privacy Policy](./docs/docs/support/privacy-policy.md)** - Data privacy & security
- **[Developer Guide](./docs/docs/development/architecture.md)** - Architecture and development
- **[Full Documentation Site](./docs/)** - Built with Docusaurus

### Building Documentation

To build and view the documentation locally:

```bash
cd docs
npm install
npm run start
```

Documentation will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

This is a monorepo containing:

- **web/** - Next.js web application with Supabase authentication, Tailwind CSS, and offline support
- **docs/** - Comprehensive documentation built with Docusaurus

## Web Application

The Next.js web application is located in the `web/` directory and provides:

- Server-side authentication with Supabase
- Protected dashboard routes
- Offline-ready service worker
- Light/dark theme support
- Health check endpoint at `/api/health`

### Prerequisites

- Node.js 20+
- Supabase project (optional - defaults to placeholders)

### Local Development

1. Navigate to the web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure Supabase environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000)

## Vercel Deployment

### Deploy to Vercel

This project is configured for easy deployment to Vercel's free tier.

#### Prerequisites

- Vercel account (free tier)
- GitHub repository connected to Vercel

#### Deployment Steps

1. **Import the project to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure the project:**
   - Framework Preset: **Next.js**
   - Root Directory: **web** (automatically detected via `vercel.json`)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

3. **Set environment variables** (optional):
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

   Note: The app will work with placeholder values if these are not set.

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - Preview deployments are automatically created for all pull requests

#### Environment Variables

| Variable | Description | Required | Source |
|----------|-------------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL from project settings | No (defaults to placeholder) | [Supabase Dashboard](https://app.supabase.com) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key from project settings | No (defaults to placeholder) | [Supabase Dashboard](https://app.supabase.com) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server operations | No (defaults to placeholder) | [Supabase Dashboard](https://app.supabase.com) |
| `GEMINI_API_KEY` | Google Gemini API key for AI chat functionality | No (mock responses if not set) | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `BRAVE_API_KEY` | Brave Search API key for web search integration | No (search disabled if not set) | [Brave Search API](https://brave.com/search/api/) |
| `NEXT_PUBLIC_API_URL` | Base URL for external AI assistant API endpoints | No (defaults to `http://localhost:8000`) | Custom backend URL |
| `NEXT_PUBLIC_ENABLE_AI_CHAT` | Enable/disable AI chat features | No (defaults to `true`) | Feature flag |
| `NEXT_PUBLIC_ENABLE_DATA_EXPORT` | Enable/disable conversation export functionality | No (defaults to `true`) | Feature flag |
| `NEXT_PUBLIC_ENABLE_CITATIONS` | Enable/disable citation tracking | No (defaults to `true`) | Feature flag |
| `NEXT_PUBLIC_ENABLE_BRAVE_SEARCH` | Enable/disable Brave Search integration | No (defaults to `true`) | Feature flag |

### Getting API Keys from Free Tiers

#### Supabase (Free Tier)
1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Create a new project
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** and **anon/public key**
5. For service role key, go to **Settings** → **API** → **Project API keys** → **service_role** (keep this secret!)

#### Google Gemini (Free Tier)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key (60 requests per minute on free tier)

#### Brave Search (Free Tier)
1. Go to [Brave Search API](https://brave.com/search/api/)
2. Sign up for a free account
3. Generate an API key
4. Copy your API key (2,000 searches per month on free tier)

#### Vercel Configuration

The repository includes a `vercel.json` configuration file at the root that:
- Sets the correct root directory to `web/`
- Configures the build commands for the monorepo structure
- Enables automatic preview deployments for pull requests

#### Database Setup

If you're using Supabase for data persistence:

1. **Apply Database Schema:**
   ```bash
   # Navigate to your Supabase project dashboard
   # Go to SQL Editor → New query
   # Copy and paste the contents of supabase/schema.sql
   # Execute the schema to create required tables
   ```

2. **Verify Table Creation:**
   - Go to **Table Editor** in Supabase dashboard
   - Verify tables like `conversations`, `messages`, `citations` are created
   - Check that Row Level Security (RLS) policies are properly configured

#### Local Development with AI Chat

To run the chat functionality locally:

1. **Start the Development Server:**
   ```bash
   cd web
   npm install
   npm run dev
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Test API Endpoints:**
   
   **Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   
   **AI Models:**
   ```bash
   curl http://localhost:3000/api/ai/models
   ```
   
   **Conversation Endpoints (when implemented):**
   ```bash
   # Create conversation
   curl -X POST http://localhost:3000/api/conversations \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Chat"}'
   
   # Export conversation data
   curl http://localhost:3000/api/conversations/{id}/export
   ```

#### Health Check Response

After deployment, verify the build succeeded by visiting:
```
https://your-deployment-url.vercel.app/api/health
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
    "aiApiConfigured": false,
    "aiApiUrl": "http://localhost:8000",
    "url": "https://your-deployment-url.vercel.app"
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

#### Preview Deployments

Vercel automatically creates preview deployments for:
- Every pull request
- Every push to non-production branches

Each preview deployment gets a unique URL that you can share for testing.

### Deployment URLs

- **Production:** Will be assigned after first deployment to main branch
- **Preview:** Automatically generated for each PR (format: `project-name-git-branch-username.vercel.app`)

## Development Scripts

From the `web/` directory:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run test` | Run lint and typecheck |

## Architecture

- **Framework:** Next.js 15+ (App Router)
- **Styling:** Tailwind CSS v4
- **Authentication:** Supabase Auth
- **State Management:** Zustand + TanStack Query
- **Theme:** next-themes (light/dark mode)
- **Offline:** Progressive service worker

## Release Information

- **Current Version:** 1.0.0
- **Release Date:** November 2024
- **Changelog:** See [CHANGELOG.md](./CHANGELOG.md)
- **Release Checklist:** See [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)

## Contributing

Contributions are welcome! Please ensure:
- All tests pass: `npm test`
- Code is properly formatted
- Documentation is updated
- CHANGELOG.md is updated

## Troubleshooting

### API Key Issues

#### Gemini API Quota Exceeded
- **Problem:** Receiving 429 or quota exceeded errors from Gemini
- **Solution:** 
  - Free tier allows 60 requests per minute
  - Implement rate limiting in your application
  - Consider upgrading to paid tier for higher limits
  - Use caching to reduce API calls

#### Brave Search API Quota Exceeded
- **Problem:** Search functionality stops working
- **Solution:**
  - Free tier includes 2,000 searches per month
  - Monitor usage in your Brave Search dashboard
  - Implement search result caching
  - Consider upgrading to paid tier if needed

### Supabase Connection Issues

#### Authentication Fails
- **Problem:** Users cannot sign in or authentication errors occur
- **Solution:**
  - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
  - Check that email/password auth is enabled in Supabase settings
  - Ensure Row Level Security (RLS) policies are properly configured
  - Check Supabase logs for detailed error messages

#### Database Schema Not Applied
- **Problem:** Features requiring database tables don't work
- **Solution:**
  - Apply the schema using `supabase/schema.sql` in the SQL Editor
  - Verify all tables are created: `conversations`, `messages`, `citations`
  - Check that RLS policies are enabled and properly configured

### Deployment Issues

#### Build Fails on Vercel
- **Problem:** Deployment fails during build process
- **Solution:**
  - Check build logs in Vercel dashboard for specific errors
  - Ensure all dependencies are in `web/package.json`
  - Verify TypeScript compilation: `npm run typecheck`
  - Check for missing environment variables

#### Environment Variables Not Working
- **Problem:** App runs but features don't work as expected
- **Solution:**
  - Ensure variables are set in Vercel dashboard with correct names
  - Variables must be prefixed with `NEXT_PUBLIC_` for client-side access
  - Redeploy after adding/changing environment variables
  - Use `/api/health` endpoint to verify configuration

### Feature-Specific Issues

#### AI Chat Not Working
- **Problem:** AI chat returns mock responses instead of real AI responses
- **Solution:**
  - Verify `GEMINI_API_KEY` is set and valid
  - Check that `NEXT_PUBLIC_ENABLE_AI_CHAT` is set to `true`
  - Test the API key directly using curl or Postman
  - Monitor Gemini API usage dashboard

#### Data Export Not Working
- **Problem:** Export functionality is disabled or returns errors
- **Solution:**
  - Verify `NEXT_PUBLIC_ENABLE_DATA_EXPORT` is set to `true`
  - Check that `SUPABASE_SERVICE_ROLE_KEY` is configured for server operations
  - Ensure database tables exist and are accessible
  - Check browser console for JavaScript errors

#### Citation Tracking Not Working
- **Problem:** Citations are not being tracked or displayed
- **Solution:**
  - Verify `NEXT_PUBLIC_ENABLE_CITATIONS` is set to `true`
  - Check that citations table exists in database
  - Ensure AI responses include citation metadata
  - Verify frontend citation rendering components

## Support

- 📖 **Documentation:** See [docs/](./docs/)
- 🐛 **Bug Reports:** [GitHub Issues](https://github.com/workplace-tools/repository/issues)
- 💬 **Questions:** [GitHub Discussions](https://github.com/workplace-tools/repository/discussions)
- 📧 **Email:** support@workplace-tools.example.com

## License

Private workplace tools repository.

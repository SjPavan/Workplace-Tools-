# Vercel Quick Setup Guide

## 🚀 Deploy to Vercel in 5 Minutes

### Step 1: Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository: `Workplace-Tools-`
3. Vercel will auto-detect the Next.js framework

### Step 2: Project Configuration

The project is pre-configured via `vercel.json`. Vercel will automatically use:

- **Framework:** Next.js
- **Root Directory:** `web/`
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

✅ No manual configuration needed!

### Step 3: Environment Variables (Required for Full Features)

Add these in Vercel Dashboard → Settings → Environment Variables:

#### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### AI Service Configuration
```
GEMINI_API_KEY=your-gemini-api-key-here
BRAVE_API_KEY=your-brave-search-api-key-here
```

#### Feature Flags
```
NEXT_PUBLIC_ENABLE_AI_CHAT=true
NEXT_PUBLIC_ENABLE_DATA_EXPORT=true
NEXT_PUBLIC_ENABLE_CITATIONS=true
NEXT_PUBLIC_ENABLE_BRAVE_SEARCH=true
```

#### Optional Configuration
```
NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

**Getting API Keys:**
- **Supabase:** https://app.supabase.com → Your Project → Settings → API
- **Gemini:** https://makersuite.google.com/app/apikey (free: 60 requests/minute)
- **Brave Search:** https://brave.com/search/api/ (free: 2,000 searches/month)

**Important:** Mark secret keys (without `NEXT_PUBLIC_` prefix) as "secret" in Vercel.

### Step 4: Deploy

Click **Deploy** button and wait ~1-2 minutes.

### Step 5: Verify Deployment

Visit your deployment URL and check health:
```
https://your-project.vercel.app/api/health
```

Should return:
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
    "url": "https://your-project.vercel.app"
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

### Step 6: Setup Database (Required for Full Features)

1. **Apply Schema:**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** → **New query**
   - Copy and paste the contents of `supabase/schema.sql`
   - Execute to create required tables

2. **Test Features:**
   - Visit your app URL and try signing in
   - Test AI chat functionality
   - Verify data export works
   - Check citation tracking

### Step 7: Test API Endpoints

After deployment, test these endpoints:
- `GET /api/health` - Health check
- `GET /api/ai/models` - Available AI models
- `GET /api/auth/me` - Authentication status
- `POST /api/ai/complete` - AI chat completion
- `GET /api/conversations` - List conversations (when implemented)
- `GET /api/conversations/{id}/export` - Export data (when implemented)

## ✨ Preview Deployments

Every pull request automatically gets a preview deployment URL:
```
https://project-name-git-branch-username.vercel.app
```

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete documentation.

## 🎯 What's Deployed

- **Frontend:** Next.js 15+ App Router
- **Styling:** Tailwind CSS v4
- **Auth:** Supabase with secure session management
- **AI Services:** Google Gemini + Brave Search integration
- **Features:**
  - Server-side authentication
  - AI-powered chat with citations
  - Data export functionality
  - Web search integration
  - Protected dashboard
  - Health check endpoint
  - Offline PWA support
  - Light/dark theme

## 🆓 Free Tier Limits

### Vercel (Hosting)
- 100 GB bandwidth/month
- Unlimited deployments
- Unlimited preview URLs
- SSL certificates included
- Custom domains supported

### Supabase (Database/Auth)
- 500 MB database storage
- 50,000 active users/month
- 2 GB bandwidth/month
- Unlimited API calls

### Google Gemini (AI)
- 60 requests per minute
- Free tier for development/testing
- Rate limited automatically

### Brave Search (Web Search)
- 2,000 searches per month
- Real-time web search results
- API-based integration

Perfect for most projects!

## 🔧 Local Development

```bash
cd web
npm install
npm run dev
```

Visit http://localhost:3000

## ❓ Need Help?

- Full guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Vercel docs: https://vercel.com/docs
- Supabase docs: https://supabase.com/docs
- Gemini API docs: https://ai.google.dev/docs
- Brave Search API docs: https://brave.com/search/api/
- Project README: [README.md](./README.md)

## 🔧 Troubleshooting

### API Key Issues
- **Gemini:** Check quota at Google AI Studio (60 requests/minute free)
- **Brave Search:** Monitor usage at Brave Search API dashboard (2,000 searches/month free)
- **Supabase:** Verify keys in project settings, check RLS policies

### Deployment Issues
- Check Vercel build logs for errors
- Verify all environment variables are set
- Ensure `vercel.json` is in repository root
- Redeploy after adding/changing environment variables

### Feature Not Working
- Verify feature flags are enabled
- Check `/api/health` endpoint for configuration status
- Ensure database schema is applied
- Test API endpoints individually

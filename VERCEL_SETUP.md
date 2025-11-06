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

### Step 3: Environment Variables (Optional)

Add these in Vercel Dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

**Note:** App works with placeholders if not set. Get real values from:
https://app.supabase.com → Your Project → Settings → API. The `NEXT_PUBLIC_API_URL`
can remain pointed at `http://localhost:8000` unless you have a hosted backend for the
AI assistant.

### Step 4: Deploy

Click **Deploy** button and wait ~1-2 minutes.

### Step 5: Verify

Visit your deployment URL and check health:
```
https://your-project.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "app": {
    "name": "Workplace Tools Web",
    "version": "0.1.0"
  }
}
```

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
- **Auth:** Supabase (optional)
- **Features:**
  - Server-side authentication
  - Protected dashboard
  - Health check endpoint
  - Offline PWA support
  - Light/dark theme

## 🆓 Free Tier Limits

- 100 GB bandwidth/month
- Unlimited deployments
- Unlimited preview URLs
- SSL certificates included
- Custom domains supported

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
- Project README: [README.md](./README.md)

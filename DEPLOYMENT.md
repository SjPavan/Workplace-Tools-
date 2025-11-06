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

3. **Set Environment Variables (Optional):**
   
   Navigate to "Environment Variables" and add:
   
   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | All |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | All |

   **Note:** The app will work with placeholder values if these are not set. Authentication features will be limited without real Supabase credentials.

4. **Deploy:**
   - Click "Deploy"
   - Wait for the build to complete (typically 1-2 minutes)
   - Your app will be available at `https://your-project.vercel.app`

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

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API → Project API keys (anon/public) |

### Getting Supabase Credentials

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project or select an existing one
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key
5. Add these to Vercel environment variables

### Setting Environment Variables in Vercel

#### Via Dashboard:
1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://your-project.supabase.co`
   - Environment: Select all (Production, Preview, Development)
4. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Redeploy for changes to take effect

#### Via CLI:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

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

## Health Check

After deployment, verify the application is running:

```bash
curl https://your-project.vercel.app/api/health
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
    "url": "https://your-project.vercel.app"
  }
}
```

The `supabaseConfigured` field indicates whether Supabase environment variables are set:
- `true`: Real Supabase credentials configured
- `false`: Using placeholder values

## Deployment Checklist

- [ ] Repository connected to Vercel
- [ ] Project created with correct framework (Next.js)
- [ ] Root directory set to `web` (auto-configured)
- [ ] Environment variables added (optional but recommended)
- [ ] First deployment successful
- [ ] Health endpoint returns 200 OK
- [ ] Preview deployments enabled (automatic)
- [ ] Custom domain configured (optional)

## Common Issues

### Build Fails

**Problem:** Build fails with module not found errors

**Solution:** Ensure all dependencies are in `web/package.json` and committed to the repository

### Environment Variables Not Working

**Problem:** App runs but Supabase features don't work

**Solution:** 
1. Check environment variables are set in Vercel dashboard
2. Ensure variables are prefixed with `NEXT_PUBLIC_`
3. Redeploy after adding environment variables

### Health Check Returns 500

**Problem:** Health endpoint returns error

**Solution:** Check build logs in Vercel dashboard for specific errors

## Free Tier Limits

Vercel's free tier includes:
- **Bandwidth:** 100 GB/month
- **Build Minutes:** 6000 minutes/month (personal), 400 minutes/month (team)
- **Deployments:** Unlimited
- **Preview Deployments:** Unlimited
- **Custom Domains:** Yes
- **SSL Certificates:** Yes (automatic)
- **Serverless Functions:** 100 GB-Hours/month
- **Edge Functions:** 500k invocations/month

For most small to medium projects, these limits are sufficient.

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
- [Vercel Community](https://vercel.com/community)

## Next Steps

After successful deployment:

1. ✅ Verify health endpoint
2. ✅ Test authentication flow (if Supabase configured)
3. ✅ Set up custom domain (optional)
4. ✅ Configure monitoring and alerts
5. ✅ Share preview URLs with your team

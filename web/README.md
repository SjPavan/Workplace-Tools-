# Web application scaffold

This project is a Next.js App Router application preconfigured with Supabase authentication, Tailwind CSS, TanStack Query, Zustand state management, theming, and an offline-ready service worker. It lives inside the `web/` directory of the monorepo and is ready to deploy to Vercel.

## Prerequisites

- Node.js 20+
- A Supabase project with an email/password authentication provider enabled

## Getting started

1. Copy the example environment file and supply your Supabase credentials:

   ```bash
   cd web
   cp .env.example .env.local
   # populate NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

3. Visit [http://localhost:3000](http://localhost:3000) and sign in with a Supabase user account. Successful authentication redirects you to the protected dashboard.

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
4. Set environment variables (optional):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy! Preview deployments are automatically created for PRs

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
    "url": "https://your-app.vercel.app"
  }
}
```

### Environment Variables

The app supports the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No (defaults to placeholder) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | No (defaults to placeholder) |

The app will boot and run with placeholder values, but authentication features will not work until real Supabase credentials are configured.

## Continuous Integration

- GitHub Actions workflow (`.github/workflows/ci.yml`) installs dependencies, runs tests (lint + typecheck), and builds the app on every push and pull request.

For further customization, extend the dashboard and query Supabase tables inside the protected routes.

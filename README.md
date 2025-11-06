# Workplace Tools

Collection of workplace productivity tools including a Next.js web application.

## Project Structure

This is a monorepo containing:

- **web/** - Next.js web application with Supabase authentication, Tailwind CSS, and offline support

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

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL from project settings | No (defaults to placeholder) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key from project settings | No (defaults to placeholder) |
| `NEXT_PUBLIC_API_URL` | Base URL for the AI assistant API endpoints | No (defaults to `http://localhost:8000`) |

To get these values:
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy the Project URL and anon/public key

#### Vercel Configuration

The repository includes a `vercel.json` configuration file at the root that:
- Sets the correct root directory to `web/`
- Configures the build commands for the monorepo structure
- Enables automatic preview deployments for pull requests

#### Health Check

After deployment, verify the build succeeded by visiting:
```
https://your-deployment-url.vercel.app/api/health
```

This should return a 200 OK response with:
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

## License

Private workplace tools repository.

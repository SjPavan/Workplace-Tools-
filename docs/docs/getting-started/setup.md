---
sidebar_position: 3
title: Setup & Configuration
---

# Setup & Configuration

Complete configuration guide for Workplace Tools after installation.

## Initial Configuration

### Environment Variables

After installation, configure the application by setting environment variables:

```bash
cd web
cp .env.example .env.local
```

### Available Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Placeholder | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Placeholder | No |
| `NEXT_PUBLIC_API_URL` | API backend URL | `http://localhost:8000` | No |

### Example Configuration

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Supabase Configuration

### Creating a Supabase Project

1. **Sign up/Login** to [supabase.com](https://supabase.com)

2. **Create new organization** (if needed)
   - Choose organization name
   - Accept terms

3. **Create project**
   - Click "New project"
   - Select organization
   - Project name: `workplace-tools`
   - Database password: Choose a strong password
   - Region: Select closest region
   - Click "Create new project"

### Setting Up Authentication

1. **Navigate to Authentication**
   - Go to Authentication in sidebar
   - Click "Providers"

2. **Enable Email Provider**
   - Ensure "Email" is enabled
   - Under "Email Auth", confirm settings:
     - Auto Confirm: Off (for production) or On (for testing)
     - Confirm Email: Enabled

3. **Test Email Configuration** (Optional)
   - Go to SQL Editor
   - View `auth.users` table
   - Add test user if needed

### Getting API Credentials

1. **Navigate to Settings**
   - Click "Settings" in sidebar
   - Select "API"

2. **Copy credentials**:
   - **Project URL**: Copy the URL under "Project URL"
   - **Anon Key**: Copy the public "anon/public" key

3. **Update `.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Database Setup (Optional)

For advanced features, you may need to configure database tables:

### Creating Tables

1. **Go to SQL Editor** in Supabase
2. **Run migration scripts** or create tables manually

Example table structure:
```sql
-- Create a sample table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Row Level Security (RLS)

1. **Navigate to Authentication → Policies**
2. **Enable RLS** on tables
3. **Create policies** for data access control

Example policy:
```sql
-- Allow users to read own data
CREATE POLICY "Allow users to read own data"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);
```

## Deployment Configuration

### Local Production Build

```bash
# Create production build
npm run build

# Start production server
npm run start
```

Visit [http://localhost:3000](http://localhost:3000)

### Vercel Deployment

1. **Push to GitHub**:
```bash
git add .
git commit -m "Configure workplace tools"
git push origin main
```

2. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select `web` as root directory

3. **Configure environment variables** in Vercel:
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Add `NEXT_PUBLIC_API_URL` (if needed)

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

5. **Verify deployment**:
```bash
curl https://your-app.vercel.app/api/health
```

### Docker Deployment

1. **Build Docker image**:
```bash
docker build -t workplace-tools:latest .
```

2. **Run container**:
```bash
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  --name workplace-tools \
  workplace-tools:latest
```

3. **View logs**:
```bash
docker logs -f workplace-tools
```

## SSL/TLS Configuration

For production deployments with custom domains:

### Vercel (Automatic)
- SSL certificates are automatically provisioned for all Vercel domains
- No additional configuration needed

### Self-Hosted
- Use nginx with Let's Encrypt
- Configure reverse proxy
- Enable HSTS headers

## Performance Tuning

### Caching

Enable efficient caching in production:

```bash
# In .env.local or deployment environment
NEXT_PUBLIC_CACHE_CONTROL="public, max-age=3600"
```

### Database Connection Pooling

For Supabase:
- Use connection pooling for better performance
- Configure in Supabase settings

## Monitoring

### Health Check Endpoint

```bash
curl -s https://your-app.vercel.app/api/health | jq
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "app": {
    "name": "Workplace Tools Web",
    "version": "0.1.0",
    "environment": "production"
  },
  "config": {
    "supabaseConfigured": true,
    "aiApiConfigured": false,
    "url": "https://your-app.vercel.app"
  }
}
```

## Troubleshooting Configuration

### Authentication not working

1. Check `.env.local` has correct Supabase URL and key
2. Verify email provider is enabled in Supabase
3. Check browser console for errors
4. Restart development server

### Database connection errors

1. Verify Supabase project is active
2. Check network connectivity
3. Verify RLS policies are correct
4. Check database connection limits

### Deployment fails

1. Review Vercel build logs
2. Check environment variables are set
3. Verify Node.js version compatibility
4. Check for missing dependencies

---

**Need help?** Check our [Troubleshooting Guide](../support/troubleshooting)

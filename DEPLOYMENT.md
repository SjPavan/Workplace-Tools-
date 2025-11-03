# Deployment Setup Guide

This guide covers setting up development deployments for the Workplace Tools project with Supabase, Render, and Vercel.

## Prerequisites

- GitHub repository with this code
- Supabase account
- Render account
- Vercel account
- AI provider API keys (OpenAI, Anthropic, etc.)

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down:
   - Project URL
   - Anon key
   - Service role key
   - JWT secret (found in Settings > API)

### Database Setup
1. Go to SQL Editor in Supabase dashboard
2. Run the migration script from `supabase/migrations/001_initial_schema.sql`
3. Verify tables were created correctly

### Authentication Setup
1. Go to Authentication > Settings
2. Configure providers (Google, GitHub, etc.) as needed
3. Set up redirect URLs for your domains

## 2. Backend Deployment (Render)

### Manual Setup
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure:
   - Root Directory: `backend`
   - Build Command: `pip install poetry && poetry install --no-dev`
   - Start Command: `poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path: `/health`

### Environment Variables
Set these environment variables in Render:
- `ENVIRONMENT=production`
- `SUPABASE_URL=your_supabase_url`
- `SUPABASE_ANON_KEY=your_supabase_anon_key`
- `SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key`
- `SUPABASE_JWT_SECRET=your_supabase_jwt_secret`
- `DATABASE_URL=your_supabase_database_url`
- `OPENAI_API_KEY=your_openai_api_key`
- `ANTHROPIC_API_KEY=your_anthropic_api_key`
- `GOOGLE_AI_API_KEY=your_google_ai_api_key`
- `CORS_ORIGINS=https://your-web-app-domain.vercel.app`

## 3. Frontend Deployment (Vercel)

### Manual Setup
1. Connect your GitHub repository to Vercel
2. Configure:
   - Root Directory: `web`
   - Framework Preset: Next.js
   - Build Command: `npm install && npm run build`
   - Output Directory: `.next`

### Environment Variables
Set these environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`
- `NEXT_PUBLIC_API_URL=your_render_backend_url`
- `NEXT_PUBLIC_APP_NAME=Workplace Tools`

## 4. GitHub Actions Setup

### Required Secrets
Add these secrets to your GitHub repository:
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### Workflow Features
- Automatic preview deployments on PR
- Tests before deployment
- PR comments with preview URLs
- Production deployments on main branch merge

## 5. Smoke Testing

### Health Endpoints
- Backend: `https://your-backend-url.onrender.com/health`
- Frontend: `https://your-app-url.vercel.app`

### AI Endpoint Testing
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test!"}' \
  https://your-backend-url.onrender.com/api/ai/complete
```

## 6. Development Setup

### Local Development
1. Clone the repository
2. Set up Supabase project and update environment files
3. Backend:
   ```bash
   cd backend
   cp .env.example .env
   # Update .env with your Supabase credentials
   poetry install
   poetry run uvicorn app.main:app --reload
   ```

4. Frontend:
   ```bash
   cd web
   cp .env.local.example .env.local
   # Update .env.local with your configuration
   npm install
   npm run dev
   ```

## 7. Monitoring and Maintenance

### Monitoring
- Render provides built-in metrics and logs
- Vercel provides analytics and performance metrics
- Supabase provides database monitoring

### Backups
- Supabase includes automatic database backups
- Consider additional backup strategies for critical data

## 8. Security Considerations

- All API keys should be stored as environment variables
- Enable Row Level Security (RLS) in Supabase
- Use HTTPS in production
- Regularly update dependencies
- Monitor API usage and set appropriate rate limits

## 9. Troubleshooting

### Common Issues
1. **CORS errors**: Update CORS origins in backend configuration
2. **Database connection**: Verify Supabase credentials and network access
3. **Build failures**: Check logs for missing dependencies or configuration errors
4. **Authentication issues**: Verify JWT secret matches between Supabase and backend

### Debug Commands
```bash
# Check backend health
curl https://your-backend-url.onrender.com/health

# Check API routes
curl https://your-backend-url.onrender.com/docs

# Test database connection
# Check Supabase logs for connection errors
```

## 10. Next Steps

1. Implement actual AI provider integrations
2. Add comprehensive error handling
3. Set up monitoring and alerting
4. Add integration tests
5. Implement caching strategies
6. Set up CDN for static assets
7. Add internationalization support
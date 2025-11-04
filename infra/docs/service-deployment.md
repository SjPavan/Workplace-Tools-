# Service Deployment Guide

This guide provides detailed instructions for deploying each service in the Workplace Tools infrastructure.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Backend Deployment (Render)](#backend-deployment-render)
- [Worker Deployment (Railway)](#worker-deployment-railway)
- [Web Deployment (Vercel)](#web-deployment-vercel)
- [Mobile Deployment (EAS)](#mobile-deployment-eas)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying any service, ensure you have:

1. **Required CLI Tools:**
   ```bash
   # Install all required CLIs
   npm install -g @render/cli @railway/cli vercel @expo/eas-cli
   
   # Install Terraform
   curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
   sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
   sudo apt-get update && sudo apt-get install terraform
   
   # Install Supabase CLI
   curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
   sudo mv supabase /usr/local/bin/
   ```

2. **Environment Configuration:**
   ```bash
   # Copy and configure environment files
   cp infra/config/environments/.env.template infra/config/environments/.env.local
   cp infra/config/secrets/secrets.template.yaml infra/config/secrets/secrets.yaml
   
   # Edit the files with your actual values
   nano infra/config/environments/.env.local
   nano infra/config/secrets/secrets.yaml
   ```

3. **Authentication:**
   ```bash
   # Login to all services
   render login
   railway login
   vercel login
   eas login
   supabase login
   ```

## Backend Deployment (Render)

### Manual Deployment

1. **Prepare Backend:**
   ```bash
   cd backend
   # Ensure Dockerfile exists and is properly configured
   ls -la Dockerfile
   ```

2. **Configure Render Service:**
   ```bash
   # Create render.yaml if it doesn't exist
   cat > render.yaml << EOF
   services:
     - type: web
       name: backend-dev
       env: docker
       dockerfilePath: ./backend/Dockerfile
       dockerContext: ./backend
       healthCheckPath: /health
       envVars:
         - key: NODE_ENV
           value: dev
         - key: SUPABASE_PROJECT_ID
           sync: false
         - key: SUPABASE_API_URL
           sync: false
   EOF
   ```

3. **Deploy:**
   ```bash
   # Deploy using Render CLI
   render deploy --env dev
   
   # Or using the deployment script
   ./infra/scripts/deploy/backend.sh --environment dev
   ```

### Automated Deployment

```bash
# Deploy all services (includes backend)
./infra/scripts/deploy-all.sh --environment dev

# Deploy only backend
./infra/scripts/deploy/backend.sh --environment dev
```

### Configuration Requirements

**Required Environment Variables:**
- `SUPABASE_PROJECT_ID`
- `SUPABASE_API_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

**Optional Variables:**
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `REDIS_URL`

### Health Checks

The backend should implement:
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health status
- `GET /metrics` - Application metrics

## Worker Deployment (Railway)

### Manual Deployment

1. **Prepare Worker:**
   ```bash
   cd worker
   # Ensure requirements.txt and main.py exist
   ls -la requirements.txt main.py
   ```

2. **Configure Railway Service:**
   ```bash
   # Create railway.toml
   cat > railway.toml << EOF
   [build]
   builder = "nixpacks"
   
   [[services]]
   name = "worker-dev"
   source = "."
   
   [services.variables]
   NODE_ENV = "dev"
   WORKER_MODE = "true"
   SUPABASE_PROJECT_ID = "\${SUPABASE_PROJECT_ID}"
   EOF
   ```

3. **Deploy:**
   ```bash
   # Deploy using Railway CLI
   railway up --service worker-dev
   
   # Or using the deployment script
   ./infra/scripts/deploy/worker.sh --environment dev
   ```

### Cron Jobs Configuration

Railway supports cron jobs through the `railway.toml`:

```toml
[[services.cron]]
schedule = "0 */6 * * *"  # Every 6 hours
command = "python -m worker.scraper"

[[services.cron]]
schedule = "0 2 * * *"    # Daily at 2 AM
command = "python -m worker.cleanup"
```

### Configuration Requirements

**Required Environment Variables:**
- `SUPABASE_PROJECT_ID`
- `SUPABASE_API_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WORKER_MODE`

**Optional Variables:**
- `CHROME_BIN` (for web scraping)
- `REDIS_URL`

## Web Deployment (Vercel)

### Manual Deployment

1. **Prepare Web Application:**
   ```bash
   cd web
   # Install dependencies
   npm install
   
   # Test build locally
   npm run build
   ```

2. **Configure Vercel:**
   ```bash
   # Create vercel.json
   cat > vercel.json << EOF
   {
     "version": 2,
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "env": {
       "NEXT_PUBLIC_SUPABASE_PROJECT_ID": "@supabase-project-id",
       "NEXT_PUBLIC_SUPABASE_API_URL": "@supabase-api-url",
       "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
     }
   }
   EOF
   ```

3. **Deploy:**
   ```bash
   # Deploy using Vercel CLI
   vercel --prod
   
   # Or using the deployment script
   ./infra/scripts/deploy/web.sh --environment dev
   ```

### Environment Variables Setup

```bash
# Set environment variables in Vercel
vercel env add NEXT_PUBLIC_SUPABASE_PROJECT_ID dev
vercel env add NEXT_PUBLIC_SUPABASE_API_URL dev
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY dev
vercel env add SUPABASE_SERVICE_ROLE_KEY dev
```

### Configuration Requirements

**Required Environment Variables:**
- `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_API_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Optional Variables:**
- `NEXT_PUBLIC_ENVIRONMENT`
- `NEXT_PUBLIC_API_URL`

## Mobile Deployment (EAS)

### Manual Deployment

1. **Prepare Mobile App:**
   ```bash
   cd mobile
   # Install dependencies
   npm install
   
   # Test build locally
   eas build --profile development --platform android
   ```

2. **Configure EAS:**
   ```bash
   # Create eas.json
   cat > eas.json << EOF
   {
     "cli": { "version": ">= 3.0.0" },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal"
       },
       "production": {
         "ios": { "resourceClass": "m-medium" },
         "android": { "resourceClass": "medium" }
       }
     }
   }
   EOF
   ```

3. **Deploy:**
   ```bash
   # Build for development
   eas build --profile development --platform all
   
   # Build for production
   eas build --profile production --platform all
   
   # Submit to app stores
   eas submit --profile production --platform all
   
   # Or using the deployment script
   ./infra/scripts/deploy/mobile.sh --environment dev
   ```

### Configuration Requirements

**Required Environment Variables:**
- `EXPO_PUBLIC_SUPABASE_PROJECT_ID`
- `EXPO_PUBLIC_SUPABASE_API_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Optional Variables:**
- `EXPO_PUBLIC_ENVIRONMENT`

## Database Setup (Supabase)

### Infrastructure Setup

1. **Initialize Supabase:**
   ```bash
   # Initialize Supabase project
   supabase init
   
   # Link to existing project
   supabase link --project-ref your-project-id
   ```

2. **Apply Migrations:**
   ```bash
   # Apply database schema
   supabase db push
   
   # Or apply specific migration
   supabase migration up 001_initial_schema
   ```

3. **Generate Types:**
   ```bash
   # Generate TypeScript types
   supabase gen types typescript --local > types/supabase.ts
   ```

### Terraform Setup

```bash
cd infra/terraform

# Initialize Terraform
terraform init

# Plan and apply
terraform plan -var="environment=dev"
terraform apply -var="environment=dev"

# Get outputs
terraform output
```

### Configuration Requirements

**Required Environment Variables:**
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

## Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Check build logs
   render logs backend-dev
   railway logs worker-dev
   vercel logs
   
   # Test locally first
   docker build -t test ./backend
   docker run -p 8000:8000 test
   ```

2. **Environment Variable Issues:**
   ```bash
   # Verify environment variables
   ./infra/scripts/validation/dry-run.sh --environment dev
   
   # Check service-specific variables
   vercel env ls
   railway variables
   ```

3. **Database Connection Issues:**
   ```bash
   # Test database connection
   supabase db ping
   
   # Check connection string
   psql "$DATABASE_URL"
   ```

4. **Deployment Script Issues:**
   ```bash
   # Debug script execution
   bash -x ./infra/scripts/deploy/backend.sh --environment dev
   
   # Check script permissions
   chmod +x infra/scripts/deploy/*.sh
   ```

### Health Checks

```bash
# Run comprehensive health checks
./infra/scripts/monitoring/health-check.sh

# Check specific service
curl https://api-dev.yourdomain.com/health
curl https://dev.yourdomain.com/api/health
```

### Logs and Monitoring

```bash
# View logs from all services
./infra/scripts/monitoring/logs.sh --environment dev

# View specific service logs
./infra/scripts/monitoring/logs.sh --service backend --environment dev
```

### Getting Help

1. **Check Documentation:**
   - [Render Documentation](https://render.com/docs)
   - [Railway Documentation](https://docs.railway.app/)
   - [Vercel Documentation](https://vercel.com/docs)
   - [EAS Documentation](https://docs.expo.dev/build/introduction/)
   - [Supabase Documentation](https://supabase.com/docs)

2. **Community Support:**
   - GitHub Issues for deployment scripts
   - Discord/Slack communities for respective platforms

3. **Debug Mode:**
   ```bash
   # Enable debug logging
   export DEBUG=true
   export LOG_LEVEL=debug
   
   # Run with verbose output
   ./infra/scripts/deploy-all.sh --environment dev --verbose
   ```

## Best Practices

1. **Always test locally before deploying**
2. **Use environment-specific configurations**
3. **Implement proper health checks**
4. **Monitor deployment logs**
5. **Use dry-run validation before deployment**
6. **Keep secrets secure and rotated**
7. **Implement proper error handling**
8. **Use infrastructure as code for consistency**

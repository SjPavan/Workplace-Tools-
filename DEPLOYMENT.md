# Deployment Automation for Workplace Tools

This document provides a comprehensive guide for deploying the Workplace Tools infrastructure using automated scripts and Infrastructure as Code (IaC).

## 🚀 Quick Start

### Prerequisites

1. **Required Tools:**
   ```bash
   # Install required CLIs
   npm install -g @render/cli @railway/cli vercel @expo/eas-cli
   curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
   sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
   sudo apt-get update && sudo apt-get install terraform
   curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
   sudo mv supabase /usr/local/bin/
   ```

2. **Clone and Setup:**
   ```bash
   git clone <repository-url>
   cd workplace-tools
   git checkout feat/deploy-automation-render-railway-supabase-vercel-eas-iac-secrets-cron
   
   # Run initial setup
   ./infra/scripts/setup.sh
   ```

3. **Configure Environment:**
   ```bash
   # Edit environment configuration
   nano infra/config/environments/.env.local
   nano infra/config/secrets/secrets.yaml
   ```

### One-Command Deployment

```bash
# Deploy all services to development
./infra/scripts/deploy-all.sh --environment dev

# Validate configuration first
./infra/scripts/validation/dry-run.sh --environment dev
```

## 📋 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │    │  FastAPI Backend│    │   Worker Jobs   │
│   (Vercel)      │    │   (Render)      │    │   (Railway)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Supabase DB  │
                    │   & Auth       │
                    └─────────────────┘
```

### Services

| Service | Platform | Purpose | Environment |
|---------|----------|---------|-------------|
| **Backend** | Render (Docker) | FastAPI REST API | `dev`, `staging`, `prod` |
| **Worker** | Railway | Background jobs & scraping | `dev`, `staging`, `prod` |
| **Web** | Vercel | Next.js frontend | `dev`, `staging`, `prod` |
| **Mobile** | EAS | React Native apps | `dev`, `staging`, `prod` |
| **Database** | Supabase | PostgreSQL & Auth | Shared |

## 🛠️ Infrastructure as Code

### Terraform Configuration

```bash
cd infra/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var="environment=dev"

# Apply infrastructure
terraform apply -var="environment=dev"

# Destroy infrastructure
terraform destroy -var="environment=dev"
```

### Generated Configuration Files

Terraform automatically generates:
- `infra/config/environments/.env.dev` - Environment variables
- `infra/config/secrets/secrets.dev.yaml` - Encrypted secrets

## 📦 Service-Specific Deployment

### Backend (Render)

```bash
# Deploy backend only
./infra/scripts/deploy/backend.sh --environment dev

# With custom options
./infra/scripts/deploy/backend.sh --environment dev --skip-tests
```

**Features:**
- Docker-based deployment
- Health checks at `/health`
- Auto-scaling on free tier
- Environment-specific configurations

### Worker (Railway)

```bash
# Deploy worker only
./infra/scripts/deploy/worker.sh --environment dev

# With specific platform
./infra/scripts/deploy/worker.sh --environment dev --platform web
```

**Features:**
- Scheduled cron jobs
- Web scraping capabilities
- Background task processing
- Redis integration support

### Web (Vercel)

```bash
# Deploy web only
./infra/scripts/deploy/web.sh --environment dev

# Preview deployment
./infra/scripts/deploy/web.sh --environment dev --preview
```

**Features:**
- Next.js 14 with App Router
- Automatic deployments on git push
- Preview environments for PRs
- Edge functions support

### Mobile (EAS)

```bash
# Deploy mobile only
./infra/scripts/deploy/mobile.sh --environment dev

# Specific platform
./infra/scripts/deploy/mobile.sh --environment dev --platform ios
```

**Features:**
- Expo Application Services (EAS)
- Over-the-air updates
- App store deployment
- Build profiles for different environments

## 🔐 Secrets Management

### Environment Variables

```bash
# Template structure
cp infra/config/environments/.env.template infra/config/environments/.env.local

# Required variables
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_API_URL=your_api_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Encrypted Secrets

```bash
# Template structure
cp infra/config/secrets/secrets.template.yaml infra/config/secrets/secrets.yaml

# Secret categories
secrets:
  database:
    url: "encrypted_database_url"
  auth:
    jwt_secret: "encrypted_jwt_secret"
  apis:
    openai_api_key: "encrypted_openai_key"
```

### Rotation Schedule

- **Database passwords**: 90 days
- **API keys**: 180 days
- **JWT secrets**: 365 days
- **Encryption keys**: 730 days

## ⏰ Cron Jobs & Automation

### Worker Cron Jobs

```yaml
# railway.toml configuration
[[services.cron]]
schedule = "0 */6 * * *"  # Every 6 hours
command = "python -m worker.scraper"

[[services.cron]]
schedule = "0 2 * * *"    # Daily at 2 AM
command = "python -m worker.cleanup"

[[services.cron]]
schedule = "*/30 * * * *" # Every 30 minutes
command = "python -m worker.health_check"
```

### Supabase Edge Functions

```typescript
// Background job processing
export default async function handler(req: Request) {
  // Process webhook events
  // Handle scheduled tasks
  // Trigger data synchronization
}
```

## 🌍 Environment Management

### Environment Promotion

```bash
# Promote from dev to staging
./infra/scripts/promote.sh --from dev --to staging

# Promote from staging to prod
./infra/scripts/promote.sh --from staging --to prod
```

### Environment-Specific Configurations

| Environment | Database | Features | Monitoring |
|-------------|----------|----------|------------|
| **dev** | Development DB | Debug mode, hot reload | Basic logging |
| **staging** | Staging DB | Production-like features | Full monitoring |
| **prod** | Production DB | All features, optimized | Advanced monitoring |

## 🔍 Validation & Testing

### Dry Run Validation

```bash
# Comprehensive validation
./infra/scripts/validation/dry-run.sh --environment dev

# Specific validations
./infra/scripts/validation/validate-environment.sh dev
./infra/scripts/validation/validate-infrastructure.sh dev
./infra/scripts/validation/validate-secrets.sh dev
```

### Health Checks

```bash
# All services health check
./infra/scripts/monitoring/health-check.sh --environment dev

# Service-specific
./infra/scripts/monitoring/health-check.sh --service backend --environment dev
```

### Smoke Testing

```bash
# Run smoke tests
./infra/scripts/smoke-test.sh --environment dev

# Test specific functionality
./infra/scripts/smoke-test.sh --environment dev --test auth
./infra/scripts/smoke-test.sh --environment dev --test api
```

## 📊 Monitoring & Logging

### Service Monitoring

```bash
# View logs from all services
./infra/scripts/monitoring/logs.sh --environment dev

# Service-specific logs
./infra/scripts/monitoring/logs.sh --service backend --environment dev
./infra/scripts/monitoring/logs.sh --service worker --environment dev
```

### Metrics Collection

- **Response times** - API endpoint performance
- **Error rates** - Failed requests and exceptions
- **Resource usage** - CPU, memory, storage
- **Business metrics** - User activity, task completion

### Alerting

```yaml
# Alerting configuration
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    severity: "warning"
  
  - name: "Service Down"
    condition: "service_status != 'healthy'"
    severity: "critical"
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Check build logs
   render logs backend-dev
   railway logs worker-dev
   vercel logs
   
   # Local testing
   docker build -t test ./backend
   docker run -p 8000:8000 test
   ```

2. **Environment Variable Issues:**
   ```bash
   # Validate configuration
   ./infra/scripts/validation/dry-run.sh --environment dev
   
   # Check service variables
   vercel env ls
   railway variables
   ```

3. **Database Connection Issues:**
   ```bash
   # Test connection
   supabase db ping
   psql "$DATABASE_URL"
   ```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=true
export LOG_LEVEL=debug

# Run with verbose output
./infra/scripts/deploy-all.sh --environment dev --verbose
```

## 📚 Documentation

- [Service Deployment Guide](./infra/docs/service-deployment.md)
- [Environment Management](./infra/docs/environment-management.md)
- [Troubleshooting Guide](./infra/docs/troubleshooting.md)
- [CI/CD Pipeline](./infra/docs/cicd-pipeline.md)
- [API Documentation](./docs/api.md)

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main, develop]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to dev
        if: github.ref == 'refs/heads/develop'
        run: ./infra/scripts/deploy-all.sh --environment dev
      - name: Deploy to prod
        if: github.ref == 'refs/heads/main'
        run: ./infra/scripts/deploy-all.sh --environment prod
```

### Pull Request Validation

```yaml
# .github/workflows/pr-validation.yml
name: PR Validation
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Dry run validation
        run: ./infra/scripts/validation/dry-run.sh --environment dev
      - name: Smoke tests
        run: ./infra/scripts/smoke-test.sh --environment dev
```

## 🎯 Best Practices

1. **Always validate before deploying**
2. **Use environment-specific configurations**
3. **Implement proper health checks**
4. **Monitor and log everything**
5. **Keep secrets secure and rotated**
6. **Test deployments in staging first**
7. **Use infrastructure as code**
8. **Document all configurations**

## 🆘 Getting Help

1. **Check documentation** in `infra/docs/`
2. **Run validation** to identify issues
3. **Check logs** for service-specific errors
4. **Use debug mode** for detailed output
5. **Review GitHub Issues** for known problems

## 📈 Scaling Considerations

### Free Tier Limitations

| Service | Free Tier Limits | Upgrade Path |
|---------|------------------|--------------|
| **Render** | 750 hours/month | Pro tier |
| **Railway** | $5/month credit | Pro tier |
| **Vercel** | 100GB bandwidth | Pro tier |
| **Supabase** | 500MB DB, 1GB storage | Pro tier |
| **EAS** | 30 builds/month | Pro tier |

### Scaling Strategy

1. **Monitor usage** regularly
2. **Optimize resources** before scaling
3. **Implement caching** where possible
4. **Use CDN** for static assets
5. **Consider database optimization**
6. **Implement rate limiting**

## 🎉 Success Criteria

✅ **Staging environments accessible**  
✅ **Deployment instructions validated via dry-run**  
✅ **Infrastructure as Code implemented**  
✅ **Secrets management configured**  
✅ **Cron jobs scheduled**  
✅ **Environment promotion working**  
✅ **Health checks implemented**  
✅ **Monitoring and logging configured**  

Your deployment automation is now ready! 🚀

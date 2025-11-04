# Deployment Infrastructure

This directory contains the complete deployment automation infrastructure for the monorepo.

## Architecture Overview

- **Backend**: FastAPI service deployed to Render (Docker)
- **Worker**: Background jobs deployed to Railway
- **Web**: Next.js frontend deployed to Vercel
- **Mobile**: React Native apps built and deployed via EAS
- **Database**: Supabase PostgreSQL with automated migrations
- **Infrastructure**: Terraform for IaC on free tier services

## Directory Structure

```
infra/
├── terraform/                 # Infrastructure as Code
│   ├── modules/              # Reusable Terraform modules
│   ├── environments/         # Environment-specific configs
│   └── scripts/              # Terraform helper scripts
├── scripts/                  # Deployment automation scripts
│   ├── deploy/              # Service-specific deployment scripts
│   ├── utils/               # Shared utilities
│   └── validation/          # Dry-run and validation scripts
├── config/                   # Configuration files
│   ├── environments/        # Environment variables
│   └── secrets/             # Secrets management
├── docs/                     # Documentation
└── monitoring/              # Health checks and monitoring
```

## Quick Start

### Prerequisites
- Terraform CLI
- Docker
- Node.js 18+
- Python 3.9+
- Render, Railway, Vercel, EAS CLI tools
- Supabase CLI

### Environment Setup

1. Copy environment templates:
```bash
cp config/environments/.env.template config/environments/.env.local
```

2. Configure your secrets:
```bash
cp config/secrets/secrets.template.yaml config/secrets/secrets.yaml
```

3. Initialize infrastructure:
```bash
./scripts/setup.sh
```

### Deployment Commands

- **Deploy all services**: `./scripts/deploy-all.sh`
- **Deploy backend only**: `./scripts/deploy/backend.sh`
- **Deploy worker only**: `./scripts/deploy/worker.sh`
- **Deploy web only**: `./scripts/deploy/web.sh`
- **Deploy mobile**: `./scripts/deploy/mobile.sh`

### Validation

- **Dry run all**: `./scripts/validation/dry-run.sh`
- **Health check**: `./scripts/monitoring/health-check.sh`

## Environment Promotion

The infrastructure supports three environments:
- `dev` - Development/staging
- `staging` - Pre-production
- `prod` - Production

Promotion is handled through the `./scripts/promote.sh` script.

## Cron Jobs

Background scraping jobs are scheduled through:
- Railway Cron (worker)
- Supabase Edge Functions (database jobs)
- GitHub Actions (CI/CD triggers)

## Secrets Management

Secrets are managed using:
- Environment-specific `.env` files
- Encrypted secrets in repository (optional)
- Cloud provider secret managers
- CI/CD secret stores

## Monitoring

- Health checks: `/health` endpoints on all services
- Logging: Structured logs to cloud providers
- Metrics: Basic metrics collection
- Alerts: Error rate and availability monitoring

## Documentation

See the `docs/` directory for detailed guides:
- [Service Deployment](docs/service-deployment.md)
- [Environment Management](docs/environment-management.md)
- [Troubleshooting](docs/troubleshooting.md)
- [CI/CD Pipeline](docs/cicd-pipeline.md)

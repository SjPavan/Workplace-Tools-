# Workplace Tools Deployment Makefile

.PHONY: help setup deploy validate clean test promote monitor logs

# Default target
help:
	@echo "Workplace Tools Deployment Automation"
	@echo "===================================="
	@echo ""
	@echo "Available commands:"
	@echo "  setup          Initialize infrastructure and dependencies"
	@echo "  deploy         Deploy all services to specified environment"
	@echo "  validate       Run dry-run validation"
	@echo "  test           Run smoke tests"
	@echo "  promote        Promote environment"
	@echo "  monitor        Run health checks"
	@echo "  logs           View service logs"
	@echo "  clean          Clean up temporary files and artifacts"
	@echo ""
	@echo "Examples:"
	@echo "  make setup"
	@echo "  make deploy ENV=dev"
	@echo "  make validate ENV=staging"
	@echo "  make test ENV=prod"
	@echo "  make promote FROM=dev TO=staging"
	@echo "  make monitor ENV=dev SERVICE=backend"

# Variables
ENV ?= dev
SERVICE ?= all
FROM ?= dev
TO ?= staging
DRY_RUN ?= false

# Colors
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# Setup and initialization
setup:
	@echo "$(BLUE)[INFO]$(NC) Setting up infrastructure..."
	@./infra/scripts/setup.sh

# Deployment
deploy:
	@echo "$(BLUE)[INFO]$(NC) Deploying to $(ENV) environment..."
	@./infra/scripts/deploy-all.sh --environment $(ENV)

deploy-backend:
	@echo "$(BLUE)[INFO]$(NC) Deploying backend to $(ENV) environment..."
	@./infra/scripts/deploy/backend.sh --environment $(ENV)

deploy-worker:
	@echo "$(BLUE)[INFO]$(NC) Deploying worker to $(ENV) environment..."
	@./infra/scripts/deploy/worker.sh --environment $(ENV)

deploy-web:
	@echo "$(BLUE)[INFO]$(NC) Deploying web to $(ENV) environment..."
	@./infra/scripts/deploy/web.sh --environment $(ENV)

deploy-mobile:
	@echo "$(BLUE)[INFO]$(NC) Deploying mobile to $(ENV) environment..."
	@./infra/scripts/deploy/mobile.sh --environment $(ENV)

# Validation
validate:
	@echo "$(BLUE)[INFO]$(NC) Validating $(ENV) environment..."
	@./infra/scripts/validation/dry-run.sh --environment $(ENV)

validate-config:
	@echo "$(BLUE)[INFO]$(NC) Validating configuration..."
	@./infra/scripts/validation/validate-environment.sh $(ENV)

validate-infra:
	@echo "$(BLUE)[INFO]$(NC) Validating infrastructure..."
	@./infra/scripts/validation/validate-infrastructure.sh $(ENV)

validate-secrets:
	@echo "$(BLUE)[INFO]$(NC) Validating secrets..."
	@./infra/scripts/validation/validate-secrets.sh $(ENV)

# Testing
test:
	@echo "$(BLUE)[INFO]$(NC) Running smoke tests for $(ENV) environment..."
	@./infra/scripts/smoke-test.sh --environment $(ENV)

test-api:
	@echo "$(BLUE)[INFO]$(NC) Testing API endpoints..."
	@./infra/scripts/smoke-test.sh --environment $(ENV) --test api

test-database:
	@echo "$(BLUE)[INFO]$(NC) Testing database connectivity..."
	@./infra/scripts/smoke-test.sh --environment $(ENV) --test database

test-auth:
	@echo "$(BLUE)[INFO]$(NC) Testing authentication..."
	@./infra/scripts/smoke-test.sh --environment $(ENV) --test auth

# Environment promotion
promote:
	@echo "$(BLUE)[INFO]$(NC) Promoting from $(FROM) to $(TO)..."
	@./infra/scripts/promote.sh --from $(FROM) --to $(TO)

promote-dry-run:
	@echo "$(BLUE)[INFO]$(NC) Dry run promotion from $(FROM) to $(TO)..."
	@./infra/scripts/promote.sh --from $(FROM) --to $(TO) --dry-run

# Monitoring and health checks
monitor:
	@echo "$(BLUE)[INFO]$(NC) Running health checks for $(ENV) environment..."
	@./infra/scripts/monitoring/health-check.sh --environment $(ENV)

monitor-service:
	@echo "$(BLUE)[INFO]$(NC) Running health check for $(SERVICE) service..."
	@./infra/scripts/monitoring/health-check.sh --environment $(ENV) --service $(SERVICE)

monitor-all:
	@echo "$(BLUE)[INFO]$(NC) Running comprehensive monitoring..."
	@for env in dev staging prod; do \
		echo "$(BLUE)[INFO]$(NC) Monitoring $$env environment..."; \
		./infra/scripts/monitoring/health-check.sh --environment $$env || true; \
		echo ""; \
	done

# Logs
logs:
	@echo "$(BLUE)[INFO]$(NC) Viewing logs for $(ENV) environment..."
	@./infra/scripts/monitoring/logs.sh --environment $(ENV)

logs-service:
	@echo "$(BLUE)[INFO]$(NC) Viewing logs for $(SERVICE) service..."
	@./infra/scripts/monitoring/logs.sh --environment $(ENV) --service $(SERVICE)

logs-tail:
	@echo "$(BLUE)[INFO]$(NC) Tailing logs for $(ENV) environment..."
	@./infra/scripts/monitoring/logs.sh --environment $(ENV) --follow

# Infrastructure management
infra-init:
	@echo "$(BLUE)[INFO]$(NC) Initializing Terraform..."
	@cd infra/terraform && terraform init

infra-plan:
	@echo "$(BLUE)[INFO]$(NC) Planning infrastructure for $(ENV) environment..."
	@cd infra/terraform && terraform plan -var="environment=$(ENV)"

infra-apply:
	@echo "$(BLUE)[INFO]$(NC) Applying infrastructure for $(ENV) environment..."
	@cd infra/terraform && terraform apply -var="environment=$(ENV)" -auto-approve

infra-destroy:
	@echo "$(BLUE)[INFO]$(NC) Destroying infrastructure for $(ENV) environment..."
	@cd infra/terraform && terraform destroy -var="environment=$(ENV)" -auto-approve

infra-output:
	@echo "$(BLUE)[INFO]$(NC) Showing infrastructure outputs..."
	@cd infra/terraform && terraform output

# Database management
db-migrate:
	@echo "$(BLUE)[INFO]$(NC) Running database migrations..."
	@supabase db push

db-reset:
	@echo "$(BLUE)[INFO]$(NC) Resetting database..."
	@supabase db reset

db-seed:
	@echo "$(BLUE)[INFO]$(NC) Seeding database..."
	@supabase db seed

db-types:
	@echo "$(BLUE)[INFO]$(NC) Generating TypeScript types..."
	@supabase gen types typescript --local > types/supabase.ts

# Development helpers
dev-setup:
	@echo "$(BLUE)[INFO]$(NC) Setting up development environment..."
	@make setup
	@cd infra/terraform && terraform init
	@cd backend && npm install && cd ..
	@cd web && npm install && cd ..
	@cd worker && pip install -r requirements.txt && cd ..
	@if [ -d "mobile" ]; then cd mobile && npm install && cd ..; fi

dev-start:
	@echo "$(BLUE)[INFO]$(NC) Starting development services..."
	@docker-compose up -d

dev-stop:
	@echo "$(BLUE)[INFO]$(NC) Stopping development services..."
	@docker-compose down

dev-restart:
	@echo "$(BLUE)[INFO]$(NC) Restarting development services..."
	@docker-compose restart

# Cleanup
clean:
	@echo "$(BLUE)[INFO]$(NC) Cleaning up temporary files..."
	@find . -name "*.log" -delete
	@find . -name "*.tmp" -delete
	@find . -name ".DS_Store" -delete
	@rm -rf logs/
	@rm -rf .terraform/
	@rm -f *.tfstate*

clean-docker:
	@echo "$(BLUE)[INFO]$(NC) Cleaning up Docker resources..."
	@docker system prune -f
	@docker volume prune -f

clean-cache:
	@echo "$(BLUE)[INFO]$(NC) Cleaning up cache files..."
	@rm -rf node_modules/
	@rm -rf .next/
	@rm -rf build/
	@rm -rf dist/
	@rm -rf __pycache__/
	@rm -rf .pytest_cache/

# Security
security-scan:
	@echo "$(BLUE)[INFO]$(NC) Running security scan..."
	@npm audit
	@pip-audit || true

security-check:
	@echo "$(BLUE)[INFO]$(NC) Checking for secrets..."
	@grep -r "password\|secret\|key" --include="*.env*" --include="*.yaml" --include="*.json" . || true

# Backup and restore
backup:
	@echo "$(BLUE)[INFO]$(NC) Creating backup of $(ENV) environment..."
	@mkdir -p backups/$(ENV)-$(shell date +%Y%m%d-%H%M%S)
	@cp infra/config/environments/.env.$(ENV) backups/$(ENV)-$(shell date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
	@cp infra/config/secrets/secrets.$(ENV).yaml backups/$(ENV)-$(shell date +%Y%m%d-%H%M%S)/ 2>/dev/null || true
	@cd infra/terraform && cp terraform.tfstate ../../backups/$(ENV)-$(shell date +%Y%m%d-%H%M%S)/ 2>/dev/null || true

restore:
	@echo "$(BLUE)[INFO]$(NC) Restoring from backup..."
	@echo "$(YELLOW)[WARNING]$(NC) Please specify backup directory: make restore BACKUP_DIR=backups/dev-20231201-120000"

# Documentation
docs-serve:
	@echo "$(BLUE)[INFO]$(NC) Serving documentation..."
	@cd docs && python -m http.server 8000

docs-build:
	@echo "$(BLUE)[INFO]$(NC) Building documentation..."
	@cd docs && make html

# Utilities
check-deps:
	@echo "$(BLUE)[INFO]$(NC) Checking dependencies..."
	@which terraform > /dev/null || (echo "$(RED)[ERROR]$(NC) Terraform not installed" && exit 1)
	@which docker > /dev/null || (echo "$(RED)[ERROR]$(NC) Docker not installed" && exit 1)
	@which node > /dev/null || (echo "$(RED)[ERROR]$(NC) Node.js not installed" && exit 1)
	@which python3 > /dev/null || (echo "$(RED)[ERROR]$(NC) Python not installed" && exit 1)
	@echo "$(GREEN)[SUCCESS]$(NC) All dependencies available"

version:
	@echo "$(BLUE)[INFO]$(NC) Version information:"
	@echo "Terraform: $$(terraform version -json | jq -r '.terraform_version')"
	@echo "Docker: $$(docker --version)"
	@echo "Node.js: $$(node --version)"
	@echo "Python: $$(python3 --version)"
	@echo "Git: $$(git --version)"

# Quick commands for common workflows
quick-deploy-dev: validate deploy-dev test-dev monitor-dev
	@echo "$(GREEN)[SUCCESS]$(NC) Quick dev deployment completed"

quick-deploy-staging: validate deploy-staging test-staging monitor-staging
	@echo "$(GREEN)[SUCCESS]$(NC) Quick staging deployment completed"

quick-promote-to-prod: promote-staging-prod test-prod monitor-prod
	@echo "$(GREEN)[SUCCESS]$(NC) Quick promotion to prod completed"

# Status overview
status:
	@echo "$(BLUE)[INFO]$(NC) System Status Overview"
	@echo "========================"
	@echo "Environment: $(ENV)"
	@echo "Timestamp: $$(date)"
	@echo ""
	@echo "Services:"
	@echo "  Backend: $$(curl -s -o /dev/null -w "%{http_code}" $${BACKEND_URL:-https://api-$(ENV).yourdomain.com/health} 2>/dev/null || echo "N/A")"
	@echo "  Web: $$(curl -s -o /dev/null -w "%{http_code}" $${WEB_URL:-https://$(ENV).yourdomain.com/api/health} 2>/dev/null || echo "N/A")"
	@echo "  Worker: $$(curl -s -o /dev/null -w "%{http_code}" $${WORKER_URL:-https://worker-$(ENV).up.railway.app/health} 2>/dev/null || echo "N/A")"
	@echo ""
	@echo "Last deployment: $$(git log -1 --format="%h %s" 2>/dev/null || echo "N/A")"

# Include local overrides if they exist
-include Makefile.local

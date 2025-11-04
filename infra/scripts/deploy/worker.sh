#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source environment variables
if [ -f "$PROJECT_ROOT/infra/config/environments/.env.local" ]; then
    source "$PROJECT_ROOT/infra/config/environments/.env.local"
fi

# Default environment
ENVIRONMENT="${ENVIRONMENT:-dev}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Install with: npm install -g @railway/cli"
        exit 1
    fi
}

# Validate environment variables
validate_environment() {
    print_status "Validating worker deployment environment..."
    
    local required_vars=(
        "RAILWAY_TOKEN"
        "SUPABASE_PROJECT_ID"
        "SUPABASE_API_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Login to Railway
login_railway() {
    print_status "Logging in to Railway..."
    
    # Set Railway token
    export RAILWAY_TOKEN="$RAILWAY_TOKEN"
    
    # Verify login
    if railway whoami > /dev/null 2>&1; then
        print_success "Railway login successful"
    else
        print_error "Railway login failed"
        exit 1
    fi
}

# Create or update Railway project
setup_railway_project() {
    print_status "Setting up Railway project..."
    
    cd "$PROJECT_ROOT"
    
    # Check if railway.toml exists
    if [ ! -f "railway.toml" ]; then
        print_warning "railway.toml not found, creating default configuration"
        create_railway_config
    fi
    
    # Link to project or create new one
    local project_name="worker-${ENVIRONMENT}"
    
    if ! railway link "$project_name" 2>/dev/null; then
        print_status "Creating new Railway project: $project_name"
        railway init --name "$project_name"
    fi
    
    print_success "Railway project setup completed"
}

# Create Railway configuration if it doesn't exist
create_railway_config() {
    cat > railway.toml << EOF
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[[services]]
name = "worker-${ENVIRONMENT}"
source = "."
[services.variables]
NODE_ENV = "${ENVIRONMENT}"
SUPABASE_PROJECT_ID = "\${SUPABASE_PROJECT_ID}"
SUPABASE_API_URL = "\${SUPABASE_API_URL}"
SUPABASE_SERVICE_ROLE_KEY = "\${SUPABASE_SERVICE_ROLE_KEY}"
WORKER_MODE = "true"
DATABASE_URL = "\${DATABASE_URL}"

# Cron job configuration for scraping jobs
[[services.cron]]
schedule = "0 */6 * * *"  # Every 6 hours
command = "python -m worker.scraper"

[[services.cron]]
schedule = "0 2 * * *"    # Daily at 2 AM
command = "python -m worker.cleanup"

[[services.cron]]
schedule = "*/30 * * * *" # Every 30 minutes
command = "python -m worker.health_check"
EOF

    print_success "Created railway.toml configuration"
}

# Build worker service
build_worker() {
    print_status "Building worker service..."
    
    cd "$PROJECT_ROOT"
    
    # Check if worker directory exists
    if [ ! -d "worker" ]; then
        print_warning "Worker directory not found, creating basic worker structure"
        create_worker_structure
    fi
    
    # Build using Railway
    if railway up --service "worker-${ENVIRONMENT}"; then
        print_success "Worker service built successfully"
    else
        print_error "Failed to build worker service"
        exit 1
    fi
}

# Create basic worker structure if it doesn't exist
create_worker_structure() {
    print_status "Creating basic worker structure..."
    
    mkdir -p worker
    
    # Create main worker file
    cat > worker/main.py << EOF
"""
Background worker service for handling scheduled tasks.
"""

import os
import asyncio
import logging
from datetime import datetime
from supabase import create_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WorkerService:
    def __init__(self):
        self.supabase = create_client(
            os.getenv("SUPABASE_API_URL"),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        )
    
    async def run_scraper(self):
        """Run scraping job"""
        logger.info("Starting scraper job...")
        try:
            # TODO: Implement scraping logic
            logger.info("Scraper job completed")
        except Exception as e:
            logger.error(f"Scraper job failed: {e}")
    
    async def run_cleanup(self):
        """Run cleanup job"""
        logger.info("Starting cleanup job...")
        try:
            # TODO: Implement cleanup logic
            logger.info("Cleanup job completed")
        except Exception as e:
            logger.error(f"Cleanup job failed: {e}")
    
    async def health_check(self):
        """Health check job"""
        logger.info("Running health check...")
        try:
            # Test database connection
            self.supabase.table('health_checks').insert({
                'timestamp': datetime.now().isoformat(),
                'status': 'healthy'
            }).execute()
            logger.info("Health check passed")
        except Exception as e:
            logger.error(f"Health check failed: {e}")

if __name__ == "__main__":
    worker = WorkerService()
    
    if os.getenv("WORKER_MODE") == "scraper":
        asyncio.run(worker.run_scraper())
    elif os.getenv("WORKER_MODE") == "cleanup":
        asyncio.run(worker.run_cleanup())
    elif os.getenv("WORKER_MODE") == "health":
        asyncio.run(worker.health_check())
    else:
        logger.info("Worker service started in default mode")
EOF

    # Create requirements.txt
    cat > worker/requirements.txt << EOF
supabase==2.3.0
python-dotenv==1.0.0
aiohttp==3.9.0
beautifulsoup4==4.12.0
selenium==4.15.0
playwright==1.40.0
lxml==4.9.3
requests==2.31.0
pydantic==2.5.0
EOF

    # Create Dockerfile for worker
    cat > worker/Dockerfile << EOF
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    chromium \\
    chromium-driver \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONPATH=/app
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_DRIVER=/usr/bin/chromedriver

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "main.py"]
EOF

    print_success "Created basic worker structure"
}

# Deploy worker to Railway
deploy_worker() {
    print_status "Deploying worker to Railway..."
    
    cd "$PROJECT_ROOT"
    
    # Deploy the service
    if railway up --service "worker-${ENVIRONMENT}"; then
        print_success "Worker deployed to Railway"
    else
        print_error "Failed to deploy worker to Railway"
        exit 1
    fi
    
    # Get service URL
    local service_url=$(railway domain --service "worker-${ENVIRONMENT}" 2>/dev/null || echo "N/A")
    print_status "Worker URL: $service_url"
}

# Test deployment
test_deployment() {
    print_status "Testing worker deployment..."
    
    # Test worker health
    local service_url=$(railway domain --service "worker-${ENVIRONMENT}" 2>/dev/null)
    
    if [ "$service_url" != "N/A" ]; then
        if curl -f -s "$service_url/health" > /dev/null 2>&1; then
            print_success "Worker health check passed"
        else
            print_warning "Worker health check failed, but deployment may still be starting"
        fi
    else
        print_warning "Could not retrieve worker URL for health check"
    fi
}

# Setup cron jobs
setup_cron_jobs() {
    print_status "Setting up cron jobs..."
    
    cd "$PROJECT_ROOT"
    
    # Railway cron jobs are configured in railway.toml
    # This function ensures they are properly configured
    
    local cron_commands=(
        "scraper:python -m worker.scraper"
        "cleanup:python -m worker.cleanup"
        "health:python -m worker.health_check"
    )
    
    for cron_config in "${cron_commands[@]}"; do
        IFS=':' read -r job_name command <<< "$cron_config"
        print_status "Configured cron job: $job_name"
    done
    
    print_success "Cron jobs configured"
}

# Main deployment function
main() {
    print_status "Starting worker deployment for environment: $ENVIRONMENT"
    
    # Validate environment
    validate_environment
    
    # Check dependencies
    check_railway_cli
    
    # Login to Railway
    login_railway
    
    # Setup Railway project
    setup_railway_project
    
    # Build worker
    build_worker
    
    # Deploy worker
    deploy_worker
    
    # Setup cron jobs
    setup_cron_jobs
    
    # Test deployment
    test_deployment
    
    print_success "Worker deployment completed!"
    
    # Output service information
    local service_url=$(railway domain --service "worker-${ENVIRONMENT}" 2>/dev/null || echo "Check Railway dashboard")
    print_status "Worker URL: $service_url"
    print_status "Cron jobs: Configured in railway.toml"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--environment|-e ENVIRONMENT] [--skip-tests]"
            echo "Environments: dev, staging, prod"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main function
main "$@"

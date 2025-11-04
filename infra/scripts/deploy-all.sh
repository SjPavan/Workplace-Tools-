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

# Function to deploy a service and handle errors
deploy_service() {
    local service_name="$1"
    local deploy_script="$2"
    
    print_status "Deploying $service_name..."
    
    if [ -f "$deploy_script" ]; then
        if bash "$deploy_script" "$ENVIRONMENT"; then
            print_success "$service_name deployed successfully"
            return 0
        else
            print_error "$service_name deployment failed"
            return 1
        fi
    else
        print_warning "Deploy script not found: $deploy_script"
        return 0
    fi
}

# Function to run health checks
health_check() {
    local service_name="$1"
    local health_url="$2"
    local max_attempts=30
    local attempt=1
    
    print_status "Running health check for $service_name..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" > /dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts: $service_name not ready yet..."
        sleep 10
        ((attempt++))
    done
    
    print_error "$service_name health check failed after $max_attempts attempts"
    return 1
}

# Main deployment function
main() {
    print_status "Starting deployment for environment: $ENVIRONMENT"
    
    # Check if environment is valid
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        print_error "Invalid environment: $ENVIRONMENT. Use dev, staging, or prod"
        exit 1
    fi
    
    # Validate configuration first
    print_status "Validating configuration..."
    if ! bash "$SCRIPT_DIR/validation/dry-run.sh" "$ENVIRONMENT"; then
        print_error "Configuration validation failed"
        exit 1
    fi
    
    print_success "Configuration validation passed"
    
    # Deploy services in order
    local services=(
        "database:$SCRIPT_DIR/deploy/database.sh"
        "backend:$SCRIPT_DIR/deploy/backend.sh"
        "worker:$SCRIPT_DIR/deploy/worker.sh"
        "web:$SCRIPT_DIR/deploy/web.sh"
        "mobile:$SCRIPT_DIR/deploy/mobile.sh"
    )
    
    local failed_services=()
    
    for service in "${services[@]}"; do
        IFS=':' read -r service_name deploy_script <<< "$service"
        
        if ! deploy_service "$service_name" "$deploy_script"; then
            failed_services+=("$service_name")
        fi
        
        # Add delay between deployments
        sleep 5
    done
    
    # Report deployment results
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "All services deployed successfully!"
    else
        print_error "Some services failed to deploy: ${failed_services[*]}"
        exit 1
    fi
    
    # Run health checks
    print_status "Running health checks..."
    
    # Get service URLs from environment or use defaults
    local backend_url="${BACKEND_URL:-https://api-$ENVIRONMENT.yourdomain.com}"
    local web_url="${WEB_URL:-https://$ENVIRONMENT.yourdomain.com}"
    
    health_check "backend" "$backend_url/health" || failed_services+=("backend-health")
    health_check "web" "$web_url/api/health" || failed_services+=("web-health")
    
    # Final status
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "Deployment completed successfully!"
        echo
        print_status "Deployed services:"
        echo "  - Backend: $backend_url"
        echo "  - Web: $web_url"
        echo "  - Database: Supabase (${SUPABASE_PROJECT_ID:-configured})"
        echo "  - Worker: Railway"
        echo "  - Mobile: EAS Build"
    else
        print_error "Deployment completed with issues: ${failed_services[*]}"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--environment|-e ENVIRONMENT]"
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

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

# Check if Render CLI is installed
check_render_cli() {
    if ! command -v render &> /dev/null; then
        print_error "Render CLI not found. Install with: npm install -g @render/cli"
        exit 1
    fi
}

# Validate environment variables
validate_environment() {
    print_status "Validating backend deployment environment..."
    
    local required_vars=(
        "RENDER_API_KEY"
        "SUPABASE_PROJECT_ID"
        "SUPABASE_API_URL"
        "SUPABASE_ANON_KEY"
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

# Build Docker image
build_docker_image() {
    print_status "Building backend Docker image..."
    
    cd "$PROJECT_ROOT"
    
    # Check if Dockerfile exists
    if [ ! -f "backend/Dockerfile" ]; then
        print_error "Backend Dockerfile not found"
        exit 1
    fi
    
    # Build image with environment tag
    local image_name="backend-$ENVIRONMENT"
    local image_tag="latest"
    
    docker build -t "$image_name:$image_tag" -f backend/Dockerfile ./backend
    
    print_success "Docker image built: $image_name:$image_tag"
}

# Deploy to Render
deploy_to_render() {
    print_status "Deploying backend to Render..."
    
    cd "$PROJECT_ROOT"
    
    # Check if render.yaml exists
    if [ ! -f "render.yaml" ]; then
        print_warning "render.yaml not found, creating default configuration"
        create_render_config
    fi
    
    # Set Render API key
    export RENDER_API_KEY="$RENDER_API_KEY"
    
    # Deploy using render.yaml
    if render deploy --env "$ENVIRONMENT"; then
        print_success "Backend deployed to Render"
    else
        print_error "Failed to deploy backend to Render"
        exit 1
    fi
}

# Create Render configuration if it doesn't exist
create_render_config() {
    cat > render.yaml << EOF
services:
  # Backend API Service
  - type: web
    name: backend-${ENVIRONMENT}
    env: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: ${ENVIRONMENT}
      - key: SUPABASE_PROJECT_ID
        value: \${SUPABASE_PROJECT_ID}
      - key: SUPABASE_API_URL
        value: \${SUPABASE_API_URL}
      - key: SUPABASE_ANON_KEY
        value: \${SUPABASE_ANON_KEY}
      - key: SUPABASE_SERVICE_ROLE_KEY
        value: \${SUPABASE_SERVICE_ROLE_KEY}
      - key: DATABASE_URL
        value: \${DATABASE_URL}
    domains:
      - api-${ENVIRONMENT}.yourdomain.com
    
  # Background Worker Service
  - type: worker
    name: worker-${ENVIRONMENT}
    env: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    envVars:
      - key: NODE_ENV
        value: ${ENVIRONMENT}
      - key: SUPABASE_PROJECT_ID
        value: \${SUPABASE_PROJECT_ID}
      - key: SUPABASE_API_URL
        value: \${SUPABASE_API_URL}
      - key: SUPABASE_SERVICE_ROLE_KEY
        value: \${SUPABASE_SERVICE_ROLE_KEY}
      - key: WORKER_MODE
        value: "true"

databases:
  - name: backend-db-${ENVIRONMENT}
    databaseName: backend_${ENVIRONMENT}
    user: backend_${ENVIRONMENT}
EOF

    print_success "Created render.yaml configuration"
}

# Test deployment locally
test_local_deployment() {
    print_status "Testing local deployment..."
    
    cd "$PROJECT_ROOT"
    
    # Run backend locally for testing
    local container_name="backend-test-$ENVIRONMENT"
    
    # Stop existing container if running
    if docker ps -q -f name="$container_name" | grep -q .; then
        docker stop "$container_name" || true
        docker rm "$container_name" || true
    fi
    
    # Run container with environment variables
    docker run -d \
        --name "$container_name" \
        -p 8000:8000 \
        -e NODE_ENV="$ENVIRONMENT" \
        -e SUPABASE_PROJECT_ID="$SUPABASE_PROJECT_ID" \
        -e SUPABASE_API_URL="$SUPABASE_API_URL" \
        -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
        -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
        "backend-$ENVIRONMENT:latest"
    
    # Wait for container to start
    sleep 10
    
    # Test health endpoint
    if curl -f -s "http://localhost:8000/health" > /dev/null; then
        print_success "Local deployment test passed"
        
        # Stop test container
        docker stop "$container_name"
        docker rm "$container_name"
    else
        print_error "Local deployment test failed"
        docker logs "$container_name"
        docker stop "$container_name" || true
        docker rm "$container_name" || true
        exit 1
    fi
}

# Main deployment function
main() {
    print_status "Starting backend deployment for environment: $ENVIRONMENT"
    
    # Validate environment
    validate_environment
    
    # Check dependencies
    check_render_cli
    
    # Build Docker image
    build_docker_image
    
    # Test locally first
    if [ "$ENVIRONMENT" != "prod" ]; then
        test_local_deployment
    fi
    
    # Deploy to Render
    deploy_to_render
    
    print_success "Backend deployment completed!"
    
    # Output service URL
    local service_url="https://api-${ENVIRONMENT}.yourdomain.com"
    print_status "Backend URL: $service_url"
    print_status "Health check: $service_url/health"
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

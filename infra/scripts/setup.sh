#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    # Check for Terraform
    if ! command -v terraform &> /dev/null; then
        missing_deps+=("terraform")
    fi
    
    # Check for Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    # Check for Python
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    # Check for Supabase CLI
    if ! command -v supabase &> /dev/null; then
        missing_deps+=("supabase")
    fi
    
    # Check for Render CLI (optional)
    if ! command -v render &> /dev/null; then
        print_warning "Render CLI not found. Install with: npm install -g @render/cli"
    fi
    
    # Check for Railway CLI (optional)
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Install with: npm install -g @railway/cli"
    fi
    
    # Check for Vercel CLI (optional)
    if ! command -t vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Install with: npm install -g vercel"
    fi
    
    # Check for EAS CLI (optional)
    if ! command -v eas &> /dev/null; then
        print_warning "EAS CLI not found. Install with: npm install -g @expo/eas-cli"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    print_success "All required dependencies found"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    local env_dir="$PROJECT_ROOT/infra/config/environments"
    local secrets_dir="$PROJECT_ROOT/infra/config/secrets"
    
    # Create directories if they don't exist
    mkdir -p "$env_dir" "$secrets_dir"
    
    # Copy environment template if it doesn't exist
    if [ ! -f "$env_dir/.env.local" ]; then
        if [ -f "$env_dir/.env.template" ]; then
            cp "$env_dir/.env.template" "$env_dir/.env.local"
            print_success "Created .env.local from template"
        else
            print_warning "No .env.template found, creating basic .env.local"
            cat > "$env_dir/.env.local" << EOF
# Environment Configuration
# Copy this file and fill in your values

# General
NODE_ENV=development
ENVIRONMENT=dev

# Supabase
SUPABASE_PROJECT_ID=your_supabase_project_id
SUPABASE_API_URL=your_supabase_api_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Render (Backend)
RENDER_API_KEY=your_render_api_key
BACKEND_RENDER_SERVICE_ID=your_backend_service_id

# Railway (Worker)
RAILWAY_TOKEN=your_railway_token
WORKER_RAILWAY_SERVICE_ID=your_worker_service_id

# Vercel (Web)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# EAS (Mobile)
EAS_PROJECT_ID=your_eas_project_id
EOF
        fi
    fi
    
    # Copy secrets template if it doesn't exist
    if [ ! -f "$secrets_dir/secrets.yaml" ]; then
        if [ -f "$secrets_dir/secrets.template.yaml" ]; then
            cp "$secrets_dir/secrets.template.yaml" "$secrets_dir/secrets.yaml"
            print_success "Created secrets.yaml from template"
        else
            print_warning "No secrets template found, creating basic secrets.yaml"
            cat > "$secrets_dir/secrets.yaml" << EOF
# Secrets Configuration
# This file contains sensitive information
# Do not commit to version control

secrets:
  database:
    url: "your_database_url"
    password: "your_database_password"
  
  apis:
    openai_api_key: "your_openai_api_key"
    anthropic_api_key: "your_anthropic_api_key"
  
  auth:
    jwt_secret: "your_jwt_secret"
    session_secret: "your_session_secret"
EOF
        fi
    fi
}

# Initialize Terraform
setup_terraform() {
    print_status "Setting up Terraform..."
    
    local terraform_dir="$PROJECT_ROOT/infra/terraform"
    
    if [ -d "$terraform_dir" ]; then
        cd "$terraform_dir"
        
        # Initialize Terraform modules
        if [ -f "main.tf" ]; then
            terraform init
            print_success "Terraform initialized"
        else
            print_warning "No Terraform main.tf found"
        fi
        
        cd "$PROJECT_ROOT"
    else
        print_warning "Terraform directory not found"
    fi
}

# Setup Supabase
setup_supabase() {
    print_status "Setting up Supabase..."
    
    if command -v supabase &> /dev/null; then
        cd "$PROJECT_ROOT"
        
        # Initialize Supabase if not already done
        if [ ! -d "supabase" ]; then
            supabase init
            print_success "Supabase initialized"
        else
            print_status "Supabase already initialized"
        fi
        
        # Link to project if configured
        if [ -f "infra/config/environments/.env.local" ]; then
            source "infra/config/environments/.env.local"
            if [ -n "${SUPABASE_PROJECT_ID:-}" ]; then
                supabase link --project-ref "$SUPABASE_PROJECT_ID" || print_warning "Failed to link Supabase project"
            fi
        fi
    else
        print_warning "Supabase CLI not found"
    fi
}

# Setup Git hooks
setup_git_hooks() {
    print_status "Setting up Git hooks..."
    
    local hooks_dir="$PROJECT_ROOT/.git/hooks"
    local infra_hooks_dir="$PROJECT_ROOT/infra/scripts/git-hooks"
    
    if [ -d "$infra_hooks_dir" ]; then
        # Copy hooks if they exist
        for hook in "$infra_hooks_dir"/*; do
            if [ -f "$hook" ]; then
                local hook_name=$(basename "$hook")
                cp "$hook" "$hooks_dir/$hook_name"
                chmod +x "$hooks_dir/$hook_name"
                print_success "Installed Git hook: $hook_name"
            fi
        done
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    local dirs=(
        "infra/terraform/modules"
        "infra/terraform/environments"
        "infra/terraform/scripts"
        "infra/scripts/deploy"
        "infra/scripts/utils"
        "infra/scripts/validation"
        "infra/scripts/monitoring"
        "infra/config/environments"
        "infra/config/secrets"
        "infra/docs"
        "infra/monitoring"
        "logs"
    )
    
    for dir in "${dirs[@]}"; do
        mkdir -p "$PROJECT_ROOT/$dir"
    done
    
    print_success "Created all necessary directories"
}

# Main setup function
main() {
    print_status "Starting infrastructure setup..."
    
    create_directories
    check_dependencies
    setup_environment
    setup_terraform
    setup_supabase
    setup_git_hooks
    
    print_success "Infrastructure setup completed!"
    echo
    print_status "Next steps:"
    echo "1. Edit infra/config/environments/.env.local with your values"
    echo "2. Edit infra/config/secrets/secrets.yaml with your secrets"
    echo "3. Run './scripts/validation/dry-run.sh' to validate configuration"
    echo "4. Run './scripts/deploy-all.sh' to deploy all services"
}

# Run main function
main "$@"

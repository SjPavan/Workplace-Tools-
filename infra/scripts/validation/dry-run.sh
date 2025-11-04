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

# Track validation results
VALIDATION_ERRORS=0
VALIDATION_WARNINGS=0

# Validation functions
validate_environment() {
    print_status "Validating environment configuration..."
    
    local env_file="$PROJECT_ROOT/infra/config/environments/.env.local"
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
        ((VALIDATION_ERRORS++))
        return
    fi
    
    # Check required variables
    local required_vars=(
        "SUPABASE_PROJECT_ID"
        "SUPABASE_API_URL"
        "SUPABASE_ANON_KEY"
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
        ((VALIDATION_ERRORS++))
    else
        print_success "Environment variables validation passed"
    fi
    
    # Check optional variables
    local optional_vars=(
        "RENDER_API_KEY"
        "RAILWAY_TOKEN"
        "VERCEL_TOKEN"
        "EAS_PROJECT_ID"
    )
    
    local missing_optional=()
    
    for var in "${optional_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_optional+=("$var")
        fi
    done
    
    if [ ${#missing_optional[@]} -ne 0 ]; then
        print_warning "Missing optional environment variables: ${missing_optional[*]}"
        ((VALIDATION_WARNINGS++))
    fi
}

validate_secrets() {
    print_status "Validating secrets configuration..."
    
    local secrets_file="$PROJECT_ROOT/infra/config/secrets/secrets.yaml"
    
    if [ ! -f "$secrets_file" ]; then
        print_warning "Secrets file not found: $secrets_file"
        ((VALIDATION_WARNINGS++))
        return
    fi
    
    # Check if secrets file is properly formatted
    if ! python3 -c "import yaml; yaml.safe_load(open('$secrets_file'))" 2>/dev/null; then
        print_error "Secrets file is not valid YAML"
        ((VALIDATION_ERRORS++))
    else
        print_success "Secrets file format is valid"
    fi
}

validate_project_structure() {
    print_status "Validating project structure..."
    
    local required_dirs=(
        "backend"
        "web"
        "infra"
    )
    
    local missing_dirs=()
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$PROJECT_ROOT/$dir" ]; then
            missing_dirs+=("$dir")
        fi
    done
    
    if [ ${#missing_dirs[@]} -ne 0 ]; then
        print_warning "Missing directories: ${missing_dirs[*]}"
        ((VALIDATION_WARNINGS++))
    else
        print_success "Project structure validation passed"
    fi
    
    # Check for deployment scripts
    local deploy_scripts=(
        "infra/scripts/deploy/backend.sh"
        "infra/scripts/deploy/worker.sh"
        "infra/scripts/deploy/web.sh"
        "infra/scripts/deploy/mobile.sh"
    )
    
    local missing_scripts=()
    
    for script in "${deploy_scripts[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$script" ]; then
            missing_scripts+=("$script")
        fi
    done
    
    if [ ${#missing_scripts[@]} -ne 0 ]; then
        print_error "Missing deployment scripts: ${missing_scripts[*]}"
        ((VALIDATION_ERRORS++))
    else
        print_success "Deployment scripts validation passed"
    fi
}

validate_backend() {
    print_status "Validating backend configuration..."
    
    local backend_dir="$PROJECT_ROOT/backend"
    
    if [ ! -d "$backend_dir" ]; then
        print_warning "Backend directory not found"
        ((VALIDATION_WARNINGS++))
        return
    fi
    
    # Check for Dockerfile
    if [ ! -f "$backend_dir/Dockerfile" ]; then
        print_error "Backend Dockerfile not found"
        ((VALIDATION_ERRORS++))
    else
        print_success "Backend Dockerfile found"
    fi
    
    # Check for requirements.txt or pyproject.toml
    if [ ! -f "$backend_dir/requirements.txt" ] && [ ! -f "$backend_dir/pyproject.toml" ]; then
        print_warning "Backend dependencies file not found (requirements.txt or pyproject.toml)"
        ((VALIDATION_WARNINGS++))
    else
        print_success "Backend dependencies file found"
    fi
    
    # Check for main application file
    if [ ! -f "$backend_dir/main.py" ] && [ ! -f "$backend_dir/app/main.py" ]; then
        print_warning "Backend main application file not found"
        ((VALIDATION_WARNINGS++))
    else
        print_success "Backend main application file found"
    fi
}

validate_web() {
    print_status "Validating web configuration..."
    
    local web_dir="$PROJECT_ROOT/web"
    
    if [ ! -d "$web_dir" ]; then
        print_warning "Web directory not found"
        ((VALIDATION_WARNINGS++))
        return
    fi
    
    # Check for package.json
    if [ ! -f "$web_dir/package.json" ]; then
        print_error "Web package.json not found"
        ((VALIDATION_ERRORS++))
    else
        print_success "Web package.json found"
    fi
    
    # Check for Next.js configuration
    if [ ! -f "$web_dir/next.config.js" ] && [ ! -f "$web_dir/next.config.ts" ]; then
        print_warning "Next.js configuration not found"
        ((VALIDATION_WARNINGS++))
    else
        print_success "Next.js configuration found"
    fi
    
    # Check for Vercel configuration
    if [ ! -f "$web_dir/vercel.json" ]; then
        print_warning "Vercel configuration not found"
        ((VALIDATION_WARNINGS++))
    else
        print_success "Vercel configuration found"
    fi
}

validate_mobile() {
    print_status "Validating mobile configuration..."
    
    local mobile_dir="$PROJECT_ROOT/mobile"
    
    if [ ! -d "$mobile_dir" ]; then
        print_warning "Mobile directory not found"
        ((VALIDATION_WARNINGS++))
        return
    fi
    
    # Check for package.json
    if [ ! -f "$mobile_dir/package.json" ]; then
        print_error "Mobile package.json not found"
        ((VALIDATION_ERRORS++))
    else
        print_success "Mobile package.json found"
    fi
    
    # Check for app.json
    if [ ! -f "$mobile_dir/app.json" ]; then
        print_warning "Expo app.json not found"
        ((VALIDATION_WARNINGS++))
    else
        print_success "Expo app.json found"
    fi
    
    # Check for EAS configuration
    if [ ! -f "$mobile_dir/eas.json" ]; then
        print_warning "EAS configuration not found"
        ((VALIDATION_WARNINGS++))
    else
        print_success "EAS configuration found"
    fi
}

validate_infrastructure() {
    print_status "Validating infrastructure configuration..."
    
    local infra_dir="$PROJECT_ROOT/infra"
    
    # Check for Terraform configuration
    local terraform_dir="$infra_dir/terraform"
    if [ -d "$terraform_dir" ]; then
        if [ -f "$terraform_dir/main.tf" ]; then
            print_success "Terraform main configuration found"
            
            # Validate Terraform syntax
            cd "$terraform_dir"
            if terraform fmt -check > /dev/null 2>&1; then
                print_success "Terraform format validation passed"
            else
                print_warning "Terraform format validation failed"
                ((VALIDATION_WARNINGS++))
            fi
            
            if terraform validate > /dev/null 2>&1; then
                print_success "Terraform validation passed"
            else
                print_error "Terraform validation failed"
                ((VALIDATION_ERRORS++))
            fi
        else
            print_warning "Terraform main.tf not found"
            ((VALIDATION_WARNINGS++))
        fi
    else
        print_warning "Terraform directory not found"
        ((VALIDATION_WARNINGS++))
    fi
    
    # Check for Docker Compose
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        print_success "Docker Compose configuration found"
        
        # Validate Docker Compose syntax
        if docker-compose config > /dev/null 2>&1; then
            print_success "Docker Compose validation passed"
        else
            print_error "Docker Compose validation failed"
            ((VALIDATION_ERRORS++))
        fi
    else
        print_warning "Docker Compose configuration not found"
        ((VALIDATION_WARNINGS++))
    fi
    
    # Check for Render configuration
    if [ -f "$PROJECT_ROOT/render.yaml" ]; then
        print_success "Render configuration found"
    else
        print_warning "Render configuration not found"
        ((VALIDATION_WARNINGS++))
    fi
}

validate_supabase() {
    print_status "Validating Supabase configuration..."
    
    # Check if Supabase CLI is available
    if command -v supabase &> /dev/null; then
        if [ -d "$PROJECT_ROOT/supabase" ]; then
            print_success "Supabase directory found"
            
            # Validate Supabase configuration
            cd "$PROJECT_ROOT"
            if supabase db diff --use-migra --schema public > /dev/null 2>&1; then
                print_success "Supabase configuration validation passed"
            else
                print_warning "Supabase configuration validation failed"
                ((VALIDATION_WARNINGS++))
            fi
        else
            print_warning "Supabase directory not found"
            ((VALIDATION_WARNINGS++))
        fi
    else
        print_warning "Supabase CLI not installed"
        ((VALIDATION_WARNINGS++))
    fi
}

validate_dependencies() {
    print_status "Validating dependencies..."
    
    # Check for required CLIs
    local required_clis=(
        "docker"
        "node"
        "python3"
    )
    
    local missing_clis=()
    
    for cli in "${required_clis[@]}"; do
        if ! command -v "$cli" &> /dev/null; then
            missing_clis+=("$cli")
        fi
    done
    
    if [ ${#missing_clis[@]} -ne 0 ]; then
        print_error "Missing required CLIs: ${missing_clis[*]}"
        ((VALIDATION_ERRORS++))
    else
        print_success "Required CLIs validation passed"
    fi
    
    # Check for optional CLIs
    local optional_clis=(
        "terraform"
        "supabase"
        "vercel"
        "railway"
        "render"
        "eas"
    )
    
    local missing_optional_clis=()
    
    for cli in "${optional_clis[@]}"; do
        if ! command -v "$cli" &> /dev/null; then
            missing_optional_clis+=("$cli")
        fi
    done
    
    if [ ${#missing_optional_clis[@]} -ne 0 ]; then
        print_warning "Missing optional CLIs: ${missing_optional_clis[*]}"
        ((VALIDATION_WARNINGS++))
    else
        print_success "Optional CLIs validation passed"
    fi
}

validate_permissions() {
    print_status "Validating script permissions..."
    
    local scripts_dir="$PROJECT_ROOT/infra/scripts"
    
    if [ -d "$scripts_dir" ]; then
        # Check if scripts are executable
        local non_executable_scripts=()
        
        while IFS= read -r -d '' script; do
            if [ ! -x "$script" ]; then
                non_executable_scripts+=("$(basename "$script")")
            fi
        done < <(find "$scripts_dir" -name "*.sh" -print0)
        
        if [ ${#non_executable_scripts[@]} -ne 0 ]; then
            print_warning "Non-executable scripts: ${non_executable_scripts[*]}"
            ((VALIDATION_WARNINGS++))
        else
            print_success "Script permissions validation passed"
        fi
    else
        print_warning "Scripts directory not found"
        ((VALIDATION_WARNINGS++))
    fi
}

generate_report() {
    echo
    print_status "Validation Report"
    echo "===================="
    echo "Environment: $ENVIRONMENT"
    echo "Errors: $VALIDATION_ERRORS"
    echo "Warnings: $VALIDATION_WARNINGS"
    echo
    
    if [ $VALIDATION_ERRORS -eq 0 ]; then
        if [ $VALIDATION_WARNINGS -eq 0 ]; then
            print_success "All validations passed! Ready for deployment."
        else
            print_warning "Validation passed with warnings. Review before deployment."
        fi
        return 0
    else
        print_error "Validation failed with errors. Fix before deployment."
        return 1
    fi
}

# Main validation function
main() {
    print_status "Starting dry-run validation for environment: $ENVIRONMENT"
    echo
    
    # Run all validations
    validate_environment
    validate_secrets
    validate_project_structure
    validate_backend
    validate_web
    validate_mobile
    validate_infrastructure
    validate_supabase
    validate_dependencies
    validate_permissions
    
    # Generate report
    generate_report
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
            echo
            echo "This script performs a comprehensive dry-run validation of the deployment configuration."
            echo "It checks environment variables, project structure, dependencies, and deployment readiness."
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

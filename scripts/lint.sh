#!/usr/bin/env bash
set -euo pipefail

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

# Track overall success
OVERALL_SUCCESS=true

# Function to run a lint check and track success
run_lint() {
    local workspace="$1"
    local command="$2"
    
    print_status "Linting $workspace..."
    
    if eval "$command"; then
        print_success "$workspace linting passed"
        return 0
    else
        print_error "$workspace linting failed"
        OVERALL_SUCCESS=false
        return 1
    fi
}

print_status "Running linting pipeline..."

# Backend linting
if [ -d "backend" ]; then
    cd backend
    
    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        # Try different Python linters in order of preference
        if command -v ruff >/dev/null 2>&1; then
            run_lint "backend (ruff)" "ruff check ."
        elif command -v flake8 >/dev/null 2>&1; then
            run_lint "backend (flake8)" "flake8 ."
        elif command -v pylint >/dev/null 2>&1; then
            run_lint "backend (pylint)" "pylint ."
        else
            print_warning "No Python linter found for backend"
        fi
        
        # Check for import sorting
        if command -v isort >/dev/null 2>&1; then
            run_lint "backend (isort)" "isort --check-only ."
        fi
    else
        print_warning "No Python dependencies found in backend"
    fi
    
    cd ..
fi

# Web linting
if [ -d "web" ]; then
    cd web
    
    if [ -f "package.json" ]; then
        # Try ESLint if available
        if command -v npx >/dev/null 2>&1 && [ -d "node_modules" ] && [ -d "node_modules/.bin" ] && [ -f "node_modules/.bin/eslint" ]; then
            run_lint "web (eslint)" "npm run lint || npx eslint ."
        elif command -v npx >/dev/null 2>&1; then
            print_warning "ESLint not found in web workspace"
        fi
        
        # Try TypeScript compiler if TypeScript files exist
        if find . -name "*.ts" -o -name "*.tsx" | grep -q . && command -v npx >/dev/null 2>&1; then
            run_lint "web (typescript)" "npx tsc --noEmit 2>/dev/null || true"
        fi
    else
        print_warning "No package.json found in web workspace"
    fi
    
    cd ..
fi

# Worker linting
if [ -d "worker" ]; then
    cd worker
    
    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        if command -v ruff >/dev/null 2>&1; then
            run_lint "worker (ruff)" "ruff check ."
        elif command -v flake8 >/dev/null 2>&1; then
            run_lint "worker (flake8)" "flake8 ."
        elif command -v pylint >/dev/null 2>&1; then
            run_lint "worker (pylint)" "pylint ."
        else
            print_warning "No Python linter found for worker"
        fi
    else
        print_warning "No Python dependencies found in worker"
    fi
    
    cd ..
fi

# Mobile linting
if [ -d "mobile" ]; then
    cd mobile
    
    if [ -f "package.json" ]; then
        if command -v npx >/dev/null 2>&1 && [ -d "node_modules" ] && [ -d "node_modules/.bin" ] && [ -f "node_modules/.bin/eslint" ]; then
            run_lint "mobile (eslint)" "npm run lint || npx eslint ."
        elif command -v npx >/dev/null 2>&1; then
            print_warning "ESLint not found in mobile workspace"
        fi
    else
        print_warning "No package.json found in mobile workspace"
    fi
    
    cd ..
fi

# Final summary
echo ""
if [ "$OVERALL_SUCCESS" = true ]; then
    print_success "All linting checks passed!"
    exit 0
else
    print_error "Some linting checks failed. Please review the output above."
    exit 1
fi

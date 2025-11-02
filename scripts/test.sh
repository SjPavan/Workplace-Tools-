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

# Function to run tests and track success
run_test() {
    local workspace="$1"
    local command="$2"
    
    print_status "Testing $workspace..."
    
    if eval "$command"; then
        print_success "$workspace tests passed"
        return 0
    else
        print_error "$workspace tests failed"
        OVERALL_SUCCESS=false
        return 1
    fi
}

print_status "Running test suite..."

# Backend testing
if [ -d "backend" ]; then
    cd backend
    
    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        # Try different Python test runners
        if command -v pytest >/dev/null 2>&1; then
            run_test "backend (pytest)" "pytest -v"
        elif command -v python3 >/dev/null 2>&1 && python3 -m pytest --version >/dev/null 2>&1; then
            run_test "backend (pytest module)" "python3 -m pytest -v"
        elif command -v python3 >/dev/null 2>&1 && [ -f "setup.py" ]; then
            run_test "backend (unittest)" "python3 -m unittest discover -v"
        elif command -v python3 >/dev/null 2>&1 && find . -name "test_*.py" -o -name "*_test.py" | grep -q .; then
            run_test "backend (unittest)" "python3 -m unittest discover -v"
        else
            print_warning "No test framework found or no tests detected in backend"
        fi
    else
        print_warning "No Python dependencies found in backend"
    fi
    
    cd ..
fi

# Web testing
if [ -d "web" ]; then
    cd web
    
    if [ -f "package.json" ]; then
        # Check for test scripts in package.json
        if grep -q '"test"' package.json; then
            run_test "web (npm test)" "npm test"
        elif grep -q '"test:unit"' package.json; then
            run_test "web (npm run test:unit)" "npm run test:unit"
        elif [ -d "node_modules" ] && [ -d "node_modules/.bin" ] && [ -f "node_modules/.bin/jest" ]; then
            run_test "web (jest)" "npx jest"
        elif command -v npx >/dev/null 2>&1; then
            # Try to run jest if it's installed
            if npx jest --version >/dev/null 2>&1; then
                run_test "web (jest)" "npx jest"
            else
                print_warning "No test framework found in web workspace"
            fi
        else
            print_warning "No test framework found in web workspace"
        fi
    else
        print_warning "No package.json found in web workspace"
    fi
    
    cd ..
fi

# Worker testing
if [ -d "worker" ]; then
    cd worker
    
    if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
        if command -v pytest >/dev/null 2>&1; then
            run_test "worker (pytest)" "pytest -v"
        elif command -v python3 >/dev/null 2>&1 && python3 -m pytest --version >/dev/null 2>&1; then
            run_test "worker (pytest module)" "python3 -m pytest -v"
        elif command -v python3 >/dev/null 2>&1 && find . -name "test_*.py" -o -name "*_test.py" | grep -q .; then
            run_test "worker (unittest)" "python3 -m unittest discover -v"
        else
            print_warning "No test framework found or no tests detected in worker"
        fi
    else
        print_warning "No Python dependencies found in worker"
    fi
    
    cd ..
fi

# Mobile testing
if [ -d "mobile" ]; then
    cd mobile
    
    if [ -f "package.json" ]; then
        if grep -q '"test"' package.json; then
            run_test "mobile (npm test)" "npm test"
        elif [ -d "node_modules" ] && [ -d "node_modules/.bin" ] && [ -f "node_modules/.bin/jest" ]; then
            run_test "mobile (jest)" "npx jest"
        elif command -v npx >/dev/null 2>&1; then
            if npx jest --version >/dev/null 2>&1; then
                run_test "mobile (jest)" "npx jest"
            else
                print_warning "No test framework found in mobile workspace"
            fi
        else
            print_warning "No test framework found in mobile workspace"
        fi
    else
        print_warning "No package.json found in mobile workspace"
    fi
    
    cd ..
fi

# Integration tests (if they exist)
if [ -d "tests" ] || [ -d "integration" ]; then
    print_status "Looking for integration tests..."
    
    if [ -d "tests" ]; then
        cd tests
        if command -v pytest >/dev/null 2>&1; then
            run_test "integration (pytest)" "pytest -v"
        fi
        cd ..
    fi
    
    if [ -d "integration" ]; then
        cd integration
        if command -v pytest >/dev/null 2>&1; then
            run_test "integration (pytest)" "pytest -v"
        fi
        cd ..
    fi
fi

# Final summary
echo ""
if [ "$OVERALL_SUCCESS" = true ]; then
    print_success "All tests passed!"
    exit 0
else
    print_error "Some tests failed. Please review the output above."
    exit 1
fi

#!/usr/bin/env bash
set -euo pipefail

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Track overall success
OVERALL_SUCCESS=true

# Function to run a check and track success
run_check() {
    local check_name="$1"
    local command="$2"
    
    print_status "Running $check_name..."
    
    if eval "$command"; then
        print_success "$check_name passed"
        return 0
    else
        print_error "$check_name failed"
        OVERALL_SUCCESS=false
        return 1
    fi
}

# Function to check if workspace exists and has required files
check_workspace() {
    local workspace="$1"
    local workspace_path="$2"
    
    if [ ! -d "$workspace_path" ]; then
        print_warning "Workspace $workspace does not exist at $workspace_path"
        return 0
    fi
    
    print_status "Checking $workspace workspace..."
    
    # Check for common configuration files
    case "$workspace" in
        "backend")
            if [ -f "$workspace_path/requirements.txt" ] || [ -f "$workspace_path/pyproject.toml" ]; then
                print_success "Backend workspace has Python dependency configuration"
                
                # Check for Python syntax
                if command_exists python3 && find "$workspace_path" -name "*.py" -type f | head -1 | grep -q .; then
                    run_check "Backend syntax check" "python3 -m py_compile \$(find $workspace_path -name '*.py' -type f | head -10)"
                fi
            else
                print_warning "Backend workspace missing Python dependency configuration"
            fi
            ;;
        "web")
            if [ -f "$workspace_path/package.json" ]; then
                print_success "Web workspace has Node.js configuration"
                
                # Check Node.js syntax if JavaScript/TypeScript files exist
                if command_exists node && find "$workspace_path" -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | head -1 | grep -q .; then
                    # Basic syntax check for JavaScript/TypeScript
                    run_check "Web syntax check" "node -c \$(find $workspace_path -name '*.js' -type f | head -5 2>/dev/null || true)"
                fi
            else
                print_warning "Web workspace missing package.json"
            fi
            ;;
        "mobile")
            if [ -f "$workspace_path/package.json" ]; then
                print_success "Mobile workspace has Node.js configuration"
            else
                print_warning "Mobile workspace missing package.json"
            fi
            ;;
        "worker")
            if [ -f "$workspace_path/requirements.txt" ] || [ -f "$workspace_path/pyproject.toml" ]; then
                print_success "Worker workspace has Python dependency configuration"
            else
                print_warning "Worker workspace missing Python dependency configuration"
            fi
            ;;
    esac
}

print_status "Running comprehensive repository checks..."

# Check repository structure
print_status "Checking repository structure..."

REQUIRED_DIRS=("backend" "web" "mobile" "worker" "scripts" "docs" "infra")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_success "Directory $dir exists"
    else
        print_warning "Directory $dir missing"
    fi
done

# Check for essential files
print_status "Checking essential files..."

ESSENTIAL_FILES=("Makefile" "README.md" ".gitignore" ".pre-commit-config.yaml")
for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "File $file exists"
    else
        print_error "File $file missing"
        OVERALL_SUCCESS=false
    fi
done

# Check workspace configurations
check_workspace "backend" "backend"
check_workspace "web" "web"
check_workspace "mobile" "mobile"
check_workspace "worker" "worker"

# Check script files
print_status "Checking script files..."

if [ -f "scripts/lint.sh" ]; then
    if [ -x "scripts/lint.sh" ]; then
        print_success "scripts/lint.sh is executable"
    else
        print_warning "scripts/lint.sh is not executable"
    fi
else
    print_warning "scripts/lint.sh not found"
fi

if [ -f "scripts/test.sh" ]; then
    if [ -x "scripts/test.sh" ]; then
        print_success "scripts/test.sh is executable"
    else
        print_warning "scripts/test.sh is not executable"
    fi
else
    print_warning "scripts/test.sh not found"
fi

# Check environment files
print_status "Checking environment files..."

if [ -f ".env" ]; then
    print_success ".env file exists"
else
    print_warning ".env file missing (run 'make setup' to create)"
fi

# Check for common development tools
print_status "Checking development tools..."

if command_exists python3; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    print_success "Python 3: $PYTHON_VERSION"
else
    print_error "Python 3 not found"
    OVERALL_SUCCESS=false
fi

if command_exists node; then
    NODE_VERSION=$(node --version 2>&1)
    print_success "Node.js: $NODE_VERSION"
else
    print_error "Node.js not found"
    OVERALL_SUCCESS=false
fi

if command_exists npm; then
    NPM_VERSION=$(npm --version 2>&1)
    print_success "npm: $NPM_VERSION"
else
    print_error "npm not found"
    OVERALL_SUCCESS=false
fi

# Optional tools
if command_exists git; then
    GIT_VERSION=$(git --version 2>&1)
    print_success "Git: $GIT_VERSION"
else
    print_warning "Git not found (recommended for version control)"
fi

if command_exists make; then
    MAKE_VERSION=$(make --version 2>&1 | head -1)
    print_success "Make: $MAKE_VERSION"
else
    print_warning "Make not found (recommended for build automation)"
fi

# Check Makefile targets
if [ -f "Makefile" ] && command_exists make; then
    print_status "Checking Makefile targets..."
    
    # Check if help target works
    if make help >/dev/null 2>&1; then
        print_success "Makefile help target works"
    else
        print_warning "Makefile help target not working"
    fi
fi

# Final summary
echo ""
if [ "$OVERALL_SUCCESS" = true ]; then
    print_success "All critical checks passed!"
    echo ""
    print_status "Repository is ready for development."
    exit 0
else
    print_error "Some checks failed. Please review the output above."
    echo ""
    print_status "Run 'make setup' to initialize the development environment."
    exit 1
fi
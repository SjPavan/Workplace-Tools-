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

# Function to install package if not exists
ensure_command() {
    if ! command_exists "$1"; then
        print_status "Installing $2..."
        if command_exists apt-get; then
            sudo apt-get update && sudo apt-get install -y "$2"
        elif command_exists brew; then
            brew install "$2"
        elif command_exists yum; then
            sudo yum install -y "$2"
        else
            print_error "Package manager not found. Please install $2 manually."
            exit 1
        fi
    else
        print_success "$1 is already installed"
    fi
}

print_status "Starting local development environment setup..."

# Check for required system tools
print_status "Checking system requirements..."

if command_exists python3; then
    print_success "Python 3 is installed"
else
    print_error "Python 3 is required but not installed"
    exit 1
fi

if command_exists node; then
    print_success "Node.js is installed"
else
    print_error "Node.js is required but not installed"
    exit 1
fi

if command_exists npm; then
    print_success "npm is installed"
else
    print_error "npm is required but not installed"
    exit 1
fi

# Install Python package management tools
if command_exists pip; then
    print_success "pip is installed"
else
    print_warning "pip not found, installing..."
    python3 -m ensurepip --upgrade
fi

# Install optional but recommended tools
if command_exists git; then
    print_success "git is installed"
else
    print_warning "git not found, installing..."
    ensure_command git git
fi

# Install Python development tools
print_status "Setting up Python development environment..."

# Check for poetry or use pip
if command_exists poetry; then
    print_success "Poetry is installed"
    POETRY_AVAILABLE=true
else
    print_warning "Poetry not found, will use pip for Python dependencies"
    POETRY_AVAILABLE=false
    
    # Install common Python development tools
    if command_exists pip; then
        print_status "Installing Python development tools..."
        pip install --user black isort flake8 pylint pytest 2>/dev/null || true
    fi
fi

# Install Node.js development tools
print_status "Setting up Node.js development environment..."

if command_exists npm; then
    print_status "Installing global Node.js development tools..."
    npm install -g prettier eslint jest typescript ts-node 2>/dev/null || true
fi

# Set up pre-commit hooks
print_status "Setting up pre-commit hooks..."
if command_exists pip; then
    pip install --user pre-commit 2>/dev/null || true
fi

if command_exists pre-commit; then
    if [ -f .pre-commit-config.yaml ]; then
        pre-commit install
        print_success "Pre-commit hooks installed"
    else
        print_warning "No .pre-commit-config.yaml found"
    fi
else
    print_warning "pre-commit not available, skipping hook installation"
fi

# Create environment files
print_status "Setting up environment files..."
make setup

# Install dependencies
print_status "Installing project dependencies..."
make install

# Run initial checks
print_status "Running initial setup checks..."
if [ -f scripts/checks.sh ]; then
    chmod +x scripts/checks.sh
    ./scripts/checks.sh
fi

print_success "Local development environment setup complete!"
echo ""
print_status "Next steps:"
echo "  1. Review and update environment variables in .env files"
echo "  2. Run 'make help' to see available commands"
echo "  3. Start development with 'make run-backend' and 'make run-web'"
echo "  4. Run 'make lint' and 'make test' before committing changes"
echo ""
print_status "For more information, see the README.md file"
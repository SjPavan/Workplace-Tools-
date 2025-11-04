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

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Install with: npm install -g vercel"
        exit 1
    fi
}

# Validate environment variables
validate_environment() {
    print_status "Validating web deployment environment..."
    
    local required_vars=(
        "VERCEL_TOKEN"
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

# Login to Vercel
login_vercel() {
    print_status "Logging in to Vercel..."
    
    # Set Vercel token
    export VERCEL_TOKEN="$VERCEL_TOKEN"
    
    # Verify login
    if vercel whoami > /dev/null 2>&1; then
        print_success "Vercel login successful"
    else
        print_error "Vercel login failed"
        exit 1
    fi
}

# Setup Vercel project
setup_vercel_project() {
    print_status "Setting up Vercel project..."
    
    cd "$PROJECT_ROOT/web"
    
    # Check if vercel.json exists
    if [ ! -f "vercel.json" ]; then
        print_warning "vercel.json not found, creating default configuration"
        create_vercel_config
    fi
    
    # Link to project or create new one
    local project_name="web-${ENVIRONMENT}"
    
    if [ ! -f ".vercel/project.json" ]; then
        print_status "Linking to Vercel project: $project_name"
        vercel link --project "$project_name" --confirm
    else
        print_status "Already linked to Vercel project"
    fi
    
    print_success "Vercel project setup completed"
}

# Create Vercel configuration if it doesn't exist
create_vercel_config() {
    cat > vercel.json << EOF
{
  "version": 2,
  "name": "web-${ENVIRONMENT}",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_ENVIRONMENT": "${ENVIRONMENT}",
    "NEXT_PUBLIC_SUPABASE_PROJECT_ID": "@supabase-project-id",
    "NEXT_PUBLIC_SUPABASE_API_URL": "@supabase-api-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_ENVIRONMENT": "${ENVIRONMENT}"
    }
  },
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/health",
      "destination": "/api/health"
    }
  ]
}
EOF

    print_success "Created vercel.json configuration"
}

# Install dependencies
install_dependencies() {
    print_status "Installing web dependencies..."
    
    cd "$PROJECT_ROOT/web"
    
    if [ -f "package.json" ]; then
        npm ci
        print_success "Dependencies installed"
    else
        print_error "package.json not found in web directory"
        exit 1
    fi
}

# Build web application
build_web() {
    print_status "Building web application..."
    
    cd "$PROJECT_ROOT/web"
    
    # Set environment variables for build
    export NEXT_PUBLIC_ENVIRONMENT="$ENVIRONMENT"
    export NEXT_PUBLIC_SUPABASE_PROJECT_ID="$SUPABASE_PROJECT_ID"
    export NEXT_PUBLIC_SUPABASE_API_URL="$SUPABASE_API_URL"
    export NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
    
    # Build the application
    if npm run build; then
        print_success "Web application built successfully"
    else
        print_error "Failed to build web application"
        exit 1
    fi
}

# Deploy to Vercel
deploy_web() {
    print_status "Deploying web application to Vercel..."
    
    cd "$PROJECT_ROOT/web"
    
    # Deploy with environment-specific settings
    local deploy_args=(
        "--prod"  # Always deploy to production for the environment
    )
    
    if [ "$ENVIRONMENT" = "dev" ]; then
        deploy_args=("--meta" "env=dev")
    elif [ "$ENVIRONMENT" = "staging" ]; then
        deploy_args=("--meta" "env=staging")
    elif [ "$ENVIRONMENT" = "prod" ]; then
        deploy_args=("--prod" "--meta" "env=prod")
    fi
    
    if vercel deploy "${deploy_args[@]}"; then
        print_success "Web application deployed to Vercel"
    else
        print_error "Failed to deploy web application to Vercel"
        exit 1
    fi
    
    # Get deployment URL
    local deployment_url=$(vercel ls --scope "$VERCEL_ORG_ID" 2>/dev/null | grep "web-${ENVIRONMENT}" | head -1 | awk '{print $2}' || echo "Check Vercel dashboard")
    print_status "Deployment URL: $deployment_url"
}

# Test deployment
test_deployment() {
    print_status "Testing web deployment..."
    
    # Get the deployment URL
    local deployment_url=$(vercel ls --scope "$VERCEL_ORG_ID" 2>/dev/null | grep "web-${ENVIRONMENT}" | head -1 | awk '{print $2}' || echo "")
    
    if [ -n "$deployment_url" ]; then
        # Test health endpoint
        if curl -f -s "$deployment_url/api/health" > /dev/null 2>&1; then
            print_success "Web health check passed"
        else
            print_warning "Web health check failed, but deployment may still be starting"
        fi
        
        # Test main page
        if curl -f -s "$deployment_url" > /dev/null 2>&1; then
            print_success "Web main page accessible"
        else
            print_warning "Web main page not accessible, but deployment may still be starting"
        fi
    else
        print_warning "Could not retrieve deployment URL for testing"
    fi
}

# Setup environment variables in Vercel
setup_vercel_env() {
    print_status "Setting up Vercel environment variables..."
    
    cd "$PROJECT_ROOT/web"
    
    local env_vars=(
        "NEXT_PUBLIC_ENVIRONMENT:$ENVIRONMENT"
        "NEXT_PUBLIC_SUPABASE_PROJECT_ID:$SUPABASE_PROJECT_ID"
        "NEXT_PUBLIC_SUPABASE_API_URL:$SUPABASE_API_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY:$SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY:$SUPABASE_SERVICE_ROLE_KEY"
    )
    
    for env_var in "${env_vars[@]}"; do
        IFS=':' read -r var_name var_value <<< "$env_var"
        
        # Set environment variable
        if vercel env add "$var_name" "$ENVIRONMENT" <<< "$var_value"; then
            print_status "Set environment variable: $var_name"
        else
            print_warning "Failed to set environment variable: $var_name"
        fi
    done
    
    print_success "Environment variables configured"
}

# Create basic web structure if it doesn't exist
create_web_structure() {
    print_status "Creating basic web structure..."
    
    cd "$PROJECT_ROOT"
    
    if [ ! -d "web" ]; then
        mkdir -p web
    fi
    
    cd web
    
    # Create package.json if it doesn't exist
    if [ ! -f "package.json" ]; then
        cat > package.json << EOF
{
  "name": "web-${ENVIRONMENT}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.0.0",
    "typescript": "^5.0.0"
  }
}
EOF
    fi
    
    # Create basic Next.js structure
    mkdir -p app/api/health components
    
    # Create health API route
    cat > app/api/health/route.ts << EOF
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'unknown',
  });
}
EOF

    # Create basic layout
    cat > app/layout.tsx << EOF
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Web App',
  description: 'Web application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
EOF

    # Create basic page
    cat > app/page.tsx << EOF
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">
          Welcome to Web App
        </h1>
      </div>
    </main>
  )
}
EOF

    print_success "Created basic web structure"
}

# Main deployment function
main() {
    print_status "Starting web deployment for environment: $ENVIRONMENT"
    
    # Validate environment
    validate_environment
    
    # Check dependencies
    check_vercel_cli
    
    # Login to Vercel
    login_vercel
    
    # Create web structure if needed
    if [ ! -d "$PROJECT_ROOT/web" ]; then
        create_web_structure
    fi
    
    # Setup Vercel project
    setup_vercel_project
    
    # Setup environment variables
    setup_vercel_env
    
    # Install dependencies
    install_dependencies
    
    # Build web application
    build_web
    
    # Deploy to Vercel
    deploy_web
    
    # Test deployment
    test_deployment
    
    print_success "Web deployment completed!"
    
    # Output service information
    local deployment_url=$(vercel ls --scope "$VERCEL_ORG_ID" 2>/dev/null | grep "web-${ENVIRONMENT}" | head -1 | awk '{print $2}' || echo "Check Vercel dashboard")
    print_status "Web URL: $deployment_url"
    print_status "Health check: $deployment_url/api/health"
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

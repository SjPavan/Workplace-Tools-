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

# Check if EAS CLI is installed
check_eas_cli() {
    if ! command -v eas &> /dev/null; then
        print_error "EAS CLI not found. Install with: npm install -g @expo/eas-cli"
        exit 1
    fi
}

# Validate environment variables
validate_environment() {
    print_status "Validating mobile deployment environment..."
    
    local required_vars=(
        "EAS_PROJECT_ID"
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

# Login to EAS
login_eas() {
    print_status "Logging in to EAS..."
    
    # Check if already logged in
    if eas whoami > /dev/null 2>&1; then
        print_success "Already logged in to EAS"
        return
    fi
    
    # Login using token if available
    if [ -n "${EAS_TOKEN:-}" ]; then
        export EXPO_TOKEN="$EAS_TOKEN"
        if eas whoami > /dev/null 2>&1; then
            print_success "EAS login successful using token"
            return
        fi
    fi
    
    print_error "EAS login failed. Please run 'eas login' manually"
    exit 1
}

# Setup EAS project
setup_eas_project() {
    print_status "Setting up EAS project..."
    
    cd "$PROJECT_ROOT"
    
    # Check if mobile directory exists
    if [ ! -d "mobile" ]; then
        print_warning "Mobile directory not found, creating basic mobile structure"
        create_mobile_structure
    fi
    
    cd mobile
    
    # Check if eas.json exists
    if [ ! -f "eas.json" ]; then
        print_warning "eas.json not found, creating default configuration"
        create_eas_config
    fi
    
    # Link to EAS project
    if [ ! -f ".expo/project-id" ]; then
        print_status "Linking to EAS project: $EAS_PROJECT_ID"
        eas project:link --id "$EAS_PROJECT_ID"
    else
        print_status "Already linked to EAS project"
    fi
    
    print_success "EAS project setup completed"
}

# Create EAS configuration if it doesn't exist
create_eas_config() {
    cat > eas.json << EOF
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "resourceClass": "medium"
      },
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "dev",
        "EXPO_PUBLIC_SUPABASE_PROJECT_ID": "${SUPABASE_PROJECT_ID}",
        "EXPO_PUBLIC_SUPABASE_API_URL": "${SUPABASE_API_URL}",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "resourceClass": "medium"
      },
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "staging",
        "EXPO_PUBLIC_SUPABASE_PROJECT_ID": "${SUPABASE_PROJECT_ID}",
        "EXPO_PUBLIC_SUPABASE_API_URL": "${SUPABASE_API_URL}",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "resourceClass": "medium"
      },
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "prod",
        "EXPO_PUBLIC_SUPABASE_PROJECT_ID": "${SUPABASE_PROJECT_ID}",
        "EXPO_PUBLIC_SUPABASE_API_URL": "${SUPABASE_API_URL}",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "${APPLE_ID:-}",
        "ascAppId": "${ASC_APP_ID:-}",
        "appleTeamId": "${APPLE_TEAM_ID:-}"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json"
      }
    }
  }
}
EOF

    print_success "Created eas.json configuration"
}

# Create basic mobile structure if it doesn't exist
create_mobile_structure() {
    print_status "Creating basic mobile structure..."
    
    cd "$PROJECT_ROOT"
    
    mkdir -p mobile
    
    cd mobile
    
    # Create package.json
    cat > package.json << EOF
{
  "name": "mobile-${ENVIRONMENT}",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-status-bar": "~1.11.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@supabase/supabase-js": "^2.38.0",
    "expo-constants": "~15.4.0",
    "expo-linking": "~6.2.0",
    "expo-router": "~3.4.0",
    "react-native-safe-area-context": "4.8.0",
    "react-native-screens": "~3.29.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.1.3"
  },
  "private": true
}
EOF

    # Create app.json
    cat > app.json << EOF
{
  "expo": {
    "name": "Mobile App",
    "slug": "mobile-app-${ENVIRONMENT}",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.mobileapp.${ENVIRONMENT}"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.mobileapp.${ENVIRONMENT}"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router"
    ],
    "scheme": "mobile-app-${ENVIRONMENT}"
  }
}
EOF

    # Create basic app structure
    mkdir -p app assets
    
    # Create main app file
    cat > app/_layout.tsx << EOF
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
EOF

    cat > app/index.tsx << EOF
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Mobile App</Text>
      <Text style={styles.subtitle}>Environment: {process.env.EXPO_PUBLIC_ENVIRONMENT || 'unknown'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
EOF

    # Create placeholder assets
    mkdir -p assets
    touch assets/icon.png assets/splash.png assets/adaptive-icon.png assets/favicon.png
    
    print_success "Created basic mobile structure"
}

# Install mobile dependencies
install_dependencies() {
    print_status "Installing mobile dependencies..."
    
    cd "$PROJECT_ROOT/mobile"
    
    if [ -f "package.json" ]; then
        npm ci
        print_success "Mobile dependencies installed"
    else
        print_error "package.json not found in mobile directory"
        exit 1
    fi
}

# Build mobile application
build_mobile() {
    print_status "Building mobile application..."
    
    cd "$PROJECT_ROOT/mobile"
    
    # Determine build profile based on environment
    local build_profile="preview"
    if [ "$ENVIRONMENT" = "dev" ]; then
        build_profile="development"
    elif [ "$ENVIRONMENT" = "prod" ]; then
        build_profile="production"
    fi
    
    # Build for both platforms
    local platforms=("ios" "android")
    
    for platform in "${platforms[@]}"; do
        print_status "Building for $platform..."
        
        if eas build --profile "$build_profile" --platform "$platform" --non-interactive; then
            print_success "$platform build completed"
        else
            print_error "$platform build failed"
            exit 1
        fi
    done
    
    print_success "Mobile application built successfully"
}

# Deploy mobile application (submit to app stores)
deploy_mobile() {
    print_status "Deploying mobile application..."
    
    cd "$PROJECT_ROOT/mobile"
    
    # Only deploy to app stores in production
    if [ "$ENVIRONMENT" = "prod" ]; then
        print_status "Submitting to app stores..."
        
        # Submit to both platforms
        local platforms=("ios" "android")
        
        for platform in "${platforms[@]}"; do
            print_status "Submitting $platform to app store..."
            
            if eas submit --profile "production" --platform "$platform" --non-interactive; then
                print_success "$platform submitted to app store"
            else
                print_warning "$platform submission failed"
            fi
        done
    else
        print_status "Skipping app store submission (only for production)"
    fi
    
    print_success "Mobile deployment completed"
}

# Test build configuration
test_build() {
    print_status "Testing mobile build configuration..."
    
    cd "$PROJECT_ROOT/mobile"
    
    # Run Expo doctor to check configuration
    if expo doctor; then
        print_success "Mobile configuration is healthy"
    else
        print_warning "Mobile configuration has issues"
    fi
    
    # Test build configuration without actually building
    if eas build --profile "development" --platform "android" --dry-run; then
        print_success "Build configuration test passed"
    else
        print_warning "Build configuration test failed"
    fi
}

# Setup app store credentials
setup_store_credentials() {
    print_status "Setting up app store credentials..."
    
    cd "$PROJECT_ROOT/mobile"
    
    # Create credentials directory
    mkdir -p credentials
    
    # Setup Apple credentials if available
    if [ -n "${APPLE_ID:-}" ] && [ -n "${ASC_APP_ID:-}" ] && [ -n "${APPLE_TEAM_ID:-}" ]; then
        print_status "Apple credentials configured"
    else
        print_warning "Apple credentials not configured"
    fi
    
    # Setup Google Play credentials if available
    if [ -f "google-service-account.json" ]; then
        print_status "Google Play credentials configured"
    else
        print_warning "Google Play credentials not configured"
    fi
}

# Main deployment function
main() {
    print_status "Starting mobile deployment for environment: $ENVIRONMENT"
    
    # Validate environment
    validate_environment
    
    # Check dependencies
    check_eas_cli
    
    # Login to EAS
    login_eas
    
    # Setup EAS project
    setup_eas_project
    
    # Setup store credentials
    setup_store_credentials
    
    # Install dependencies
    install_dependencies
    
    # Test build configuration
    test_build
    
    # Build mobile application
    build_mobile
    
    # Deploy mobile application
    deploy_mobile
    
    print_success "Mobile deployment completed!"
    
    # Output service information
    print_status "Build profile: $([ "$ENVIRONMENT" = "dev" ] && echo "development" || [ "$ENVIRONMENT" = "prod" ] && echo "production" || echo "preview")"
    print_status "Platforms: iOS and Android"
    if [ "$ENVIRONMENT" = "prod" ]; then
        print_status "Status: Submitted to app stores"
    else
        print_status "Status: Available for testing via EAS"
    fi
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
        --platform|-p)
            PLATFORM="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--environment|-e ENVIRONMENT] [--skip-tests] [--platform|-p PLATFORM]"
            echo "Environments: dev, staging, prod"
            echo "Platforms: ios, android, all (default: all)"
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

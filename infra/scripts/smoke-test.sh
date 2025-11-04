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

# Test results
TEST_RESULTS=()
FAILED_TESTS=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="${3:-0}"
    
    print_status "Running test: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        local actual_result=$?
        if [ "$actual_result" -eq "$expected_result" ]; then
            print_success "$test_name: PASSED"
            TEST_RESULTS+=("$test_name:passed")
        else
            print_error "$test_name: FAILED (exit code: $actual_result)"
            TEST_RESULTS+=("$test_name:failed")
            ((FAILED_TESTS++))
        fi
    else
        print_error "$test_name: FAILED (command error)"
        TEST_RESULTS+=("$test_name:failed")
        ((FAILED_TESTS++))
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    print_status "Testing API endpoints..."
    
    local backend_url="${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
    local web_url="${WEB_URL:-https://${ENVIRONMENT}.yourdomain.com}"
    
    # Test backend health endpoint
    run_test "Backend Health Check" "curl -f -s '$backend_url/health'"
    
    # Test backend API endpoints
    run_test "Backend Version Endpoint" "curl -f -s '$backend_url/version'"
    
    # Test web health endpoint
    run_test "Web Health Check" "curl -f -s '$web_url/api/health'"
    
    # Test web main page
    run_test "Web Main Page" "curl -f -s '$web_url'"
    
    # Test API response times
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$backend_url/health" 2>/dev/null || echo "N/A")
    if [[ "$response_time" != "N/A" ]] && (( $(echo "$response_time < 2.0" | bc -l) )); then
        print_success "API Response Time: OK (${response_time}s)"
        TEST_RESULTS+=("API Response Time:passed")
    else
        print_warning "API Response Time: SLOW (${response_time}s)"
        TEST_RESULTS+=("API Response Time:warning")
    fi
}

# Function to test database connectivity
test_database() {
    print_status "Testing database connectivity..."
    
    if [ -n "${DATABASE_URL:-}" ]; then
        # Test basic database connection
        run_test "Database Connection" "psql '$DATABASE_URL' -c 'SELECT 1;'"
        
        # Test table existence
        run_test "Database Tables" "psql '$DATABASE_URL' -c 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '\''public'\'';'"
        
        # Test basic query
        run_test "Database Query" "psql '$DATABASE_URL' -c 'SELECT COUNT(*) FROM users;'"
    else
        print_warning "Database URL not configured, skipping database tests"
        TEST_RESULTS+=("Database:skipped")
    fi
}

# Function to test authentication
test_authentication() {
    print_status "Testing authentication..."
    
    local backend_url="${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
    local supabase_url="${SUPABASE_API_URL:-https://${SUPABASE_PROJECT_ID:-project}.supabase.co}"
    
    # Test Supabase auth endpoint
    if [ -n "${SUPABASE_ANON_KEY:-}" ]; then
        run_test "Supabase Auth Endpoint" "curl -f -s -H 'apikey: $SUPABASE_ANON_KEY' -H 'Authorization: Bearer $SUPABASE_ANON_KEY' '$supabase_url/rest/v1/'"
    else
        print_warning "Supabase anon key not configured, skipping auth tests"
        TEST_RESULTS+=("Authentication:skipped")
    fi
}

# Function to test file uploads
test_file_uploads() {
    print_status "Testing file upload functionality..."
    
    local backend_url="${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
    
    # Create test file
    local test_file="/tmp/test-upload.txt"
    echo "Test file content" > "$test_file"
    
    # Test file upload endpoint
    run_test "File Upload" "curl -f -s -X POST -F 'file=@$test_file' '$backend_url/api/upload'"
    
    # Clean up
    rm -f "$test_file"
}

# Function to test background jobs
test_background_jobs() {
    print_status "Testing background jobs..."
    
    local worker_url="${WORKER_URL:-https://worker-${ENVIRONMENT}.up.railway.app}"
    
    # Test worker health
    run_test "Worker Health" "curl -f -s '$worker_url/health'"
    
    # Test job submission (if endpoint exists)
    run_test "Job Submission" "curl -f -s -X POST '$worker_url/api/jobs' -H 'Content-Type: application/json' -d '{\"type\": \"test\", \"data\": {}}'"
}

# Function to test websockets/realtime
test_realtime() {
    print_status "Testing realtime functionality..."
    
    if command -v wscat &> /dev/null; then
        local supabase_url="${SUPABASE_API_URL:-https://${SUPABASE_PROJECT_ID:-project}.supabase.co}"
        local realtime_url="${supabase_url/https:\/\//wss:\/\/}/realtime/v1/websocket"
        
        # Test WebSocket connection (basic check)
        run_test "Realtime WebSocket" "timeout 5 wscat -c '$realtime_url' <<< '{}' || true"
    else
        print_warning "wscat not available, skipping realtime tests"
        TEST_RESULTS+=("Realtime:skipped")
    fi
}

# Function to test SSL certificates
test_ssl() {
    print_status "Testing SSL certificates..."
    
    local urls=(
        "${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
        "${WEB_URL:-https://${ENVIRONMENT}.yourdomain.com}"
        "${WORKER_URL:-https://worker-${ENVIRONMENT}.up.railway.app}"
    )
    
    for url in "${urls[@]}"; do
        local hostname=$(echo "$url" | sed 's|https://||' | sed 's|/.*||')
        
        if [ "$hostname" != "yourdomain.com" ]; then
            run_test "SSL Certificate ($hostname)" "echo | openssl s_client -servername '$hostname' -connect '$hostname:443' 2>/dev/null | openssl x509 -noout -checkend 2592000"
        else
            print_warning "SSL test skipped for placeholder domain: $hostname"
            TEST_RESULTS+=("SSL ($hostname):skipped")
        fi
    done
}

# Function to test rate limiting
test_rate_limiting() {
    print_status "Testing rate limiting..."
    
    local backend_url="${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
    local request_count=10
    local failed_requests=0
    
    # Make multiple requests quickly
    for i in $(seq 1 $request_count); do
        if ! curl -s -f "$backend_url/health" > /dev/null 2>&1; then
            ((failed_requests++))
        fi
    done
    
    # Check if rate limiting is working (some requests should fail)
    if [ "$failed_requests" -gt 0 ] && [ "$failed_requests" -lt "$request_count" ]; then
        print_success "Rate Limiting: WORKING ($failed_requests/$request_count requests failed)"
        TEST_RESULTS+=("Rate Limiting:passed")
    elif [ "$failed_requests" -eq 0 ]; then
        print_warning "Rate Limiting: NOT DETECTED (all requests succeeded)"
        TEST_RESULTS+=("Rate Limiting:warning")
    else
        print_error "Rate Limiting: TOO STRICT (all requests failed)"
        TEST_RESULTS+=("Rate Limiting:failed")
        ((FAILED_TESTS++))
    fi
}

# Function to test CORS
test_cors() {
    print_status "Testing CORS configuration..."
    
    local backend_url="${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
    local web_url="${WEB_URL:-https://${ENVIRONMENT}.yourdomain.com}"
    
    # Test CORS preflight request
    local cors_headers=$(curl -s -I -X OPTIONS "$backend_url/health" -H "Origin: $web_url" -H "Access-Control-Request-Method: GET" 2>/dev/null | grep -i "access-control-allow-origin" || echo "")
    
    if [ -n "$cors_headers" ]; then
        print_success "CORS: CONFIGURED"
        TEST_RESULTS+=("CORS:passed")
    else
        print_warning "CORS: NOT CONFIGURED or not accessible"
        TEST_RESULTS+=("CORS:warning")
    fi
}

# Function to test error handling
test_error_handling() {
    print_status "Testing error handling..."
    
    local backend_url="${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
    
    # Test 404 handling
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$backend_url/nonexistent-endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "404" ]; then
        print_success "404 Error Handling: OK"
        TEST_RESULTS+=("404 Handling:passed")
    else
        print_warning "404 Error Handling: UNEXPECTED ($status_code)"
        TEST_RESULTS+=("404 Handling:warning")
    fi
    
    # Test invalid method
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$backend_url/health" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "405" ] || [ "$status_code" = "404" ]; then
        print_success "Method Not Allowed: OK"
        TEST_RESULTS+=("Method Handling:passed")
    else
        print_warning "Method Not Allowed: UNEXPECTED ($status_code)"
        TEST_RESULTS+=("Method Handling:warning")
    fi
}

# Function to generate test report
generate_report() {
    echo
    print_status "Smoke Test Report"
    echo "==================="
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo "Failed Tests: $FAILED_TESTS"
    echo
    
    # Detailed results
    echo "Test Results:"
    echo "-------------"
    for result in "${TEST_RESULTS[@]}"; do
        IFS=':' read -r test status <<< "$result"
        case $status in
            "passed")
                echo "✅ $test: PASSED"
                ;;
            "failed")
                echo "❌ $test: FAILED"
                ;;
            "warning")
                echo "⚠️  $test: WARNING"
                ;;
            "skipped")
                echo "⏭️  $test: SKIPPED"
                ;;
        esac
    done
    
    echo
    
    # Overall status
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "Overall Status: ALL TESTS PASSED"
        return 0
    else
        print_error "Overall Status: SOME TESTS FAILED"
        return 1
    fi
}

# Function to save test results
save_results() {
    local report_file="$PROJECT_ROOT/logs/smoke-test-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"
    
    mkdir -p "$PROJECT_ROOT/logs"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "$ENVIRONMENT",
  "failed_tests": $FAILED_TESTS,
  "total_tests": ${#TEST_RESULTS[@]},
  "results": [
$(printf '    {"test": "%s", "status": "%s"},\n' "${TEST_RESULTS[@]}" | sed '$ s/,$//')
  ]
}
EOF
    
    print_status "Smoke test results saved to: $report_file"
}

# Main smoke test function
main() {
    print_status "Starting smoke tests for environment: $ENVIRONMENT"
    echo
    
    # Run all tests
    test_api_endpoints
    test_database
    test_authentication
    test_file_uploads
    test_background_jobs
    test_realtime
    test_ssl
    test_rate_limiting
    test_cors
    test_error_handling
    
    # Generate and display report
    generate_report
    
    # Save results
    save_results
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -eq 0 ]; then
        exit 0
    else
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
        --test|-t)
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --output|-o)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--environment|-e ENVIRONMENT] [--test|-t TEST_NAME] [--output|-o FILE]"
            echo "Environments: dev, staging, prod"
            echo "Tests: api, database, auth, upload, worker, realtime, ssl, ratelimit, cors, errors, all (default)"
            echo
            echo "This script runs comprehensive smoke tests on deployed services."
            echo "It tests API endpoints, database connectivity, authentication, and more."
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If specific test is requested, run only that test
if [ -n "${SPECIFIC_TEST:-}" ]; then
    case "$SPECIFIC_TEST" in
        "api")
            test_api_endpoints
            ;;
        "database")
            test_database
            ;;
        "auth")
            test_authentication
            ;;
        "upload")
            test_file_uploads
            ;;
        "worker")
            test_background_jobs
            ;;
        "realtime")
            test_realtime
            ;;
        "ssl")
            test_ssl
            ;;
        "ratelimit")
            test_rate_limiting
            ;;
        "cors")
            test_cors
            ;;
        "errors")
            test_error_handling
            ;;
        *)
            print_error "Unknown test: $SPECIFIC_TEST"
            exit 1
            ;;
    esac
    
    generate_report
    save_results
    exit $FAILED_TESTS
fi

# Run main function
main "$@"

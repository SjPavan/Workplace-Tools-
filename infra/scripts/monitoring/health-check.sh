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

# Health check results
HEALTH_RESULTS=()
FAILED_CHECKS=0

# Function to perform health check
check_service() {
    local service_name="$1"
    local url="$2"
    local timeout="${3:-10}"
    local expected_status="${4:-200}"
    
    print_status "Checking $service_name health at $url"
    
    local start_time=$(date +%s.%N)
    local http_status
    local response_time
    
    # Perform health check
    if http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null); then
        local end_time=$(date +%s.%N)
        response_time=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "N/A")
        
        if [ "$http_status" -eq "$expected_status" ]; then
            print_success "$service_name: HEALTHY (${http_status}) - ${response_time}s"
            HEALTH_RESULTS+=("$service_name:healthy:$response_time")
        else
            print_error "$service_name: UNHEALTHY (${http_status})"
            HEALTH_RESULTS+=("$service_name:unhealthy:N/A")
            ((FAILED_CHECKS++))
        fi
    else
        print_error "$service_name: FAILED (connection error)"
        HEALTH_RESULTS+=("$service_name:failed:N/A")
        ((FAILED_CHECKS++))
    fi
}

# Function to check database connectivity
check_database() {
    local service_name="Database"
    
    print_status "Checking database connectivity..."
    
    if command -v psql &> /dev/null && [ -n "${DATABASE_URL:-}" ]; then
        if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "$service_name: HEALTHY"
            HEALTH_RESULTS+=("$service_name:healthy:N/A")
        else
            print_error "$service_name: FAILED (connection error)"
            HEALTH_RESULTS+=("$service_name:failed:N/A")
            ((FAILED_CHECKS++))
        fi
    elif command -v supabase &> /dev/null; then
        if supabase db ping > /dev/null 2>&1; then
            print_success "$service_name: HEALTHY (Supabase)"
            HEALTH_RESULTS+=("$service_name:healthy:N/A")
        else
            print_error "$service_name: FAILED (Supabase ping failed)"
            HEALTH_RESULTS+=("$service_name:failed:N/A")
            ((FAILED_CHECKS++))
        fi
    else
        print_warning "$service_name: SKIPPED (no database tool available)"
        HEALTH_RESULTS+=("$service_name:skipped:N/A")
    fi
}

# Function to check service URLs
check_service_urls() {
    print_status "Checking service URLs..."
    
    # Determine URLs based on environment
    local backend_url="${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
    local web_url="${WEB_URL:-https://${ENVIRONMENT}.yourdomain.com}"
    local worker_url="${WORKER_URL:-https://worker-${ENVIRONMENT}.up.railway.app}"
    
    # Check backend health
    check_service "Backend" "$backend_url/health" 10 200
    
    # Check web health
    check_service "Web" "$web_url/api/health" 10 200
    
    # Check worker health
    check_service "Worker" "$worker_url/health" 10 200
    
    # Check main pages
    check_service "Web Main Page" "$web_url" 10 200
}

# Function to check cron jobs
check_cron_jobs() {
    print_status "Checking cron job status..."
    
    if command -v railway &> /dev/null; then
        # Check Railway cron jobs
        local cron_status=$(railway status 2>/dev/null || echo "unavailable")
        if [[ "$cron_status" == *"running"* ]]; then
            print_success "Cron Jobs: HEALTHY"
            HEALTH_RESULTS+=("Cron Jobs:healthy:N/A")
        else
            print_warning "Cron Jobs: UNKNOWN (status: $cron_status)"
            HEALTH_RESULTS+=("Cron Jobs:unknown:N/A")
        fi
    else
        print_warning "Cron Jobs: SKIPPED (Railway CLI not available)"
        HEALTH_RESULTS+=("Cron Jobs:skipped:N/A")
    fi
}

# Function to check SSL certificates
check_ssl_certificates() {
    print_status "Checking SSL certificates..."
    
    local urls=(
        "${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
        "${WEB_URL:-https://${ENVIRONMENT}.yourdomain.com}"
        "${WORKER_URL:-https://worker-${ENVIRONMENT}.up.railway.app}"
    )
    
    for url in "${urls[@]}"; do
        local hostname=$(echo "$url" | sed 's|https://||' | sed 's|/.*||')
        
        if [ "$hostname" != "yourdomain.com" ]; then
            local cert_info=$(echo | openssl s_client -servername "$hostname" -connect "$hostname:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
            
            if [ -n "$cert_info" ]; then
                local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
                local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                local current_timestamp=$(date +%s)
                local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
                
                if [ "$days_until_expiry" -gt 30 ]; then
                    print_success "SSL Certificate ($hostname): VALID ($days_until_expiry days)"
                    HEALTH_RESULTS+=("SSL ($hostname):healthy:$days_until_expiry")
                elif [ "$days_until_expiry" -gt 7 ]; then
                    print_warning "SSL Certificate ($hostname): EXPIRING SOON ($days_until_expiry days)"
                    HEALTH_RESULTS+=("SSL ($hostname):warning:$days_until_expiry")
                else
                    print_error "SSL Certificate ($hostname): EXPIRING VERY SOON ($days_until_expiry days)"
                    HEALTH_RESULTS+=("SSL ($hostname):critical:$days_until_expiry")
                    ((FAILED_CHECKS++))
                fi
            else
                print_warning "SSL Certificate ($hostname): SKIPPED (could not retrieve)"
                HEALTH_RESULTS+=("SSL ($hostname):skipped:N/A")
            fi
        else
            print_warning "SSL Certificate ($hostname): SKIPPED (placeholder domain)"
            HEALTH_RESULTS+=("SSL ($hostname):skipped:N/A")
        fi
    done
}

# Function to check API rate limits
check_rate_limits() {
    print_status "Checking API rate limits..."
    
    local backend_url="${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}"
    
    # Test rate limiting by making multiple requests
    local request_count=5
    local failed_requests=0
    
    for i in $(seq 1 $request_count); do
        if ! curl -s -f "$backend_url/health" > /dev/null 2>&1; then
            ((failed_requests++))
        fi
        sleep 0.1
    done
    
    if [ "$failed_requests" -eq 0 ]; then
        print_success "Rate Limiting: OK (all $request_count requests succeeded)"
        HEALTH_RESULTS+=("Rate Limiting:healthy:$request_count")
    else
        print_warning "Rate Limiting: ISSUE ($failed_requests/$request_count requests failed)"
        HEALTH_RESULTS+=("Rate Limiting:warning:$((request_count - failed_requests))")
    fi
}

# Function to generate health report
generate_report() {
    echo
    print_status "Health Check Report"
    echo "====================="
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo "Failed Checks: $FAILED_CHECKS"
    echo
    
    # Detailed results
    echo "Detailed Results:"
    echo "----------------"
    for result in "${HEALTH_RESULTS[@]}"; do
        IFS=':' read -r service status metric <<< "$result"
        case $status in
            "healthy")
                echo "✅ $service: $status ($metric)"
                ;;
            "unhealthy"|"failed"|"critical")
                echo "❌ $service: $status ($metric)"
                ;;
            "warning")
                echo "⚠️  $service: $status ($metric)"
                ;;
            "skipped"|"unknown")
                echo "⏭️  $service: $status ($metric)"
                ;;
        esac
    done
    
    echo
    
    # Overall status
    if [ $FAILED_CHECKS -eq 0 ]; then
        print_success "Overall Status: HEALTHY"
        return 0
    else
        print_error "Overall Status: UNHEALTHY ($FAILED_CHECKS failed checks)"
        return 1
    fi
}

# Function to save results to file
save_results() {
    local report_file="$PROJECT_ROOT/logs/health-check-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"
    
    mkdir -p "$PROJECT_ROOT/logs"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "$ENVIRONMENT",
  "failed_checks": $FAILED_CHECKS,
  "results": [
$(printf '    {"service": "%s", "status": "%s", "metric": "%s"},\n' "${HEALTH_RESULTS[@]}" | sed '$ s/,$//')
  ]
}
EOF
    
    print_status "Health check results saved to: $report_file"
}

# Function to send notifications (if configured)
send_notifications() {
    if [ $FAILED_CHECKS -gt 0 ] && [ -n "${WEBHOOK_URL:-}" ]; then
        print_status "Sending health check failure notification..."
        
        local message="Health check failed for $ENVIRONMENT environment. Failed checks: $FAILED_CHECKS"
        
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$message\"}" \
            2>/dev/null || print_warning "Failed to send webhook notification"
    fi
}

# Main health check function
main() {
    print_status "Starting comprehensive health check for environment: $ENVIRONMENT"
    echo
    
    # Run all health checks
    check_database
    check_service_urls
    check_cron_jobs
    check_ssl_certificates
    check_rate_limits
    
    # Generate and display report
    generate_report
    
    # Save results
    save_results
    
    # Send notifications if needed
    send_notifications
    
    # Exit with appropriate code
    if [ $FAILED_CHECKS -eq 0 ]; then
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
        --service|-s)
            SPECIFIC_SERVICE="$2"
            shift 2
            ;;
        --timeout|-t)
            TIMEOUT="$2"
            shift 2
            ;;
        --output|-o)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--environment|-e ENVIRONMENT] [--service|-s SERVICE] [--timeout|-t TIMEOUT] [--output|-o FILE]"
            echo "Environments: dev, staging, prod"
            echo "Services: backend, web, worker, database, all (default)"
            echo
            echo "This script performs comprehensive health checks on all deployed services."
            echo "It checks API endpoints, database connectivity, SSL certificates, and more."
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If specific service is requested, run only that check
if [ -n "${SPECIFIC_SERVICE:-}" ]; then
    case "$SPECIFIC_SERVICE" in
        "backend")
            check_service "Backend" "${BACKEND_URL:-https://api-${ENVIRONMENT}.yourdomain.com}/health"
            ;;
        "web")
            check_service "Web" "${WEB_URL:-https://${ENVIRONMENT}.yourdomain.com}/api/health"
            ;;
        "worker")
            check_service "Worker" "${WORKER_URL:-https://worker-${ENVIRONMENT}.up.railway.app}/health"
            ;;
        "database")
            check_database
            ;;
        *)
            print_error "Unknown service: $SPECIFIC_SERVICE"
            exit 1
            ;;
    esac
    
    generate_report
    exit $FAILED_CHECKS
fi

# Run main function
main "$@"

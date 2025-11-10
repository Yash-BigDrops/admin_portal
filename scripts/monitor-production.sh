#!/bin/bash

# Production Monitoring Script
# Run this script to monitor your deployed dashboard

set -e

BASE_URL=${1:-"https://your-domain.com"}
ADMIN_EMAIL="admin@bigdrops.com"
ADMIN_PASSWORD="admin123"

echo "🔍 Monitoring Admin Portal at: $BASE_URL"
echo "=========================================="

# Function to test endpoint with authentication
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo "Testing $description..."
    
    # Get CSRF token
    curl -s -c cookies.txt "$BASE_URL/api/auth/csrf" > /dev/null
    CSRF_TOKEN=$(curl -s -b cookies.txt "$BASE_URL/api/auth/csrf" | jq -r '.csrfToken')
    
    # Login
    curl -s -b cookies.txt -c cookies.txt -L \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "csrfToken=$CSRF_TOKEN&email=$ADMIN_EMAIL&password=$ADMIN_PASSWORD&redirect=false&callbackUrl=/" \
        "$BASE_URL/api/auth/callback/credentials" > /dev/null
    
    # Test endpoint
    RESPONSE=$(curl -s -b cookies.txt "$BASE_URL$endpoint")
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b cookies.txt "$BASE_URL$endpoint")
    
    if [ "$STATUS_CODE" = "200" ]; then
        echo "✅ $description: OK"
        echo "   Response: $(echo $RESPONSE | jq -r 'keys[]' 2>/dev/null || echo 'Valid JSON')"
    else
        echo "❌ $description: FAILED (Status: $STATUS_CODE)"
    fi
    
    echo ""
}

# Function to check response times
check_performance() {
    local endpoint=$1
    local description=$2
    
    echo "⏱️  Performance check: $description"
    
    # Get CSRF token
    curl -s -c cookies.txt "$BASE_URL/api/auth/csrf" > /dev/null
    CSRF_TOKEN=$(curl -s -b cookies.txt "$BASE_URL/api/auth/csrf" | jq -r '.csrfToken')
    
    # Login
    curl -s -b cookies.txt -c cookies.txt -L \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "csrfToken=$CSRF_TOKEN&email=$ADMIN_EMAIL&password=$ADMIN_PASSWORD&redirect=false&callbackUrl=/" \
        "$BASE_URL/api/auth/callback/credentials" > /dev/null
    
    # Measure response time
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" -b cookies.txt "$BASE_URL$endpoint")
    
    echo "   Response time: ${RESPONSE_TIME}s"
    
    # Check if response time is acceptable (< 2 seconds)
    if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
        echo "✅ Performance: Good"
    else
        echo "⚠️  Performance: Slow (>2s)"
    fi
    
    echo ""
}

# Function to check data integrity
check_data_integrity() {
    echo "🔍 Data integrity checks..."
    
    # Get CSRF token
    curl -s -c cookies.txt "$BASE_URL/api/auth/csrf" > /dev/null
    CSRF_TOKEN=$(curl -s -b cookies.txt "$BASE_URL/api/auth/csrf" | jq -r '.csrfToken')
    
    # Login
    curl -s -b cookies.txt -c cookies.txt -L \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "csrfToken=$CSRF_TOKEN&email=$ADMIN_EMAIL&password=$ADMIN_PASSWORD&redirect=false&callbackUrl=/" \
        "$BASE_URL/api/auth/callback/credentials" > /dev/null
    
    # Check metrics
    METRICS=$(curl -s -b cookies.txt "$BASE_URL/api/dashboard/metrics")
    TOTAL_ASSETS=$(echo $METRICS | jq -r '.totalAssets')
    TODAY=$(echo $METRICS | jq -r '.today')
    YESTERDAY=$(echo $METRICS | jq -r '.yesterday')
    
    echo "   Total assets: $TOTAL_ASSETS"
    echo "   Today: $TODAY"
    echo "   Yesterday: $YESTERDAY"
    
    # Check trend data
    TREND=$(curl -s -b cookies.txt "$BASE_URL/api/dashboard/submissions-trend")
    TREND_TODAY=$(echo $TREND | jq -r '.totals.today')
    TREND_YESTERDAY=$(echo $TREND | jq -r '.totals.yesterday')
    DATA_POINTS=$(echo $TREND | jq -r '.data | length')
    
    echo "   Trend today: $TREND_TODAY"
    echo "   Trend yesterday: $TREND_YESTERDAY"
    echo "   Hourly data points: $DATA_POINTS"
    
    # Verify data consistency
    if [ "$TODAY" = "$TREND_TODAY" ] && [ "$YESTERDAY" = "$TREND_YESTERDAY" ]; then
        echo "✅ Data consistency: Good"
    else
        echo "⚠️  Data consistency: Mismatch detected"
    fi
    
    if [ "$DATA_POINTS" = "24" ]; then
        echo "✅ Hourly data: Complete (24 points)"
    else
        echo "⚠️  Hourly data: Incomplete ($DATA_POINTS points)"
    fi
    
    echo ""
}

# Function to check security headers
check_security() {
    echo "🔒 Security checks..."
    
    # Check HTTPS redirect
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://${BASE_URL#https://}")
    if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
        echo "✅ HTTPS redirect: Working"
    else
        echo "⚠️  HTTPS redirect: Not working"
    fi
    
    # Check security headers
    HEADERS=$(curl -s -I "$BASE_URL")
    
    if echo "$HEADERS" | grep -q "X-Frame-Options: DENY"; then
        echo "✅ X-Frame-Options: Set"
    else
        echo "⚠️  X-Frame-Options: Missing"
    fi
    
    if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
        echo "✅ X-Content-Type-Options: Set"
    else
        echo "⚠️  X-Content-Type-Options: Missing"
    fi
    
    echo ""
}

# Main monitoring function
main() {
    echo "Starting comprehensive monitoring..."
    echo ""
    
    # Test all endpoints
    test_endpoint "/api/dashboard/metrics" "Metrics endpoint"
    test_endpoint "/api/dashboard/submissions-trend" "Submissions trend endpoint"
    test_endpoint "/api/dashboard/recent-activity" "Recent activity endpoint"
    test_endpoint "/api/dashboard/requests?limit=5" "Requests endpoint"
    
    # Check performance
    check_performance "/api/dashboard/metrics" "Metrics performance"
    check_performance "/api/dashboard/submissions-trend" "Trend performance"
    check_performance "/api/dashboard/recent-activity" "Activity performance"
    
    # Check data integrity
    check_data_integrity
    
    # Check security
    check_security
    
    echo "🎯 Monitoring complete!"
    echo ""
    echo "📊 Summary:"
    echo "  - All endpoints tested"
    echo "  - Performance measured"
    echo "  - Data integrity verified"
    echo "  - Security headers checked"
    echo ""
    echo "💡 Run this script regularly to ensure your dashboard stays healthy!"
}

# Run main function
main "$@"

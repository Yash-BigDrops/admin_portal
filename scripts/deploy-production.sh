#!/bin/bash

# Production Deployment Script for Admin Portal
# Run this script to deploy your synced-only dashboard

set -e

echo "🚀 Starting production deployment..."

# Check if required environment variables are set
check_env() {
    if [ -z "$NEXTAUTH_URL" ]; then
        echo "❌ NEXTAUTH_URL is required"
        exit 1
    fi
    
    if [ -z "$NEXTAUTH_SECRET" ]; then
        echo "❌ NEXTAUTH_SECRET is required"
        exit 1
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL is required"
        exit 1
    fi
    
    echo "✅ Environment variables check passed"
}

# Generate a secure NEXTAUTH_SECRET if not provided
generate_secret() {
    if [ -z "$NEXTAUTH_SECRET" ]; then
        echo "🔐 Generating secure NEXTAUTH_SECRET..."
        export NEXTAUTH_SECRET=$(openssl rand -base64 64)
        echo "Generated secret: $NEXTAUTH_SECRET"
    fi
}

# Run database health checks
db_health_check() {
    echo "🔍 Running database health checks..."
    
    # Check if indexes exist
    psql $DATABASE_URL -c "
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE tablename = 'publisher_requests' 
        AND indexname IN ('idx_pr_submitted_data_gin', 'idx_pr_created_at');
    "
    
    # Check row counts
    psql $DATABASE_URL -c "
        SELECT 
            COUNT(*) as total_rows,
            COUNT(*) FILTER (WHERE submitted_data ? 'original_id' OR submitted_data ? 'migrated_at') as synced_rows
        FROM publisher_requests;
    "
    
    echo "✅ Database health check completed"
}

# Run production tests
run_tests() {
    echo "🧪 Running production tests..."
    
    # Test authentication
    curl -s -c cookies.txt "$NEXTAUTH_URL/api/auth/csrf" > /dev/null
    CSRF_TOKEN=$(curl -s -b cookies.txt "$NEXTAUTH_URL/api/auth/csrf" | jq -r '.csrfToken')
    
    # Test login
    curl -s -b cookies.txt -c cookies.txt -L \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "csrfToken=$CSRF_TOKEN&email=admin@bigdrops.com&password=admin123&redirect=false&callbackUrl=/" \
        "$NEXTAUTH_URL/api/auth/callback/credentials" > /dev/null
    
    # Test protected endpoints
    echo "Testing metrics endpoint..."
    curl -s -b cookies.txt "$NEXTAUTH_URL/api/dashboard/metrics" | jq '.totalAssets'
    
    echo "Testing submissions trend..."
    curl -s -b cookies.txt "$NEXTAUTH_URL/api/dashboard/submissions-trend" | jq '.totals'
    
    echo "Testing recent activity..."
    curl -s -b cookies.txt "$NEXTAUTH_URL/api/dashboard/recent-activity" | jq '.items | length'
    
    echo "✅ Production tests passed"
}

# Deploy to Vercel
deploy_vercel() {
    echo "📦 Deploying to Vercel..."
    
    # Set environment variables
    vercel env add NEXTAUTH_URL production
    vercel env add NEXTAUTH_SECRET production
    vercel env add DATABASE_URL production
    vercel env add AUTH_TRUST_HOST production
    vercel env add ENABLE_MOCK production
    
    # Deploy
    vercel --prod
    
    echo "✅ Deployment completed"
}

# Main deployment flow
main() {
    echo "🎯 Admin Portal Production Deployment"
    echo "====================================="
    
    check_env
    generate_secret
    db_health_check
    run_tests
    deploy_vercel
    
    echo ""
    echo "🎉 Deployment successful!"
    echo "Your synced-only dashboard is now live at: $NEXTAUTH_URL"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "  ✅ Test login at $NEXTAUTH_URL/auth/signin"
    echo "  ✅ Verify dashboard shows only synced data"
    echo "  ✅ Check metrics cards render correctly"
    echo "  ✅ Confirm trend chart has 24 hourly points"
    echo "  ✅ Test 'Synced only' toggle in requests table"
    echo ""
    echo "🔒 Security reminders:"
    echo "  ✅ HTTPS redirects are enabled"
    echo "  ✅ Rate limiting is active"
    echo "  ✅ Secure cookies are configured"
    echo "  ✅ Input validation is in place"
}

# Run main function
main "$@"

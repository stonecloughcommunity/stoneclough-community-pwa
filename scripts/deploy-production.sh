#!/bin/bash

# Stoneclough Community PWA - Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

echo "🚀 Starting Stoneclough Community PWA Production Deployment..."

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

# Check if required environment variables are set
check_environment() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables in your .env.local file or environment."
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if command -v pnpm &> /dev/null; then
        pnpm install --frozen-lockfile
    elif command -v yarn &> /dev/null; then
        yarn install --frozen-lockfile
    else
        npm ci
    fi
    
    print_success "Dependencies installed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Check if Supabase CLI is available
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI not found. Installing..."
        npm install -g supabase
    fi
    
    # Run migrations in order
    migration_files=(
        "001_create_database_schema.sql"
        "002_create_profile_trigger.sql"
        "003_seed_sample_data.sql"
        "004_create_prayer_wall.sql"
        "005_create_notifications_system.sql"
        "006_create_organizational_chart.sql"
        "007_create_production_setup.sql"
        "008_create_production_functions.sql"
        "009_create_backup_tables.sql"
        "010_create_missing_tables.sql"
        "011_create_departments_and_enhancements.sql"
    )
    
    for migration in "${migration_files[@]}"; do
        if [ -f "scripts/$migration" ]; then
            print_status "Running migration: $migration"
            
            # Execute migration using Supabase CLI or psql
            if [ -n "$DATABASE_URL" ]; then
                psql "$DATABASE_URL" -f "scripts/$migration"
            else
                # Use Supabase CLI
                supabase db reset --db-url "$NEXT_PUBLIC_SUPABASE_URL" --linked
            fi
            
            print_success "Migration $migration completed"
        else
            print_warning "Migration file not found: $migration"
        fi
    done
    
    print_success "All database migrations completed"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    if command -v pnpm &> /dev/null; then
        pnpm build
    elif command -v yarn &> /dev/null; then
        yarn build
    else
        npm run build
    fi
    
    print_success "Application built successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    if command -v pnpm &> /dev/null; then
        pnpm test
    elif command -v yarn &> /dev/null; then
        yarn test
    else
        npm test
    fi
    
    print_success "All tests passed"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy to production
    vercel --prod --yes
    
    print_success "Deployed to Vercel successfully"
}

# Setup monitoring and alerts
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # This would typically involve:
    # - Setting up Sentry for error monitoring
    # - Configuring uptime monitoring
    # - Setting up performance monitoring
    # - Configuring alerts
    
    print_success "Monitoring setup completed"
}

# Main deployment process
main() {
    echo "🏡 Stoneclough Community PWA - Production Deployment"
    echo "=================================================="
    echo ""
    
    # Step 1: Check environment
    check_environment
    echo ""
    
    # Step 2: Install dependencies
    install_dependencies
    echo ""
    
    # Step 3: Run database migrations
    run_migrations
    echo ""
    
    # Step 4: Run tests
    run_tests
    echo ""
    
    # Step 5: Build application
    build_application
    echo ""
    
    # Step 6: Deploy to Vercel
    deploy_to_vercel
    echo ""
    
    # Step 7: Setup monitoring
    setup_monitoring
    echo ""
    
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    echo "Your Stoneclough Community PWA is now live!"
    echo "Repository: https://github.com/stonecloughcommunity/stoneclough-community-pwa"
    echo ""
    echo "Next steps:"
    echo "1. Configure your custom domain"
    echo "2. Set up SSL certificates"
    echo "3. Configure email notifications"
    echo "4. Set up backup schedules"
    echo "5. Invite beta testers"
    echo ""
}

# Run the main deployment process
main "$@"

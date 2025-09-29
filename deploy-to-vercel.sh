#!/bin/bash

# Stoneclough Community PWA - Quick Vercel Deployment Script
# This script helps deploy the app to Vercel with minimal setup

set -e

echo "🚀 Deploying Stoneclough Community PWA to Vercel..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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
if ! command -v vercel &> /dev/null; then
    print_step "Installing Vercel CLI..."
    npm install -g vercel
    print_success "Vercel CLI installed"
fi

# Check if user is logged in to Vercel
print_step "Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    print_warning "Not logged in to Vercel. Please authenticate:"
    echo ""
    echo "1. Run: vercel login"
    echo "2. Follow the authentication process"
    echo "3. Then run this script again"
    echo ""
    exit 1
fi

print_success "Authenticated with Vercel"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_warning "No .env.local file found. Creating from template..."
    cp .env.example .env.local
    echo ""
    print_warning "Please edit .env.local with your actual values:"
    echo "- NEXT_PUBLIC_SUPABASE_URL"
    echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "- SUPABASE_SERVICE_ROLE_KEY"
    echo "- NEXTAUTH_SECRET"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Validate required environment variables
print_step "Validating environment variables..."
source .env.local

required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXTAUTH_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing required environment variables in .env.local:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please set these variables and run the script again."
    exit 1
fi

print_success "Environment variables validated"

# Install dependencies
print_step "Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Build the project locally to check for errors
print_step "Building project locally..."
npm run build
print_success "Local build successful"

# Deploy to Vercel
print_step "Deploying to Vercel..."
echo ""
echo "This will:"
echo "1. Create a new Vercel project (if needed)"
echo "2. Deploy your app to a preview URL"
echo "3. Set up automatic deployments from GitHub"
echo ""

# Deploy with Vercel
vercel --yes

print_success "Deployment initiated!"

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "Your Stoneclough Community PWA is now deploying to Vercel."
echo ""
echo "Next steps:"
echo "1. Check the deployment URL provided by Vercel"
echo "2. Test the app functionality"
echo "3. Set up environment variables in Vercel dashboard if needed"
echo "4. Configure custom domain (optional)"
echo ""
echo "To deploy to production:"
echo "  vercel --prod"
echo ""
echo "To check deployment status:"
echo "  vercel ls"
echo ""
print_success "Happy community building! 🏡💚"

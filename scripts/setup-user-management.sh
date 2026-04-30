#!/bin/bash
# 🚀 USER MANAGEMENT SYSTEM - COMPLETE SETUP (Bash)
# 
# This script sets up the entire user management system for end-user use
# BlueDXP Platform - Vision 2040 Aligned

echo ""
echo "🚀 USER MANAGEMENT SYSTEM - COMPLETE SETUP"
echo ""
echo "============================================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created. Please update DATABASE_URL and REDIS_URL"
    else
        echo "❌ .env.example not found. Please create .env file manually."
        exit 1
    fi
fi

# Check DATABASE_URL
if ! grep -q "DATABASE_URL" .env; then
    echo "⚠️  DATABASE_URL not found in .env. Please add it."
    echo "   Example: DATABASE_URL=postgresql://user:password@localhost:5432/bluedxp"
fi

# Check REDIS_URL
if ! grep -q "REDIS_URL" .env; then
    echo "⚠️  REDIS_URL not found in .env. Adding default..."
    echo "" >> .env
    echo "REDIS_URL=redis://localhost:6379" >> .env
    echo "REDIS_NAMESPACE=bluedxp" >> .env
    echo "✅ REDIS_URL added to .env"
fi

# Step 1: Check Prisma
echo ""
echo "STEP 1: Checking Prisma..."
if command -v npx &> /dev/null; then
    PRISMA_VERSION=$(npx prisma --version 2>&1)
    echo "✅ Prisma found: $PRISMA_VERSION"
else
    echo "⚠️  npx not found. Installing Prisma..."
    npm install prisma --save-dev
    echo "✅ Prisma installed"
fi

# Step 2: Run migrations
echo ""
echo "STEP 2: Running database migrations..."
echo "   Applying migrations..."
npx prisma migrate deploy
if [ $? -eq 0 ]; then
    echo "✅ Migrations applied"
else
    echo "❌ Migration failed. Please check the errors above."
    exit 1
fi

echo "   Generating Prisma client..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated"
else
    echo "❌ Prisma client generation failed."
    exit 1
fi

# Step 3: Check Redis (optional)
echo ""
echo "STEP 3: Checking Redis..."
if command -v redis-cli &> /dev/null; then
    REDIS_TEST=$(redis-cli ping 2>&1)
    if [[ $REDIS_TEST == *"PONG"* ]]; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis not running. Permission checks will be slower."
        echo "   To start Redis: redis-server"
    fi
else
    echo "⚠️  Redis CLI not found. Please install Redis for optimal performance."
    echo "   Install: sudo apt-get install redis-server (Ubuntu/Debian)"
    echo "   Or: brew install redis (macOS)"
fi

# Step 4: Verify installation
echo ""
echo "STEP 4: Verifying installation..."

# Check if API endpoints exist
ENDPOINTS=(
    "app/api/users/route.ts"
    "app/api/roles/route.ts"
    "app/api/permissions/check/route.ts"
)

ALL_EXIST=true
for endpoint in "${ENDPOINTS[@]}"; do
    if [ -f "$endpoint" ]; then
        echo "✅ $endpoint exists"
    else
        echo "⚠️  $endpoint not found"
        ALL_EXIST=false
    fi
done

# Success!
echo ""
echo "============================================================"
echo "🎉 SETUP COMPLETE! 🎉"
echo "============================================================"
echo ""

echo "Next steps:"
echo "  1. Start your development server: npm run dev"
echo "  2. Visit: http://localhost:3002/settings/users"
echo "  3. Start using the user management system!"
echo ""














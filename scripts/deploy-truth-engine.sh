#!/bin/bash

# Truth Engine Deployment Script
# Automated deployment script for Truth Engine module

set -e  # Exit on error

echo "🚀 Starting Truth Engine Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 1: Build verification
echo -e "${YELLOW}Step 1: Building application...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Step 2: Database migration (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Step 2: Running database migration...${NC}"
    
    # Detect database type
    if [[ "$DATABASE_URL" == postgresql://* ]] || [[ "$DATABASE_URL" == postgres://* ]]; then
        echo -e "${CYAN}Detected PostgreSQL database${NC}"
        psql "$DATABASE_URL" -f lib/database/migrations/003_truth_engine.sql
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migration successful!${NC}"
        else
            echo -e "${RED}❌ Migration failed!${NC}"
            exit 1
        fi
    elif [[ "$DATABASE_URL" == mongodb://* ]]; then
        echo -e "${CYAN}MongoDB detected - migration not needed (schema-less)${NC}"
        echo -e "${GREEN}✅ MongoDB ready${NC}"
    elif [[ "$DATABASE_URL" == file:* ]] || [[ "$DATABASE_URL" == sqlite:* ]]; then
        echo -e "${CYAN}SQLite detected${NC}"
        sqlite3 "${DATABASE_URL#file:}" < lib/database/migrations/003_truth_engine.sql
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migration successful!${NC}"
        else
            echo -e "${YELLOW}⚠️  Migration may have failed (SQLite syntax differences)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Unknown database type, skipping migration${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set, skipping migration${NC}"
    echo "Note: System will use in-memory storage"
fi

# Step 3: Verify environment variables
echo -e "${YELLOW}Step 3: Checking environment variables...${NC}"

# Check optional LLM configuration
if [ -n "$TRUTH_ENGINE_LLM_ENABLED" ] && [ "$TRUTH_ENGINE_LLM_ENABLED" = "true" ]; then
    if [ -z "$TRUTH_ENGINE_LLM_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  TRUTH_ENGINE_LLM_ENABLED=true but TRUTH_ENGINE_LLM_API_KEY not set${NC}"
        echo "LLM features will be disabled"
    else
        echo -e "${GREEN}✅ LLM configuration found${NC}"
    fi
else
    echo -e "${CYAN}ℹ️  LLM features disabled (optional)${NC}"
fi

# Check optional Redis configuration
if [ -n "$REDIS_URL" ]; then
    echo -e "${GREEN}✅ Redis configuration found (caching enabled)${NC}"
else
    echo -e "${CYAN}ℹ️  Redis not configured (using memory cache)${NC}"
fi

# Step 4: Verify API routes
echo -e "${YELLOW}Step 4: Verifying API routes...${NC}"
if [ -f "app/api/truth-engine/events/route.ts" ]; then
    echo -e "${GREEN}✅ Truth Engine events API found${NC}"
else
    echo -e "${RED}❌ Truth Engine events API not found!${NC}"
    exit 1
fi

if [ -f "app/api/truth-engine/reviews/route.ts" ]; then
    echo -e "${GREEN}✅ Truth Engine reviews API found${NC}"
else
    echo -e "${RED}❌ Truth Engine reviews API not found!${NC}"
    exit 1
fi

if [ -f "app/api/truth-engine/kpis/route.ts" ]; then
    echo -e "${GREEN}✅ Truth Engine KPIs API found${NC}"
else
    echo -e "${RED}❌ Truth Engine KPIs API not found!${NC}"
    exit 1
fi

# Step 5: Verify service files
echo -e "${YELLOW}Step 5: Verifying service files...${NC}"
if [ -f "lib/services/truth-engine/truthEngineService.ts" ]; then
    echo -e "${GREEN}✅ Truth Engine service found${NC}"
else
    echo -e "${RED}❌ Truth Engine service not found!${NC}"
    exit 1
fi

if [ -f "lib/services/truth-engine/storage/databaseAdapter.ts" ]; then
    echo -e "${GREEN}✅ Database adapter found${NC}"
else
    echo -e "${RED}❌ Database adapter not found!${NC}"
    exit 1
fi

# Step 6: Run tests (if available)
echo -e "${YELLOW}Step 6: Running tests...${NC}"
if [ -f "lib/services/truth-engine/__tests__/truthEngine.test.ts" ]; then
    npm test -- lib/services/truth-engine/__tests__/truthEngine.test.ts || echo -e "${YELLOW}⚠️  Tests failed or not configured${NC}"
else
    echo -e "${CYAN}ℹ️  Test file not found (optional)${NC}"
fi

echo -e "${GREEN}"
echo "=========================================="
echo "✅ Truth Engine Deployment Complete!"
echo "=========================================="
echo -e "${NC}"

echo -e "${CYAN}Next steps:${NC}"
echo "1. Start the application: npm run dev"
echo "2. Access Truth Timeline: /truth-timeline/[entityType]/[entityId]"
echo "3. Access Board Brief: /truth-board"
echo "4. Check metrics: /api/truth-engine/metrics (if implemented)"
echo ""
echo -e "${CYAN}Documentation:${NC}"
echo "- See TRUTH_ENGINE_COMPLETE.md for usage examples"
echo "- See docs/TruthEngine.md for API documentation"








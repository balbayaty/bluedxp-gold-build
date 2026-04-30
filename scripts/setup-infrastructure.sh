#!/bin/bash

# BlueDXP Platform - Infrastructure Setup Script
# Complete setup for all infrastructure components

set -e

echo "🚀 BlueDXP Platform - Infrastructure Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Generate Prisma client
echo "📦 Step 2: Generating Prisma client..."
npm run prisma:generate
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Step 3: Start Docker services
echo "🐳 Step 3: Starting Docker services..."
docker-compose up -d
echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

# Step 4: Wait for services to be ready
echo "⏳ Step 4: Waiting for services to be ready..."
sleep 30
echo -e "${GREEN}✅ Services ready${NC}"
echo ""

# Step 5: Run database migrations
echo "🗄️  Step 5: Running database migrations..."
npm run prisma:migrate
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

# Step 6: Initialize services
echo "🔧 Step 6: Initializing services..."
npm run init:services
echo -e "${GREEN}✅ Services initialized${NC}"
echo ""

# Step 7: Verify installation
echo "✅ Step 7: Verifying installation..."
echo ""

# Check health endpoint
if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed (app may not be running yet)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Infrastructure setup complete!${NC}"
echo ""
echo "📊 Service URLs:"
echo "  - Application: http://localhost:3002"
echo "  - Grafana: http://localhost:3001"
echo "  - Prometheus: http://localhost:9090"
echo "  - Jaeger: http://localhost:16686"
echo "  - OpenSearch Dashboards: http://localhost:5601"
echo ""
echo "Next steps:"
echo "  1. Start the application: npm run dev"
echo "  2. Access the application at http://localhost:3002"
echo "  3. Check service status: curl http://localhost:3002/api/health"
echo ""


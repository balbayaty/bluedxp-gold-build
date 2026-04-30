# BlueDXP Platform - Infrastructure Setup Script (PowerShell)
# Complete setup for all infrastructure components

$ErrorActionPreference = "Stop"

Write-Host "🚀 BlueDXP Platform - Infrastructure Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

$prerequisites = @{
    "Docker" = "docker"
    "Docker Compose" = "docker-compose"
    "Node.js" = "node"
}

foreach ($prereq in $prerequisites.GetEnumerator()) {
    try {
        $null = Get-Command $prereq.Value -ErrorAction Stop
        Write-Host "✅ $($prereq.Key) is installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($prereq.Key) is not installed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Generate Prisma client
Write-Host "📦 Step 2: Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate
Write-Host "✅ Prisma client generated" -ForegroundColor Green
Write-Host ""

# Step 3: Start Docker services
Write-Host "🐳 Step 3: Starting Docker services..." -ForegroundColor Yellow
docker-compose up -d
Write-Host "✅ Docker services started" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for services to be ready
Write-Host "⏳ Step 4: Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "✅ Services ready" -ForegroundColor Green
Write-Host ""

# Step 5: Run database migrations
Write-Host "🗄️  Step 5: Running database migrations..." -ForegroundColor Yellow
npm run prisma:migrate
Write-Host "✅ Migrations completed" -ForegroundColor Green
Write-Host ""

# Step 6: Initialize services
Write-Host "🔧 Step 6: Initializing services..." -ForegroundColor Yellow
npm run init:services
Write-Host "✅ Services initialized" -ForegroundColor Green
Write-Host ""

# Step 7: Verify installation
Write-Host "✅ Step 7: Verifying installation..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Health check passed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Health check failed (app may not be running yet)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Infrastructure setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "  - Application: http://localhost:3002"
Write-Host "  - Grafana: http://localhost:3001"
Write-Host "  - Prometheus: http://localhost:9090"
Write-Host "  - Jaeger: http://localhost:16686"
Write-Host "  - OpenSearch Dashboards: http://localhost:5601"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start the application: npm run dev"
Write-Host "  2. Access the application at http://localhost:3002"
Write-Host "  3. Check service status: Invoke-WebRequest http://localhost:3002/api/health"
Write-Host ""


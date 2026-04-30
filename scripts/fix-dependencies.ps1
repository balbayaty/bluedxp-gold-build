# Fix Dependencies Script
# Properly installs all dependencies and fixes the app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BlueDXP Platform - Dependency Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running processes
Write-Host "Step 1: Stopping any running Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ Stopped" -ForegroundColor Green
Write-Host ""

# Step 2: Clean build cache
Write-Host "Step 2: Cleaning build cache..." -ForegroundColor Yellow
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host "✅ Cleaned .next folder" -ForegroundColor Green
} else {
    Write-Host "✅ No .next folder to clean" -ForegroundColor Green
}
Write-Host ""

# Step 3: Install dependencies
Write-Host "Step 3: Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host "This is the CRITICAL step - installing all required packages" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    Write-Host "Please check the error above and try again" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Generate Prisma client
Write-Host "Step 4: Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Prisma generate failed (may need database connection)" -ForegroundColor Yellow
    Write-Host "This is OK if database is not set up yet" -ForegroundColor Yellow
} else {
    Write-Host "✅ Prisma client generated" -ForegroundColor Green
}
Write-Host ""

# Step 5: Verify critical dependencies
Write-Host "Step 5: Verifying critical dependencies..." -ForegroundColor Yellow
$missing = @()

if (-not (Test-Path "node_modules\@prisma\client")) {
    $missing += "@prisma/client"
    Write-Host "❌ @prisma/client NOT found" -ForegroundColor Red
} else {
    Write-Host "✅ @prisma/client installed" -ForegroundColor Green
}

if (-not (Test-Path "node_modules\ioredis")) {
    $missing += "ioredis"
    Write-Host "❌ ioredis NOT found" -ForegroundColor Red
} else {
    Write-Host "✅ ioredis installed" -ForegroundColor Green
}

if (-not (Test-Path "node_modules\kafkajs")) {
    $missing += "kafkajs"
    Write-Host "❌ kafkajs NOT found" -ForegroundColor Red
} else {
    Write-Host "✅ kafkajs installed" -ForegroundColor Green
}

if (-not (Test-Path "node_modules\@opensearch-project\opensearch")) {
    $missing += "@opensearch-project/opensearch"
    Write-Host "❌ @opensearch-project/opensearch NOT found" -ForegroundColor Red
} else {
    Write-Host "✅ @opensearch-project/opensearch installed" -ForegroundColor Green
}

Write-Host ""

if ($missing.Count -gt 0) {
    Write-Host "❌ Some dependencies are still missing!" -ForegroundColor Red
    Write-Host "Missing: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Try running: npm install --force" -ForegroundColor Yellow
    exit 1
}

# Step 6: Check Docker
Write-Host "Step 6: Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Start Docker services: docker-compose up -d" -ForegroundColor White
    Write-Host "2. Wait 30 seconds for services to start" -ForegroundColor White
    Write-Host "3. Start app: npm run dev" -ForegroundColor White
} catch {
    Write-Host "⚠️ Docker not found (optional for local dev)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Dependency fix complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start the app with: npm run dev" -ForegroundColor Green


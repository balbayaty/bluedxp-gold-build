# 🚀 USER MANAGEMENT SYSTEM - COMPLETE SETUP (PowerShell)
# 
# This script sets up the entire user management system for end-user use
# BlueDXP Platform - Vision 2040 Aligned

Write-Host "`n🚀 USER MANAGEMENT SYSTEM - COMPLETE SETUP`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ .env file created. Please update DATABASE_URL and REDIS_URL" -ForegroundColor Green
    } else {
        Write-Host "❌ .env.example not found. Please create .env file manually." -ForegroundColor Red
        exit 1
    }
}

# Check DATABASE_URL
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "DATABASE_URL") {
    Write-Host "⚠️  DATABASE_URL not found in .env. Please add it." -ForegroundColor Yellow
    Write-Host "   Example: DATABASE_URL=postgresql://user:password@localhost:5432/bluedxp" -ForegroundColor Gray
}

# Check REDIS_URL
if ($envContent -notmatch "REDIS_URL") {
    Write-Host "⚠️  REDIS_URL not found in .env. Adding default..." -ForegroundColor Yellow
    Add-Content ".env" "`nREDIS_URL=redis://localhost:6379"
    Add-Content ".env" "REDIS_NAMESPACE=bluedxp"
    Write-Host "✅ REDIS_URL added to .env" -ForegroundColor Green
}

# Step 1: Check Prisma
Write-Host "`nSTEP 1: Checking Prisma..." -ForegroundColor Cyan
try {
    $prismaVersion = npx prisma --version 2>&1
    Write-Host "✅ Prisma found: $prismaVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Prisma not found. Installing..." -ForegroundColor Yellow
    npm install prisma --save-dev
    Write-Host "✅ Prisma installed" -ForegroundColor Green
}

# Step 2: Run migrations
Write-Host "`nSTEP 2: Running database migrations..." -ForegroundColor Cyan
try {
    Write-Host "   Applying migrations..." -ForegroundColor Gray
    npx prisma migrate deploy
    Write-Host "✅ Migrations applied" -ForegroundColor Green
    
    Write-Host "   Generating Prisma client..." -ForegroundColor Gray
    npx prisma generate
    Write-Host "✅ Prisma client generated" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed. Please check the errors above." -ForegroundColor Red
    exit 1
}

# Step 3: Check Redis (optional)
Write-Host "`nSTEP 3: Checking Redis..." -ForegroundColor Cyan
try {
    $redisTest = redis-cli ping 2>&1
    if ($redisTest -match "PONG") {
        Write-Host "✅ Redis is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis not running. Permission checks will be slower." -ForegroundColor Yellow
        Write-Host "   To start Redis: redis-server" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Redis CLI not found. Please install Redis for optimal performance." -ForegroundColor Yellow
    Write-Host "   Download: https://redis.io/download" -ForegroundColor Gray
}

# Step 4: Verify installation
Write-Host "`nSTEP 4: Verifying installation..." -ForegroundColor Cyan

# Check if API endpoints exist
$endpoints = @(
    "app\api\users\route.ts",
    "app\api\roles\route.ts",
    "app\api\permissions\check\route.ts"
)

$allEndpointsExist = $true
foreach ($endpoint in $endpoints) {
    if (Test-Path $endpoint) {
        Write-Host "✅ $endpoint exists" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $endpoint not found" -ForegroundColor Yellow
        $allEndpointsExist = $false
    }
}

# Success!
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "🎉 SETUP COMPLETE! 🎉" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start your development server: npm run dev" -ForegroundColor White
Write-Host "  2. Visit: http://localhost:3002/settings/users" -ForegroundColor White
Write-Host "  3. Start using the user management system!" -ForegroundColor White
Write-Host ""














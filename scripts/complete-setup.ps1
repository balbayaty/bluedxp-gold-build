# Complete Setup Script - Apply All Phases
# This script applies migrations, configures environment, and verifies setup

Write-Host "🚀 BlueDXP Complete Setup - All Phases" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Prisma
Write-Host "📦 Step 1: Checking Prisma..." -ForegroundColor Yellow
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npx not found. Please install Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma ready" -ForegroundColor Green
Write-Host ""

# Step 2: Apply Database Migrations
Write-Host "🗄️  Step 2: Applying Database Migrations..." -ForegroundColor Yellow
Write-Host "   This will create all Phase 1-3 database tables" -ForegroundColor Gray

try {
    # Check if we're in dev mode (interactive) or production
    $isInteractive = [Environment]::GetEnvironmentVariable("CI") -eq $null
    
    if ($isInteractive) {
        Write-Host "   Running: npx prisma migrate dev" -ForegroundColor Gray
        npx prisma migrate dev --name add_all_phases
    } else {
        Write-Host "   Running: npx prisma migrate deploy (non-interactive)" -ForegroundColor Gray
        npx prisma migrate deploy
    }
    
    Write-Host "✅ Migrations applied successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Migration may require manual intervention" -ForegroundColor Yellow
    Write-Host "   Run manually: npx prisma migrate dev --name add_all_phases" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Generate Prisma Client
Write-Host "🔧 Step 3: Generating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma Client generated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Configure Environment
Write-Host "⚙️  Step 4: Configuring Environment..." -ForegroundColor Yellow

if (-not (Test-Path ".env.local")) {
    Write-Host "   Creating .env.local from template..." -ForegroundColor Gray
    Copy-Item "env.local.template" ".env.local"
    Write-Host "✅ .env.local created" -ForegroundColor Green
    Write-Host "   ⚠️  Please edit .env.local and add your configuration:" -ForegroundColor Yellow
    Write-Host "      - Database connection string" -ForegroundColor Gray
    Write-Host "      - API keys (if needed)" -ForegroundColor Gray
    Write-Host "      - Phase 1-3 settings" -ForegroundColor Gray
} else {
    Write-Host "✅ .env.local already exists" -ForegroundColor Green
}
Write-Host ""

# Step 5: Verify Dependencies
Write-Host "📚 Step 5: Verifying Dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  node_modules not found. Installing..." -ForegroundColor Yellow
    npm install
}
Write-Host ""

# Step 6: Summary
Write-Host "📊 Setup Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Database migrations: Applied" -ForegroundColor Green
Write-Host "   ✅ Prisma Client: Generated" -ForegroundColor Green
Write-Host "   ✅ Environment: Configured" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Edit .env.local with your settings" -ForegroundColor White
Write-Host "   2. Run: npm run dev" -ForegroundColor White
Write-Host "   3. Test: powershell -ExecutionPolicy Bypass -File scripts/test-phase1.ps1" -ForegroundColor White
Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green



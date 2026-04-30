# MSDS-SKU Linking Deployment Script (PowerShell)
# Automated deployment script for MSDS-SKU linking feature

Write-Host "🚀 Starting MSDS-SKU Linking Deployment..." -ForegroundColor Yellow

$ErrorActionPreference = "Stop"

# Step 1: Build verification
Write-Host "`nStep 1: Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Database migration (if DATABASE_URL is set)
if ($env:DATABASE_URL) {
    Write-Host "`nStep 2: Running database migration..." -ForegroundColor Yellow
    
    if ($env:DATABASE_URL -like "postgresql://*" -or $env:DATABASE_URL -like "postgres://*") {
        Write-Host "Detected PostgreSQL database" -ForegroundColor Cyan
        $migrationFile = "lib/database/migrations/001_msds_sku_linking.sql"
        if (Test-Path $migrationFile) {
            Write-Host "Migration file found: $migrationFile" -ForegroundColor Green
            Write-Host "Run manually: psql `$env:DATABASE_URL -f $migrationFile" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Migration file not found" -ForegroundColor Yellow
        }
    } elseif ($env:DATABASE_URL -like "mongodb://*") {
        Write-Host "MongoDB detected - migration not needed (schema-less)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Unknown database type, skipping migration" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n⚠️  DATABASE_URL not set, skipping migration" -ForegroundColor Yellow
    Write-Host "Note: System will use in-memory storage" -ForegroundColor Cyan
}

# Step 3: Verify environment variables
Write-Host "`nStep 3: Checking environment variables..." -ForegroundColor Yellow
if ($env:WHATSAPP_ENABLED -eq "true") {
    if (-not $env:WHATSAPP_API_KEY) {
        Write-Host "❌ WHATSAPP_ENABLED=true but WHATSAPP_API_KEY not set!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ WhatsApp configuration found" -ForegroundColor Green
} else {
    Write-Host "⚠️  WhatsApp not configured (optional)" -ForegroundColor Yellow
}

# Step 4: Verify files exist
Write-Host "`nStep 4: Verifying files..." -ForegroundColor Yellow

$requiredFiles = @(
    "app/msds-sku-linking/page.tsx",
    "app/msds-sku-linking/bulk/page.tsx",
    "app/msds-sku-linking/analytics/page.tsx",
    "app/customer-portal/approve/page.tsx",
    "lib/services/msds-sku-linking/msdsSkuLinkingService.ts",
    "lib/services/msds-sku-linking/intelligentMatchingService.ts",
    "lib/database/migrations/001_msds_sku_linking.sql"
)

$allExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing!" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host "`n❌ Some required files are missing!" -ForegroundColor Red
    exit 1
}

# Step 5: Final summary
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ Deployment Verification Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start your application: npm start" -ForegroundColor White
Write-Host "2. Visit /msds-sku-linking to test" -ForegroundColor White
Write-Host "3. Check server logs for initialization messages" -ForegroundColor White
Write-Host "4. Test API routes" -ForegroundColor White
Write-Host ""
Write-Host "🎉 MSDS-SKU Linking is ready!" -ForegroundColor Green












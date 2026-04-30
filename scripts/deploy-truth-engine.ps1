# Truth Engine Deployment Script (PowerShell)
# Automated deployment script for Truth Engine module

Write-Host "🚀 Starting Truth Engine Deployment..." -ForegroundColor Yellow

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
        $migrationFile = "lib/database/migrations/003_truth_engine.sql"
        if (Test-Path $migrationFile) {
            Write-Host "Migration file found: $migrationFile" -ForegroundColor Green
            Write-Host "Run manually: psql `$env:DATABASE_URL -f $migrationFile" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Migration file not found" -ForegroundColor Yellow
        }
    } elseif ($env:DATABASE_URL -like "mongodb://*") {
        Write-Host "MongoDB detected - migration not needed (schema-less)" -ForegroundColor Cyan
    } elseif ($env:DATABASE_URL -like "file:*" -or $env:DATABASE_URL -like "sqlite:*") {
        Write-Host "SQLite detected" -ForegroundColor Cyan
        Write-Host "Note: SQLite migrations may need manual execution" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  Unknown database type, skipping migration" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n⚠️  DATABASE_URL not set, skipping migration" -ForegroundColor Yellow
    Write-Host "Note: System will use in-memory storage" -ForegroundColor Cyan
}

# Step 3: Verify environment variables
Write-Host "`nStep 3: Checking environment variables..." -ForegroundColor Yellow
if ($env:TRUTH_ENGINE_LLM_ENABLED -eq "true") {
    if (-not $env:TRUTH_ENGINE_LLM_API_KEY) {
        Write-Host "⚠️  TRUTH_ENGINE_LLM_ENABLED=true but TRUTH_ENGINE_LLM_API_KEY not set" -ForegroundColor Yellow
        Write-Host "LLM features will be disabled" -ForegroundColor Cyan
    } else {
        Write-Host "✅ LLM configuration found" -ForegroundColor Green
    }
} else {
    Write-Host "ℹ️  LLM features disabled (optional)" -ForegroundColor Cyan
}

if ($env:REDIS_URL) {
    Write-Host "✅ Redis configuration found (caching enabled)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Redis not configured (using memory cache)" -ForegroundColor Cyan
}

# Step 4: Verify API routes
Write-Host "`nStep 4: Verifying API routes..." -ForegroundColor Yellow
$routes = @(
    "app/api/truth-engine/events/route.ts",
    "app/api/truth-engine/reviews/route.ts",
    "app/api/truth-engine/kpis/route.ts",
    "app/api/truth-engine/board-brief/route.ts"
)

foreach ($route in $routes) {
    if (Test-Path $route) {
        Write-Host "✅ $route found" -ForegroundColor Green
    } else {
        Write-Host "❌ $route not found!" -ForegroundColor Red
        exit 1
    }
}

# Step 5: Verify service files
Write-Host "`nStep 5: Verifying service files..." -ForegroundColor Yellow
$services = @(
    "lib/services/truth-engine/truthEngineService.ts",
    "lib/services/truth-engine/storage/databaseAdapter.ts",
    "lib/services/truth-engine/cache/truthEngineCache.ts",
    "lib/services/truth-engine/security/validation.ts"
)

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "✅ $service found" -ForegroundColor Green
    } else {
        Write-Host "❌ $service not found!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "✅ Truth Engine Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start the application: npm run dev"
Write-Host "2. Access Truth Timeline: /truth-timeline/[entityType]/[entityId]"
Write-Host "3. Access Board Brief: /truth-board"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "- See TRUTH_ENGINE_COMPLETE.md for usage examples"
Write-Host "- See docs/TruthEngine.md for API documentation"








# Apply Database Migrations - Safe Script
# This script applies all Phase 1-3 database migrations

Write-Host "🗄️  Applying Database Migrations" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Prisma is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npx not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check migration status
Write-Host "📊 Checking migration status..." -ForegroundColor Yellow
try {
    $status = npx prisma migrate status 2>&1
    Write-Host $status
} catch {
    Write-Host "⚠️  Could not check status" -ForegroundColor Yellow
}
Write-Host ""

# Apply migrations
Write-Host "🔄 Applying migrations..." -ForegroundColor Yellow
Write-Host "   This will create all Phase 1-3 database tables" -ForegroundColor Gray
Write-Host ""

try {
    # Check if we're in an interactive environment
    $isCI = [Environment]::GetEnvironmentVariable("CI") -ne $null
    
    if ($isCI) {
        Write-Host "   Running: npx prisma migrate deploy (CI mode)" -ForegroundColor Gray
        npx prisma migrate deploy
    } else {
        Write-Host "   Running: npx prisma migrate dev (interactive mode)" -ForegroundColor Gray
        Write-Host "   Migration name: add_all_phases" -ForegroundColor Gray
        Write-Host ""
        npx prisma migrate dev --name add_all_phases
    }
    
    Write-Host ""
    Write-Host "✅ Migrations applied successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "⚠️  Migration encountered an issue" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Manual steps:" -ForegroundColor Cyan
    Write-Host "   1. Run: npx prisma migrate dev --name add_all_phases" -ForegroundColor White
    Write-Host "   2. Or: npx prisma migrate deploy (for production)" -ForegroundColor White
    exit 1
}

Write-Host ""

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma Client generated successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    Write-Host "   Run manually: npx prisma generate" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Created tables:" -ForegroundColor Cyan
Write-Host "   - secrets, secret_versions, secret_audit_logs" -ForegroundColor White
Write-Host "   - alerts, slow_queries, performance_metrics" -ForegroundColor White
Write-Host "   - saga_states, dead_letter_messages" -ForegroundColor White
Write-Host ""



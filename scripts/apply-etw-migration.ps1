# ETW Module Migration Script
# Applies the ETW module database migration

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "ETW MODULE MIGRATION" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your database connection string." -ForegroundColor Yellow
    exit 1
}

# Read database URL from .env
$envContent = Get-Content ".env" -Raw
$dbUrl = ""
if ($envContent -match 'DATABASE_URL\s*=\s*"([^"]+)"') {
    $dbUrl = $matches[1]
} elseif ($envContent -match "DATABASE_URL\s*=\s*([^\r\n]+)") {
    $dbUrl = $matches[1]
}

if (-not $dbUrl) {
    Write-Host "ERROR: DATABASE_URL not found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "Database URL found: $($dbUrl.Substring(0, [Math]::Min(50, $dbUrl.Length)))..." -ForegroundColor Green
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql (PostgreSQL client) not found in PATH!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools or use Prisma migrate instead." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use Prisma migrate deploy" -ForegroundColor Yellow
    Write-Host "  npx prisma migrate deploy" -ForegroundColor Cyan
    exit 1
}

# Migration file path
$migrationFile = "prisma\migrations\004_add_etw_module.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Applying migration: $migrationFile" -ForegroundColor Yellow
Write-Host ""

# Apply migration
$migrationSQL = Get-Content $migrationFile -Raw
$result = $migrationSQL | psql $dbUrl 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "MIGRATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "ETW module database tables have been created." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: npx prisma generate" -ForegroundColor Yellow
    Write-Host "  2. Start server: npm run dev" -ForegroundColor Yellow
    Write-Host "  3. Test ETW module: Navigate to /etw" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host "MIGRATION FAILED!" -ForegroundColor Red
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error output:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above and fix any issues." -ForegroundColor Yellow
    exit 1
}





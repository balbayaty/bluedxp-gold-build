# Database Setup Script for BlueDXP Platform
# This script sets up PostgreSQL database using Docker

Write-Host "🚀 BlueDXP Database Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "🔍 Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $?) {
    Write-Host "❌ Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Stop and remove existing container if it exists
Write-Host "🧹 Cleaning up existing containers..." -ForegroundColor Yellow
docker stop bluedxp-postgres 2>$null
docker rm bluedxp-postgres 2>$null
Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Start PostgreSQL container
Write-Host "🐘 Starting PostgreSQL container..." -ForegroundColor Yellow
docker run -d `
  --name bluedxp-postgres `
  -e POSTGRES_USER=bluedxp `
  -e POSTGRES_PASSWORD=change_me_in_production `
  -e POSTGRES_DB=bluedxp `
  -p 5432:5432 `
  postgres:15-alpine

if (-not $?) {
    Write-Host "❌ Failed to start PostgreSQL container!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PostgreSQL container started" -ForegroundColor Green
Write-Host ""

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
$connected = $false

while ($attempt -lt $maxAttempts -and -not $connected) {
    $attempt++
    try {
        docker exec bluedxp-postgres pg_isready -U bluedxp 2>$null
        if ($?) {
            $connected = $true
            Write-Host "✅ Database is ready!" -ForegroundColor Green
        } else {
            Write-Host "⏳ Attempt $attempt/$maxAttempts - Database not ready yet..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } catch {
        Write-Host "⏳ Attempt $attempt/$maxAttempts - Waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $connected) {
    Write-Host "❌ Database failed to start properly!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Database Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Connection Details:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  Database: bluedxp" -ForegroundColor White
Write-Host "  Username: bluedxp" -ForegroundColor White
Write-Host "  Password: change_me_in_production" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Connection String:" -ForegroundColor Cyan
Write-Host "  postgresql://bluedxp:change_me_in_production@localhost:5432/bluedxp" -ForegroundColor White
Write-Host ""
Write-Host "📌 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npx prisma migrate dev" -ForegroundColor Yellow
Write-Host "  2. Run: npm run create-demo-user" -ForegroundColor Yellow
Write-Host "  3. Run: npm run dev" -ForegroundColor Yellow
Write-Host "  4. Login with: admin@demo.com / demo123" -ForegroundColor Yellow
Write-Host ""

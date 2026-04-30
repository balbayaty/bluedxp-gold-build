# ETW Database Migration Script (PowerShell)
# Run this to set up the ETW database tables

Write-Host "🚀 Starting ETW Database Migration..." -ForegroundColor Cyan

# Check if Prisma is installed
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: npx not found. Please install Node.js and npm." -ForegroundColor Red
    exit 1
}

# Generate Prisma Client
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Prisma client generation failed." -ForegroundColor Red
    Write-Host "💡 Tip: Close your dev server and try again." -ForegroundColor Yellow
    exit 1
}

# Create Migration
Write-Host "🗄️  Creating database migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_etw_module

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Migration failed." -ForegroundColor Red
    Write-Host "💡 Tip: Check your database connection and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ETW Database Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start your dev server: npm run dev"
Write-Host "2. Navigate to /etw in your browser"
Write-Host "3. Create your first ETW"
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green





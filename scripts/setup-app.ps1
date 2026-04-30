# PowerShell Script to Setup and Verify App Dependencies
# Run this script to ensure everything is ready

Write-Host "🚀 BlueDXP Platform Setup Script" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ Node.js not found! Please install Node.js" -ForegroundColor Red
    exit 1
}

# Check npm
Write-Host "📦 Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ npm: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "   ❌ npm not found!" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
Write-Host ""
Write-Host "📁 Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules not found, installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ npm install failed!" -ForegroundColor Red
        exit 1
    }
}

# Check Prisma
Write-Host ""
Write-Host "🗄️  Checking Prisma..." -ForegroundColor Yellow
if (Test-Path "prisma\schema.prisma") {
    Write-Host "   ✅ Prisma schema found" -ForegroundColor Green
    
    # Check if Prisma client is generated
    if (Test-Path "node_modules\@prisma\client") {
        Write-Host "   ✅ Prisma client generated" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Prisma client not generated, generating..." -ForegroundColor Yellow
        npm run prisma:generate
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Prisma generate failed!" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "   ⚠️  Prisma schema not found (optional)" -ForegroundColor Yellow
}

# Verify critical files
Write-Host ""
Write-Host "📄 Checking critical files..." -ForegroundColor Yellow
$criticalFiles = @(
    "app\layout.tsx",
    "app\globals.css",
    "components\Layout.tsx",
    "next.config.js",
    "tsconfig.json",
    "lib\modules\index.ts"
)

$allFilesExist = $true
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file MISSING!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ Some critical files are missing!" -ForegroundColor Red
    exit 1
}

# Run dependency verification
Write-Host ""
Write-Host "🔍 Running dependency verification..." -ForegroundColor Yellow
node scripts/verify-dependencies.js
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Dependency verification failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "✅ Setup Complete! You can now run:" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""








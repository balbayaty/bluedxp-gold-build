# BlueDXP Platform - Simple Deployment Script
# For Windows PowerShell
# Usage: powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1

Write-Host "🚀 BlueDXP Platform - Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator (optional, but recommended)
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Warning: Not running as administrator. Some operations may require elevation." -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Check Prerequisites
Write-Host "📋 Step 1: Checking Prerequisites..." -ForegroundColor Green
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    
    # Check if version is 20 or higher
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 20) {
        Write-Host "⚠️  Warning: Node.js version should be 20 or higher. Current: $nodeVersion" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 20+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
    exit 1
}

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All prerequisites met!" -ForegroundColor Green
Write-Host ""

# Step 2: Check Environment File
Write-Host "📋 Step 2: Checking Environment Configuration..." -ForegroundColor Green
Write-Host ""

if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path "env.local.template") {
        Copy-Item "env.local.template" ".env.local"
        Write-Host "✅ Created .env.local from template" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANT: Please edit .env.local and add your API keys if needed!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ env.local.template not found. Cannot create .env.local" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env.local exists" -ForegroundColor Green
}

Write-Host ""

# Step 3: Ask for deployment method
Write-Host "📋 Step 3: Choose Deployment Method" -ForegroundColor Green
Write-Host ""
Write-Host "1. Docker Compose (Recommended - Easiest)" -ForegroundColor Cyan
Write-Host "2. Production Build (Requires existing PostgreSQL/Redis)" -ForegroundColor Cyan
Write-Host "3. Development Mode (npm run dev)" -ForegroundColor Cyan
Write-Host ""
$choice = Read-Host 'Enter your choice: 1, 2, or 3'

Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "🐳 Deploying with Docker Compose..." -ForegroundColor Cyan
        Write-Host ""
        
        # Step 3.1: Start infrastructure services
        Write-Host "Starting infrastructure services (this may take 5-10 minutes on first run)..." -ForegroundColor Yellow
        docker-compose up -d
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Services started. Waiting for services to be ready..." -ForegroundColor Green
        Start-Sleep -Seconds 30
        
        # Step 3.2: Check services
        Write-Host "Checking service status..." -ForegroundColor Yellow
        docker-compose ps
        
        # Step 3.3: Install dependencies
        Write-Host ""
        Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
        npm install
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
            exit 1
        }
        
        # Step 3.4: Setup database
        Write-Host ""
        Write-Host "Setting up database..." -ForegroundColor Yellow
        npx prisma generate
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "Running database migrations..." -ForegroundColor Yellow
        npx prisma migrate deploy
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️  Migration failed. Trying dev migration..." -ForegroundColor Yellow
            npx prisma migrate dev --name initial
        }
        
        # Step 3.5: Build application
        Write-Host ""
        Write-Host "Building application..." -ForegroundColor Yellow
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Build failed" -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        Write-Host "✅ Deployment Complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📌 Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Start the application: npm start" -ForegroundColor White
        Write-Host "2. Or for development: npm run dev" -ForegroundColor White
        Write-Host "3. Open browser: http://localhost:3002" -ForegroundColor White
        Write-Host ""
        Write-Host "📊 Service URLs:" -ForegroundColor Cyan
        Write-Host "- Application: http://localhost:3002" -ForegroundColor White
        Write-Host "- Grafana: http://localhost:3001" -ForegroundColor White
        Write-Host "- Prometheus: http://localhost:9090" -ForegroundColor White
        Write-Host "- Jaeger: http://localhost:16686" -ForegroundColor White
        Write-Host ""
    }
    
    "2" {
        Write-Host "🏗️  Deploying Production Build..." -ForegroundColor Cyan
        Write-Host ""
        
        # Check database connection
        Write-Host "⚠️  Make sure PostgreSQL and Redis are running and configured in .env.local" -ForegroundColor Yellow
        $continue = Read-Host "Continue? (y/n)"
        
        if ($continue -ne "y") {
            Write-Host "Deployment cancelled." -ForegroundColor Yellow
            exit 0
        }
        
        # Install dependencies
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
        
        # Generate Prisma
        Write-Host "Generating Prisma client..." -ForegroundColor Yellow
        npx prisma generate
        
        # Run migrations
        Write-Host "Running migrations..." -ForegroundColor Yellow
        npx prisma migrate deploy
        
        # Build
        Write-Host "Building application..." -ForegroundColor Yellow
        npm run build
        
        Write-Host ""
        Write-Host "✅ Build Complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📌 Start the application:" -ForegroundColor Cyan
        Write-Host "npm start" -ForegroundColor White
        Write-Host ""
    }
    
    "3" {
        Write-Host "🔧 Starting Development Mode..." -ForegroundColor Cyan
        Write-Host ""
        
        # Install dependencies
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
        
        # Generate Prisma
        Write-Host "Generating Prisma client..." -ForegroundColor Yellow
        npx prisma generate
        
        Write-Host ""
        Write-Host "✅ Ready for Development!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📌 Start development server:" -ForegroundColor Cyan
        Write-Host "npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️  Note: Make sure Docker services are running (docker-compose up -d)" -ForegroundColor Yellow
        Write-Host ""
    }
    
    default {
        Write-Host '❌ Invalid choice. Please run the script again and choose 1, 2, or 3.' -ForegroundColor Red
        exit 1
    }
}

Write-Host "🎉 Deployment script completed!" -ForegroundColor Green
Write-Host ""


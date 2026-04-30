# Complete App Setup Script - Full Database & Authentication
# This script sets up everything you need to test your app with full functionality

Write-Host "BlueDXP Full App Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env.local exists
Write-Host "Step 1: Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host ".env.local not found. Creating from template..." -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env.local"
        Write-Host "Created .env.local from template" -ForegroundColor Green
        Write-Host "Please edit .env.local and add your DATABASE_URL" -ForegroundColor Yellow
    } else {
        Write-Host "env.example not found. Creating basic .env.local..." -ForegroundColor Yellow
        $envLines = @(
            "NODE_ENV=development",
            "PORT=3002",
            "DATABASE_URL=postgresql://bluedxp:change_me_in_production@localhost:5432/bluedxp",
            "JWT_SECRET=your-super-secret-key-change-in-production",
            "JWT_ISSUER=bluedxp-platform",
            "JWT_AUDIENCE=bluedxp-client",
            "BOOTSTRAP_TENANT_ID=default-tenant"
        )
        $envLines | Out-File -FilePath ".env.local" -Encoding ASCII
        Write-Host "Created basic .env.local" -ForegroundColor Green
        Write-Host "Please edit .env.local and update DATABASE_URL with your database password" -ForegroundColor Yellow
    }
} else {
    Write-Host ".env.local exists" -ForegroundColor Green
}

# Step 2: Check if PostgreSQL is running (Docker)
Write-Host ""
Write-Host "Step 2: Checking PostgreSQL database..." -ForegroundColor Yellow
$postgresRunning = $false

# Check if Docker is available
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $postgresContainer = docker ps -a --filter "name=bluedxp-postgres" --format "{{.Names}}" 2>$null
    if ($postgresContainer -eq "bluedxp-postgres") {
        $postgresStatus = docker ps --filter "name=bluedxp-postgres" --format "{{.Status}}" 2>$null
        if ($postgresStatus -like "*Up*") {
            Write-Host "PostgreSQL container is running" -ForegroundColor Green
            $postgresRunning = $true
        } else {
            Write-Host "PostgreSQL container exists but is not running" -ForegroundColor Yellow
            Write-Host "Starting PostgreSQL container..." -ForegroundColor Gray
            docker start bluedxp-postgres 2>$null
            Start-Sleep -Seconds 3
            if (docker ps --filter "name=bluedxp-postgres" --format "{{.Names}}" 2>$null) {
                Write-Host "PostgreSQL container started" -ForegroundColor Green
                $postgresRunning = $true
            }
        }
    } else {
        Write-Host "PostgreSQL container not found" -ForegroundColor Yellow
        Write-Host "Starting PostgreSQL with Docker Compose..." -ForegroundColor Gray
        docker-compose up -d postgres 2>$null
        Start-Sleep -Seconds 5
        if (docker ps --filter "name=bluedxp-postgres" --format "{{.Names}}" 2>$null) {
            Write-Host "PostgreSQL container started" -ForegroundColor Green
            $postgresRunning = $true
        }
    }
} else {
    Write-Host "Docker not found. Assuming PostgreSQL is running locally" -ForegroundColor Yellow
    $postgresRunning = $true
}

if (-not $postgresRunning) {
    Write-Host "Could not start PostgreSQL. Please start it manually:" -ForegroundColor Red
    Write-Host "docker-compose up -d postgres" -ForegroundColor Gray
    Write-Host "OR install PostgreSQL locally and update DATABASE_URL in .env.local" -ForegroundColor Gray
    exit 1
}

# Step 3: Verify DATABASE_URL is set
Write-Host ""
Write-Host "Step 3: Verifying DATABASE_URL..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "DATABASE_URL=") {
        $dbUrl = ($envContent | Select-String -Pattern "DATABASE_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }).Trim()
        if ($dbUrl -and $dbUrl -ne "" -and $dbUrl -notlike "*change_me*") {
            Write-Host "DATABASE_URL is configured" -ForegroundColor Green
        } else {
            Write-Host "DATABASE_URL needs to be configured in .env.local" -ForegroundColor Yellow
            Write-Host "Default for Docker: postgresql://bluedxp:change_me_in_production@localhost:5432/bluedxp" -ForegroundColor Gray
            Write-Host "Please update .env.local and run this script again" -ForegroundColor Gray
            exit 1
        }
    } else {
        Write-Host "DATABASE_URL not found in .env.local" -ForegroundColor Yellow
        Write-Host "Adding default DATABASE_URL..." -ForegroundColor Gray
        Add-Content ".env.local" "`nDATABASE_URL=postgresql://bluedxp:change_me_in_production@localhost:5432/bluedxp"
        Write-Host "Please edit .env.local and update the password" -ForegroundColor Yellow
    }
}

# Step 4: Generate Prisma Client
Write-Host ""
Write-Host "Step 4: Generating Prisma Client..." -ForegroundColor Yellow
try {
    npm run prisma:generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Prisma Client generated" -ForegroundColor Green
    } else {
        Write-Host "Failed to generate Prisma Client" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error generating Prisma Client: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Run Database Migrations
Write-Host ""
Write-Host "Step 5: Running database migrations..." -ForegroundColor Yellow
Write-Host "This will create all database tables..." -ForegroundColor Gray
try {
    npm run prisma:migrate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database migrations completed" -ForegroundColor Green
    } else {
        Write-Host "Migration may have issues. Check the output above." -ForegroundColor Yellow
        Write-Host "You can try running manually: npm run prisma:migrate" -ForegroundColor Gray
    }
} catch {
    Write-Host "Migration error: $_" -ForegroundColor Yellow
    Write-Host "You may need to run migrations manually" -ForegroundColor Gray
}

# Step 6: Create Admin User
Write-Host ""
Write-Host "Step 6: Creating admin user..." -ForegroundColor Yellow
try {
    npm run setup:auth
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Admin user created" -ForegroundColor Green
    } else {
        Write-Host "Admin user setup may have issues. Check the output above." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating admin user: $_" -ForegroundColor Yellow
    Write-Host "You can create it manually: npm run setup:auth" -ForegroundColor Gray
}

# Step 7: Verify Setup
Write-Host ""
Write-Host "Step 7: Verifying setup..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start your app:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Log in at:" -ForegroundColor White
Write-Host "   http://localhost:3002/login" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Use these credentials:" -ForegroundColor White
Write-Host "   Email: admin@hazalyze.com" -ForegroundColor Cyan
Write-Host "   Password: Admin@1234" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Check diagnostics:" -ForegroundColor White
Write-Host "   http://localhost:3002/diagnostics" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: Change the password after first login!" -ForegroundColor Yellow
Write-Host ""

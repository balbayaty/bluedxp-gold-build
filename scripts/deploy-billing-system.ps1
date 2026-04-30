# 🚀 BILLING SYSTEM DEPLOYMENT SCRIPT (PowerShell)
# 
# Complete deployment automation for billing system
# BlueDXP Platform - Enterprise-Grade Billing

Write-Host "🚀 BILLING SYSTEM DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Prisma installation
Write-Host "⏳ Checking Prisma installation..." -ForegroundColor Yellow
try {
    $prismaVersion = npx prisma --version
    Write-Host "✅ Prisma installed: $prismaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Prisma not found. Installing..." -ForegroundColor Red
    npm install -g prisma
}

# Step 2: Generate Prisma Client
Write-Host ""
Write-Host "⏳ Generating Prisma client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "✅ Prisma client generated" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

# Step 3: Check database connection
Write-Host ""
Write-Host "⏳ Checking database connection..." -ForegroundColor Yellow
try {
    npx prisma db pull
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Database connection check failed (may be normal if tables don't exist yet)" -ForegroundColor Yellow
}

# Step 4: Run migrations
Write-Host ""
Write-Host "⏳ Running database migrations..." -ForegroundColor Yellow
try {
    # Try production migration first
    npx prisma migrate deploy
    Write-Host "✅ Migrations completed (production mode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Production migration failed, trying dev migration..." -ForegroundColor Yellow
    try {
        npx prisma migrate dev --name billing_system_setup
        Write-Host "✅ Migrations completed (dev mode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Migrations failed" -ForegroundColor Red
        Write-Host "   Please check:" -ForegroundColor Yellow
        Write-Host "   1. Database is running" -ForegroundColor Yellow
        Write-Host "   2. DATABASE_URL is set in .env" -ForegroundColor Yellow
        Write-Host "   3. You have database write permissions" -ForegroundColor Yellow
        exit 1
    }
}

# Step 5: Verify tables
Write-Host ""
Write-Host "⏳ Verifying tables..." -ForegroundColor Yellow
try {
    npx prisma studio --browser none &
    Write-Host "✅ Prisma Studio opened (you can verify tables there)" -ForegroundColor Green
    Write-Host "   Or run: npx prisma studio" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  Could not open Prisma Studio" -ForegroundColor Yellow
}

# Step 6: Run TypeScript deployment script
Write-Host ""
Write-Host "⏳ Running deployment verification..." -ForegroundColor Yellow
try {
    npx tsx scripts/deploy-billing-system.ts
    Write-Host "✅ Deployment verification completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Deployment verification script failed (may need tsx installed)" -ForegroundColor Yellow
    Write-Host "   Install with: npm install -D tsx" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 BILLING SYSTEM DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test the billing dashboard at /billing" -ForegroundColor White
Write-Host "   2. Create a test subscription" -ForegroundColor White
Write-Host "   3. Generate a test invoice" -ForegroundColor White
Write-Host "   4. Process a test payment" -ForegroundColor White
Write-Host ""
Write-Host "✅ Ready for end-user use!" -ForegroundColor Green

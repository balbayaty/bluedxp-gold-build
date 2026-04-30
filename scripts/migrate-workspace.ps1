# Workspace Module Database Migration Script (PowerShell)
# Run this to set up the Workspace database tables

Write-Host "🚀 Starting Workspace Module Database Migration..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Check if Prisma is installed
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: npx not found. Please install Node.js and npm." -ForegroundColor Red
    exit 1
}

# Step 1: Generate Prisma Client
Write-Host "📦 Step 1: Generating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Prisma client generated successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Prisma client generation had issues. Continuing anyway..." -ForegroundColor Yellow
        Write-Host "💡 Tip: Close your dev server and try again if you see file lock errors." -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Prisma client generation had issues. Continuing anyway..." -ForegroundColor Yellow
    Write-Host "💡 Tip: Close your dev server and try again if you see file lock errors." -ForegroundColor Gray
}
Write-Host ""

# Step 2: Create Migration
Write-Host "🗄️  Step 2: Creating database migration..." -ForegroundColor Yellow
Write-Host "   Migration name: add_workspace_module" -ForegroundColor Gray
Write-Host "   This will create:" -ForegroundColor Gray
Write-Host "   - widget_categories" -ForegroundColor Gray
Write-Host "   - widget_definitions" -ForegroundColor Gray
Write-Host "   - workspace_layouts" -ForegroundColor Gray
Write-Host "   - user_widgets" -ForegroundColor Gray
Write-Host "   - google_workspace_integrations" -ForegroundColor Gray
Write-Host "   - email_integrations" -ForegroundColor Gray
Write-Host "   - workspace_analytics" -ForegroundColor Gray
Write-Host ""

try {
    npx prisma migrate dev --name add_workspace_module
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration created and applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed." -ForegroundColor Red
        Write-Host "💡 Tip: Check your database connection in .env" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Migration failed: $_" -ForegroundColor Red
    Write-Host "💡 Tip: Check your database connection and try again." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 3: Seed Default Categories
Write-Host "🌱 Step 3: Seeding default widget categories..." -ForegroundColor Yellow
try {
    npx ts-node prisma/seed/workspaceCategories.ts
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Default categories seeded!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Category seeding had issues. You can run it manually later." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Category seeding had issues. You can run it manually later." -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Seed Default Widgets
Write-Host "🌱 Step 4: Seeding default widgets..." -ForegroundColor Yellow
try {
    npx ts-node prisma/seed/workspaceWidgets.ts
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Default widgets seeded!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Widget seeding had issues. You can run it manually later." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Widget seeding had issues. You can run it manually later." -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Verification
Write-Host "✅ Step 5: Verifying migration..." -ForegroundColor Yellow
Write-Host "   Checking migration status..." -ForegroundColor Gray
try {
    $status = npx prisma migrate status 2>&1
    Write-Host $status
} catch {
    Write-Host "⚠️  Could not verify migration status automatically" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ WORKSPACE MODULE MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start your dev server: npm run dev" -ForegroundColor White
Write-Host "   2. Navigate to /workspace in your browser" -ForegroundColor White
Write-Host "   3. Start customizing your workspace!" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - Quick Start: docs/workspace/QUICK_START.md" -ForegroundColor White
Write-Host "   - User Guide: docs/workspace/USER_GUIDE.md" -ForegroundColor White
Write-Host "   - Setup Guide: docs/workspace/SETUP_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy workspace building!" -ForegroundColor Green
Write-Host ""













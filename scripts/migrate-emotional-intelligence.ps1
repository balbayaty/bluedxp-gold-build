# Emotional Intelligence Database Migration Script (PowerShell)
# Run this after adding Prisma models

Write-Host "🔄 Running Prisma migration for Emotional Intelligence..." -ForegroundColor Yellow

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

# Create migration
Write-Host "Creating migration..." -ForegroundColor Cyan
npx prisma migrate dev --name add_emotional_intelligence_models

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Models created:" -ForegroundColor Cyan
Write-Host "  - EmotionalState"
Write-Host "  - RelationshipHealth"
Write-Host "  - BehavioralPrediction"
Write-Host "  - EmotionalInsight"
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the migration file"
Write-Host "  2. Test the database connection"
Write-Host "  3. Verify indexes are created"



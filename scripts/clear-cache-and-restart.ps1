# Clear Next.js Cache and Restart Dev Server
# Run this script to fix build cache issues

Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Cyan

# Stop any running Next.js processes
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*node*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove cache directories
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
}

if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force node_modules/.cache
    Write-Host "✅ Removed node_modules/.cache" -ForegroundColor Green
}

Write-Host "`n✅ Cache cleared!" -ForegroundColor Green
Write-Host "`n🚀 Starting dev server..." -ForegroundColor Cyan
Write-Host "   Run: npm run dev" -ForegroundColor Yellow

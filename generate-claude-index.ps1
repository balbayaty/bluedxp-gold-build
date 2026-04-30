# PowerShell Script to Generate Claude Codebase Index
# Double-click this file or run: .\generate-claude-index.ps1

Write-Host "🚀 Generating Claude Codebase Index..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Run the index generator
Write-Host ""
Write-Host "📊 Analyzing codebase..." -ForegroundColor Cyan

node scripts/generate-claude-codebase-index.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Success! Codebase index generated: CLAUDE_CODEBASE_INDEX.md" -ForegroundColor Green
    Write-Host ""
    Write-Host "📖 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Open Claude Desktop (or Claude Web)" -ForegroundColor White
    Write-Host "2. Attach the file: CLAUDE_CODEBASE_INDEX.md" -ForegroundColor White
    Write-Host "3. Ask Claude to analyze your codebase!" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Tip: See CLAUDE_ACCESS_GUIDE.md for detailed instructions" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Error generating index. Check the error messages above." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"






# Verify Ollama Integration Script
# Checks if Ollama is properly integrated with BlueDXP

Write-Host "🔍 Verifying Ollama Integration..." -ForegroundColor Green

$errors = 0

# Check 1: Ollama installed
Write-Host "`n[1/6] Checking Ollama installation..." -ForegroundColor Yellow
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "   ✅ Ollama is installed" -ForegroundColor Green
    ollama --version
} else {
    Write-Host "   ❌ Ollama is not installed" -ForegroundColor Red
    Write-Host "      Run: scripts/setup-local-llm.ps1" -ForegroundColor Cyan
    $errors++
}

# Check 2: Ollama running
Write-Host "`n[2/6] Checking Ollama service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
    Write-Host "   ✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Ollama is not running" -ForegroundColor Red
    Write-Host "      Start with: ollama serve" -ForegroundColor Cyan
    $errors++
}

# Check 3: Models available
Write-Host "`n[3/6] Checking available models..." -ForegroundColor Yellow
$models = ollama list
if ($models -match "llama2|mistral") {
    Write-Host "   ✅ Models are available" -ForegroundColor Green
    ollama list
} else {
    Write-Host "   ⚠️  No models found. Pull a model:" -ForegroundColor Yellow
    Write-Host "      ollama pull llama2" -ForegroundColor Cyan
}

# Check 4: Provider files exist
Write-Host "`n[4/6] Checking provider files..." -ForegroundColor Yellow
$files = @(
    "lib/services/llm-provider/providers/ollama/OllamaProvider.ts",
    "lib/services/llm-provider/providers/ollama/index.ts"
)
$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
        $allExist = $false
        $errors++
    }
}

# Check 5: Service initializer integration
Write-Host "`n[5/6] Checking service initializer..." -ForegroundColor Yellow
$initializer = Get-Content "lib/services/integration/serviceInitializer.ts" -Raw
if ($initializer -match "ollama") {
    Write-Host "   ✅ Ollama provider registered in service initializer" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Ollama provider not found in service initializer" -ForegroundColor Yellow
    Write-Host "      (This may be okay if using dynamic registration)" -ForegroundColor Gray
}

# Check 6: API routes
Write-Host "`n[6/6] Checking API routes..." -ForegroundColor Yellow
if (Test-Path "app/api/llm/generate/route.ts") {
    Write-Host "   ✅ LLM API routes exist" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  LLM API routes not found" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" + "="*50 -ForegroundColor Gray
if ($errors -eq 0) {
    Write-Host "✅ All checks passed! Ollama is ready to use." -ForegroundColor Green
    Write-Host "`n📝 To use Ollama:" -ForegroundColor Yellow
    Write-Host "   POST /api/llm/generate" -ForegroundColor Cyan
    Write-Host "   {`"provider`": `"ollama`", `"model`": `"llama2`", `"messages`": [...]}" -ForegroundColor Cyan
} else {
    Write-Host "❌ Found $errors issue(s). Please fix them before using Ollama." -ForegroundColor Red
}
Write-Host "="*50 -ForegroundColor Gray



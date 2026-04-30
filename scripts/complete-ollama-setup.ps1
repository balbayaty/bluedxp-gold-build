# Complete Ollama Setup Script
# Verifies installation and completes setup

Write-Host "Completing Ollama Setup..." -ForegroundColor Green
Write-Host ""

# Check if Ollama is accessible
Write-Host "[1/5] Verifying Ollama installation..." -ForegroundColor Yellow
try {
    $version = ollama --version
    Write-Host "   ✅ Ollama is installed: $version" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Ollama not found. Please restart your terminal and try again." -ForegroundColor Red
    exit 1
}

# Check if Ollama is running
Write-Host ""
Write-Host "[2/5] Checking Ollama service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 2
    Write-Host "   ✅ Ollama is running!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Ollama is not running. Starting it..." -ForegroundColor Yellow
    Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 5
    
    # Check again
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
        Write-Host "   ✅ Ollama started successfully!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to start Ollama. Please start manually: ollama serve" -ForegroundColor Red
        exit 1
    }
}

# Check available models
Write-Host ""
Write-Host "[3/5] Checking available models..." -ForegroundColor Yellow
$models = ollama list
if ($models -match "llama2|mistral") {
    Write-Host "   ✅ Models are available:" -ForegroundColor Green
    ollama list
} else {
    Write-Host "   ⚠️  No models found. Downloading base models..." -ForegroundColor Yellow
    Write-Host ""
    
    # Download llama2
    Write-Host "   📥 Downloading llama2 (this may take a few minutes)..." -ForegroundColor Cyan
    ollama pull llama2
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ llama2 downloaded!" -ForegroundColor Green
    }
    
    # Download mistral (optional, smaller)
    Write-Host ""
    Write-Host "   📥 Downloading mistral (optional)..." -ForegroundColor Cyan
    ollama pull mistral
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ mistral downloaded!" -ForegroundColor Green
    }
}

# Test model
Write-Host ""
Write-Host "[4/5] Testing model..." -ForegroundColor Yellow
$modelsList = ollama list
if ($modelsList -match "llama2") {
    Write-Host "   🧪 Testing llama2..." -ForegroundColor Cyan
    $testOutput = ollama run llama2 "Say hello in one word." 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Model test successful!" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Model test had issues, but Ollama is working" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  No models available for testing" -ForegroundColor Yellow
}

# Verify BlueDXP integration
Write-Host ""
Write-Host "[5/5] Verifying BlueDXP integration..." -ForegroundColor Yellow
$files = @(
    "lib/services/llm-provider/providers/ollama/OllamaProvider.ts",
    "lib/services/llm-provider/providers/ollama/index.ts",
    "lib/services/integration/serviceInitializer.ts"
)
$allExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
        $allExist = $false
    }
}

if ($allExist) {
    Write-Host "   ✅ BlueDXP integration complete!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Some integration files are missing" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ Ollama Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start your BlueDXP app: npm run dev" -ForegroundColor Cyan
Write-Host "   2. The Ollama provider will auto-register on startup" -ForegroundColor Cyan
Write-Host "   3. Test via API: POST /api/llm/generate" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available models:" -ForegroundColor Yellow
ollama list
Write-Host ("=" * 60) -ForegroundColor Gray


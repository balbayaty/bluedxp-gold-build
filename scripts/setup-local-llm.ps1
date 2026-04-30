# Local LLM Setup Script for Windows
# Installs Ollama and sets up local LLM infrastructure

Write-Host "Setting up Local LLM Infrastructure..." -ForegroundColor Green

# Check if Ollama is installed
Write-Host ""
Write-Host "Checking Ollama installation..." -ForegroundColor Yellow
$ollamaInstalled = Get-Command ollama -ErrorAction SilentlyContinue

if (-not $ollamaInstalled) {
    Write-Host "Ollama not found. Installing..." -ForegroundColor Red
    
    # Try winget first
    $wingetAvailable = Get-Command winget -ErrorAction SilentlyContinue
    if ($wingetAvailable) {
        Write-Host "Installing Ollama via winget..." -ForegroundColor Yellow
        winget install Ollama.Ollama --accept-package-agreements --accept-source-agreements
    } else {
        Write-Host "winget not available. Please install Ollama manually:" -ForegroundColor Yellow
        Write-Host "1. Download from: https://ollama.ai/download" -ForegroundColor Cyan
        Write-Host "2. Run the installer" -ForegroundColor Cyan
        Write-Host "3. Restart this script" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "Ollama is already installed!" -ForegroundColor Green
    ollama --version
}

# Start Ollama service
Write-Host ""
Write-Host "Starting Ollama service..." -ForegroundColor Yellow
$ollamaProcess = Get-Process ollama -ErrorAction SilentlyContinue

if (-not $ollamaProcess) {
    Write-Host "Starting Ollama..." -ForegroundColor Yellow
    Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 3
} else {
    Write-Host "Ollama is already running!" -ForegroundColor Green
}

# Check if Ollama is responding
Write-Host ""
Write-Host "Testing Ollama connection..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
    Write-Host "Ollama is running and responding!" -ForegroundColor Green
} catch {
    Write-Host "Ollama is not responding. Please check:" -ForegroundColor Red
    Write-Host "1. Is Ollama running? (ollama serve)" -ForegroundColor Cyan
    Write-Host "2. Check firewall settings" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You can start Ollama manually with: ollama serve" -ForegroundColor Yellow
    exit 1
}

# Pull base models
Write-Host ""
Write-Host "Downloading base models..." -ForegroundColor Yellow
Write-Host "This may take a while depending on your internet speed..." -ForegroundColor Gray

$models = @("llama2", "mistral")
foreach ($model in $models) {
    Write-Host ""
    Write-Host "Pulling $model..." -ForegroundColor Cyan
    ollama pull $model
    if ($LASTEXITCODE -eq 0) {
        Write-Host "$model downloaded successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to download $model. You can download it later with: ollama pull $model" -ForegroundColor Yellow
    }
}

# List available models
Write-Host ""
Write-Host "Available models:" -ForegroundColor Yellow
ollama list

# Test model (if llama2 is available)
Write-Host ""
Write-Host "Testing model..." -ForegroundColor Yellow
$modelsList = ollama list
if ($modelsList -match "llama2") {
    $testResponse = ollama run llama2 "Hello, this is a test."
    Write-Host "Model test successful!" -ForegroundColor Green
} else {
    Write-Host "No models available for testing. Pull a model first: ollama pull llama2" -ForegroundColor Yellow
}

# Verify BlueDXP integration
Write-Host ""
Write-Host "Verifying BlueDXP integration..." -ForegroundColor Yellow
$integrationFile = "lib/services/llm-provider/providers/ollama/index.ts"
if (Test-Path $integrationFile) {
    Write-Host "Ollama provider integration found!" -ForegroundColor Green
} else {
    Write-Host "Ollama provider integration not found." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Local LLM setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start your BlueDXP application" -ForegroundColor Cyan
Write-Host "2. The Ollama provider will be auto-registered" -ForegroundColor Cyan
Write-Host "3. Use via API: POST /api/llm/generate with provider: 'ollama'" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available models:" -ForegroundColor Yellow
ollama list

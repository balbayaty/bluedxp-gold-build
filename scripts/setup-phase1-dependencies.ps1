# Phase 1 Dependencies Setup Script
# Installs required packages for enhanced observability

Write-Host "📦 Installing Phase 1 dependencies..." -ForegroundColor Cyan

# Check if packages are already installed
$packages = @(
    "@opentelemetry/sdk-node",
    "@opentelemetry/auto-instrumentations-node"
)

$missingPackages = @()

foreach ($package in $packages) {
    $installed = npm list $package 2>&1 | Select-String -Pattern $package
    if (-not $installed) {
        $missingPackages += $package
    }
}

if ($missingPackages.Count -eq 0) {
    Write-Host "✅ All Phase 1 dependencies already installed" -ForegroundColor Green
    exit 0
}

Write-Host "Installing missing packages: $($missingPackages -join ', ')" -ForegroundColor Yellow

# Install packages
npm install $missingPackages --save

Write-Host "✅ Phase 1 dependencies installed successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run database migrations for new tables"
Write-Host "2. Integrate middleware into API routes"
Write-Host "3. Test security and observability features"



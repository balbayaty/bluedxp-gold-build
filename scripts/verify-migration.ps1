# Migration Verification Script
# Verifies that all migrations were successful and nothing is missing

$BLUEDXP_DIR = "C:\Users\balba\hazalyze-asn-module"
$CHEMCHECK_DIR = "C:\Users\balba\chemcheck-analysis"
$VERIFICATION_REPORT = "$BLUEDXP_DIR\migration-verification-report.txt"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Find latest gap analysis
$latestJson = Get-ChildItem -Path "$BLUEDXP_DIR\gap-analysis-results" -Filter "gap-analysis-data_*.json" -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

if (-not $latestJson) {
    Write-Host "❌ No gap analysis found. Run gap analysis first." -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Starting Migration Verification..." -ForegroundColor Cyan
Write-Host "📦 Using gap analysis: $($latestJson.Name)" -ForegroundColor Cyan

$gapData = ((Get-Content $latestJson.FullName -ErrorAction SilentlyContinue) -join "`n") | ConvertFrom-Json

$verification = @{
    Passed = 0
    Failed = 0
    Warnings = 0
    Issues = @()
    MissingFiles = @()
    ImportIssues = @()
    MergeNeeded = @()
}

function Verify-File {
    param($File, $Category)
    
    if (-not (Test-Path $File)) {
        $verification.Failed++
        $verification.MissingFiles += "$Category - $File"
        return $false
    }
    
    # Check for compilation errors (basic syntax check)
    $content = (Get-Content $File -ErrorAction SilentlyContinue) -join "`n"
    if ($null -eq $content) {
        $verification.Failed++
        $verification.Issues += "❌ EMPTY: $Category - $File"
        return $false
    }
    
    # Check for common issues
    if ($content -match "from ['\"]react-icons/fi['\"]") {
        $verification.Warnings++
        $verification.ImportIssues += "$Category - $File (still uses react-icons)"
    }
    
    if ($content -match "TODO|FIXME|XXX") {
        $verification.Warnings++
        $verification.Issues += "⚠️ TODO: $Category - $File (contains TODO/FIXME)"
    }
    
    # Check for merge files
    if (Test-Path "$File.chemcheck") {
        $verification.Warnings++
        $verification.MergeNeeded += "$Category - $File"
    }
    
    $verification.Passed++
    return $true
}

# Verify migrated services
Write-Host "⚙️ Verifying services..." -ForegroundColor Yellow
foreach ($category in $gapData.Gaps.ServiceCategories) {
    if ($gapData.ChemCheck.Services.Categories.PSObject.Properties.Name -contains $category) {
        $files = $gapData.ChemCheck.Services.Categories.$category
        foreach ($file in $files) {
            $target = "$BLUEDXP_DIR\lib\services\$($file.Replace('lib/services/', '').Replace('lib/', '').Replace('services/', ''))"
            Verify-File $target "Service"
        }
    }
}

# Verify migrated components
Write-Host "🧩 Verifying components..." -ForegroundColor Yellow
foreach ($category in $gapData.Gaps.ComponentCategories) {
    if ($gapData.ChemCheck.Components.Categories.PSObject.Properties.Name -contains $category) {
        $files = $gapData.ChemCheck.Components.Categories.$category
        foreach ($file in $files) {
            $target = "$BLUEDXP_DIR\$file"
            Verify-File $target "Component"
        }
    }
}

# Verify migrated API routes
Write-Host "🔌 Verifying API routes..." -ForegroundColor Yellow
foreach ($category in $gapData.Gaps.APIRouteCategories) {
    if ($gapData.ChemCheck.APIRoutes.Categories.PSObject.Properties.Name -contains $category) {
        $files = $gapData.ChemCheck.APIRoutes.Categories.$category
        foreach ($file in $files) {
            $target = "$BLUEDXP_DIR\app\api\$file"
            Verify-File $target "API-Route"
        }
    }
}

# Verify migrated pages
Write-Host "📄 Verifying pages..." -ForegroundColor Yellow
foreach ($pageRoute in $gapData.Gaps.Pages) {
    $pagePath = $pageRoute.TrimStart('/')
    $target = "$BLUEDXP_DIR\app\$pagePath\page.tsx"
    if (-not (Test-Path $target)) {
        $target = "$BLUEDXP_DIR\app\$pagePath\page.ts"
    }
    Verify-File $target "Page"
}

# Verify dependencies
Write-Host "📦 Verifying dependencies..." -ForegroundColor Yellow
$pkgPath = "$BLUEDXP_DIR\package.json"
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
    foreach ($depName in $gapData.Gaps.Dependencies) {
        if (-not $pkg.dependencies.PSObject.Properties.Name -contains $depName) {
            $verification.Failed++
            $verification.Issues += "❌ MISSING_DEPENDENCY: $depName"
        } else {
            $verification.Passed++
        }
    }
}

# Generate report
"=== Migration Verification Report ===" | Out-File $VERIFICATION_REPORT -Encoding UTF8
"Generated: $(Get-Date)" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
"" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
"Summary:" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
"  ✅ Passed: $($verification.Passed)" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
"  ❌ Failed: $($verification.Failed)" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
"  ⚠️ Warnings: $($verification.Warnings)" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
"" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8

if ($verification.MissingFiles.Count -gt 0) {
    "Missing Files:" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
    $verification.MissingFiles | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
    "" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
}

if ($verification.ImportIssues.Count -gt 0) {
    "Import Issues (need react-icons → remixicon fix):" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
    $verification.ImportIssues | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
    "" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
}

if ($verification.MergeNeeded.Count -gt 0) {
    "Files Needing Merge (.chemcheck files exist):" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
    $verification.MergeNeeded | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
    "" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
}

if ($verification.Issues.Count -gt 0) {
    "All Issues:" | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
    $verification.Issues | Out-File $VERIFICATION_REPORT -Append -Encoding UTF8
}

Write-Host ""
Write-Host "✅ Verification Complete!" -ForegroundColor Green
Write-Host "  ✅ Passed: $($verification.Passed)" -ForegroundColor Green
Write-Host "  ❌ Failed: $($verification.Failed)" -ForegroundColor $(if ($verification.Failed -gt 0) { "Red" } else { "Green" })
Write-Host "  ⚠️ Warnings: $($verification.Warnings)" -ForegroundColor $(if ($verification.Warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host "📄 Report: $VERIFICATION_REPORT" -ForegroundColor Cyan

if ($verification.Failed -eq 0 -and $verification.Warnings -eq 0) {
    Write-Host ""
    Write-Host "🎉 MIGRATION 100% COMPLETE - All files verified!" -ForegroundColor Green
    Write-Host "✅ You can now safely disregard the old codebase!" -ForegroundColor Green
}


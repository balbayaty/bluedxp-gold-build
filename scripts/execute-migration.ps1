# Migration Execution Script
# Migrates missing features from chemcheck-analysis to BlueDXP based on gap analysis

param(
    [string]$GapAnalysisJson = "",
    [switch]$DryRun = $false
)

$BLUEDXP_DIR = "C:\Users\balba\hazalyze-asn-module"
$CHEMCHECK_DIR = "C:\Users\balba\chemcheck-analysis"
$MIGRATION_LOG = "$BLUEDXP_DIR\migration-execution-log.txt"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Initialize log
"=== Migration Execution Log - $TIMESTAMP ===" | Out-File $MIGRATION_LOG -Encoding UTF8
"" | Out-File $MIGRATION_LOG -Append -Encoding UTF8

if (-not $GapAnalysisJson) {
    # Find latest gap analysis JSON
    $latestJson = Get-ChildItem -Path "$BLUEDXP_DIR\gap-analysis-results" -Filter "gap-analysis-data_*.json" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($latestJson) {
        $GapAnalysisJson = $latestJson.FullName
        Write-Host "📦 Using gap analysis: $($latestJson.Name)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ No gap analysis JSON found. Run gap analysis first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "📦 Loading gap analysis data..." -ForegroundColor Cyan
try {
    $jsonContent = (Get-Content $GapAnalysisJson -ErrorAction SilentlyContinue) -join "`n"
    $gapData = $jsonContent | ConvertFrom-Json
} catch {
    Write-Host "❌ Error loading gap analysis: $_" -ForegroundColor Red
    exit 1
}

$migrationStats = @{
    Copied = 0
    Merged = 0
    Skipped = 0
    Errors = 0
}

function Log-Migration {
    param($Message, $Type = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Type] $Message"
    Write-Host $logMessage
    $logMessage | Out-File $MIGRATION_LOG -Append -Encoding UTF8
}

function Migrate-File {
    param($SourceFile, $TargetFile, $Category)
    
    if (-not (Test-Path $SourceFile)) {
        Log-Migration "Source not found: $SourceFile" "WARNING"
        $migrationStats.Skipped++
        return $false
    }
    
    $targetDir = Split-Path $TargetFile -Parent
    if (-not (Test-Path $targetDir)) {
        if (-not $DryRun) {
            New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        }
        Log-Migration "Created directory: $targetDir" "INFO"
    }
    
    if (Test-Path $TargetFile) {
        Log-Migration "Target exists: $TargetFile - Saving as .chemcheck for merge" "MERGE"
        $mergeFile = "$TargetFile.chemcheck"
        if (-not $DryRun) {
            Copy-Item $SourceFile $mergeFile -Force
        }
        $migrationStats.Merged++
        return $true
    }
    
    if (-not $DryRun) {
        try {
            Copy-Item $SourceFile $TargetFile -Force
            Log-Migration "Migrated: $TargetFile" "SUCCESS"
            $migrationStats.Copied++
            
            # Fix imports
            Fix-Imports $TargetFile
            return $true
        } catch {
            Log-Migration "Error copying $TargetFile : $_" "ERROR"
            $migrationStats.Errors++
            return $false
        }
    } else {
        Log-Migration "Would migrate: $TargetFile" "DRYRUN"
        $migrationStats.Copied++
        return $true
    }
}

function Fix-Imports {
    param($File)
    if (-not (Test-Path $File)) { return }
    
    try {
        $content = (Get-Content $File -ErrorAction SilentlyContinue) -join "`n"
        $original = $content
        $changed = $false
        
        # Fix icon imports
        if ($content -match "from ['\"]react-icons/fi['\"]") {
            $content = $content -replace "from ['\"]react-icons/fi['\"]", "from 'remixicon-react'"
            $content = $content -replace '\bFi([A-Z])', 'Ri$1'
            $changed = $true
        }
        
        # Fix relative paths
        if ($content -match '@/lib/(?!services/)') {
            $content = $content -replace '@/lib/(?!services/)', '@/lib/services/'
            $changed = $true
        }
        
        if ($changed) {
            Set-Content -Path $File -Value $content -NoNewline
            Log-Migration "Fixed imports in: $File" "FIX"
        }
    } catch {
        Log-Migration "Error fixing imports in $File : $_" "WARNING"
    }
}

# ============================================================================
# MIGRATION EXECUTION
# ============================================================================

Write-Host "🚀 Starting Migration..." -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "  🔍 DRY RUN MODE - No files will be modified" -ForegroundColor Yellow
    Log-Migration "Starting migration in DRY RUN mode" "INFO"
} else {
    Log-Migration "Starting migration" "INFO"
}

# 1. Migrate missing services
Write-Host "⚙️ Migrating services..." -ForegroundColor Yellow
Log-Migration "=== PHASE 1: SERVICES ===" "PHASE"

if ($gapData.Detailed.ServiceCategories) {
    foreach ($category in $gapData.Detailed.ServiceCategories.PSObject.Properties.Name) {
        $files = $gapData.Detailed.ServiceCategories.$category
        foreach ($file in $files) {
            $source = "$CHEMCHECK_DIR\$file"
            # Determine target path based on source structure
            if ($file -match "^lib[\\/]") {
                $target = "$BLUEDXP_DIR\$file"
            } elseif ($file -match "^services[\\/]") {
                $target = "$BLUEDXP_DIR\lib\services\$($file.Replace('services/', ''))"
            } else {
                $target = "$BLUEDXP_DIR\lib\services\$file"
            }
            Migrate-File $source $target "Service"
        }
    }
}

# Migrate missing service classes
foreach ($className in $gapData.Gaps.ServiceClasses) {
    if ($gapData.ChemCheck.Services.Exports.PSObject.Properties.Name -contains $className) {
        $file = $gapData.ChemCheck.Services.Exports.$className.File
        $source = "$CHEMCHECK_DIR\$file"
        $target = "$BLUEDXP_DIR\$file"
        Migrate-File $source $target "Service-Class"
    }
}

# 2. Migrate missing components
Write-Host "🧩 Migrating components..." -ForegroundColor Yellow
Log-Migration "=== PHASE 2: COMPONENTS ===" "PHASE"

if ($gapData.Detailed.ComponentCategories) {
    foreach ($category in $gapData.Detailed.ComponentCategories.PSObject.Properties.Name) {
        $files = $gapData.Detailed.ComponentCategories.$category
        foreach ($file in $files) {
            $source = "$CHEMCHECK_DIR\$file"
            $target = "$BLUEDXP_DIR\$file"
            Migrate-File $source $target "Component"
        }
    }
}

# Migrate missing component exports
foreach ($exportName in $gapData.Gaps.ComponentExports) {
    # Find file containing this export
    $files = Get-ChildItem -Path "$CHEMCHECK_DIR\components" -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -match "export.*$exportName") {
            $source = $file.FullName
            $target = $source.Replace($CHEMCHECK_DIR, $BLUEDXP_DIR)
            Migrate-File $source $target "Component-Export"
            break
        }
    }
}

# 3. Migrate missing API routes
Write-Host "🔌 Migrating API routes..." -ForegroundColor Yellow
Log-Migration "=== PHASE 3: API ROUTES ===" "PHASE"

if ($gapData.Detailed.APIRouteCategories) {
    foreach ($category in $gapData.Detailed.APIRouteCategories.PSObject.Properties.Name) {
        $files = $gapData.Detailed.APIRouteCategories.$category
        foreach ($file in $files) {
            # chemcheck-analysis uses Pages Router, BlueDXP uses App Router
            # Convert pages/api/... to app/api/.../route.ts
            if ($file -match "^pages[\\/]api[\\/](.+)\.(ts|tsx)$") {
                $routePath = $matches[1]
                $source = "$CHEMCHECK_DIR\pages\api\$routePath.ts"
                if (-not (Test-Path $source)) {
                    $source = "$CHEMCHECK_DIR\pages\api\$routePath.tsx"
                }
                $targetDir = "$BLUEDXP_DIR\app\api\$routePath"
                $target = "$targetDir\route.ts"
            } else {
                $source = "$CHEMCHECK_DIR\pages\api\$file"
                $target = "$BLUEDXP_DIR\app\api\$file\route.ts"
            }
            Migrate-File $source $target "API-Route"
        }
    }
}

# 4. Migrate missing pages
Write-Host "📄 Migrating pages..." -ForegroundColor Yellow
Log-Migration "=== PHASE 4: PAGES ===" "PHASE"

foreach ($pageRoute in $gapData.Gaps.Pages) {
    $pagePath = $pageRoute.TrimStart('/').Replace('\', '/')
    
    # Skip API routes (handled separately)
    if ($pagePath -match '^api[\\/]') { continue }
    
    # chemcheck-analysis uses Pages Router, convert to App Router
    if ($pagePath -match '^pages[\\/](.+)$') {
        $routePath = $matches[1]
    } else {
        $routePath = $pagePath
    }
    
    # Find source file (Pages Router format)
    $source = "$CHEMCHECK_DIR\pages\$routePath.tsx"
    if (-not (Test-Path $source)) {
        $source = "$CHEMCHECK_DIR\pages\$routePath.ts"
    }
    if (-not (Test-Path $source)) {
        $source = "$CHEMCHECK_DIR\pages\$routePath\index.tsx"
    }
    if (-not (Test-Path $source)) {
        $source = "$CHEMCHECK_DIR\pages\$routePath\index.ts"
    }
    
    if (Test-Path $source) {
        $target = "$BLUEDXP_DIR\app\$routePath\page.tsx"
        Migrate-File $source $target "Page"
    } else {
        Log-Migration "Source page not found: $pageRoute" "WARNING"
    }
}

# 5. Migrate missing types
Write-Host "📝 Migrating types..." -ForegroundColor Yellow
Log-Migration "=== PHASE 5: TYPES ===" "PHASE"

foreach ($typeName in $gapData.Gaps.Types) {
    # Find file containing this type
    $files = Get-ChildItem -Path "$CHEMCHECK_DIR\types" -Recurse -Include *.ts -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -match "export.*(interface|type|enum)\s+$typeName") {
            $source = $file.FullName
            $target = $source.Replace($CHEMCHECK_DIR, $BLUEDXP_DIR)
            Migrate-File $source $target "Type"
            break
        }
    }
}

# 6. Update package.json with missing dependencies
Write-Host "📦 Updating dependencies..." -ForegroundColor Yellow
Log-Migration "=== PHASE 6: DEPENDENCIES ===" "PHASE"

if ($gapData.Gaps.Dependencies.Count -gt 0) {
    $pkgPath = "$BLUEDXP_DIR\package.json"
    if (Test-Path $pkgPath) {
        $pkg = ((Get-Content $pkgPath -ErrorAction SilentlyContinue) -join "`n") | ConvertFrom-Json
        
        foreach ($depName in $gapData.Gaps.Dependencies) {
            $depVersion = ($gapData.ChemCheck.TechStack.Dependencies | Where-Object { $_.Name -eq $depName }).Version
            if ($depVersion -and -not $pkg.dependencies.PSObject.Properties.Name -contains $depName) {
                if (-not $DryRun) {
                    if (-not $pkg.dependencies) {
                        $pkg | Add-Member -MemberType NoteProperty -Name "dependencies" -Value @{}
                    }
                    $pkg.dependencies | Add-Member -MemberType NoteProperty -Name $depName -Value $depVersion -Force
                    Log-Migration "Added dependency: $depName@$depVersion" "DEPENDENCY"
                } else {
                    Log-Migration "Would add dependency: $depName@$depVersion" "DRYRUN"
                }
            }
        }
        
        if (-not $DryRun) {
            $pkg | ConvertTo-Json -Depth 10 | Set-Content $pkgPath
        }
    }
}

# Summary
Write-Host ""
Write-Host "✅ Migration Complete!" -ForegroundColor Green
Write-Host "📊 Statistics:" -ForegroundColor Cyan
Write-Host "  ✅ Copied: $($migrationStats.Copied)" -ForegroundColor Green
Write-Host "  🔄 Merged: $($migrationStats.Merged)" -ForegroundColor Yellow
Write-Host "  ⏭️ Skipped: $($migrationStats.Skipped)" -ForegroundColor Gray
Write-Host "  ❌ Errors: $($migrationStats.Errors)" -ForegroundColor $(if ($migrationStats.Errors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "📄 Log: $MIGRATION_LOG" -ForegroundColor Cyan

Log-Migration "=== MIGRATION COMPLETE ===" "PHASE"
Log-Migration "Copied: $($migrationStats.Copied), Merged: $($migrationStats.Merged), Skipped: $($migrationStats.Skipped), Errors: $($migrationStats.Errors)" "SUMMARY"


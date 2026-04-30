# Deep Code Analysis - Analyzes actual LOGIC and FUNCTIONALITY
# Not just file names - but what code actually DOES and how to integrate it

$BLUEDXP_DIR = "C:\Users\balba\hazalyze-asn-module"
$CHEMCHECK_DIR = "C:\Users\balba\chemcheck-analysis"
$OUTPUT_DIR = "$BLUEDXP_DIR\gap-analysis-results"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null
$REPORT_FILE = "$OUTPUT_DIR\DEEP_CODE_ANALYSIS_$TIMESTAMP.md"
$JSON_FILE = "$OUTPUT_DIR\deep-code-data_$TIMESTAMP.json"

Write-Host "Starting Deep Code Analysis (Logic & Functionality)..." -ForegroundColor Cyan
Write-Host ""

$analysis = @{
    Services = @{}
    Components = @{}
    Pages = @{}
    IntegrationPoints = @()
    Capabilities = @{}
    Recommendations = @()
}

# Analyze Service Logic
function Analyze-ServiceLogic {
    param($File)
    
    if (-not (Test-Path $File)) { return $null }
    
    $content = (Get-Content $File -ErrorAction SilentlyContinue) -join "`n"
    if (-not $content) { return $null }
    
    $service = @{
        File = $File
        Exports = @()
        Functions = @()
        Classes = @()
        Interfaces = @()
        Dependencies = @()
        Capabilities = @()
        IntegrationPoints = @()
        Patterns = @{}
        BlueDXPEquivalent = $null
        IntegrationStrategy = ""
    }
    
    # Extract exports
    $exportMatches = [regex]::Matches($content, 'export\s+(default\s+)?(class|interface|type|function|const|enum)\s+(\w+)')
    foreach ($match in $exportMatches) {
        $type = $match.Groups[2].Value
        $name = $match.Groups[3].Value
        $service.Exports += @{ Type = $type; Name = $name }
        
        if ($type -eq "class") { $service.Classes += $name }
        if ($type -eq "interface") { $service.Interfaces += $name }
        if ($type -eq "function") { $service.Functions += $name }
    }
    
    # Extract function signatures
    $funcMatches = [regex]::Matches($content, '(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)')
    foreach ($match in $funcMatches) {
        if ($service.Functions -notcontains $match.Groups[1].Value) {
            $service.Functions += $match.Groups[1].Value
        }
    }
    
    # Extract class methods
    $methodMatches = [regex]::Matches($content, '(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{')
    foreach ($match in $methodMatches) {
        if ($match.Groups[1].Value -notmatch '^(constructor|get|set)$') {
            $service.Functions += $match.Groups[1].Value
        }
    }
    
    # Detect capabilities from code patterns
    if ($content -match 'analyze|analysis|process') { $service.Capabilities += "Analysis" }
    if ($content -match 'predict|prediction|forecast') { $service.Capabilities += "Prediction" }
    if ($content -match 'compliance|regulatory|audit') { $service.Capabilities += "Compliance" }
    if ($content -match 'iot|sensor|device') { $service.Capabilities += "IoT" }
    if ($content -match 'dashboard|metrics|analytics') { $service.Capabilities += "Dashboard" }
    if ($content -match 'ai|ml|model|neural') { $service.Capabilities += "AI/ML" }
    if ($content -match 'workflow|process|orchestrat') { $service.Capabilities += "Workflow" }
    if ($content -match 'tenant|multi-tenant') { $service.Capabilities += "MultiTenant" }
    if ($content -match 'event|emit|subscribe|publish') { $service.Capabilities += "EventDriven" }
    if ($content -match 'storage|database|firebase|mongodb') { $service.Capabilities += "Storage" }
    if ($content -match 'api|http|fetch|request') { $service.Capabilities += "API" }
    if ($content -match 'vision|image|video|camera') { $service.Capabilities += "Vision" }
    if ($content -match 'chemical|sds|msds|hazard') { $service.Capabilities += "Chemical" }
    
    # Detect integration points
    if ($content -match 'EventBus|event-bus|publishEvent|subscribe') {
        $service.IntegrationPoints += "EventBus"
    }
    if ($content -match 'ModuleRegistry|registerModule|getModule') {
        $service.IntegrationPoints += "ModuleRegistry"
    }
    if ($content -match 'tenant|TenantContext|getTenant') {
        $service.IntegrationPoints += "MultiTenant"
    }
    if ($content -match 'RBAC|role|permission|authorize') {
        $service.IntegrationPoints += "RBAC"
    }
    
    # Detect architectural patterns
    if ($content -match 'class\s+\w+\s+extends') { $service.Patterns['Inheritance'] = $true }
    if ($content -match 'interface\s+\w+') { $service.Patterns['Interface'] = $true }
    if ($content -match 'async\s+function|Promise|await') { $service.Patterns['Async'] = $true }
    if ($content -match 'EventEmitter|\.on\(|\.emit\(') { $service.Patterns['EventEmitter'] = $true }
    
    # Find BlueDXP equivalent by capability matching
    $service.BlueDXPEquivalent = Find-BlueDXPEquivalent $service.Capabilities
    
    # Determine integration strategy
    if ($service.BlueDXPEquivalent) {
        $service.IntegrationStrategy = "ENHANCE_EXISTING"
    } elseif ($service.IntegrationPoints.Count -gt 0) {
        $service.IntegrationStrategy = "INTEGRATE_NEW"
    } else {
        $service.IntegrationStrategy = "STANDALONE_MIGRATE"
    }
    
    return $service
}

# Find BlueDXP equivalent service
function Find-BlueDXPEquivalent {
    param($Capabilities)
    
    # Map capabilities to BlueDXP services
    $capabilityMap = @{
        "AI/ML" = @("lib\services\ai", "lib\services\ml-registry")
        "Vision" = @("lib\services\ai\visionService.ts", "lib\services\ai\chemicalVisionService.ts")
        "Chemical" = @("lib\services\chemical", "lib\services\compliance")
        "Compliance" = @("lib\services\compliance")
        "IoT" = @("lib\services\iot", "lib\services\facility\iot")
        "Dashboard" = @("lib\services\dashboards")
        "Workflow" = @("lib\services\process-lifecycle", "lib\services\workflows")
        "Storage" = @("lib\services\firebase", "lib\services\cache")
        "EventDriven" = @("lib\services\event-bus", "lib\services\event-store")
        "MultiTenant" = @("lib\services")
    }
    
    foreach ($cap in $Capabilities) {
        if ($capabilityMap.ContainsKey($cap)) {
            return $capabilityMap[$cap]
        }
    }
    
    return $null
}

# Analyze Component Logic
function Analyze-ComponentLogic {
    param($File)
    
    if (-not (Test-Path $File)) { return $null }
    
    $content = (Get-Content $File -ErrorAction SilentlyContinue) -join "`n"
    if (-not $content) { return $null }
    
    $component = @{
        File = $File
        Name = ""
        Props = @()
        Hooks = @()
        State = @()
        Effects = @()
        Capabilities = @()
        Dependencies = @()
        BlueDXPEquivalent = $null
        IntegrationStrategy = ""
    }
    
    # Extract component name
    $nameMatch = [regex]::Match($content, 'export\s+(?:default\s+)?(?:function|const)\s+(\w+)')
    if ($nameMatch.Success) {
        $component.Name = $nameMatch.Groups[1].Value
    }
    
    # Extract props
    $propMatches = [regex]::Matches($content, 'interface\s+\w+Props\s*\{([^}]+)\}')
    foreach ($match in $propMatches) {
        $props = $match.Groups[1].Value -split ',|\n'
        foreach ($prop in $props) {
            $prop = $prop.Trim()
            if ($prop -and $prop -notmatch '^\s*$') {
                $component.Props += $prop
            }
        }
    }
    
    # Extract hooks
    $hookMatches = [regex]::Matches($content, '(use\w+)\s*\(')
    foreach ($match in $hookMatches) {
        $component.Hooks += $match.Groups[1].Value
    }
    
    # Extract state
    $stateMatches = [regex]::Matches($content, 'useState\s*<[^>]*>\s*\([^)]*\)\s*\[(\w+)')
    foreach ($match in $stateMatches) {
        $component.State += $match.Groups[1].Value
    }
    
    # Extract effects
    $effectMatches = [regex]::Matches($content, 'useEffect\s*\([^)]*\)')
    foreach ($match in $effectMatches) {
        $component.Effects += "effect"
    }
    
    # Detect capabilities
    if ($content -match 'dashboard|metrics|chart|graph') { $component.Capabilities += "Dashboard" }
    if ($content -match 'form|input|submit') { $component.Capabilities += "Form" }
    if ($content -match 'table|list|grid') { $component.Capabilities += "DataDisplay" }
    if ($content -match 'modal|dialog|popup') { $component.Capabilities += "Modal" }
    if ($content -match 'ai|copilot|assistant') { $component.Capabilities += "AI" }
    if ($content -match 'iot|sensor|device') { $component.Capabilities += "IoT" }
    if ($content -match 'compliance|audit|regulatory') { $component.Capabilities += "Compliance" }
    
    # Find BlueDXP equivalent
    $component.BlueDXPEquivalent = Find-BlueDXPComponent $component.Capabilities $component.Name
    
    if ($component.BlueDXPEquivalent) {
        $component.IntegrationStrategy = "ENHANCE_EXISTING"
    } else {
        $component.IntegrationStrategy = "NEW_COMPONENT"
    }
    
    return $component
}

function Find-BlueDXPComponent {
    param($Capabilities, $Name)
    
    # Search BlueDXP components directory for similar components
    $searchPaths = @("components", "app")
    foreach ($path in $searchPaths) {
        if (Test-Path "$BLUEDXP_DIR\$path") {
            $files = Get-ChildItem -Path "$BLUEDXP_DIR\$path" -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -like "*$Name*" -or $_.Name -like "*Dashboard*" -or $_.Name -like "*Metrics*" }
            if ($files) {
                return $files[0].FullName.Replace("$BLUEDXP_DIR\", "")
            }
        }
    }
    
    return $null
}

# ============================================================================
# MAIN ANALYSIS
# ============================================================================

Write-Host "Analyzing chemcheck-analysis Services (Deep Logic)..." -ForegroundColor Yellow

# Get all service files from gap analysis
$gapJson = Get-ChildItem -Path "$OUTPUT_DIR" -Filter "final-gap-data_*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$gapData = $null
if ($gapJson) {
    $gapData = ((Get-Content $gapJson.FullName -ErrorAction SilentlyContinue) -join "`n") | ConvertFrom-Json
}

if ($gapData -and $gapData.Detailed.ServiceCategories) {
        foreach ($category in $gapData.Detailed.ServiceCategories.PSObject.Properties.Name) {
            $files = $gapData.Detailed.ServiceCategories.$category
            $fileCount = $files.Count
            Write-Host "  Analyzing category: $category ($fileCount files)" -ForegroundColor Cyan
            
            foreach ($file in $files) {
                $sourceFile = Join-Path $CHEMCHECK_DIR $file
                $service = Analyze-ServiceLogic $sourceFile
                
                if ($service) {
                    $key = $file.Replace('\', '/')
                    $analysis.Services[$key] = $service
                    
                    $exportCount = $service.Exports.Count
                    $funcCount = $service.Functions.Count
                    $caps = $service.Capabilities -join ', '
                    Write-Host "    - $exportCount exports, $funcCount functions, Capabilities: $caps" -ForegroundColor Gray
                }
            }
        }
}

Write-Host ""
Write-Host "Analyzing chemcheck-analysis Components (Deep Logic)..." -ForegroundColor Yellow

if ($gapData -and $gapData.Detailed.ComponentCategories) {
    foreach ($category in $gapData.Detailed.ComponentCategories.PSObject.Properties.Name) {
        $files = $gapData.Detailed.ComponentCategories.$category
        $fileCount = $files.Count
        Write-Host "  Analyzing category: $category ($fileCount files)" -ForegroundColor Cyan
        
        foreach ($file in $files) {
            $sourceFile = Join-Path $CHEMCHECK_DIR $file
            $component = Analyze-ComponentLogic $sourceFile
            
            if ($component) {
                $key = $file.Replace('\', '/')
                $analysis.Components[$key] = $component
                
                $hookCount = $component.Hooks.Count
                $stateCount = $component.State.Count
                Write-Host "    - $($component.Name) - $hookCount hooks, $stateCount state" -ForegroundColor Gray
            }
        }
    }
}

# Generate Integration Report
Write-Host ""
Write-Host "Generating Integration Report..." -ForegroundColor Yellow

"# Deep Code Analysis & Integration Plan" | Out-File $REPORT_FILE -Encoding UTF8
"**Generated:** $(Get-Date)" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

"## Executive Summary" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Strategy | Count | Description |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"|----------|-------|-------------|" | Out-File $REPORT_FILE -Append -Encoding UTF8

$enhanceCount = ($analysis.Services.Values | Where-Object { $_.IntegrationStrategy -eq "ENHANCE_EXISTING" }).Count
$integrateCount = ($analysis.Services.Values | Where-Object { $_.IntegrationStrategy -eq "INTEGRATE_NEW" }).Count
$standaloneCount = ($analysis.Services.Values | Where-Object { $_.IntegrationStrategy -eq "STANDALONE_MIGRATE" }).Count

"| ENHANCE_EXISTING | $enhanceCount | Merge functionality into existing BlueDXP services |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| INTEGRATE_NEW | $integrateCount | Create new services integrated with BlueDXP architecture |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| STANDALONE_MIGRATE | $standaloneCount | Migrate as new standalone services |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

"## Services Integration Plan" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

foreach ($serviceKey in $analysis.Services.Keys | Sort-Object) {
    $service = $analysis.Services[$serviceKey]
    
    "### $serviceKey" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "**Exports:** $($service.Exports.Count) | **Functions:** $($service.Functions.Count) | **Capabilities:** $($service.Capabilities -join ', ')" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    
    if ($service.BlueDXPEquivalent) {
        "**BlueDXP Equivalent:** $($service.BlueDXPEquivalent -join ', ')" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "**Strategy:** ENHANCE_EXISTING - Merge functionality into existing service" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "**Integration Steps:**" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "1. Review existing BlueDXP service" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "2. Extract unique functions from chemcheck-analysis service" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "3. Integrate functions into BlueDXP service" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "4. Update Module Registry if needed" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "5. Add Event Bus integration if missing" | Out-File $REPORT_FILE -Append -Encoding UTF8
    } elseif ($service.IntegrationPoints.Count -gt 0) {
        "**Strategy:** INTEGRATE_NEW - Create new service with BlueDXP integration" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "**Integration Points:** $($service.IntegrationPoints -join ', ')" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "**Integration Steps:**" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "1. Create service in lib/services/[category]/" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "2. Add Event Bus integration" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "3. Add Module Registry registration" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "4. Add Multi-tenant support" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "5. Add RBAC integration" | Out-File $REPORT_FILE -Append -Encoding UTF8
    } else {
        "**Strategy:** STANDALONE_MIGRATE - Migrate as new service" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "**Integration Steps:**" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "1. Migrate service file" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "2. Add BlueDXP integration layer" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "3. Register in Module Registry" | Out-File $REPORT_FILE -Append -Encoding UTF8
    }
    
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "**Key Functions:**" | Out-File $REPORT_FILE -Append -Encoding UTF8
    foreach ($func in $service.Functions | Select-Object -First 10) {
        "  - $func" | Out-File $REPORT_FILE -Append -Encoding UTF8
    }
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "---" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
}

# Save JSON
$analysis | ConvertTo-Json -Depth 10 | Out-File $JSON_FILE -Encoding UTF8

Write-Host ""
Write-Host "Deep Code Analysis Complete!" -ForegroundColor Green
Write-Host "Report: $REPORT_FILE" -ForegroundColor Cyan
Write-Host "Data: $JSON_FILE" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Services Analyzed: $($analysis.Services.Count)" -ForegroundColor Green
Write-Host "  Components Analyzed: $($analysis.Components.Count)" -ForegroundColor Green
Write-Host "  Enhance Existing: $enhanceCount" -ForegroundColor Cyan
Write-Host "  Integrate New: $integrateCount" -ForegroundColor Cyan
$standaloneColor = "Cyan"
Write-Host "  Standalone: $standaloneCount" -ForegroundColor $standaloneColor
Write-Host ""


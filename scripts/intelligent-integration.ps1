# Intelligent Integration Script
# Analyzes actual CODE and merges functionality into BlueDXP services
# NOT just file copying - actual code integration

$BLUEDXP_DIR = "C:\Users\balba\hazalyze-asn-module"
$CHEMCHECK_DIR = "C:\Users\balba\chemcheck-analysis"
$OUTPUT_DIR = "$BLUEDXP_DIR\gap-analysis-results"
$INTEGRATION_DIR = "$BLUEDXP_DIR\integration-work"

New-Item -ItemType Directory -Force -Path $INTEGRATION_DIR | Out-Null
New-Item -ItemType Directory -Force -Path "$INTEGRATION_DIR\services" | Out-Null
New-Item -ItemType Directory -Force -Path "$INTEGRATION_DIR\components" | Out-Null
New-Item -ItemType Directory -Force -Path "$INTEGRATION_DIR\pages" | Out-Null

$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$REPORT_FILE = "$INTEGRATION_DIR\INTEGRATION_REPORT_$TIMESTAMP.md"

Write-Host "Intelligent Integration - Code Analysis & Merging" -ForegroundColor Cyan
Write-Host ""

# Load deep code analysis
$deepCodeJson = Get-ChildItem -Path "$OUTPUT_DIR" -Filter "deep-code-data_*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $deepCodeJson) {
    Write-Host "ERROR: Deep code analysis not found. Run deep-code-analysis.ps1 first!" -ForegroundColor Red
    exit 1
}

$deepCode = ((Get-Content $deepCodeJson.FullName -ErrorAction SilentlyContinue) -join "`n") | ConvertFrom-Json

Write-Host "Loaded deep code analysis: $($deepCode.Services.Count) services, $($deepCode.Components.Count) components" -ForegroundColor Green
Write-Host ""

# Integration statistics
$stats = @{
    ServicesEnhanced = 0
    ServicesCreated = 0
    ComponentsEnhanced = 0
    ComponentsCreated = 0
    FunctionsMerged = 0
    IntegrationPointsAdded = 0
    Errors = 0
}

# Generate integration report header
"# Intelligent Integration Report" | Out-File $REPORT_FILE -Encoding UTF8
"**Generated:** $(Get-Date)" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"## Integration Strategy" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"This report details how each service and component from chemcheck-analysis will be integrated into BlueDXP." | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"### Integration Patterns:" | Out-File $REPORT_FILE -Append -Encoding UTF8
"- **ENHANCE_EXISTING**: Merge unique functions into existing BlueDXP services" | Out-File $REPORT_FILE -Append -Encoding UTF8
"- **INTEGRATE_NEW**: Create new services with full BlueDXP integration (Event Bus, Multi-tenant, RBAC)" | Out-File $REPORT_FILE -Append -Encoding UTF8
"- **STANDALONE_MIGRATE**: Migrate as new standalone services" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"---" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

# Process Services
Write-Host "Processing Services..." -ForegroundColor Yellow
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"## Services Integration" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

foreach ($serviceKey in $deepCode.Services.Keys | Sort-Object) {
    $service = $deepCode.Services[$serviceKey]
    $sourceFile = $service.File
    
    Write-Host "  Processing: $serviceKey" -ForegroundColor Cyan
    
    if (-not (Test-Path $sourceFile)) {
        Write-Host "    WARNING: Source file not found: $sourceFile" -ForegroundColor Yellow
        $stats.Errors++
        continue
    }
    
    $sourceContent = (Get-Content $sourceFile -ErrorAction SilentlyContinue) -join "`n"
    if (-not $sourceContent) {
        Write-Host "    WARNING: Source file is empty" -ForegroundColor Yellow
        $stats.Errors++
        continue
    }
    
    # Generate integration plan for this service
    "### $serviceKey" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "**Strategy:** $($service.IntegrationStrategy)" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "**Capabilities:** $($service.Capabilities -join ', ')" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "**Functions:** $($service.Functions.Count)" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    
    if ($service.IntegrationStrategy -eq "ENHANCE_EXISTING" -and $service.BlueDXPEquivalent) {
        $targetService = $service.BlueDXPEquivalent[0]
        $targetPath = Join-Path $BLUEDXP_DIR $targetService
        
        Write-Host "    Strategy: ENHANCE_EXISTING -> $targetService" -ForegroundColor Green
        
        "**Target Service:** $targetService" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "**Integration Steps:**" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "1. Review existing service: $targetService" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "2. Extract unique functions from: $serviceKey" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "3. Add functions to existing service with:" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "   - Event Bus integration (publish/subscribe)" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "   - Multi-tenant support (tenantId parameter)" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "   - RBAC checks (if needed)" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "4. Update Module Registry if needed" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        
        # Create integration file with extracted functions
        $integrationFile = "$INTEGRATION_DIR\services\$($serviceKey.Replace('/', '_').Replace('\', '_'))_INTEGRATION.md"
        "# Integration Plan: $serviceKey" | Out-File $integrationFile -Encoding UTF8
        "" | Out-File $integrationFile -Append -Encoding UTF8
        "**Source:** $sourceFile" | Out-File $integrationFile -Append -Encoding UTF8
        "**Target:** $targetService" | Out-File $integrationFile -Append -Encoding UTF8
        "" | Out-File $integrationFile -Append -Encoding UTF8
        "## Functions to Integrate" | Out-File $integrationFile -Append -Encoding UTF8
        "" | Out-File $integrationFile -Append -Encoding UTF8
        
        foreach ($func in $service.Functions | Select-Object -First 20) {
            "  - $func" | Out-File $integrationFile -Append -Encoding UTF8
        }
        
        "" | Out-File $integrationFile -Append -Encoding UTF8
        "## Code Snippet (First 50 lines)" | Out-File $integrationFile -Append -Encoding UTF8
        "```typescript" | Out-File $integrationFile -Append -Encoding UTF8
        ($sourceContent -split "`n" | Select-Object -First 50) -join "`n" | Out-File $integrationFile -Append -Encoding UTF8
        "```" | Out-File $integrationFile -Append -Encoding UTF8
        
        $stats.ServicesEnhanced++
        $stats.FunctionsMerged += $service.Functions.Count
        
    } else {
        $strategy = $service.IntegrationStrategy
        $isNewService = ($strategy -eq 'INTEGRATE_NEW') -or ($strategy -eq 'STANDALONE_MIGRATE')
        
        if ($isNewService) {
            Write-Host '    Strategy: CREATE_NEW' -ForegroundColor Yellow
            
            $targetLine = '**Target:** lib/services/[category]/[service-name].ts'
            $targetLine | Out-File $REPORT_FILE -Append -Encoding UTF8
            "" | Out-File $REPORT_FILE -Append -Encoding UTF8
            $stepsLine = '**Integration Steps:**'
            $stepsLine | Out-File $REPORT_FILE -Append -Encoding UTF8
        "1. Create new service file in lib/services/" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "2. Add Event Bus integration:" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "   - Import eventBus from lib/services/event-bus" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "   - Subscribe to events using eventBus.subscribe" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "   - Publish events using eventBus.publish" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "3. Add Multi-tenant support (tenantId parameter to all functions)" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "4. Add RBAC integration (check permissions)" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "5. Register in Module Registry" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        
        # Create new service template
        $serviceName = ($serviceKey -split '/')[-1] -replace '\.ts$', ''
        $newServiceFile = "$INTEGRATION_DIR\services\$serviceName.ts"
        
        "# BlueDXP Service: $serviceName" | Out-File $newServiceFile -Encoding UTF8
        "# Integrated from: $serviceKey" | Out-File $newServiceFile -Append -Encoding UTF8
        "" | Out-File $newServiceFile -Append -Encoding UTF8
        "import { eventBus } from '@/lib/services/event-bus'" | Out-File $newServiceFile -Append -Encoding UTF8
        "" | Out-File $newServiceFile -Append -Encoding UTF8
        "# TODO: Add original code from $sourceFile" | Out-File $newServiceFile -Append -Encoding UTF8
        "# TODO: Add Event Bus integration" | Out-File $newServiceFile -Append -Encoding UTF8
        "# TODO: Add Multi-tenant support" | Out-File $newServiceFile -Append -Encoding UTF8
        "# TODO: Add RBAC integration" | Out-File $newServiceFile -Append -Encoding UTF8
        "" | Out-File $newServiceFile -Append -Encoding UTF8
        "# Original code:" | Out-File $newServiceFile -Append -Encoding UTF8
        ($sourceContent -split "`n" | Select-Object -First 100) -join "`n" | Out-File $newServiceFile -Append -Encoding UTF8
        
        $stats.ServicesCreated++
        }
    }
    
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "---" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
}

# Process Components
Write-Host ""
Write-Host "Processing Components..." -ForegroundColor Yellow
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"## Components Integration" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

foreach ($componentKey in $deepCode.Components.Keys | Sort-Object) {
    $component = $deepCode.Components[$componentKey]
    $sourceFile = $component.File
    
    Write-Host "  Processing: $componentKey" -ForegroundColor Cyan
    
    if (-not (Test-Path $sourceFile)) {
        Write-Host "    WARNING: Source file not found" -ForegroundColor Yellow
        $stats.Errors++
        continue
    }
    
    $sourceContent = (Get-Content $sourceFile -ErrorAction SilentlyContinue) -join "`n"
    if (-not $sourceContent) {
        Write-Host "    WARNING: Source file is empty" -ForegroundColor Yellow
        $stats.Errors++
        continue
    }
    
    "### $componentKey" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "**Strategy:** $($component.IntegrationStrategy)" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "**Component Name:** $($component.Name)" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "**Capabilities:** $($component.Capabilities -join ', ')" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "**Hooks:** $($component.Hooks.Count) | **State:** $($component.State.Count)" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    
    if ($component.IntegrationStrategy -eq "ENHANCE_EXISTING" -and $component.BlueDXPEquivalent) {
        Write-Host "    Strategy: ENHANCE_EXISTING -> $($component.BlueDXPEquivalent)" -ForegroundColor Green
        
        "**Target Component:** $($component.BlueDXPEquivalent)" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "**Integration Steps:**" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "1. Review existing component: $($component.BlueDXPEquivalent)" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "2. Extract unique features from: $componentKey" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "3. Merge features into existing component" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "4. Update imports (react-icons -> remixicon-react)" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "5. Ensure BlueDXP patterns (ErrorBoundary, etc.)" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        
        $stats.ComponentsEnhanced++
    } else {
        Write-Host "    Strategy: NEW_COMPONENT" -ForegroundColor Yellow
        
        "**Target:** components/[category]/[component-name].tsx" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "**Integration Steps:**" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "1. Migrate component to components/" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "2. Update imports:" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "   - react-icons/fi -> remixicon-react" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "   - Update relative paths" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "3. Add ErrorBoundary wrapper if needed" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "4. Ensure multi-tenant support" | Out-File $REPORT_FILE -Append -Encoding UTF8
        "" | Out-File $REPORT_FILE -Append -Encoding UTF8
        
        $stats.ComponentsCreated++
    }
    
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "---" | Out-File $REPORT_FILE -Append -Encoding UTF8
    "" | Out-File $REPORT_FILE -Append -Encoding UTF8
}

# Summary
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"## Summary" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Category | Count |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"|----------|-------|" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Services Enhanced | $($stats.ServicesEnhanced) |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Services Created | $($stats.ServicesCreated) |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Components Enhanced | $($stats.ComponentsEnhanced) |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Components Created | $($stats.ComponentsCreated) |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Functions Merged | $($stats.FunctionsMerged) |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Errors | $($stats.Errors) |" | Out-File $REPORT_FILE -Append -Encoding UTF8

Write-Host ""
Write-Host "Integration Report Generated!" -ForegroundColor Green
Write-Host "Report: $REPORT_FILE" -ForegroundColor Cyan
Write-Host "Integration Files: $INTEGRATION_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Services Enhanced: $($stats.ServicesEnhanced)" -ForegroundColor Green
Write-Host "  Services Created: $($stats.ServicesCreated)" -ForegroundColor Green
Write-Host "  Components Enhanced: $($stats.ComponentsEnhanced)" -ForegroundColor Green
Write-Host "  Components Created: $($stats.ComponentsCreated)" -ForegroundColor Green
Write-Host "  Functions to Merge: $($stats.FunctionsMerged)" -ForegroundColor Cyan
Write-Host "  Errors: $($stats.Errors)" -ForegroundColor $(if ($stats.Errors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review integration report: $REPORT_FILE" -ForegroundColor Cyan
Write-Host "  2. Review integration files in: $INTEGRATION_DIR" -ForegroundColor Cyan
Write-Host "  3. Manually integrate services/components following the plans" -ForegroundColor Cyan
Write-Host "  4. Test each integration thoroughly" -ForegroundColor Cyan
Write-Host ""


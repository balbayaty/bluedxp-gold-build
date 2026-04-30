# Final Comprehensive Gap Analysis - Handles both App Router and Pages Router
# Analyzes BlueDXP vs chemcheck-analysis to find ALL gaps

$BLUEDXP_DIR = "C:\Users\balba\hazalyze-asn-module"
$CHEMCHECK_DIR = "C:\Users\balba\chemcheck-analysis"
$OUTPUT_DIR = "$BLUEDXP_DIR\gap-analysis-results"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null
$REPORT_FILE = "$OUTPUT_DIR\FINAL_GAP_ANALYSIS_$TIMESTAMP.md"
$JSON_FILE = "$OUTPUT_DIR\final-gap-data_$TIMESTAMP.json"

Write-Host "Starting Final Comprehensive Gap Analysis..." -ForegroundColor Cyan
Write-Host ""

# Helper function to get all files recursively
function Get-AllCodeFiles {
    param($Dir, $Extensions = @("*.ts", "*.tsx"))
    $files = @()
    foreach ($ext in $Extensions) {
        $found = Get-ChildItem -Path $Dir -Recurse -Include $ext -ErrorAction SilentlyContinue | 
            Where-Object { $_.FullName -notmatch "node_modules|\.next|\.git|dist|build" }
        $files += $found
    }
    return $files
}

# Analyze Services
function Get-Services {
    param($Dir)
    $services = @{
        Files = @()
        Categories = @{}
        AllFiles = @()
    }
    
    # Check multiple possible service locations
    $servicePaths = @("lib\services", "lib", "services", "src\services", "src\lib")
    foreach ($path in $servicePaths) {
        if (Test-Path "$Dir\$path") {
            $files = Get-ChildItem -Path "$Dir\$path" -Recurse -Include *.ts,*.tsx -ErrorAction SilentlyContinue |
                Where-Object { $_.FullName -notmatch "node_modules|\.next|\.git|dist|build|test|spec" }
            
            foreach ($file in $files) {
                $relativePath = $file.FullName.Replace("$Dir\", "")
                if ($services.AllFiles -notcontains $relativePath) {
                    $services.AllFiles += $relativePath
                    $services.Files += $relativePath
                    
                    # Get category (first subdirectory after lib/services or lib)
                    $category = ""
                    if ($relativePath -match "lib[\\/](?:services[\\/])?([^\\/]+)") {
                        $category = $matches[1]
                    } elseif ($relativePath -match "services[\\/]([^\\/]+)") {
                        $category = $matches[1]
                    }
                    
                    if ($category -and $category -ne "") {
                        if (-not $services.Categories.ContainsKey($category)) {
                            $services.Categories[$category] = @()
                        }
                        if ($services.Categories[$category] -notcontains $relativePath) {
                            $services.Categories[$category] += $relativePath
                        }
                    }
                }
            }
        }
    }
    
    return $services
}

# Analyze Components
function Get-Components {
    param($Dir)
    $components = @{
        Files = @()
        Categories = @{}
        AllFiles = @()
    }
    
    $componentPaths = @("components", "app", "src\components", "src\app")
    foreach ($path in $componentPaths) {
        if (Test-Path "$Dir\$path") {
            $files = Get-ChildItem -Path "$Dir\$path" -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue |
                Where-Object { $_.FullName -notmatch "node_modules|\.next|\.git|dist|build|test|spec|page\.tsx|layout\.tsx" }
            
            foreach ($file in $files) {
                $relativePath = $file.FullName.Replace("$Dir\", "")
                if ($components.AllFiles -notcontains $relativePath) {
                    $components.AllFiles += $relativePath
                    $components.Files += $relativePath
                    
                    # Get category
                    $category = ""
                    if ($relativePath -match "(?:components|app)[\\/]([^\\/]+)") {
                        $category = $matches[1]
                    }
                    
                    if ($category -and $category -ne "") {
                        if (-not $components.Categories.ContainsKey($category)) {
                            $components.Categories[$category] = @()
                        }
                        if ($components.Categories[$category] -notcontains $relativePath) {
                            $components.Categories[$category] += $relativePath
                        }
                    }
                }
            }
        }
    }
    
    return $components
}

# Analyze Pages
function Get-Pages {
    param($Dir)
    $pages = @{
        Files = @()
        Routes = @()
        RouterType = ""
    }
    
    # App Router
    if (Test-Path "$Dir\app") {
        $pages.RouterType = "App Router"
        $files = Get-ChildItem -Path "$Dir\app" -Recurse -Include page.tsx,page.ts -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $relativePath = $file.FullName.Replace("$Dir\app\", "").Replace('\page.tsx', '').Replace('\page.ts', '')
            $route = "/$relativePath"
            if ($pages.Files -notcontains $relativePath) {
                $pages.Files += $relativePath
            }
            if ($pages.Routes -notcontains $route) {
                $pages.Routes += $route
            }
        }
    }
    
    # Pages Router
    if (Test-Path "$Dir\pages") {
        if ($pages.RouterType -eq "") { $pages.RouterType = "Pages Router" }
        $files = Get-ChildItem -Path "$Dir\pages" -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -notmatch '^_|^api' -and $_.Directory.Name -ne 'api' }
        foreach ($file in $files) {
            $relativePath = $file.FullName.Replace("$Dir\pages\", "").Replace('.tsx', '').Replace('.ts', '').Replace('\index', '')
            if ($relativePath -notmatch '^_') {
                $route = "/$relativePath"
                if ($pages.Files -notcontains $relativePath) {
                    $pages.Files += $relativePath
                }
                if ($pages.Routes -notcontains $route) {
                    $pages.Routes += $route
                }
            }
        }
    }
    
    return $pages
}

# Analyze API Routes
function Get-APIRoutes {
    param($Dir)
    $routes = @{
        Files = @()
        Categories = @{}
        AllFiles = @()
    }
    
    # App Router API
    if (Test-Path "$Dir\app\api") {
        $files = Get-ChildItem -Path "$Dir\app\api" -Recurse -Include route.ts,*.ts -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $relativePath = $file.FullName.Replace("$Dir\app\api\", "")
            if ($routes.AllFiles -notcontains $relativePath) {
                $routes.AllFiles += $relativePath
                $routes.Files += $relativePath
                
                $category = $file.DirectoryName.Replace("$Dir\app\api\", "").Split('\')[0]
                if ($category -and $category -ne "") {
                    if (-not $routes.Categories.ContainsKey($category)) {
                        $routes.Categories[$category] = @()
                    }
                    if ($routes.Categories[$category] -notcontains $relativePath) {
                        $routes.Categories[$category] += $relativePath
                    }
                }
            }
        }
    }
    
    # Pages Router API
    if (Test-Path "$Dir\pages\api") {
        $files = Get-ChildItem -Path "$Dir\pages\api" -Recurse -Include *.ts,*.tsx -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $relativePath = $file.FullName.Replace("$Dir\pages\api\", "").Replace('.ts', '').Replace('.tsx', '')
            if ($routes.AllFiles -notcontains $relativePath) {
                $routes.AllFiles += $relativePath
                $routes.Files += $relativePath
                
                $category = $file.DirectoryName.Replace("$Dir\pages\api\", "").Split('\')[0]
                if ($category -and $category -ne "") {
                    if (-not $routes.Categories.ContainsKey($category)) {
                        $routes.Categories[$category] = @()
                    }
                    if ($routes.Categories[$category] -notcontains $relativePath) {
                        $routes.Categories[$category] += $relativePath
                    }
                }
            }
        }
    }
    
    return $routes
}

# Analyze Dependencies
function Get-Dependencies {
    param($Dir)
    $deps = @{
        Dependencies = @()
        DevDependencies = @()
    }
    
    if (Test-Path "$Dir\package.json") {
        try {
            $content = (Get-Content "$Dir\package.json" -ErrorAction SilentlyContinue) -join "`n"
            $pkg = $content | ConvertFrom-Json
            if ($pkg.dependencies) {
                $deps.Dependencies = $pkg.dependencies.PSObject.Properties | ForEach-Object { $_.Name }
            }
            if ($pkg.devDependencies) {
                $deps.DevDependencies = $pkg.devDependencies.PSObject.Properties | ForEach-Object { $_.Name }
            }
        } catch {
            Write-Host "  Warning: Could not parse package.json" -ForegroundColor Yellow
        }
    }
    
    return $deps
}

# ============================================================================
# MAIN ANALYSIS
# ============================================================================

Write-Host "Analyzing BlueDXP..." -ForegroundColor Yellow
$bdServices = Get-Services $BLUEDXP_DIR
Write-Host "  Services: $($bdServices.Files.Count) files, $($bdServices.Categories.Count) categories" -ForegroundColor Green

$bdComponents = Get-Components $BLUEDXP_DIR
Write-Host "  Components: $($bdComponents.Files.Count) files, $($bdComponents.Categories.Count) categories" -ForegroundColor Green

$bdPages = Get-Pages $BLUEDXP_DIR
Write-Host "  Pages: $($bdPages.Routes.Count) routes ($($bdPages.RouterType))" -ForegroundColor Green

$bdAPIRoutes = Get-APIRoutes $BLUEDXP_DIR
Write-Host "  API Routes: $($bdAPIRoutes.Files.Count) files, $($bdAPIRoutes.Categories.Count) categories" -ForegroundColor Green

$bdDeps = Get-Dependencies $BLUEDXP_DIR
Write-Host "  Dependencies: $($bdDeps.Dependencies.Count)" -ForegroundColor Green

Write-Host ""
Write-Host "Analyzing chemcheck-analysis..." -ForegroundColor Yellow
if (-not (Test-Path $CHEMCHECK_DIR)) {
    Write-Host "  ERROR: chemcheck-analysis directory not found!" -ForegroundColor Red
    exit 1
}

$ccServices = Get-Services $CHEMCHECK_DIR
Write-Host "  Services: $($ccServices.Files.Count) files, $($ccServices.Categories.Count) categories" -ForegroundColor Green

$ccComponents = Get-Components $CHEMCHECK_DIR
Write-Host "  Components: $($ccComponents.Files.Count) files, $($ccComponents.Categories.Count) categories" -ForegroundColor Green

$ccPages = Get-Pages $CHEMCHECK_DIR
Write-Host "  Pages: $($ccPages.Routes.Count) routes ($($ccPages.RouterType))" -ForegroundColor Green

$ccAPIRoutes = Get-APIRoutes $CHEMCHECK_DIR
Write-Host "  API Routes: $($ccAPIRoutes.Files.Count) files, $($ccAPIRoutes.Categories.Count) categories" -ForegroundColor Green

$ccDeps = Get-Dependencies $CHEMCHECK_DIR
Write-Host "  Dependencies: $($ccDeps.Dependencies.Count)" -ForegroundColor Green

Write-Host ""
Write-Host "Finding gaps..." -ForegroundColor Yellow

# Find gaps
$missingServiceCats = $ccServices.Categories.Keys | Where-Object { $_ -notin $bdServices.Categories.Keys }
$missingComponentCats = $ccComponents.Categories.Keys | Where-Object { $_ -notin $bdComponents.Categories.Keys }
$missingPages = $ccPages.Routes | Where-Object { $_ -notin $bdPages.Routes }
$missingAPICats = $ccAPIRoutes.Categories.Keys | Where-Object { $_ -notin $bdAPIRoutes.Categories.Keys }
$missingDeps = $ccDeps.Dependencies | Where-Object { $_ -notin $bdDeps.Dependencies }

# Generate report
"# Final Comprehensive Gap Analysis Report" | Out-File $REPORT_FILE -Encoding UTF8
"**Generated:** $(Get-Date)" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

"## Executive Summary" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Metric | BlueDXP | chemcheck-analysis | Gap |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"|--------|---------|-------------------|-----|" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Services | $($bdServices.Files.Count) | $($ccServices.Files.Count) | $($missingServiceCats.Count) categories |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Components | $($bdComponents.Files.Count) | $($ccComponents.Files.Count) | $($missingComponentCats.Count) categories |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Pages | $($bdPages.Routes.Count) | $($ccPages.Routes.Count) | $($missingPages.Count) |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| API Routes | $($bdAPIRoutes.Files.Count) | $($ccAPIRoutes.Files.Count) | $($missingAPICats.Count) categories |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"| Dependencies | $($bdDeps.Dependencies.Count) | $($ccDeps.Dependencies.Count) | $($missingDeps.Count) |" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

"## 1. Missing Service Categories" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
if ($missingServiceCats.Count -gt 0) {
    foreach ($cat in $missingServiceCats) {
        $fileCount = $ccServices.Categories[$cat].Count
        $line = '* **' + $cat + '**: ' + $fileCount + ' files'
        $line | Out-File $REPORT_FILE -Append -Encoding UTF8
        foreach ($file in $ccServices.Categories[$cat]) {
            $fileLine = '    * ' + $file
            $fileLine | Out-File $REPORT_FILE -Append -Encoding UTF8
        }
    }
} else {
    $msg = 'All categories already present in BlueDXP'
    $msg | Out-File $REPORT_FILE -Append -Encoding UTF8
}
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

"## 2. Missing Component Categories" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
if ($missingComponentCats.Count -gt 0) {
    foreach ($cat in $missingComponentCats) {
        $fileCount = $ccComponents.Categories[$cat].Count
        $line = "- **$cat**: $fileCount files"
        $line | Out-File $REPORT_FILE -Append -Encoding UTF8
    }
} else {
    $msg = 'All categories already present in BlueDXP'
    $msg | Out-File $REPORT_FILE -Append -Encoding UTF8
}
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

"## 3. Missing Pages" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
if ($missingPages.Count -gt 0) {
    foreach ($page in $missingPages) {
        $line = '  * ' + $page
        $line | Out-File $REPORT_FILE -Append -Encoding UTF8
    }
} else {
    $msg = 'All categories already present in BlueDXP'
    $msg | Out-File $REPORT_FILE -Append -Encoding UTF8
}
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

"## 4. Missing API Route Categories" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
if ($missingAPICats.Count -gt 0) {
    foreach ($cat in $missingAPICats) {
        $fileCount = $ccAPIRoutes.Categories[$cat].Count
        $line = "  * **$cat**: $fileCount routes"
        $line | Out-File $REPORT_FILE -Append -Encoding UTF8
    }
} else {
    $msg = 'All categories already present in BlueDXP'
    $msg | Out-File $REPORT_FILE -Append -Encoding UTF8
}
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

"## 5. Missing Dependencies" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
if ($missingDeps.Count -gt 0) {
    foreach ($dep in $missingDeps) {
        $line = "  * **$dep**"
        $line | Out-File $REPORT_FILE -Append -Encoding UTF8
    }
} else {
    $msg = 'All categories already present in BlueDXP'
    $msg | Out-File $REPORT_FILE -Append -Encoding UTF8
}
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

# Save JSON
$gapData = @{
    Timestamp = Get-Date
    BlueDXP = @{
        Services = @{ Files = $bdServices.Files.Count; Categories = $bdServices.Categories.Keys }
        Components = @{ Files = $bdComponents.Files.Count; Categories = $bdComponents.Categories.Keys }
        Pages = @{ Count = $bdPages.Routes.Count; Routes = $bdPages.Routes }
        APIRoutes = @{ Files = $bdAPIRoutes.Files.Count; Categories = $bdAPIRoutes.Categories.Keys }
        Dependencies = $bdDeps.Dependencies
    }
    ChemCheck = @{
        Services = @{ Files = $ccServices.Files.Count; Categories = $ccServices.Categories.Keys }
        Components = @{ Files = $ccComponents.Files.Count; Categories = $ccComponents.Categories.Keys }
        Pages = @{ Count = $ccPages.Routes.Count; Routes = $ccPages.Routes }
        APIRoutes = @{ Files = $ccAPIRoutes.Files.Count; Categories = $ccAPIRoutes.Categories.Keys }
        Dependencies = $ccDeps.Dependencies
    }
    Gaps = @{
        ServiceCategories = $missingServiceCats
        ComponentCategories = $missingComponentCats
        Pages = $missingPages
        APIRouteCategories = $missingAPICats
        Dependencies = $missingDeps
    }
    Detailed = @{
        ServiceCategories = @{}
        ComponentCategories = @{}
        APIRouteCategories = @{}
    }
}

foreach ($cat in $missingServiceCats) {
    $gapData.Detailed.ServiceCategories[$cat] = $ccServices.Categories[$cat]
}
foreach ($cat in $missingComponentCats) {
    $gapData.Detailed.ComponentCategories[$cat] = $ccComponents.Categories[$cat]
}
foreach ($cat in $missingAPICats) {
    $gapData.Detailed.APIRouteCategories[$cat] = $ccAPIRoutes.Categories[$cat]
}

$gapData | ConvertTo-Json -Depth 10 | Out-File $JSON_FILE -Encoding UTF8

Write-Host ""
Write-Host "Analysis Complete!" -ForegroundColor Green
Write-Host "Report: $REPORT_FILE" -ForegroundColor Cyan
Write-Host "Data: $JSON_FILE" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Missing Service Categories: $($missingServiceCats.Count)" -ForegroundColor $(if ($missingServiceCats.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "  Missing Component Categories: $($missingComponentCats.Count)" -ForegroundColor $(if ($missingComponentCats.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "  Missing Pages: $($missingPages.Count)" -ForegroundColor $(if ($missingPages.Count -gt 0) { "Yellow" } else { "Green" })
Write-Host "  Missing API Categories: $($missingAPICats.Count)" -ForegroundColor $(if ($missingAPICats.Count -gt 0) { "Yellow" } else { "Green" })
$depColor = if ($missingDeps.Count -gt 0) { "Yellow" } else { "Green" }
Write-Host "  Missing Dependencies: $($missingDeps.Count)" -ForegroundColor $depColor
Write-Host ""


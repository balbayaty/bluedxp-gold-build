# Enhanced Comprehensive Gap Analysis Script
# Analyzes BlueDXP vs chemcheck-analysis to find ALL gaps

$BLUEDXP_DIR = "C:\Users\balba\hazalyze-asn-module"
$CHEMCHECK_DIR = "C:\Users\balba\chemcheck-analysis"
$OUTPUT_DIR = "$BLUEDXP_DIR\gap-analysis-results"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Create output directories
New-Item -ItemType Directory -Force -Path $OUTPUT_DIR | Out-Null
New-Item -ItemType Directory -Force -Path "$OUTPUT_DIR\detailed" | Out-Null

$REPORT_FILE = "$OUTPUT_DIR\COMPREHENSIVE_GAP_ANALYSIS_$TIMESTAMP.md"
$JSON_FILE = "$OUTPUT_DIR\gap-analysis-data_$TIMESTAMP.json"

$analysis = @{
    Timestamp = Get-Date
    BlueDXP = @{}
    ChemCheck = @{}
    Gaps = @{}
    Recommendations = @()
}

function Write-Report {
    param($Content)
    $Content | Out-File $REPORT_FILE -Append -Encoding UTF8
}

function Get-AllFiles {
    param($Dir, $Extensions = @("*.ts", "*.tsx", "*.js", "*.jsx"))
    $files = @()
    foreach ($ext in $Extensions) {
        $files += Get-ChildItem -Path $Dir -Recurse -Include $ext -ErrorAction SilentlyContinue | 
            Where-Object { $_.FullName -notmatch "node_modules|\.next|\.git|dist|build" }
    }
    return $files
}

function Analyze-TechStack {
    param($Dir)
    $tech = @{
        Dependencies = @()
        DevDependencies = @()
        OptionalDependencies = @()
        Scripts = @()
        ConfigFiles = @{}
        Engines = @()
    }
    
    if (Test-Path "$Dir\package.json") {
        try {
            $pkg = (Get-Content "$Dir\package.json" -ErrorAction SilentlyContinue) -join "`n" | ConvertFrom-Json
            if ($pkg.dependencies) {
                $tech.Dependencies = $pkg.dependencies.PSObject.Properties | ForEach-Object { @{Name=$_.Name; Version=$_.Value} }
            }
            if ($pkg.devDependencies) {
                $tech.DevDependencies = $pkg.devDependencies.PSObject.Properties | ForEach-Object { @{Name=$_.Name; Version=$_.Value} }
            }
            if ($pkg.optionalDependencies) {
                $tech.OptionalDependencies = $pkg.optionalDependencies.PSObject.Properties | ForEach-Object { @{Name=$_.Name; Version=$_.Value} }
            }
            if ($pkg.scripts) {
                $tech.Scripts = $pkg.scripts.PSObject.Properties | ForEach-Object { @{Name=$_.Name; Command=$_.Value} }
            }
            if ($pkg.engines) {
                $tech.Engines = $pkg.engines.PSObject.Properties | ForEach-Object { @{Name=$_.Name; Version=$_.Value} }
            }
        } catch {
            Write-Host "  ⚠️ Error reading package.json: $_" -ForegroundColor Yellow
        }
    }
    
    $configFiles = @("next.config.js", "tsconfig.json", "tailwind.config.js", "postcss.config.js", ".eslintrc.json", "jest.config.js", "docker-compose.yml", "Dockerfile")
    foreach ($file in $configFiles) {
        if (Test-Path "$Dir\$file") {
            $content = (Get-Content "$Dir\$file" -ErrorAction SilentlyContinue) -join "`n"
            $tech.ConfigFiles[$file] = @{
                Exists = $true
                Size = (Get-Item "$Dir\$file").Length
                Lines = if ($content) { ($content -split "`n").Count } else { 0 }
            }
        }
    }
    
    return $tech
}

function Analyze-Services {
    param($Dir)
    $services = @{
        Files = @()
        Classes = @()
        Interfaces = @()
        Types = @()
        Functions = @()
        Constants = @()
        Categories = @{}
        Imports = @{}
        Exports = @{}
        Patterns = @{}
    }
    
    $servicePaths = @("lib\services", "lib", "services", "src\services", "src\lib")
    foreach ($path in $servicePaths) {
        if (Test-Path "$Dir\$path") {
            Get-ChildItem -Path "$Dir\$path" -Recurse -Include *.ts,*.tsx -ErrorAction SilentlyContinue | ForEach-Object {
                $relativePath = $_.FullName.Replace("$Dir\", "")
                if ($services.Files -notcontains $relativePath) {
                    $services.Files += $relativePath
                }
                
                $content = (Get-Content $_.FullName -ErrorAction SilentlyContinue) -join "`n"
                if ($content) {
                    # Extract exports
                    $exportMatches = [regex]::Matches($content, 'export\s+(default\s+)?(class|interface|type|function|const|enum)\s+(\w+)')
                    foreach ($match in $exportMatches) {
                        $type = $match.Groups[2].Value
                        $name = $match.Groups[3].Value
                        
                        switch ($type) {
                            "class" { if ($services.Classes -notcontains $name) { $services.Classes += $name } }
                            "interface" { if ($services.Interfaces -notcontains $name) { $services.Interfaces += $name } }
                            "type" { if ($services.Types -notcontains $name) { $services.Types += $name } }
                            "function" { if ($services.Functions -notcontains $name) { $services.Functions += $name } }
                            "const" { if ($services.Constants -notcontains $name) { $services.Constants += $name } }
                            "enum" { if ($services.Types -notcontains $name) { $services.Types += $name } }
                        }
                        
                        $services.Exports[$name] = @{
                            Type = $type
                            File = $relativePath
                        }
                    }
                    
                    # Extract imports
                    $importMatches = [regex]::Matches($content, 'import\s+.*from\s+[''"]([^''"]+)[''"]')
                    foreach ($match in $importMatches) {
                        $importPath = $match.Groups[1].Value
                        if (-not $services.Imports.ContainsKey($importPath)) {
                            $services.Imports[$importPath] = 0
                        }
                        $services.Imports[$importPath]++
                    }
                    
                    # Categorize by directory
                    $category = $_.DirectoryName.Replace("$Dir\$path\", "").Split('\')[0]
                    if ($category -and $category -ne "" -and $category -ne $_.DirectoryName) {
                        if (-not $services.Categories.ContainsKey($category)) {
                            $services.Categories[$category] = @()
                        }
                        if ($services.Categories[$category] -notcontains $relativePath) {
                            $services.Categories[$category] += $relativePath
                        }
                    }
                    
                    # Detect patterns
                    if ($content -match 'EventEmitter|\.on\(|\.emit\(') { $services.Patterns['EventEmitter'] = $true }
                    if ($content -match 'async\s+function|Promise|await') { $services.Patterns['Async'] = $true }
                    if ($content -match 'class\s+\w+\s+extends') { $services.Patterns['Inheritance'] = $true }
                    if ($content -match 'interface\s+\w+|type\s+\w+\s*=') { $services.Patterns['TypeScript'] = $true }
                }
            }
        }
    }
    
    return $services
}

function Analyze-Components {
    param($Dir)
    $components = @{
        Files = @()
        Exports = @()
        Categories = @{}
        Hooks = @()
        Contexts = @()
        Providers = @()
        Imports = @{}
        Patterns = @{}
    }
    
    $componentPaths = @("components", "app", "src\components", "src\app")
    foreach ($path in $componentPaths) {
        if (Test-Path "$Dir\$path") {
            Get-ChildItem -Path "$Dir\$path" -Recurse -Include *.tsx,*.ts -ErrorAction SilentlyContinue | ForEach-Object {
                $relativePath = $_.FullName.Replace("$Dir\", "")
                if ($components.Files -notcontains $relativePath) {
                    $components.Files += $relativePath
                }
                
                $content = (Get-Content $_.FullName -ErrorAction SilentlyContinue) -join "`n"
                if ($content) {
                    # Extract component exports
                    $exportMatches = [regex]::Matches($content, 'export\s+(default\s+)?(function|const|class)\s+(\w+)')
                    foreach ($match in $exportMatches) {
                        $name = $match.Groups[3].Value
                        if ($components.Exports -notcontains $name) {
                            $components.Exports += $name
                        }
                    }
                    
                    # Extract hooks
                    $hookMatches = [regex]::Matches($content, '(use\w+)\s*\(')
                    foreach ($match in $hookMatches) {
                        if ($components.Hooks -notcontains $match.Groups[1].Value) {
                            $components.Hooks += $match.Groups[1].Value
                        }
                    }
                    
                    # Extract contexts
                    if ($content -match 'createContext|Context\.Provider') {
                        $ctxMatches = [regex]::Matches($content, 'createContext<(\w+)>')
                        foreach ($match in $ctxMatches) {
                            if ($components.Contexts -notcontains $match.Groups[1].Value) {
                                $components.Contexts += $match.Groups[1].Value
                            }
                        }
                    }
                    
                    # Extract providers
                    if ($content -match 'Provider|\.Provider') {
                        $provMatches = [regex]::Matches($content, '(\w+Provider)')
                        foreach ($match in $provMatches) {
                            if ($components.Providers -notcontains $match.Groups[1].Value) {
                                $components.Providers += $match.Groups[1].Value
                            }
                        }
                    }
                    
                    # Categorize
                    $category = $_.DirectoryName.Replace("$Dir\$path\", "").Split('\')[0]
                    if ($category -and $category -ne "" -and $category -ne $_.DirectoryName) {
                        if (-not $components.Categories.ContainsKey($category)) {
                            $components.Categories[$category] = @()
                        }
                        if ($components.Categories[$category] -notcontains $relativePath) {
                            $components.Categories[$category] += $relativePath
                        }
                    }
                    
                    # Extract imports
                    $importMatches = [regex]::Matches($content, 'import\s+.*from\s+[''"]([^''"]+)[''"]')
                    foreach ($match in $importMatches) {
                        $importPath = $match.Groups[1].Value
                        if (-not $components.Imports.ContainsKey($importPath)) {
                            $components.Imports[$importPath] = 0
                        }
                        $components.Imports[$importPath]++
                    }
                    
                    # Detect patterns
                    if ($content -match "'use client'") { $components.Patterns['ClientComponent'] = $true }
                    if ($content -match "'use server'") { $components.Patterns['ServerComponent'] = $true }
                    if ($content -match 'useState|useEffect') { $components.Patterns['ReactHooks'] = $true }
                    if ($content -match 'framer-motion|motion\.') { $components.Patterns['Animations'] = $true }
                    if ($content -match 'three|@react-three') { $components.Patterns['3D'] = $true }
                }
            }
        }
    }
    
    return $components
}

function Analyze-APIRoutes {
    param($Dir)
    $routes = @{
        Files = @()
        Endpoints = @()
        Methods = @{}
        Categories = @{}
        Middleware = @()
        Patterns = @{}
    }
    
    if (Test-Path "$Dir\app\api") {
        Get-ChildItem -Path "$Dir\app\api" -Recurse -Include route.ts,*.ts -ErrorAction SilentlyContinue | ForEach-Object {
            $relativePath = $_.FullName.Replace("$Dir\app\api\", "")
            if ($routes.Files -notcontains $relativePath) {
                $routes.Files += $relativePath
            }
            
            $content = (Get-Content $_.FullName -ErrorAction SilentlyContinue) -join "`n"
            if ($content) {
                # Extract HTTP methods
                $methodMatches = [regex]::Matches($content, 'export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)')
                foreach ($match in $methodMatches) {
                    $method = $match.Groups[2].Value
                    $endpoint = "/api/$($relativePath.Replace('\route.ts', '').Replace('\', '/'))"
                    
                    if ($routes.Endpoints -notcontains "$method $endpoint") {
                        $routes.Endpoints += "$method $endpoint"
                    }
                    
                    if (-not $routes.Methods.ContainsKey($method)) {
                        $routes.Methods[$method] = 0
                    }
                    $routes.Methods[$method]++
                }
                
                # Categorize
                $category = $_.DirectoryName.Replace("$Dir\app\api\", "").Split('\')[0]
                if ($category -and $category -ne "" -and $category -ne $_.DirectoryName) {
                    if (-not $routes.Categories.ContainsKey($category)) {
                        $routes.Categories[$category] = @()
                    }
                    if ($routes.Categories[$category] -notcontains $relativePath) {
                        $routes.Categories[$category] += $relativePath
                    }
                }
                
                # Detect patterns
                if ($content -match 'NextRequest|NextResponse') { $routes.Patterns['NextJS'] = $true }
                if ($content -match 'middleware|auth|authenticate') { $routes.Patterns['Auth'] = $true }
                if ($content -match 'rateLimit|rate.*limit') { $routes.Patterns['RateLimiting'] = $true }
                if ($content -match 'validation|validate|zod|yup') { $routes.Patterns['Validation'] = $true }
            }
        }
    }
    
    return $routes
}

function Analyze-Pages {
    param($Dir)
    $pages = @{
        Files = @()
        Routes = @()
        Layouts = @()
        Metadata = @{}
        Patterns = @{}
    }
    
    if (Test-Path "$Dir\app") {
        # Find page files
        Get-ChildItem -Path "$Dir\app" -Recurse -Include page.tsx,page.ts -ErrorAction SilentlyContinue | ForEach-Object {
            $relativePath = $_.FullName.Replace("$Dir\app\", "").Replace('\page.tsx', '').Replace('\page.ts', '')
            $route = "/$relativePath"
            if ($pages.Files -notcontains $relativePath) {
                $pages.Files += $relativePath
            }
            if ($pages.Routes -notcontains $route) {
                $pages.Routes += $route
            }
        }
        
        # Find layout files
        Get-ChildItem -Path "$Dir\app" -Recurse -Include layout.tsx,layout.ts -ErrorAction SilentlyContinue | ForEach-Object {
            $relativePath = $_.FullName.Replace("$Dir\app\", "").Replace('\layout.tsx', '').Replace('\layout.ts', '')
            if ($pages.Layouts -notcontains $relativePath) {
                $pages.Layouts += $relativePath
            }
        }
        
        # Analyze page patterns
        Get-ChildItem -Path "$Dir\app" -Recurse -Include page.tsx,page.ts -ErrorAction SilentlyContinue | Select-Object -First 10 | ForEach-Object {
            $content = (Get-Content $_.FullName -ErrorAction SilentlyContinue) -join "`n"
            if ($content) {
                if ($content -match "export\s+const\s+metadata") { $pages.Patterns['Metadata'] = $true }
                if ($content -match "'use client'") { $pages.Patterns['ClientPage'] = $true }
                if ($content -match "'use server'") { $pages.Patterns['ServerPage'] = $true }
                if ($content -match 'generateMetadata|generateStaticParams') { $pages.Patterns['Dynamic'] = $true }
            }
        }
    }
    
    return $pages
}

function Analyze-Types {
    param($Dir)
    $types = @{
        Files = @()
        Interfaces = @()
        Types = @()
        Enums = @()
        Categories = @{}
    }
    
    $typePaths = @("types", "lib\types", "src\types")
    foreach ($path in $typePaths) {
        if (Test-Path "$Dir\$path") {
            Get-ChildItem -Path "$Dir\$path" -Recurse -Include *.ts -ErrorAction SilentlyContinue | ForEach-Object {
                $relativePath = $_.FullName.Replace("$Dir\", "")
                if ($types.Files -notcontains $relativePath) {
                    $types.Files += $relativePath
                }
                
                $content = (Get-Content $_.FullName -ErrorAction SilentlyContinue) -join "`n"
                if ($content) {
                    # Extract interfaces
                    $ifMatches = [regex]::Matches($content, 'export\s+(interface|type)\s+(\w+)')
                    foreach ($match in $ifMatches) {
                        $typeKind = $match.Groups[1].Value
                        $name = $match.Groups[2].Value
                        
                        if ($typeKind -eq "interface") {
                            if ($types.Interfaces -notcontains $name) {
                                $types.Interfaces += $name
                            }
                        } else {
                            if ($types.Types -notcontains $name) {
                                $types.Types += $name
                            }
                        }
                    }
                    
                    # Extract enums
                    $enumMatches = [regex]::Matches($content, 'export\s+enum\s+(\w+)')
                    foreach ($match in $enumMatches) {
                        if ($types.Enums -notcontains $match.Groups[1].Value) {
                            $types.Enums += $match.Groups[1].Value
                        }
                    }
                    
                    # Categorize
                    $category = $_.Name.Replace('.ts', '')
                    if (-not $types.Categories.ContainsKey($category)) {
                        $types.Categories[$category] = @{
                            Interfaces = 0
                            Types = 0
                            Enums = 0
                        }
                    }
                    $types.Categories[$category].Interfaces = ($ifMatches | Where-Object { $_.Groups[1].Value -eq "interface" }).Count
                    $types.Categories[$category].Types = ($ifMatches | Where-Object { $_.Groups[1].Value -eq "type" }).Count
                    $types.Categories[$category].Enums = $enumMatches.Count
                }
            }
        }
    }
    
    return $types
}

function Analyze-Architecture {
    param($Dir)
    $arch = @{
        Patterns = @{}
        Infrastructure = @{}
        Integrations = @{}
        Databases = @{}
    }
    
    $files = Get-AllFiles $Dir | Select-Object -First 1000
    
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            # Architecture patterns
            if ($content -match 'EventEmitter|EventBus|event-bus') { $arch.Patterns['EventDriven'] = $true }
            if ($content -match 'Command|Query|CQRS') { $arch.Patterns['CQRS'] = $true }
            if ($content -match 'ModuleRegistry|registerModule') { $arch.Patterns['PluginArchitecture'] = $true }
            if ($content -match 'tenant|multi-tenant|MultiTenant') { $arch.Patterns['MultiTenant'] = $true }
            if ($content -match 'EventStore|event-store') { $arch.Patterns['EventSourcing'] = $true }
            if ($content -match 'Adapter|adapter') { $arch.Patterns['AdapterPattern'] = $true }
            if ($content -match 'Repository|repository') { $arch.Patterns['RepositoryPattern'] = $true }
            if ($content -match 'Factory|factory') { $arch.Patterns['FactoryPattern'] = $true }
            if ($content -match 'Singleton|singleton') { $arch.Patterns['SingletonPattern'] = $true }
            if ($content -match 'Observer|observer') { $arch.Patterns['ObserverPattern'] = $true }
            
            # Infrastructure
            if ($content -match 'docker|Dockerfile|docker-compose') { $arch.Infrastructure['Docker'] = $true }
            if ($content -match 'kubernetes|k8s|kubectl') { $arch.Infrastructure['Kubernetes'] = $true }
            if ($content -match 'redis|Redis') { $arch.Infrastructure['Redis'] = $true }
            if ($content -match 'postgres|PostgreSQL|pg\.') { $arch.Databases['PostgreSQL'] = $true }
            if ($content -match 'mongodb|MongoDB|mongoose') { $arch.Databases['MongoDB'] = $true }
            if ($content -match 'sqlite|SQLite') { $arch.Databases['SQLite'] = $true }
            if ($content -match 'mysql|MySQL') { $arch.Databases['MySQL'] = $true }
            
            # Integrations
            if ($content -match 'graphql|GraphQL|Apollo') { $arch.Integrations['GraphQL'] = $true }
            if ($content -match 'websocket|socket\.io|SocketIO') { $arch.Integrations['WebSocket'] = $true }
            if ($content -match 'mqtt|MQTT') { $arch.Integrations['MQTT'] = $true }
            if ($content -match 'firebase|Firebase') { $arch.Integrations['Firebase'] = $true }
            if ($content -match 'erpnext|ERPNext') { $arch.Integrations['ERPNext'] = $true }
        }
    }
    
    return $arch
}

# ============================================================================
# MAIN ANALYSIS
# ============================================================================

Write-Host "🔍 Starting Enhanced Comprehensive Gap Analysis..." -ForegroundColor Cyan
Write-Host ""

# Initialize report
"# 🔍 Enhanced Comprehensive Gap Analysis Report" | Out-File $REPORT_FILE -Encoding UTF8
"**Generated:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8
"## Executive Summary" | Out-File $REPORT_FILE -Append -Encoding UTF8
"" | Out-File $REPORT_FILE -Append -Encoding UTF8

# Analyze BlueDXP
Write-Host "📊 Analyzing BlueDXP..." -ForegroundColor Yellow
$analysis.BlueDXP.TechStack = Analyze-TechStack $BLUEDXP_DIR
Write-Host "  ✅ Tech Stack" -ForegroundColor Green
$analysis.BlueDXP.Services = Analyze-Services $BLUEDXP_DIR
Write-Host "  ✅ Services" -ForegroundColor Green
$analysis.BlueDXP.Components = Analyze-Components $BLUEDXP_DIR
Write-Host "  ✅ Components" -ForegroundColor Green
$analysis.BlueDXP.APIRoutes = Analyze-APIRoutes $BLUEDXP_DIR
Write-Host "  ✅ API Routes" -ForegroundColor Green
$analysis.BlueDXP.Pages = Analyze-Pages $BLUEDXP_DIR
Write-Host "  ✅ Pages" -ForegroundColor Green
$analysis.BlueDXP.Types = Analyze-Types $BLUEDXP_DIR
Write-Host "  ✅ Types" -ForegroundColor Green
$analysis.BlueDXP.Architecture = Analyze-Architecture $BLUEDXP_DIR
Write-Host "  ✅ Architecture" -ForegroundColor Green

# Analyze chemcheck-analysis
Write-Host "📊 Analyzing chemcheck-analysis..." -ForegroundColor Yellow
if (Test-Path $CHEMCHECK_DIR) {
    $analysis.ChemCheck.TechStack = Analyze-TechStack $CHEMCHECK_DIR
    Write-Host "  ✅ Tech Stack" -ForegroundColor Green
    $analysis.ChemCheck.Services = Analyze-Services $CHEMCHECK_DIR
    Write-Host "  ✅ Services" -ForegroundColor Green
    $analysis.ChemCheck.Components = Analyze-Components $CHEMCHECK_DIR
    Write-Host "  ✅ Components" -ForegroundColor Green
    $analysis.ChemCheck.APIRoutes = Analyze-APIRoutes $CHEMCHECK_DIR
    Write-Host "  ✅ API Routes" -ForegroundColor Green
    $analysis.ChemCheck.Pages = Analyze-Pages $CHEMCHECK_DIR
    Write-Host "  ✅ Pages" -ForegroundColor Green
    $analysis.ChemCheck.Types = Analyze-Types $CHEMCHECK_DIR
    Write-Host "  ✅ Types" -ForegroundColor Green
    $analysis.ChemCheck.Architecture = Analyze-Architecture $CHEMCHECK_DIR
    Write-Host "  ✅ Architecture" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ chemcheck-analysis directory not found at: $CHEMCHECK_DIR" -ForegroundColor Yellow
    Write-Host "  Please verify the path and run again." -ForegroundColor Yellow
    exit 1
}

# Find gaps
Write-Host "🔍 Finding gaps..." -ForegroundColor Yellow

# Tech Stack Gaps
$bdDeps = $analysis.BlueDXP.TechStack.Dependencies | ForEach-Object { $_.Name }
$ccDeps = $analysis.ChemCheck.TechStack.Dependencies | ForEach-Object { $_.Name }
$missingDeps = $ccDeps | Where-Object { $_ -notin $bdDeps }

# Services Gaps
$bdServiceCats = $analysis.BlueDXP.Services.Categories.Keys
$ccServiceCats = $analysis.ChemCheck.Services.Categories.Keys
$missingServiceCats = $ccServiceCats | Where-Object { $_ -notin $bdServiceCats }

$bdServiceClasses = $analysis.BlueDXP.Services.Classes
$ccServiceClasses = $analysis.ChemCheck.Services.Classes
$missingServiceClasses = $ccServiceClasses | Where-Object { $_ -notin $bdServiceClasses }

# Components Gaps
$bdCompCats = $analysis.BlueDXP.Components.Categories.Keys
$ccCompCats = $analysis.ChemCheck.Components.Categories.Keys
$missingCompCats = $ccCompCats | Where-Object { $_ -notin $bdCompCats }

$bdCompExports = $analysis.BlueDXP.Components.Exports
$ccCompExports = $analysis.ChemCheck.Components.Exports
$missingCompExports = $ccCompExports | Where-Object { $_ -notin $bdCompExports }

# API Routes Gaps
$bdRouteCats = $analysis.BlueDXP.APIRoutes.Categories.Keys
$ccRouteCats = $analysis.ChemCheck.APIRoutes.Categories.Keys
$missingRouteCats = $ccRouteCats | Where-Object { $_ -notin $bdRouteCats }

# Pages Gaps
$bdPages = $analysis.BlueDXP.Pages.Routes
$ccPages = $analysis.ChemCheck.Pages.Routes
$missingPages = $ccPages | Where-Object { $_ -notin $bdPages }

# Types Gaps
$bdTypes = $analysis.BlueDXP.Types.Interfaces
$ccTypes = $analysis.ChemCheck.Types.Interfaces
$missingTypes = $ccTypes | Where-Object { $_ -notin $bdTypes }

# Architecture Gaps
$bdArchPatterns = $analysis.BlueDXP.Architecture.Patterns.Keys
$ccArchPatterns = $analysis.ChemCheck.Architecture.Patterns.Keys
$missingArchPatterns = $ccArchPatterns | Where-Object { $_ -notin $bdArchPatterns }

# Store gaps
$analysis.Gaps = @{
    Dependencies = $missingDeps
    ServiceCategories = $missingServiceCats
    ServiceClasses = $missingServiceClasses
    ComponentCategories = $missingCompCats
    ComponentExports = $missingCompExports
    APIRouteCategories = $missingRouteCats
    Pages = $missingPages
    Types = $missingTypes
    ArchitecturePatterns = $missingArchPatterns
}

# Generate detailed report
Write-Report "## 1. Tech Stack Analysis"
Write-Report ""
Write-Report "### BlueDXP Dependencies: $($analysis.BlueDXP.TechStack.Dependencies.Count)"
Write-Report "### chemcheck-analysis Dependencies: $($analysis.ChemCheck.TechStack.Dependencies.Count)"
Write-Report ""
Write-Report "### Missing Dependencies in BlueDXP:"
if ($missingDeps.Count -gt 0) {
    foreach ($dep in $missingDeps) {
        $version = ($analysis.ChemCheck.TechStack.Dependencies | Where-Object { $_.Name -eq $dep }).Version
        Write-Report "- **$dep**: $version"
    }
} else {
    Write-Report "- None (all dependencies already present)"
}
Write-Report ""

Write-Report "## 2. Services Analysis"
Write-Report ""
Write-Report "### BlueDXP Services:"
Write-Report "- Files: $($analysis.BlueDXP.Services.Files.Count)"
Write-Report "- Classes: $($analysis.BlueDXP.Services.Classes.Count)"
Write-Report "- Categories: $($analysis.BlueDXP.Services.Categories.Count)"
Write-Report ""
Write-Report "### chemcheck-analysis Services:"
Write-Report "- Files: $($analysis.ChemCheck.Services.Files.Count)"
Write-Report "- Classes: $($analysis.ChemCheck.Services.Classes.Count)"
Write-Report "- Categories: $($analysis.ChemCheck.Services.Categories.Count)"
Write-Report ""
Write-Report "### Missing Service Categories:"
if ($missingServiceCats.Count -gt 0) {
    foreach ($cat in $missingServiceCats) {
        Write-Report "- **$cat**: $($analysis.ChemCheck.Services.Categories[$cat].Count) files"
    }
} else {
    Write-Report "- None"
}
Write-Report ""
Write-Report "### Missing Service Classes:"
if ($missingServiceClasses.Count -gt 0) {
    foreach ($class in $missingServiceClasses | Select-Object -First 50) {
        Write-Report "- **$class**"
    }
    if ($missingServiceClasses.Count -gt 50) {
        Write-Report "- ... and $($missingServiceClasses.Count - 50) more"
    }
} else {
    Write-Report "- None"
}
Write-Report ""

Write-Report "## 3. Components Analysis"
Write-Report ""
Write-Report "### BlueDXP Components:"
Write-Report "- Files: $($analysis.BlueDXP.Components.Files.Count)"
Write-Report "- Exports: $($analysis.BlueDXP.Components.Exports.Count)"
Write-Report "- Categories: $($analysis.BlueDXP.Components.Categories.Count)"
Write-Report ""
Write-Report "### chemcheck-analysis Components:"
Write-Report "- Files: $($analysis.ChemCheck.Components.Files.Count)"
Write-Report "- Exports: $($analysis.ChemCheck.Components.Exports.Count)"
Write-Report "- Categories: $($analysis.ChemCheck.Components.Categories.Count)"
Write-Report ""
Write-Report "### Missing Component Categories:"
if ($missingCompCats.Count -gt 0) {
    foreach ($cat in $missingCompCats) {
        Write-Report "- **$cat**: $($analysis.ChemCheck.Components.Categories[$cat].Count) files"
    }
} else {
    Write-Report "- None"
}
Write-Report ""
Write-Report "### Missing Component Exports:"
if ($missingCompExports.Count -gt 0) {
    foreach ($export in $missingCompExports | Select-Object -First 50) {
        Write-Report "- **$export**"
    }
    if ($missingCompExports.Count -gt 50) {
        Write-Report "- ... and $($missingCompExports.Count - 50) more"
    }
} else {
    Write-Report "- None"
}
Write-Report ""

Write-Report "## 4. API Routes Analysis"
Write-Report ""
Write-Report "### BlueDXP API Routes:"
Write-Report "- Files: $($analysis.BlueDXP.APIRoutes.Files.Count)"
Write-Report "- Endpoints: $($analysis.BlueDXP.APIRoutes.Endpoints.Count)"
Write-Report "- Categories: $($analysis.BlueDXP.APIRoutes.Categories.Count)"
Write-Report ""
Write-Report "### chemcheck-analysis API Routes:"
Write-Report "- Files: $($analysis.ChemCheck.APIRoutes.Files.Count)"
Write-Report "- Endpoints: $($analysis.ChemCheck.APIRoutes.Endpoints.Count)"
Write-Report "- Categories: $($analysis.ChemCheck.APIRoutes.Categories.Count)"
Write-Report ""
Write-Report "### Missing API Route Categories:"
if ($missingRouteCats.Count -gt 0) {
    foreach ($cat in $missingRouteCats) {
        Write-Report "- **$cat**: $($analysis.ChemCheck.APIRoutes.Categories[$cat].Count) routes"
    }
} else {
    Write-Report "- None"
}
Write-Report ""

Write-Report "## 5. Pages Analysis"
Write-Report ""
Write-Report "### BlueDXP Pages: $($analysis.BlueDXP.Pages.Files.Count)"
Write-Report "### chemcheck-analysis Pages: $($analysis.ChemCheck.Pages.Files.Count)"
Write-Report ""
Write-Report "### Missing Pages in BlueDXP:"
if ($missingPages.Count -gt 0) {
    foreach ($page in $missingPages) {
        Write-Report "- **$page**"
    }
} else {
    Write-Report "- None"
}
Write-Report ""

Write-Report "## 6. Types Analysis"
Write-Report ""
Write-Report "### BlueDXP Types:"
Write-Report "- Interfaces: $($analysis.BlueDXP.Types.Interfaces.Count)"
Write-Report "- Types: $($analysis.BlueDXP.Types.Types.Count)"
Write-Report "- Files: $($analysis.BlueDXP.Types.Files.Count)"
Write-Report ""
Write-Report "### chemcheck-analysis Types:"
Write-Report "- Interfaces: $($analysis.ChemCheck.Types.Interfaces.Count)"
Write-Report "- Types: $($analysis.ChemCheck.Types.Types.Count)"
Write-Report "- Files: $($analysis.ChemCheck.Types.Files.Count)"
Write-Report ""
Write-Report "### Missing Types in BlueDXP:"
if ($missingTypes.Count -gt 0) {
    foreach ($type in $missingTypes | Select-Object -First 50) {
        Write-Report "- **$type**"
    }
    if ($missingTypes.Count -gt 50) {
        Write-Report "- ... and $($missingTypes.Count - 50) more"
    }
} else {
    Write-Report "- None"
}
Write-Report ""

Write-Report "## 7. Architecture Patterns Analysis"
Write-Report ""
Write-Report "### BlueDXP Patterns:"
foreach ($pattern in $analysis.BlueDXP.Architecture.Patterns.Keys) {
    Write-Report "- ✅ $pattern"
}
Write-Report ""
Write-Report "### chemcheck-analysis Patterns:"
foreach ($pattern in $analysis.ChemCheck.Architecture.Patterns.Keys) {
    Write-Report "- ✅ $pattern"
}
Write-Report ""
Write-Report "### Missing Patterns in BlueDXP:"
if ($missingArchPatterns.Count -gt 0) {
    foreach ($pattern in $missingArchPatterns) {
        Write-Report "- ❌ $pattern"
    }
} else {
    Write-Report "- None"
}
Write-Report ""

Write-Report "## Summary & Recommendations"
Write-Report ""
Write-Report "### Critical Gaps Identified:"
Write-Report "1. Dependencies: $($missingDeps.Count) missing"
Write-Report "2. Service Categories: $($missingServiceCats.Count) missing"
Write-Report "3. Service Classes: $($missingServiceClasses.Count) missing"
Write-Report "4. Component Categories: $($missingCompCats.Count) missing"
Write-Report "5. Component Exports: $($missingCompExports.Count) missing"
Write-Report "6. API Route Categories: $($missingRouteCats.Count) missing"
Write-Report "7. Pages: $($missingPages.Count) missing"
Write-Report "8. Types: $($missingTypes.Count) missing"
Write-Report "9. Architecture Patterns: $($missingArchPatterns.Count) missing"
Write-Report ""

# Save JSON for migration script
$analysis | ConvertTo-Json -Depth 10 | Out-File $JSON_FILE -Encoding UTF8

Write-Host ""
Write-Host "Enhanced Gap Analysis Complete!" -ForegroundColor Green
Write-Host "Report: $REPORT_FILE" -ForegroundColor Cyan
Write-Host "Data: $JSON_FILE" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
$depColor = if ($missingDeps.Count -gt 0) { "Yellow" } else { "Green" }
Write-Host "  Missing Dependencies: $($missingDeps.Count)" -ForegroundColor $depColor
$svcCatColor = if ($missingServiceCats.Count -gt 0) { "Yellow" } else { "Green" }
Write-Host "  Missing Service Categories: $($missingServiceCats.Count)" -ForegroundColor $svcCatColor
$svcClassColor = if ($missingServiceClasses.Count -gt 0) { "Yellow" } else { "Green" }
Write-Host "  Missing Service Classes: $($missingServiceClasses.Count)" -ForegroundColor $svcClassColor
$compCatColor = if ($missingCompCats.Count -gt 0) { "Yellow" } else { "Green" }
Write-Host "  Missing Component Categories: $($missingCompCats.Count)" -ForegroundColor $compCatColor
$pageColor = if ($missingPages.Count -gt 0) { "Yellow" } else { "Green" }
Write-Host "  Missing Pages: $($missingPages.Count)" -ForegroundColor $pageColor
Write-Host ""


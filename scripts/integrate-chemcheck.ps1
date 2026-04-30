# PowerShell Integration Script: Copy ChemCheck & ChemCollab modules to Hazalyze
# Run from hazalyze-asn-module root directory

$CHEMCHECK_DIR = "C:\Users\balba\chemcheck-ai"
$CHEMCOLLAB_DIR = "C:\Users\balba\ChemCollab"
$HAZALYZE_DIR = "."

Write-Host "🚀 Starting ChemCheck & ChemCollab Integration..." -ForegroundColor Cyan
Write-Host ""

# Phase 1: Copy Services (100% copy-paste ready)
Write-Host "📦 Phase 1: Copying Services..." -ForegroundColor Yellow

# Create directories
New-Item -ItemType Directory -Force -Path "lib\adapters\erpnext" | Out-Null
New-Item -ItemType Directory -Force -Path "lib\services\ml" | Out-Null
New-Item -ItemType Directory -Force -Path "lib\services\ai" | Out-Null
New-Item -ItemType Directory -Force -Path "lib\services\firebase" | Out-Null
New-Item -ItemType Directory -Force -Path "lib\services\event-bus" | Out-Null

# Copy ERPNext API
if (Test-Path "$CHEMCHECK_DIR\lib\erpnext-api.ts") {
  Copy-Item "$CHEMCHECK_DIR\lib\erpnext-api.ts" "lib\adapters\erpnext\api.ts"
  Write-Host "✅ Copied ERPNext API" -ForegroundColor Green
}

# Copy ML Services
if (Test-Path "$CHEMCHECK_DIR\lib\ml-services") {
  Copy-Item "$CHEMCHECK_DIR\lib\ml-services\*" "lib\services\ml\" -Recurse -Force
  Write-Host "✅ Copied ML Services (5 services)" -ForegroundColor Green
}

# Copy AI Service
if (Test-Path "$CHEMCHECK_DIR\lib\ai-service.ts") {
  Copy-Item "$CHEMCHECK_DIR\lib\ai-service.ts" "lib\services\ai\service.ts"
  Write-Host "✅ Copied AI Service" -ForegroundColor Green
}

# Copy Firebase Services
if (Test-Path "$CHEMCHECK_DIR\lib\firebase.ts") {
  Copy-Item "$CHEMCHECK_DIR\lib\firebase.ts" "lib\services\firebase\"
}
if (Test-Path "$CHEMCHECK_DIR\lib\firebase-db.ts") {
  Copy-Item "$CHEMCHECK_DIR\lib\firebase-db.ts" "lib\services\firebase\"
}
if (Test-Path "$CHEMCHECK_DIR\lib\firebase-storage.ts") {
  Copy-Item "$CHEMCHECK_DIR\lib\firebase-storage.ts" "lib\services\firebase\"
}
Write-Host "✅ Copied Firebase Services" -ForegroundColor Green

# Copy Event Bus
if (Test-Path "$CHEMCOLLAB_DIR\core\event-bus") {
  Copy-Item "$CHEMCOLLAB_DIR\core\event-bus\*" "lib\services\event-bus\" -Recurse -Force
  Write-Host "✅ Copied Event Bus" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Phase 1 Complete: All services copied" -ForegroundColor Green
Write-Host ""

# Phase 2: Copy Components
Write-Host "📦 Phase 2: Copying Components..." -ForegroundColor Yellow

# Create directories
New-Item -ItemType Directory -Force -Path "components\ims" | Out-Null
New-Item -ItemType Directory -Force -Path "components\ui-chemcheck" | Out-Null

# Copy IMS Components
if (Test-Path "$CHEMCHECK_DIR\components\IMS") {
  Copy-Item "$CHEMCHECK_DIR\components\IMS\*" "components\ims\" -Recurse -Force
  Write-Host "✅ Copied IMS Components" -ForegroundColor Green
}

# Copy Specialized Components
$components = @(
  "StorageLocationForm.tsx",
  "WarehouseAreasManager.tsx",
  "MSDSUpload.tsx",
  "NFPADiamond.tsx"
)

foreach ($component in $components) {
  if (Test-Path "$CHEMCHECK_DIR\components\$component") {
    Copy-Item "$CHEMCHECK_DIR\components\$component" "components\"
  }
}
Write-Host "✅ Copied Specialized Components" -ForegroundColor Green

# Copy UI Components
if (Test-Path "$CHEMCHECK_DIR\components\ui") {
  Copy-Item "$CHEMCHECK_DIR\components\ui\*" "components\ui-chemcheck\" -Recurse -Force
  Write-Host "✅ Copied UI Components (check for duplicates)" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Phase 2 Complete: All components copied" -ForegroundColor Green
Write-Host "⚠️  Note: Update imports and icons in components" -ForegroundColor Yellow
Write-Host ""

# Phase 3: Copy Types
Write-Host "📦 Phase 3: Copying Types..." -ForegroundColor Yellow

if (Test-Path "$CHEMCHECK_DIR\lib\types.ts") {
  Copy-Item "$CHEMCHECK_DIR\lib\types.ts" "types\chemcheck.ts"
  Write-Host "✅ Copied Type Definitions" -ForegroundColor Green
}

if (Test-Path "$CHEMCHECK_DIR\lib\utils.ts") {
  Copy-Item "$CHEMCHECK_DIR\lib\utils.ts" "utils\chemcheckUtils.ts"
  Write-Host "✅ Copied Utilities" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Integration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update import paths in copied files"
Write-Host "2. Update icon imports (react-icons/fi → remixicon)"
Write-Host "3. Convert pages from Pages Router to App Router"
Write-Host "4. Install dependencies: npm install"
Write-Host ""
Write-Host "See docs/integrations/CHEMCHECK_CHEMCOLLAB_INTEGRATION.md for details" -ForegroundColor Gray




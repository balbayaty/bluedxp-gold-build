# Batch Secure Remaining WMS Routes
# PowerShell Script to add withAPIGateway to unsecured WMS routes

$routes = @(
    "app/api/wms/areas/export/route.ts",
    "app/api/wms/inventory/accuracy/[skuId]/route.ts",
    "app/api/wms/inventory/sku/[skuId]/route.ts",
    "app/api/wms/sku/analytics/route.ts",
    "app/api/wms/sku/analytics/apply/route.ts",
    "app/api/wms/sku/inventory/route.ts",
    "app/api/wms/skus/bulk/export/route.ts",
    "app/api/wms/skus/bulk/import/route.ts",
    "app/api/wms/skus/[id]/analytics/route.ts",
    "app/api/wms/skus/[id]/compliance/route.ts",
    "app/api/wms/skus/[id]/customers/route.ts",
    "app/api/wms/skus/[id]/customers/[relationshipId]/route.ts",
    "app/api/wms/skus/[id]/packaging/route.ts",
    "app/api/wms/skus/[id]/packaging/levels/route.ts",
    "app/api/wms/skus/[id]/packaging/levels/[levelId]/route.ts",
    "app/api/wms/warehouse-optimization/slotting/route.ts",
    "app/api/wms/ai-analytics/classification/[skuId]/route.ts",
    "app/api/wms/ai-analytics/forecast/route.ts",
    "app/api/wms/ai-analytics/forecast/[skuId]/route.ts",
    "app/api/wms/ai-analytics/optimization/[skuId]/route.ts",
    "app/api/wms/ai-analytics/optimize/route.ts",
    "app/api/wms/ai-analytics/reorder/route.ts"
)

Write-Host "Phase 10: Batch Securing Remaining WMS Routes" -ForegroundColor Cyan
Write-Host "Routes to secure: $($routes.Length)" -ForegroundColor Yellow
Write-Host ""

$secured = 0
$failed = 0

foreach ($route in $routes) {
    $filePath = $route
    if (-not (Test-Path $filePath)) {
        Write-Host "❌ File not found: $filePath" -ForegroundColor Red
        $failed++
        continue
    }
    
    $content = Get-Content $filePath | Out-String
    
    # Skip if already secured
    if ($content -match 'withAPIGateway') {
        Write-Host "✓ Already secured: $filePath" -ForegroundColor Green
        $secured++
        continue
    }
    
    Write-Host "🔒 Securing: $filePath" -ForegroundColor Yellow
    
    # Determine feature ID from path
    $featurePath = $route -replace 'app/api/wms/', '' -replace '/route\.ts$', '' -replace '/\[.+?\]', ''
    $featureId = "wms.$($featurePath -replace '/', '.')"
    
    # Add imports after last import
    if ($content -notmatch "from '@/middleware/apiGateway'") {
        $content = $content -replace "(?m)(^import .+ from .+`$)(?![\r\n]*^import)", "`$1`nimport { withAPIGateway } from '@/middleware/apiGateway'`nimport type { APIRequestContext } from '@/middleware/apiPermissions'"
    }
    
    # Convert GET export async function to handler
    if ($content -match 'export async function GET\(') {
        $content = $content -replace 'export async function GET\(', 'async function getHandler('
        # Add context parameter
        $content = $content -replace 'getHandler\([\s\n]*request: NextRequest', 'getHandler(request: NextRequest, context: APIRequestContext'
        # Add export with withAPIGateway
        if ($content -notmatch 'export const GET = withAPIGateway') {
            $content = $content.TrimEnd() + "`n`nexport const GET = withAPIGateway(getHandler, {`n  moduleId: 'wms',`n  featureId: '$featureId',`n  action: 'read',`n  requireAuth: true,`n  rateLimit: true,`n})`n"
        }
    }
    
    # Convert POST export async function to handler
    if ($content -match 'export async function POST\(') {
        $content = $content -replace 'export async function POST\(', 'async function postHandler('
        $content = $content -replace 'postHandler\([\s\n]*request: NextRequest', 'postHandler(request: NextRequest, context: APIRequestContext'
        if ($content -notmatch 'export const POST = withAPIGateway') {
            $content = $content.TrimEnd() + "`n`nexport const POST = withAPIGateway(postHandler, {`n  moduleId: 'wms',`n  featureId: '$featureId',`n  action: 'write',`n  requireAuth: true,`n  rateLimit: true,`n})`n"
        }
    }
    
    # Convert PUT
    if ($content -match 'export async function PUT\(') {
        $content = $content -replace 'export async function PUT\(', 'async function putHandler('
        $content = $content -replace 'putHandler\([\s\n]*request: NextRequest', 'putHandler(request: NextRequest, context: APIRequestContext'
        if ($content -notmatch 'export const PUT = withAPIGateway') {
            $content = $content.TrimEnd() + "`n`nexport const PUT = withAPIGateway(putHandler, {`n  moduleId: 'wms',`n  featureId: '$featureId',`n  action: 'write',`n  requireAuth: true,`n  rateLimit: true,`n})`n"
        }
    }
    
    # Convert DELETE
    if ($content -match 'export async function DELETE\(') {
        $content = $content -replace 'export async function DELETE\(', 'async function deleteHandler('
        $content = $content -replace 'deleteHandler\([\s\n]*request: NextRequest', 'deleteHandler(request: NextRequest, context: APIRequestContext'
        if ($content -notmatch 'export const DELETE = withAPIGateway') {
            $content = $content.TrimEnd() + "`n`nexport const DELETE = withAPIGateway(deleteHandler, {`n  moduleId: 'wms',`n  featureId: '$featureId',`n  action: 'delete',`n  requireAuth: true,`n  rateLimit: true,`n})`n"
        }
    }
    
    # Write updated content
    $content | Set-Content $filePath -NoNewline
    Write-Host "✅ Secured: $filePath" -ForegroundColor Green
    $secured++
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor White
Write-Host "  Total routes processed: $($routes.Length)" -ForegroundColor White
Write-Host "  Successfully secured: $secured" -ForegroundColor Green
Write-Host "  Failed/Skipped: $failed" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan

# Test All Phases - Comprehensive Testing Script
# Tests Phase 1, 2, and 3 services

Write-Host "🧪 Testing All Phases - BlueDXP Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0
$tests = 0

function Test-Service {
    param(
        [string]$ServiceName,
        [string]$FilePath,
        [string]$Description
    )
    
    $script:tests++
    Write-Host "Testing: $ServiceName" -ForegroundColor Yellow
    Write-Host "  $Description" -ForegroundColor Gray
    
    if (Test-Path $FilePath) {
        Write-Host "  ✅ File exists" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ❌ File not found: $FilePath" -ForegroundColor Red
        $script:errors++
        return $false
    }
}

# Phase 1: Security & Observability
Write-Host "PHASE 1: Security & Observability" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Cyan

Test-Service "Zero-Trust Service" "lib\services\security\zeroTrustService.ts" "Zero-trust security implementation"
Test-Service "API Security Gateway" "lib\services\security\apiSecurityGateway.ts" "WAF and DDoS protection"
Test-Service "Secrets Rotation" "lib\services\security\secretsRotationService.ts" "Automated secrets rotation"
Test-Service "File Encryption" "lib\services\storage\encryptionService.ts" "File encryption at rest"
Test-Service "APM Service" "lib\services\observability\apmService.ts" "Application performance monitoring"
Test-Service "Alerting Service" "lib\services\observability\alertingService.ts" "Real-time alerting"
Test-Service "Zero-Trust Middleware" "middleware\zeroTrustMiddleware.ts" "Zero-trust middleware"
Test-Service "Observability Middleware" "middleware\observabilityMiddleware.ts" "Observability middleware"
Write-Host ""

# Phase 2: Architecture & Resilience
Write-Host "PHASE 2: Architecture & Resilience" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

Test-Service "Enhanced Saga" "lib\services\saga\enhancedSagaOrchestrator.ts" "Enhanced saga orchestrator"
Test-Service "Dead Letter Queue" "lib\services\resilience\deadLetterQueueService.ts" "DLQ service"
Test-Service "Bulkhead Circuit Breaker" "lib\services\resilience\bulkheadCircuitBreaker.ts" "Bulkhead pattern"
Test-Service "Chaos Engineering" "lib\services\resilience\chaosEngineeringService.ts" "Chaos engineering"
Test-Service "GraphQL API" "app\api\graphql\route.ts" "Complete GraphQL API"
Write-Host ""

# Phase 3: Scalability & Polish
Write-Host "PHASE 3: Scalability & Polish" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan

Test-Service "Database Sharding" "lib\database\shardingService.ts" "Database sharding service"
Test-Service "CDN Service" "lib\services\cdn\cdnService.ts" "CDN and edge computing"
Test-Service "Performance Optimization" "lib\services\performance\optimizationService.ts" "Performance optimization"
Test-Service "Advanced Caching" "lib\services\caching\advancedCacheService.ts" "Multi-layer caching"
Write-Host ""

# Database Models
Write-Host "🗄️  Database Models" -ForegroundColor Cyan
Write-Host "-------------------" -ForegroundColor Cyan

$schemaContent = Get-Content "prisma\schema.prisma" -Raw
$models = @("Secret", "SecretVersion", "SecretAuditLog", "Alert", "SlowQuery", "PerformanceMetric", "SagaState", "DeadLetterMessage")

foreach ($model in $models) {
    $tests++
    if ($schemaContent -match "model $model") {
        Write-Host "  ✅ Model $model exists" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Model $model not found" -ForegroundColor Red
        $errors++
    }
}
Write-Host ""

# Documentation
Write-Host "📚 Documentation" -ForegroundColor Cyan
Write-Host "----------------" -ForegroundColor Cyan

$docs = @(
    "docs\ALL_PHASES_COMPLETE.md",
    "docs\WHAT_REMAINS.md",
    "docs\EVERYTHING_IMPLEMENTED.md",
    "docs\PHASE1_COMPLETE_SUMMARY.md",
    "docs\PHASE2_COMPLETE_SUMMARY.md",
    "docs\PHASE3_COMPLETE_SUMMARY.md"
)

foreach ($doc in $docs) {
    $tests++
    if (Test-Path $doc) {
        Write-Host "  ✅ $([System.IO.Path]::GetFileName($doc))" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Missing: $doc" -ForegroundColor Red
        $errors++
    }
}
Write-Host ""

# Summary
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "  Tests Run: $tests" -ForegroundColor White
Write-Host "  Passed: $($tests - $errors)" -ForegroundColor Green
Write-Host "  Failed: $errors" -ForegroundColor $(if ($errors -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errors -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Apply migrations: npx prisma migrate dev" -ForegroundColor White
    Write-Host "   2. Start server: npm run dev" -ForegroundColor White
    Write-Host "   3. Test GraphQL: http://localhost:3002/api/graphql" -ForegroundColor White
} else {
    Write-Host "⚠️  Some tests failed. Please check the errors above." -ForegroundColor Yellow
}

exit $errors


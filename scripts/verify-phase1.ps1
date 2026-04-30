# Phase 1 Verification Script
# Verifies that all Phase 1 components are properly installed and configured

Write-Host "Verifying Phase 1 Implementation..." -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$success = @()

# 1. Check dependencies
Write-Host "1. Checking dependencies..." -ForegroundColor Yellow
$deps = @(
    "@opentelemetry/sdk-node",
    "@opentelemetry/auto-instrumentations-node"
)

foreach ($dep in $deps) {
    $installed = npm list $dep 2>&1 | Select-String -Pattern $dep
    if ($installed) {
        $success += "OK: $dep installed"
    } else {
        $errors += "FAIL: $dep NOT installed"
    }
}

# 2. Check files exist
Write-Host "2. Checking service files..." -ForegroundColor Yellow
$files = @(
    "lib\services\security\zeroTrustService.ts",
    "lib\services\security\apiSecurityGateway.ts",
    "lib\services\security\secretsRotationService.ts",
    "lib\services\storage\encryptionService.ts",
    "lib\services\observability\apmService.ts",
    "lib\services\observability\alertingService.ts",
    "middleware\zeroTrustMiddleware.ts",
    "middleware\observabilityMiddleware.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $success += "OK: $file exists"
    } else {
        $errors += "FAIL: $file NOT found"
    }
}

# 3. Check database models
Write-Host "3. Checking database models..." -ForegroundColor Yellow
$schema = Get-Content "prisma\schema.prisma" -Raw
$models = @(
    "model Secret",
    "model SecretVersion",
    "model SecretAuditLog",
    "model Alert",
    "model SlowQuery",
    "model PerformanceMetric"
)

foreach ($model in $models) {
    if ($schema -match $model) {
        $success += "OK: $model found in schema"
    } else {
        $errors += "FAIL: $model NOT found in schema"
    }
}

# 4. Check API Gateway integration
Write-Host "4. Checking API Gateway integration..." -ForegroundColor Yellow
$apiGateway = Get-Content "middleware\apiGateway.ts" -Raw
if ($apiGateway -match "zeroTrustMiddleware") {
    $success += "OK: Zero-trust middleware integrated"
} else {
    $warnings += "WARN: Zero-trust middleware not integrated"
}

if ($apiGateway -match "observabilityMiddleware") {
    $success += "OK: Observability middleware integrated"
} else {
    $warnings += "WARN: Observability middleware not integrated"
}

# 5. Check instrumentation
Write-Host "5. Checking instrumentation..." -ForegroundColor Yellow
$instrumentation = Get-Content "instrumentation.ts" -Raw
if ($instrumentation -match "initializeOpenTelemetry") {
    $success += "OK: OpenTelemetry initialization found"
} else {
    $warnings += "WARN: OpenTelemetry initialization not found"
}

# 6. Check environment variables
Write-Host "6. Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $env = Get-Content ".env.local" -Raw
    if ($env -match "ZERO_TRUST_ENABLED|OBSERVABILITY_ENABLED|OTEL_ENABLED") {
        $success += "OK: Environment variables configured"
    } else {
        $warnings += "WARN: Environment variables not configured (optional)"
    }
} else {
    $warnings += "WARN: .env.local not found (create it to configure Phase 1)"
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "SUCCESS: $($success.Count) items" -ForegroundColor Green
    foreach ($item in $success) {
        Write-Host "   $item" -ForegroundColor Green
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "WARNINGS: $($warnings.Count) items" -ForegroundColor Yellow
    foreach ($item in $warnings) {
        Write-Host "   $item" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -gt 0) {
    Write-Host "ERRORS: $($errors.Count) items" -ForegroundColor Red
    foreach ($item in $errors) {
        Write-Host "   $item" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
} else {
    Write-Host "All critical checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host '1. Run: npx prisma migrate dev --name add_phase1_security_observability' -ForegroundColor White
    Write-Host '2. Configure .env.local with Phase 1 settings' -ForegroundColor White
    Write-Host '3. Test: npm run dev' -ForegroundColor White
    exit 0
}

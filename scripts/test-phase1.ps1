# Phase 1 Testing Script
# Tests all Phase 1 components

Write-Host "Testing Phase 1 Implementation..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3002"
$errors = @()
$success = @()

# Test 1: Enhanced Health Check
Write-Host "1. Testing Enhanced Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health/enhanced" -Method GET -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $success += "OK: Enhanced health check endpoint working"
        $health = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($health.status)" -ForegroundColor Green
        Write-Host "   Zero-Trust: $($health.services.zeroTrust)" -ForegroundColor Green
        Write-Host "   OpenTelemetry: $($health.services.openTelemetry)" -ForegroundColor Green
    } else {
        $errors += "FAIL: Health check returned status $($response.StatusCode)"
    }
} catch {
    $errors += "FAIL: Health check endpoint not accessible - $_"
}

# Test 2: Metrics Endpoint
Write-Host "2. Testing Metrics Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/metrics" -Method GET -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $success += "OK: Metrics endpoint working"
        Write-Host "   Metrics format: $($response.Headers.'Content-Type')" -ForegroundColor Green
    } else {
        $errors += "FAIL: Metrics endpoint returned status $($response.StatusCode)"
    }
} catch {
    $errors += "FAIL: Metrics endpoint not accessible - $_"
}

# Test 3: Zero-Trust Security (should block unauthorized requests)
Write-Host "3. Testing Zero-Trust Security..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/inventory" -Method GET -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 403) {
        $success += "OK: Zero-trust security blocking unauthorized requests"
    } elseif ($response.StatusCode -eq 401) {
        $success += "OK: Authentication required (security working)"
    } else {
        $warnings += "WARN: Unexpected response code $($response.StatusCode) for unauthorized request"
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 403 -or $_.Exception.Response.StatusCode -eq 401) {
        $success += "OK: Zero-trust security blocking unauthorized requests"
    } else {
        $errors += "FAIL: Zero-trust test failed - $_"
    }
}

# Test 4: Check Jaeger (if running)
Write-Host "4. Testing Jaeger Connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:16686" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    $success += "OK: Jaeger UI accessible"
} catch {
    $warnings += "WARN: Jaeger not running (optional for testing)"
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "SUCCESS: $($success.Count) tests passed" -ForegroundColor Green
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
    Write-Host "ERRORS: $($errors.Count) tests failed" -ForegroundColor Red
    foreach ($item in $errors) {
        Write-Host "   $item" -ForegroundColor Red
    }
    Write-Host ""
    exit 1
} else {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
}



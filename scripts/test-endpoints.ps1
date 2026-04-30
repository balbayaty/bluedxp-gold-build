# Comprehensive Endpoint Testing Script
# Tests all major endpoints for functionality and performance

Write-Host "=== BlueDXP Platform - Endpoint Testing ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3002"
$results = @{
    passed = 0
    failed = 0
    warnings = 0
    tests = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [int]$Timeout = 3,
        [int]$ExpectedStatus = 200
    )
    
    $startTime = Get-Date
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = $Timeout
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            $results.passed++
            $status = "✅ PASSED"
            $color = "Green"
        } else {
            $results.warnings++
            $status = "⚠️  WARNING"
            $color = "Yellow"
        }
        
        Write-Host "$status - $Name" -ForegroundColor $color
        Write-Host "   URL: $Url" -ForegroundColor Gray
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "   Duration: $([math]::Round($duration, 2))ms" -ForegroundColor Gray
        
        $results.tests += @{
            name = $Name
            status = if ($response.StatusCode -eq $ExpectedStatus) { "passed" } else { "warning" }
            duration = $duration
            statusCode = $response.StatusCode
        }
        
        return $response
    } catch {
        $duration = ((Get-Date) - $startTime).TotalMilliseconds
        $results.failed++
        Write-Host "❌ FAILED - $Name" -ForegroundColor Red
        Write-Host "   URL: $Url" -ForegroundColor Gray
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Duration: $([math]::Round($duration, 2))ms" -ForegroundColor Gray
        
        $results.tests += @{
            name = $Name
            status = "failed"
            duration = $duration
            error = $_.Exception.Message
        }
        
        return $null
    }
}

# Test 1: Main App
Write-Host "1. Testing Main Application..." -ForegroundColor Yellow
Test-Endpoint -Name "Main App" -Url "$baseUrl" -Timeout 2

# Test 2: Demo Toggle
Write-Host "`n2. Testing Demo Mode Toggle..." -ForegroundColor Yellow
Test-Endpoint -Name "Demo Toggle (GET)" -Url "$baseUrl/api/demo/toggle"

# Test 3: Modules List
Write-Host "`n3. Testing Modules API..." -ForegroundColor Yellow
$modulesResponse = Test-Endpoint -Name "Modules List" -Url "$baseUrl/api/modules/list" -Timeout 5
if ($modulesResponse) {
    try {
        $modules = ($modulesResponse.Content | ConvertFrom-Json).data
        Write-Host "   Found $($modules.Count) modules" -ForegroundColor Gray
    } catch {
        Write-Host "   Could not parse modules response" -ForegroundColor Yellow
    }
}

# Test 4: Journey Analysis (with demo data)
Write-Host "`n4. Testing Journey Analysis..." -ForegroundColor Yellow
$journeyBody = @{
    action = "analyze"
    shipmentId = "SHIP-000001"
    includeRootCauseAnalysis = $true
    includeOptimization = $true
    includePredictions = $true
}
Test-Endpoint -Name "Journey Analysis (Demo)" -Url "$baseUrl/api/transportation/journey-analysis" -Method "POST" -Body $journeyBody -Timeout 5

# Test 5: Transportation Shipments
Write-Host "`n5. Testing Transportation APIs..." -ForegroundColor Yellow
Test-Endpoint -Name "Shipments List" -Url "$baseUrl/api/transportation/shipments?limit=10" -Timeout 5
Test-Endpoint -Name "Carriers List" -Url "$baseUrl/api/transportation/carriers" -Timeout 5

# Test 6: Process Lifecycle
Write-Host "`n6. Testing Process Lifecycle..." -ForegroundColor Yellow
Test-Endpoint -Name "Process Lifecycle Overview" -Url "$baseUrl/api/process-lifecycle" -Timeout 5

# Test 7: Storage Test
Write-Host "`n7. Testing Storage..." -ForegroundColor Yellow
Test-Endpoint -Name "Storage Test" -Url "$baseUrl/api/storage/test" -Timeout 10

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "✅ Passed: $($results.passed)" -ForegroundColor Green
Write-Host "⚠️  Warnings: $($results.warnings)" -ForegroundColor Yellow
Write-Host "❌ Failed: $($results.failed)" -ForegroundColor Red
Write-Host ""

$totalTests = $results.passed + $results.warnings + $results.failed
if ($totalTests -gt 0) {
    $successRate = [math]::Round(($results.passed / $totalTests) * 100, 2)
    Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })
}

# Performance Summary
$avgDuration = ($results.tests | Where-Object { $_.duration } | Measure-Object -Property duration -Average).Average
if ($avgDuration) {
    Write-Host "Average Response Time: $([math]::Round($avgDuration, 2))ms" -ForegroundColor $(if ($avgDuration -lt 500) { "Green" } elseif ($avgDuration -lt 1000) { "Yellow" } else { "Red" })
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan







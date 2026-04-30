# Comprehensive Platform Testing Script
# Tests login page and all critical endpoints

Write-Host "=== BlueDXP Platform - Full Platform Test ===" -ForegroundColor Cyan
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
        [int]$Timeout = 5,
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
        Write-Host "   Size: $($response.Content.Length) bytes" -ForegroundColor Gray
        
        $results.tests += @{
            name = $Name
            status = if ($response.StatusCode -eq $ExpectedStatus) { "passed" } else { "warning" }
            duration = $duration
            statusCode = $response.StatusCode
            size = $response.Content.Length
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

# Test 1: Root Page
Write-Host "1. Testing Root Page..." -ForegroundColor Yellow
Test-Endpoint -Name "Root Page (/) - Should redirect to login" -Url "$baseUrl/" -Timeout 3

# Test 2: Login Page
Write-Host "`n2. Testing Login Page..." -ForegroundColor Yellow
$loginResponse = Test-Endpoint -Name "Login Page" -Url "$baseUrl/login" -Timeout 5
if ($loginResponse) {
    if ($loginResponse.Content -match "Welcome Back|Sign In|login") {
        Write-Host "   ✅ Login page content detected" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Login page content not found" -ForegroundColor Yellow
    }
}

# Test 3: Demo Toggle
Write-Host "`n3. Testing Demo Mode..." -ForegroundColor Yellow
Test-Endpoint -Name "Demo Toggle (GET)" -Url "$baseUrl/api/demo/toggle" -Timeout 3

# Test 4: Modules List
Write-Host "`n4. Testing Modules API..." -ForegroundColor Yellow
$modulesResponse = Test-Endpoint -Name "Modules List" -Url "$baseUrl/api/modules/list" -Timeout 5
if ($modulesResponse) {
    try {
        $modules = ($modulesResponse.Content | ConvertFrom-Json).data
        Write-Host "   Found $($modules.Count) modules" -ForegroundColor Gray
    } catch {
        Write-Host "   Could not parse modules response" -ForegroundColor Yellow
    }
}

# Test 5: Journey Analysis
Write-Host "`n5. Testing Journey Analysis..." -ForegroundColor Yellow
$journeyBody = @{
    action = "analyze"
    shipmentId = "SHIP-000001"
    includeRootCauseAnalysis = $true
    includeOptimization = $true
    includePredictions = $true
}
Test-Endpoint -Name "Journey Analysis (Demo)" -Url "$baseUrl/api/transportation/journey-analysis" -Method "POST" -Body $journeyBody -Timeout 5

# Test 6: Shipments
Write-Host "`n6. Testing Shipments API..." -ForegroundColor Yellow
Test-Endpoint -Name "Shipments List (Demo)" -Url "$baseUrl/api/transportation/shipments?limit=10" -Timeout 5

# Test 7: Process Lifecycle
Write-Host "`n7. Testing Process Lifecycle..." -ForegroundColor Yellow
Test-Endpoint -Name "Process Lifecycle Overview" -Url "$baseUrl/api/process-lifecycle" -Timeout 5

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
$passedTests = $results.tests | Where-Object { $_.status -eq "passed" -and $_.duration }
if ($passedTests) {
    $avgDuration = ($passedTests | Measure-Object -Property duration -Average).Average
    Write-Host "Average Response Time: $([math]::Round($avgDuration, 2))ms" -ForegroundColor $(if ($avgDuration -lt 500) { "Green" } elseif ($avgDuration -lt 1000) { "Yellow" } else { "Red" })
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan







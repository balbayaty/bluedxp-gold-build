# ETW Module Test Script
# Tests all ETW module functionality

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "ETW MODULE COMPREHENSIVE TEST" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3002"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description,
        [object]$Body = $null
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Yellow
    Write-Host "  $Method $Url" -ForegroundColor Gray
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Body) {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers -Body ($Body | ConvertTo-Json -Depth 10) -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        $result = $response.Content | ConvertFrom-Json
        
        if ($result.success -or $response.StatusCode -eq 200) {
            Write-Host "  ✓ PASSED" -ForegroundColor Green
            $script:testResults += @{
                Test = $Description
                Status = "PASSED"
                StatusCode = $response.StatusCode
            }
            return $result
        } else {
            Write-Host "  ✗ FAILED: $($result.error)" -ForegroundColor Red
            $script:testResults += @{
                Test = $Description
                Status = "FAILED"
                Error = $result.error
            }
            return $null
        }
    } catch {
        Write-Host "  ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $script:testResults += @{
            Test = $Description
            Status = "FAILED"
            Error = $_.Exception.Message
        }
        return $null
    }
}

# Test 1: Check if server is running
Write-Host "Step 1: Checking if server is running..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Server is running" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Server is not running. Please start the server first:" -ForegroundColor Red
    Write-Host "    npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: List ETWs
Write-Host "Step 2: Testing ETW API endpoints..." -ForegroundColor Cyan
$listResult = Test-Endpoint -Method "GET" -Url "$baseUrl/api/etw" -Description "List ETWs"

# Test 3: Create Seed Data
Write-Host ""
Write-Host "Step 3: Creating seed data..." -ForegroundColor Cyan
$seedResult = Test-Endpoint -Method "POST" -Url "$baseUrl/api/etw/seed" -Description "Create seed data"

if ($seedResult -and $seedResult.data) {
    $etwIds = $seedResult.data.etws
    
    # Test 4: Get ETW by ID
    if ($etwIds.Count -gt 0) {
        Write-Host ""
        Write-Host "Step 4: Testing ETW operations..." -ForegroundColor Cyan
        $etwId = $etwIds[0]
        
        Test-Endpoint -Method "GET" -Url "$baseUrl/api/etw/$etwId" -Description "Get ETW by ID"
        
        # Test 5: Get Events
        Test-Endpoint -Method "GET" -Url "$baseUrl/api/etw/$etwId/events" -Description "Get ETW events"
        
        # Test 6: Get Intelligence
        Test-Endpoint -Method "GET" -Url "$baseUrl/api/etw/$etwId/intelligence" -Description "Get ETW intelligence"
    }
}

# Summary
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$passed = ($testResults | Where-Object { $_.Status -eq "PASSED" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "ALL TESTS PASSED! ✓" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "ETW module is fully functional!" -ForegroundColor Green
} else {
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed tests:" -ForegroundColor Yellow
    $testResults | Where-Object { $_.Status -eq "FAILED" } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Error)" -ForegroundColor Red
    }
}

Write-Host ""





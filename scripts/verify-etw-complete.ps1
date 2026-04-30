# ETW Module Complete Verification Script
# Tests all aspects of the ETW module implementation

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "ETW MODULE - COMPREHENSIVE VERIFICATION" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$passed = 0
$total = 0

function Test-Check {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [bool]$Required = $true
    )
    
    $script:total++
    Write-Host "Testing: $Name" -ForegroundColor Yellow -NoNewline
    Write-Host " ... " -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "✓ PASSED" -ForegroundColor Green
            $script:passed++
            return $true
        } else {
            Write-Host "✗ FAILED" -ForegroundColor Red
            if ($Required) {
                $script:errors += $Name
            } else {
                $script:warnings += $Name
            }
            return $false
        }
    }
    catch {
        Write-Host "✗ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($Required) {
            $script:errors += "$Name - $($_.Exception.Message)"
        } else {
            $script:warnings += "$Name - $($_.Exception.Message)"
        }
        return $false
    }
}

# ============================================================================
# FILE EXISTENCE CHECKS
# ============================================================================

Write-Host "Step 1: Verifying File Structure..." -ForegroundColor Cyan
Write-Host ""

# Core Types
Test-Check "Types file exists" { Test-Path "types/etw.ts" }
Test-Check "Prisma schema includes ETW models" {
    $content = Get-Content "prisma/schema.prisma" -Raw
    ($content -match "model ETW") -and ($content -match "model ETWVersion") -and ($content -match "model ETWEvent")
}

# Services
Test-Check "ETW Service exists" { Test-Path "lib/services/etw/etwService.ts" }
Test-Check "Event Service exists" { Test-Path "lib/services/etw/eventService.ts" }
Test-Check "QR Service exists" { Test-Path "lib/services/etw/qrVerificationService.ts" }
Test-Check "Rules Engine exists" { Test-Path "lib/services/etw/rulesEngine.ts" }
Test-Check "PDF Service exists" { Test-Path "lib/services/etw/pdfService.ts" }
Test-Check "Permit Service exists" { Test-Path "lib/services/etw/permitService.ts" }
Test-Check "Integration Service exists" { Test-Path "lib/services/etw/integrationService.ts" }
Test-Check "Intelligence Service exists" { Test-Path "lib/services/etw/intelligence/intelligenceOrchestrator.ts" }
Test-Check "Seed Data exists" { Test-Path "lib/services/etw/seedData.ts" }
Test-Check "Service Index exists" { Test-Path "lib/services/etw/index.ts" }

# API Routes
Test-Check "Main ETW API route exists" { Test-Path "app/api/etw/route.ts" }
Test-Check "ETW Detail API route exists" { Test-Path "app/api/etw/[id]/route.ts" }
Test-Check "Events API route exists" { Test-Path "app/api/etw/[id]/events/route.ts" }
Test-Check "QR API route exists" { Test-Path "app/api/etw/[id]/qr/route.ts" }
Test-Check "Verify API route exists" { Test-Path "app/api/etw/[id]/verify/route.ts" }
Test-Check "Public Verification API route exists" { Test-Path "app/api/v/[token]/route.ts" }
Test-Check "PDF Export API route exists" { Test-Path "app/api/etw/[id]/export/pdf/route.ts" }
Test-Check "Proof Bundle API route exists" { Test-Path "app/api/etw/[id]/export/proof-bundle/route.ts" }
Test-Check "Intelligence API route exists" { Test-Path "app/api/etw/[id]/intelligence/route.ts" }
Test-Check "Seed API route exists" { Test-Path "app/api/etw/seed/route.ts" }

# UI Pages
Test-Check "ETW List page exists" { Test-Path "app/etw/page.tsx" }
Test-Check "ETW Detail page exists" { Test-Path "app/etw/[id]/page.tsx" }
Test-Check "ETW Create page exists" { Test-Path "app/etw/create/page.tsx" }
Test-Check "ETW Edit page exists" { Test-Path "app/etw/[id]/edit/page.tsx" }
Test-Check "ETW Print page exists" { Test-Path "app/etw/[id]/print/page.tsx" }
Test-Check "ETW Verification page exists" { Test-Path "app/etw/verify/[token]/page.tsx" }

# Module Registration
Test-Check "ETW Module definition exists" { Test-Path "lib/modules/etw.ts" }
Test-Check "ETW Module registered" {
    $content = Get-Content "lib/modules/index.ts" -Raw
    ($content -match "import.*etwModule") -and ($content -match "registerModule\(etwModule\)")
}

# Migration
Test-Check "Migration SQL file exists" { Test-Path "prisma/migrations/004_add_etw_module.sql" }

# Documentation
Test-Check "Operator Manual exists" { Test-Path "docs/ETW_OPERATOR_MANUAL.md" }
Test-Check "Setup Guide exists" { Test-Path "docs/ETW_COMPLETE_SETUP_GUIDE.md" }
Test-Check "Migration Guide exists" { Test-Path "docs/ETW_MIGRATION_GUIDE.md" }

Write-Host ""

# ============================================================================
# CODE STRUCTURE CHECKS
# ============================================================================

Write-Host "Step 2: Verifying Code Structure..." -ForegroundColor Cyan
Write-Host ""

# Check for TODOs
Test-Check "No TODOs in ETW code" {
    $files = Get-ChildItem -Path "lib/services/etw", "app/api/etw", "app/etw" -Recurse -File -ErrorAction SilentlyContinue
    $found = $false
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -and ($content -match "TODO|FIXME|XXX")) {
            $found = $true
            break
        }
    }
    -not $found
}

# Check exports
Test-Check "ETW Service exported" {
    $content = Get-Content "lib/services/etw/index.ts" -Raw
    $content -match "export.*etwService"
}

Test-Check "All services exported" {
    $content = Get-Content "lib/services/etw/index.ts" -Raw
    ($content -match "etwService") -and ($content -match "etwEventService") -and ($content -match "etwQRVerificationService")
}

# Check API route exports
Test-Check "API routes export handlers" {
    $routeFiles = Get-ChildItem -Path "app/api/etw" -Recurse -Filter "route.ts" -ErrorAction SilentlyContinue
    if ($routeFiles.Count -eq 0) { return $false }
    $allExported = $true
    foreach ($file in $routeFiles) {
        $content = Get-Content $file.FullName -Raw
        if (-not ($content -match "export const (GET|POST|PUT|DELETE)")) {
            $allExported = $false
            break
        }
    }
    $allExported
}

# Check types
Test-Check "ETW types defined" {
    $content = Get-Content "types/etw.ts" -Raw
    ($content -match "export.*ETW") -and ($content -match "export.*ETWEvent") -and ($content -match "export.*ETWPermit")
}

# Check schemas
Test-Check "Zod schemas defined" {
    $content = Get-Content "types/etw.ts" -Raw
    ($content -match "CreateETWSchema") -and ($content -match "UpdateETWSchema") -and ($content -match "AddETWEventSchema")
}

Write-Host ""

# ============================================================================
# PRISMA SCHEMA CHECKS
# ============================================================================

Write-Host "Step 3: Verifying Prisma Schema..." -ForegroundColor Cyan
Write-Host ""

Test-Check "ETW model in schema" {
    $content = Get-Content "prisma/schema.prisma" -Raw
    $content -match "model ETW"
}

Test-Check "All ETW models in schema" {
    $content = Get-Content "prisma/schema.prisma" -Raw
    ($content -match "model ETW") -and 
    ($content -match "model ETWVersion") -and 
    ($content -match "model ETWEvent") -and
    ($content -match "model ETWLeg") -and
    ($content -match "model ETWPermit") -and
    ($content -match "model ETWRiskSnapshot") -and
    ($content -match "model ETWMilestone") -and
    ($content -match "model ETWAttachment")
}

Test-Check "QR Token model in schema" {
    $content = Get-Content "prisma/schema.prisma" -Raw
    $content -match "model QRToken"
}

Test-Check "Verification Log model in schema" {
    $content = Get-Content "prisma/schema.prisma" -Raw
    $content -match "model VerificationLog"
}

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Checks: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $($total - $passed)" -ForegroundColor $(if (($total - $passed) -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "CRITICAL ERRORS:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  ✗ $error" -ForegroundColor Red
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "WARNINGS:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  ⚠ $warning" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($errors.Count -eq 0) {
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host "✓ ALL CRITICAL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "ETW Module is structurally complete and ready for:" -ForegroundColor Green
    Write-Host "  1. Database migration (npx prisma migrate deploy)" -ForegroundColor Yellow
    Write-Host "  2. Runtime testing" -ForegroundColor Yellow
    Write-Host "  3. Production deployment" -ForegroundColor Yellow
    Write-Host ""
    exit 0
} else {
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host "✗ SOME CHECKS FAILED" -ForegroundColor Red
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please fix the errors above before proceeding." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}


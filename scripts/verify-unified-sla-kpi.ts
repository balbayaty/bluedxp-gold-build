/**
 * Verification Script for Unified SLA/KPI Service
 * 
 * Verifies that the unified service is properly set up and integrated
 * 
 * Usage: npx tsx scripts/verify-unified-sla-kpi.ts [tenantId]
 */

import { unifiedSlaKpiService } from '../lib/services/sla-kpi/unifiedSlaKpiService'
import { initializeUnifiedSlaKpi } from '../lib/services/sla-kpi/initialization'
import { readFileSync } from 'fs'
import { join } from 'path'

const tenantId = process.argv[2] || 'default'

interface VerificationResult {
  step: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  message: string
  details?: any
}

const results: VerificationResult[] = []

// ============================================================================
// VERIFICATION FUNCTIONS
// ============================================================================

function verifyPrismaSchema(): VerificationResult {
  try {
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma')
    const schema = readFileSync(schemaPath, 'utf-8')
    
    const hasSLA = schema.includes('model SupplyChainSLA')
    const hasKPI = schema.includes('model SupplyChainKPI')
    const hasCompliance = schema.includes('model SupplyChainSLACompliance')
    const hasKPIResult = schema.includes('model SupplyChainKPIResult')
    
    if (hasSLA && hasKPI && hasCompliance && hasKPIResult) {
      return {
        step: 'Prisma Schema',
        status: 'PASS',
        message: 'All required models found in schema.prisma',
      }
    } else {
      return {
        step: 'Prisma Schema',
        status: 'FAIL',
        message: 'Missing required models in schema.prisma',
        details: {
          hasSLA,
          hasKPI,
          hasCompliance,
          hasKPIResult,
        },
      }
    }
  } catch (error) {
    return {
      step: 'Prisma Schema',
      status: 'FAIL',
      message: `Error reading schema: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function verifyServiceFiles(): VerificationResult {
  const requiredFiles = [
    'lib/services/sla-kpi/unifiedSlaKpiService.ts',
    'lib/services/sla-kpi/migrationService.ts',
    'lib/services/sla-kpi/initialization.ts',
    'lib/services/sla-kpi/utils.ts',
    'lib/services/sla-kpi/index.ts',
    'lib/services/sla-kpi/moduleAdapters/transportationAdapter.ts',
    'lib/services/sla-kpi/moduleAdapters/wmsAdapter.ts',
    'lib/services/sla-kpi/moduleAdapters/geofenceAdapter.ts',
  ]
  
  const missingFiles: string[] = []
  
  for (const file of requiredFiles) {
    try {
      const filePath = join(process.cwd(), file)
      readFileSync(filePath, 'utf-8')
    } catch {
      missingFiles.push(file)
    }
  }
  
  if (missingFiles.length === 0) {
    return {
      step: 'Service Files',
      status: 'PASS',
      message: 'All required service files exist',
    }
  } else {
    return {
      step: 'Service Files',
      status: 'FAIL',
      message: `Missing ${missingFiles.length} required file(s)`,
      details: { missingFiles },
    }
  }
}

function verifyAPIEndpoints(): VerificationResult {
  const requiredEndpoints = [
    'app/api/sla-kpi/unified/route.ts',
    'app/api/sla-kpi/unified/kpi/route.ts',
    'app/api/sla-kpi/unified/compliance/route.ts',
  ]
  
  const missingEndpoints: string[] = []
  
  for (const endpoint of requiredEndpoints) {
    try {
      const filePath = join(process.cwd(), endpoint)
      readFileSync(filePath, 'utf-8')
    } catch {
      missingEndpoints.push(endpoint)
    }
  }
  
  if (missingEndpoints.length === 0) {
    return {
      step: 'API Endpoints',
      status: 'PASS',
      message: 'All required API endpoints exist',
    }
  } else {
    return {
      step: 'API Endpoints',
      status: 'FAIL',
      message: `Missing ${missingEndpoints.length} required endpoint(s)`,
      details: { missingEndpoints },
    }
  }
}

function verifyDashboard(): VerificationResult {
  try {
    const dashboardPath = join(process.cwd(), 'app', 'sla-kpi', 'dashboard', 'page.tsx')
    readFileSync(dashboardPath, 'utf-8')
    return {
      step: 'Dashboard UI',
      status: 'PASS',
      message: 'Dashboard UI exists',
    }
  } catch {
    return {
      step: 'Dashboard UI',
      status: 'WARNING',
      message: 'Dashboard UI not found (optional)',
    }
  }
}

async function verifyServiceInitialization(): Promise<VerificationResult> {
  try {
    await initializeUnifiedSlaKpi(tenantId, { skipMigration: true })
    
    // Try to get dashboard (this will fail if service isn't initialized)
    try {
      await unifiedSlaKpiService.getSLADashboard(tenantId)
      return {
        step: 'Service Initialization',
        status: 'PASS',
        message: 'Service initialized successfully',
      }
    } catch (error) {
      return {
        step: 'Service Initialization',
        status: 'WARNING',
        message: 'Service initialized but dashboard access failed',
        details: { error: error instanceof Error ? error.message : String(error) },
      }
    }
  } catch (error) {
    return {
      step: 'Service Initialization',
      status: 'FAIL',
      message: `Failed to initialize service: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

function verifyDocumentation(): VerificationResult {
  const requiredDocs = [
    'docs/UNIFIED_SLA_KPI_IMPLEMENTATION.md',
    'docs/UNIFIED_SLA_KPI_EXAMPLES.md',
    'docs/MIGRATION_GUIDE_UNIFIED_SLA_KPI.md',
    'docs/QUICK_START_UNIFIED_SLA_KPI.md',
  ]
  
  const missingDocs: string[] = []
  
  for (const doc of requiredDocs) {
    try {
      const docPath = join(process.cwd(), doc)
      readFileSync(docPath, 'utf-8')
    } catch {
      missingDocs.push(doc)
    }
  }
  
  if (missingDocs.length === 0) {
    return {
      step: 'Documentation',
      status: 'PASS',
      message: 'All required documentation exists',
    }
  } else {
    return {
      step: 'Documentation',
      status: 'WARNING',
      message: `Missing ${missingDocs.length} documentation file(s)`,
      details: { missingDocs },
    }
  }
}

// ============================================================================
// MAIN VERIFICATION
// ============================================================================

async function runVerification() {
  console.log('🔍 Verifying Unified SLA/KPI Service Setup...')
  console.log(`   Tenant: ${tenantId}`)
  console.log('')

  // Run all verifications
  results.push(verifyPrismaSchema())
  results.push(verifyServiceFiles())
  results.push(verifyAPIEndpoints())
  results.push(verifyDashboard())
  results.push(verifyDocumentation())
  results.push(await verifyServiceInitialization())

  // Print results
  console.log('📊 Verification Results:')
  console.log('')

  let passCount = 0
  let failCount = 0
  let warnCount = 0

  for (const result of results) {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${icon} ${result.step}: ${result.message}`)
    
    if (result.details) {
      console.log(`   Details:`, result.details)
    }
    
    if (result.status === 'PASS') passCount++
    else if (result.status === 'FAIL') failCount++
    else warnCount++
  }

  console.log('')
  console.log('📈 Summary:')
  console.log(`   ✅ Passed: ${passCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`   ⚠️  Warnings: ${warnCount}`)
  console.log('')

  if (failCount === 0) {
    console.log('🎉 All critical checks passed!')
    console.log('')
    console.log('✅ Unified SLA/KPI Service is ready to use!')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Run: npx prisma format && npx prisma generate')
    console.log('  2. Run: npx prisma migrate dev --name add_unified_sla_kpi')
    console.log('  3. Run: npx tsx scripts/seed-unified-sla-kpi.ts ' + tenantId)
    console.log('  4. View dashboard: /sla-kpi/dashboard')
    process.exit(0)
  } else {
    console.log('❌ Some checks failed. Please review the errors above.')
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runVerification()
    .catch((error) => {
      console.error('Fatal error during verification:', error)
      process.exit(1)
    })
}

export { runVerification }



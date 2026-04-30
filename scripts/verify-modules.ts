/**
 * Module Verification Script
 * Verifies all QHSE and ISO-IMS modules are properly set up
 */

import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green')
}

function logError(message: string) {
  log(`❌ ${message}`, 'red')
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'cyan')
}

interface VerificationResult {
  category: string
  item: string
  status: 'pass' | 'fail'
  message?: string
}

const results: VerificationResult[] = []

function verifyFile(path: string, description: string): boolean {
  const exists = existsSync(path)
  if (exists) {
    results.push({ category: 'Files', item: description, status: 'pass' })
    logSuccess(`${description} exists`)
    return true
  } else {
    results.push({ category: 'Files', item: description, status: 'fail', message: `File not found: ${path}` })
    logError(`${description} missing: ${path}`)
    return false
  }
}

function verifyFileContent(path: string, searchString: string, description: string): boolean {
  if (!existsSync(path)) {
    results.push({ category: 'Content', item: description, status: 'fail', message: 'File does not exist' })
    return false
  }
  
  const content = readFileSync(path, 'utf-8')
  const found = content.includes(searchString)
  
  if (found) {
    results.push({ category: 'Content', item: description, status: 'pass' })
    logSuccess(`${description} contains required content`)
    return true
  } else {
    results.push({ category: 'Content', item: description, status: 'fail', message: `Missing: ${searchString}` })
    logError(`${description} missing required content`)
    return false
  }
}

async function verifyModules() {
  log('\n' + '='.repeat(60), 'cyan')
  log('🔍 MODULE VERIFICATION', 'cyan')
  log('='.repeat(60) + '\n', 'cyan')

  // Verify ISO-IMS Pages
  logInfo('Verifying ISO-IMS Pages...')
  verifyFile('app/iso-ims/page.tsx', 'ISO-IMS Dashboard')
  verifyFile('app/iso-ims/capa/page.tsx', 'CAPA Management Page')
  verifyFile('app/iso-ims/ncr/page.tsx', 'NCR Management Page')
  verifyFile('app/iso-ims/audit/page.tsx', 'Audit Management Page')
  verifyFile('app/iso-ims/document/page.tsx', 'Document Management Page')
  verifyFile('app/iso-ims/risk/page.tsx', 'Risk Management Page')
  verifyFile('app/iso-ims/training/page.tsx', 'Training Management Page')
  verifyFile('app/iso-ims/intelligence/page.tsx', 'Intelligence Dashboard')

  // Verify API Routes
  logInfo('\nVerifying API Routes...')
  verifyFile('app/api/iso-ims/capa/route.ts', 'CAPA API Route')
  verifyFile('app/api/iso-ims/capa/[id]/route.ts', 'CAPA [id] API Route')
  verifyFile('app/api/iso-ims/ncr/route.ts', 'NCR API Route')
  verifyFile('app/api/iso-ims/ncr/[id]/route.ts', 'NCR [id] API Route')
  verifyFile('app/api/iso-ims/audit/route.ts', 'Audit API Route')
  verifyFile('app/api/qhse/incidents/route.ts', 'QHSE Incidents API Route')
  verifyFile('app/api/qhse/incidents/[id]/route.ts', 'QHSE Incidents [id] API Route')

  // Verify Services
  logInfo('\nVerifying Services...')
  verifyFile('lib/services/qhse/incidentService.ts', 'QHSE Incident Service')
  verifyFile('lib/services/qhse/inspectionService.ts', 'QHSE Inspection Service')
  verifyFile('lib/services/qhse/trainingService.ts', 'QHSE Training Service')
  verifyFile('lib/services/iso-ims/capaService.ts', 'CAPA Service')
  verifyFile('lib/services/iso-ims/ncrService.ts', 'NCR Service')
  verifyFile('lib/services/iso-ims/auditService.ts', 'Audit Service')

  // Verify Database
  logInfo('\nVerifying Database...')
  verifyFile('prisma/schema.prisma', 'Prisma Schema')
  verifyFile('prisma/migrations/006_add_qhse_iso_ims_models.sql', 'Database Migration')

  // Verify Module Registry
  logInfo('\nVerifying Module Registry...')
  verifyFile('lib/modules/qhse.ts', 'QHSE Module Registry')
  verifyFile('lib/modules/iso-ims.ts', 'ISO-IMS Module Registry')

  // Verify Content
  logInfo('\nVerifying Page Content...')
  verifyFileContent('app/iso-ims/capa/page.tsx', 'ErrorBoundary', 'CAPA Page has ErrorBoundary')
  verifyFileContent('app/iso-ims/capa/page.tsx', 'PremiumLoader', 'CAPA Page has PremiumLoader')
  verifyFileContent('app/iso-ims/ncr/page.tsx', 'ErrorBoundary', 'NCR Page has ErrorBoundary')
  verifyFileContent('app/iso-ims/ncr/page.tsx', 'PremiumLoader', 'NCR Page has PremiumLoader')
  verifyFileContent('app/iso-ims/audit/page.tsx', 'ErrorBoundary', 'Audit Page has ErrorBoundary')
  verifyFileContent('app/iso-ims/audit/page.tsx', 'PremiumLoader', 'Audit Page has PremiumLoader')

  // Verify API Route Content
  logInfo('\nVerifying API Route Content...')
  verifyFileContent('app/api/iso-ims/capa/route.ts', 'z.object', 'CAPA API has Zod validation')
  verifyFileContent('app/api/iso-ims/ncr/route.ts', 'z.object', 'NCR API has Zod validation')
  verifyFileContent('app/api/iso-ims/audit/route.ts', 'z.object', 'Audit API has Zod validation')

  // Verify Service Content
  logInfo('\nVerifying Service Content...')
  verifyFileContent('lib/services/qhse/incidentService.ts', 'prisma.qHSEIncident', 'Incident Service uses Prisma')
  verifyFileContent('lib/services/iso-ims/capaService.ts', 'prisma.iSOIMSCAPA', 'CAPA Service uses Prisma')
  verifyFileContent('lib/services/iso-ims/ncrService.ts', 'prisma.iSOIMSNCR', 'NCR Service uses Prisma')
  verifyFileContent('lib/services/iso-ims/auditService.ts', 'prisma.iSOIMSAudit', 'Audit Service uses Prisma')

  // Print Summary
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const total = results.length

  log('\n' + '='.repeat(60), 'cyan')
  log('📊 VERIFICATION SUMMARY', 'cyan')
  log('='.repeat(60), 'cyan')
  log(`Total Checks: ${total}`, 'cyan')
  log(`✅ Passed: ${passed}`, 'green')
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset')

  if (failed > 0) {
    log('\n❌ Failed Checks:', 'red')
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        log(`  - ${r.item}: ${r.message || 'Check failed'}`, 'red')
      })
  }

  log('\n' + '='.repeat(60) + '\n', 'cyan')

  if (failed === 0) {
    logSuccess('🎉 ALL VERIFICATIONS PASSED!')
    process.exit(0)
  } else {
    logError(`❌ ${failed} VERIFICATION(S) FAILED`)
    process.exit(1)
  }
}

verifyModules().catch(console.error)
















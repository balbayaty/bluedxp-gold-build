/**
 * Comprehensive Test Script for QHSE & ISO-IMS Services
 * Tests all services end-to-end with real database operations
 */

import { prisma } from '@/lib/services/database/prismaClient'
import { qhseIncidentService } from '@/lib/services/qhse'
import { capaService } from '@/lib/services/iso-ims/capaService'
import { ncrService } from '@/lib/services/iso-ims/ncrService'
import { auditService } from '@/lib/services/iso-ims/auditService'

const TEST_TENANT_ID = 'test-tenant-' + Date.now()
const TEST_USER_ID = 'test-user-' + Date.now()

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
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

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow')
}

// Test Results
interface TestResult {
  service: string
  test: string
  passed: boolean
  error?: string
  duration: number
}

const results: TestResult[] = []

async function runTest(
  service: string,
  testName: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now()
  try {
    await testFn()
    const duration = Date.now() - startTime
    results.push({ service, test: testName, passed: true, duration })
    logSuccess(`${service} - ${testName} (${duration}ms)`)
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    results.push({ service, test: testName, passed: false, error: errorMessage, duration })
    logError(`${service} - ${testName}: ${errorMessage}`)
  }
}

// QHSE Incident Service Tests
async function testQHSEIncidentService() {
  logInfo('\n=== Testing QHSE Incident Service ===')
  
  let incidentId: string | undefined

  await runTest('QHSE Incident', 'Create Incident', async () => {
    const incident = await qhseIncidentService.createIncident({
      tenantId: TEST_TENANT_ID,
      type: 'NEAR_MISS',
      severity: 'MEDIUM',
      title: 'Test Incident',
      description: 'Test incident description',
      location: 'Test Location',
      occurredAt: new Date().toISOString(),
      reportedBy: TEST_USER_ID,
      createdBy: TEST_USER_ID,
    })
    incidentId = incident.id
    if (!incident.id) throw new Error('Incident ID not generated')
  })

  await runTest('QHSE Incident', 'Get Incident', async () => {
    if (!incidentId) throw new Error('No incident ID from create test')
    const incident = await qhseIncidentService.getIncident(incidentId)
    if (!incident) throw new Error('Incident not found')
    if (incident.title !== 'Test Incident') throw new Error('Incident title mismatch')
  })

  await runTest('QHSE Incident', 'List Incidents', async () => {
    const incidents = await qhseIncidentService.getIncidents({
      tenantId: TEST_TENANT_ID,
    })
    if (!Array.isArray(incidents)) throw new Error('Incidents not an array')
    if (incidents.length === 0) throw new Error('No incidents found')
  })

  await runTest('QHSE Incident', 'Update Incident', async () => {
    if (!incidentId) throw new Error('No incident ID from create test')
    const updated = await qhseIncidentService.updateIncident(incidentId, {
      title: 'Updated Test Incident',
      updatedBy: TEST_USER_ID,
    })
    if (updated.title !== 'Updated Test Incident') throw new Error('Update failed')
  })

  await runTest('QHSE Incident', 'Delete Incident', async () => {
    if (!incidentId) throw new Error('No incident ID from create test')
    await qhseIncidentService.deleteIncident(incidentId)
    const deleted = await qhseIncidentService.getIncident(incidentId)
    if (deleted) throw new Error('Incident still exists after deletion')
  })
}

// ISO-IMS CAPA Service Tests
async function testCAPAService() {
  logInfo('\n=== Testing ISO-IMS CAPA Service ===')
  
  let capaId: string | undefined

  await runTest('CAPA', 'Create CAPA', async () => {
    const capa = await capaService.createCAPA({
      tenantId: TEST_TENANT_ID,
      subject: 'Test CAPA',
      description: 'Test CAPA description',
      priority: 'HIGH',
      capaType: 'CORRECTIVE_ACTION',
      capaSource: 'NCR',
      assignedTo: TEST_USER_ID,
      department: 'Quality',
      owner: TEST_USER_ID,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      actionPlan: 'Test action plan',
      createdBy: TEST_USER_ID,
    })
    capaId = capa.id
    if (!capa.id) throw new Error('CAPA ID not generated')
  })

  await runTest('CAPA', 'Get CAPA', async () => {
    if (!capaId) throw new Error('No CAPA ID from create test')
    const capa = await capaService.getCAPA(capaId, TEST_TENANT_ID)
    if (!capa) throw new Error('CAPA not found')
    if (capa.subject !== 'Test CAPA') throw new Error('CAPA subject mismatch')
  })

  await runTest('CAPA', 'List CAPAs', async () => {
    const result = await capaService.getCAPAs({
      tenantId: TEST_TENANT_ID,
      pagination: { page: 1, pageSize: 10 },
    })
    if (!result.capas) throw new Error('CAPAs not returned')
    if (!Array.isArray(result.capas)) throw new Error('CAPAs not an array')
  })

  await runTest('CAPA', 'Update CAPA', async () => {
    if (!capaId) throw new Error('No CAPA ID from create test')
    const updated = await capaService.updateCAPA(
      capaId,
      { subject: 'Updated Test CAPA' },
      TEST_TENANT_ID,
      TEST_USER_ID
    )
    if (updated.subject !== 'Updated Test CAPA') throw new Error('Update failed')
  })

  await runTest('CAPA', 'Delete CAPA', async () => {
    if (!capaId) throw new Error('No CAPA ID from create test')
    await capaService.deleteCAPA(capaId, TEST_TENANT_ID)
    const deleted = await capaService.getCAPA(capaId, TEST_TENANT_ID)
    if (deleted) throw new Error('CAPA still exists after deletion')
  })
}

// ISO-IMS NCR Service Tests
async function testNCRService() {
  logInfo('\n=== Testing ISO-IMS NCR Service ===')
  
  let ncrId: string | undefined

  await runTest('NCR', 'Create NCR', async () => {
    const ncr = await ncrService.createNCR({
      tenantId: TEST_TENANT_ID,
      subject: 'Test NCR',
      description: 'Test NCR description',
      priority: 'HIGH',
      severity: 'MAJOR',
      ncType: 'PROCESS',
      reportedBy: TEST_USER_ID,
      reportedDate: new Date(),
      createdBy: TEST_USER_ID,
    })
    ncrId = ncr.id
    if (!ncr.id) throw new Error('NCR ID not generated')
  })

  await runTest('NCR', 'Get NCR', async () => {
    if (!ncrId) throw new Error('No NCR ID from create test')
    const ncr = await ncrService.getNCR(ncrId, TEST_TENANT_ID)
    if (!ncr) throw new Error('NCR not found')
    if (ncr.subject !== 'Test NCR') throw new Error('NCR subject mismatch')
  })

  await runTest('NCR', 'List NCRs', async () => {
    const result = await ncrService.getNCRs({
      tenantId: TEST_TENANT_ID,
      pagination: { offset: 0, limit: 10 },
    })
    if (!result.ncrs) throw new Error('NCRs not returned')
    if (!Array.isArray(result.ncrs)) throw new Error('NCRs not an array')
  })

  await runTest('NCR', 'Update NCR', async () => {
    if (!ncrId) throw new Error('No NCR ID from create test')
    const updated = await ncrService.updateNCR(
      ncrId,
      { subject: 'Updated Test NCR' },
      TEST_TENANT_ID,
      TEST_USER_ID
    )
    if (updated.subject !== 'Updated Test NCR') throw new Error('Update failed')
  })

  await runTest('NCR', 'Delete NCR', async () => {
    if (!ncrId) throw new Error('No NCR ID from create test')
    const deleted = await ncrService.deleteNCR(ncrId, TEST_TENANT_ID)
    if (!deleted) throw new Error('Delete failed')
  })
}

// ISO-IMS Audit Service Tests
async function testAuditService() {
  logInfo('\n=== Testing ISO-IMS Audit Service ===')
  
  let auditId: string | undefined

  await runTest('Audit', 'Create Audit', async () => {
    const audit = await auditService.createAudit({
      tenantId: TEST_TENANT_ID,
      title: 'Test Audit',
      description: 'Test audit description',
      auditType: 'INTERNAL',
      scope: 'Quality Management System',
      isoStandards: ['ISO 9001:2015'],
      plannedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      leadAuditor: TEST_USER_ID,
      createdBy: TEST_USER_ID,
    })
    auditId = audit.id
    if (!audit.id) throw new Error('Audit ID not generated')
  })

  await runTest('Audit', 'Get Audit', async () => {
    if (!auditId) throw new Error('No Audit ID from create test')
    const audit = await auditService.getAudit(auditId, TEST_TENANT_ID)
    if (!audit) throw new Error('Audit not found')
    if (audit.title !== 'Test Audit') throw new Error('Audit title mismatch')
  })

  await runTest('Audit', 'List Audits', async () => {
    const result = await auditService.getAudits({
      tenantId: TEST_TENANT_ID,
      pagination: { offset: 0, limit: 10 },
    })
    if (!result.audits) throw new Error('Audits not returned')
    if (!Array.isArray(result.audits)) throw new Error('Audits not an array')
  })

  await runTest('Audit', 'Update Audit', async () => {
    if (!auditId) throw new Error('No Audit ID from create test')
    const updated = await auditService.updateAudit(
      auditId,
      { title: 'Updated Test Audit' },
      TEST_TENANT_ID,
      TEST_USER_ID
    )
    if (updated.title !== 'Updated Test Audit') throw new Error('Update failed')
  })

  await runTest('Audit', 'Delete Audit', async () => {
    if (!auditId) throw new Error('No Audit ID from create test')
    const deleted = await auditService.deleteAudit(auditId, TEST_TENANT_ID)
    if (!deleted) throw new Error('Delete failed')
  })
}

// Cleanup function
async function cleanup() {
  logInfo('\n=== Cleaning up test data ===')
  try {
    // Delete test data
    await prisma.qHSEIncident.deleteMany({
      where: { tenantId: TEST_TENANT_ID },
    })
    await prisma.iSOIMSCAPA.deleteMany({
      where: { tenantId: TEST_TENANT_ID },
    })
    await prisma.iSOIMSNCR.deleteMany({
      where: { tenantId: TEST_TENANT_ID },
    })
    await prisma.iSOIMSAudit.deleteMany({
      where: { tenantId: TEST_TENANT_ID },
    })
    logSuccess('Test data cleaned up')
  } catch (error) {
    logWarning(`Cleanup warning: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue')
  log('🧪 COMPREHENSIVE SERVICE TEST SUITE', 'blue')
  log('='.repeat(60) + '\n', 'blue')

  const startTime = Date.now()

  try {
    // Run all test suites
    await testQHSEIncidentService()
    await testCAPAService()
    await testNCRService()
    await testAuditService()

    // Cleanup
    await cleanup()

    // Print summary
    const totalDuration = Date.now() - startTime
    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const totalDurationTests = results.reduce((sum, r) => sum + r.duration, 0)

    log('\n' + '='.repeat(60), 'blue')
    log('📊 TEST SUMMARY', 'blue')
    log('='.repeat(60), 'blue')
    log(`Total Tests: ${results.length}`, 'cyan')
    log(`✅ Passed: ${passed}`, 'green')
    log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset')
    log(`⏱️  Total Duration: ${totalDuration}ms`, 'cyan')
    log(`⚡ Average Test Time: ${Math.round(totalDurationTests / results.length)}ms`, 'cyan')

    if (failed > 0) {
      log('\n❌ Failed Tests:', 'red')
      results
        .filter(r => !r.passed)
        .forEach(r => {
          log(`  - ${r.service} - ${r.test}: ${r.error}`, 'red')
        })
    }

    log('\n' + '='.repeat(60) + '\n', 'blue')

    if (failed === 0) {
      logSuccess('🎉 ALL TESTS PASSED!')
      process.exit(0)
    } else {
      logError(`❌ ${failed} TEST(S) FAILED`)
      process.exit(1)
    }
  } catch (error) {
    logError(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    await cleanup()
    process.exit(1)
  }
}

// Run tests
runAllTests().catch(console.error)
















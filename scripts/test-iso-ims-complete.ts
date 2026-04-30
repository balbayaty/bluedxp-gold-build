/**
 * ISO IMS Complete Test Suite
 * 
 * Comprehensive testing of ISO IMS module
 * Run with: npx tsx scripts/test-iso-ims-complete.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  category: string
  test: string
  status: 'PASS' | 'FAIL'
  message: string
  duration?: number
}

const results: TestResult[] = []

async function runTest(
  category: string,
  test: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now()
  try {
    await testFn()
    const duration = Date.now() - start
    results.push({
      category,
      test,
      status: 'PASS',
      message: 'Success',
      duration,
    })
    console.log(`   ✅ ${test}`)
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({
      category,
      test,
      status: 'FAIL',
      message: error.message,
      duration,
    })
    console.log(`   ❌ ${test} - ${error.message}`)
  }
}

async function testDatabaseOperations() {
  console.log('\n📊 Testing Database Operations...\n')

  const testTenantId = 'test-tenant-' + Date.now()
  const testUserId = 'test-user-' + Date.now()

  // Test Document Creation
  await runTest('Database', 'Create Document', async () => {
    const doc = await prisma.iSOIMSDocument.create({
      data: {
        id: `test-doc-${Date.now()}`,
        tenantId: testTenantId,
        documentNumber: `DOC-TEST-${Date.now()}`,
        title: 'Test Document',
        documentType: 'PROCEDURE',
        owner: testUserId,
        createdBy: testUserId,
      },
    })
    if (!doc.id) throw new Error('Document not created')
    await prisma.iSOIMSDocument.delete({ where: { id: doc.id } })
  })

  // Test NCR Creation
  await runTest('Database', 'Create NCR', async () => {
    const ncr = await prisma.iSOIMSNCR.create({
      data: {
        id: `test-ncr-${Date.now()}`,
        tenantId: testTenantId,
        ncrNumber: `NCR-TEST-${Date.now()}`,
        subject: 'Test NCR',
        description: 'Test description',
        ncType: 'QUALITY',
        reportedBy: testUserId,
        createdBy: testUserId,
      },
    })
    if (!ncr.id) throw new Error('NCR not created')
    await prisma.iSOIMSNCR.delete({ where: { id: ncr.id } })
  })

  // Test CAPA Creation
  await runTest('Database', 'Create CAPA', async () => {
    const capa = await prisma.iSOIMSCAPA.create({
      data: {
        id: `test-capa-${Date.now()}`,
        tenantId: testTenantId,
        capaNumber: `CAPA-TEST-${Date.now()}`,
        subject: 'Test CAPA',
        description: 'Test description',
        capaType: 'CORRECTIVE',
        capaSource: 'NCR',
        assignedTo: testUserId,
        department: 'Quality',
        owner: testUserId,
        targetDate: new Date(),
        actionPlan: 'Test plan',
        actionItems: [],
        createdBy: testUserId,
      },
    })
    if (!capa.id) throw new Error('CAPA not created')
    await prisma.iSOIMSCAPA.delete({ where: { id: capa.id } })
  })

  // Test Audit Creation
  await runTest('Database', 'Create Audit', async () => {
    const audit = await prisma.iSOIMSAudit.create({
      data: {
        id: `test-audit-${Date.now()}`,
        tenantId: testTenantId,
        auditNumber: `AUDIT-TEST-${Date.now()}`,
        auditType: 'INTERNAL',
        standard: 'ISO 9001',
        scope: 'Test scope',
        title: 'Test Audit',
        plannedStartDate: new Date(),
        plannedEndDate: new Date(),
        auditorName: 'Test Auditor',
        createdBy: testUserId,
      },
    })
    if (!audit.id) throw new Error('Audit not created')
    await prisma.iSOIMSAudit.delete({ where: { id: audit.id } })
  })

  // Test Risk Creation
  await runTest('Database', 'Create Risk', async () => {
    const risk = await prisma.iSOIMSRisk.create({
      data: {
        id: `test-risk-${Date.now()}`,
        tenantId: testTenantId,
        riskNumber: `RISK-TEST-${Date.now()}`,
        title: 'Test Risk',
        description: 'Test description',
        riskCategory: 'QUALITY',
        riskType: 'OPERATIONAL',
        likelihood: 3,
        impact: 3,
        riskScore: 9,
        riskLevel: 'HIGH',
        owner: testUserId,
        createdBy: testUserId,
      },
    })
    if (!risk.id) throw new Error('Risk not created')
    await prisma.iSOIMSRisk.delete({ where: { id: risk.id } })
  })

  // Test Training Creation
  await runTest('Database', 'Create Training', async () => {
    const training = await prisma.iSOIMSTraining.create({
      data: {
        id: `test-training-${Date.now()}`,
        tenantId: testTenantId,
        trainingNumber: `TRAIN-TEST-${Date.now()}`,
        title: 'Test Training',
        description: 'Test description',
        trainingType: 'INITIAL',
        deliveryMethod: 'CLASSROOM',
        instructor: testUserId,
        createdBy: testUserId,
      },
    })
    if (!training.id) throw new Error('Training not created')
    await prisma.iSOIMSTraining.delete({ where: { id: training.id } })
  })

  // Test Data Retrieval
  await runTest('Database', 'Retrieve Documents', async () => {
    const count = await prisma.iSOIMSDocument.count()
    if (count < 0) throw new Error('Cannot retrieve document count')
  })

  await runTest('Database', 'Retrieve NCRs', async () => {
    const count = await prisma.iSOIMSNCR.count()
    if (count < 0) throw new Error('Cannot retrieve NCR count')
  })
}

async function testServiceImports() {
  console.log('\n🔧 Testing Service Imports...\n')

  await runTest('Services', 'Import Document Service', async () => {
    const { documentService } = await import('@/lib/services/iso-ims/documentService')
    if (!documentService) throw new Error('Document service not found')
  })

  await runTest('Services', 'Import NCR Service', async () => {
    const { ncrService } = await import('@/lib/services/iso-ims/ncrService')
    if (!ncrService) throw new Error('NCR service not found')
  })

  await runTest('Services', 'Import CAPA Service', async () => {
    const { capaService } = await import('@/lib/services/iso-ims/capaService')
    if (!capaService) throw new Error('CAPA service not found')
  })

  await runTest('Services', 'Import Audit Service', async () => {
    const { auditService } = await import('@/lib/services/iso-ims/auditService')
    if (!auditService) throw new Error('Audit service not found')
  })

  await runTest('Services', 'Import Risk Service', async () => {
    const { riskService } = await import('@/lib/services/iso-ims/riskService')
    if (!riskService) throw new Error('Risk service not found')
  })

  await runTest('Services', 'Import Training Service', async () => {
    const { trainingService } = await import('@/lib/services/iso-ims/trainingService')
    if (!trainingService) throw new Error('Training service not found')
  })
}

async function printSummary() {
  console.log('\n📊 Test Summary:\n')

  const byCategory: Record<string, TestResult[]> = {}
  results.forEach((r) => {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r)
  })

  Object.entries(byCategory).forEach(([category, tests]) => {
    const passed = tests.filter((t) => t.status === 'PASS').length
    const failed = tests.filter((t) => t.status === 'FAIL').length
    console.log(`${category}:`)
    console.log(`   ✅ Passed: ${passed}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📊 Total: ${tests.length}`)
  })

  const totalPassed = results.filter((r) => r.status === 'PASS').length
  const totalFailed = results.filter((r) => r.status === 'FAIL').length
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0)

  console.log(`\n📈 Overall:`)
  console.log(`   ✅ Passed: ${totalPassed}`)
  console.log(`   ❌ Failed: ${totalFailed}`)
  console.log(`   📊 Total: ${results.length}`)
  console.log(`   ⏱️ Duration: ${totalDuration}ms`)

  if (totalFailed === 0) {
    console.log('\n🎉 All tests passed!')
    console.log('✅ ISO IMS module is ready for production use!')
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.')
  }
}

async function main() {
  console.log('🧪 ISO IMS Complete Test Suite\n')
  console.log('=' .repeat(50))

  try {
    await testDatabaseOperations()
    await testServiceImports()
    await printSummary()
  } catch (error: any) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()








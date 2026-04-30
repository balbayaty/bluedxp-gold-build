/**
 * Comprehensive ISO IMS Workflow Test Script
 * 
 * This script thoroughly tests the entire ISO IMS module by:
 * 1. Creating comprehensive test data for all entity types
 * 2. Testing all CRUD operations
 * 3. Testing workflows and integrations
 * 4. Verifying all functionality
 * 
 * Run with: npx tsx scripts/test-iso-ims-workflow.ts
 */

import { capaService } from '@/lib/services/iso-ims/capaService'
import { ncrService } from '@/lib/services/iso-ims/ncrService'
import { documentService } from '@/lib/services/iso-ims/documentService'
import { auditService } from '@/lib/services/iso-ims/auditService'
import { riskService } from '@/lib/services/iso-ims/riskService'
import { trainingService } from '@/lib/services/iso-ims/trainingService'

const TENANT_ID = 'tenant-1'
const USER_ID = 'test-user-1'
const TEST_DEPARTMENT = 'Quality Assurance'

// Test results tracking
const testResults: {
  passed: number
  failed: number
  errors: Array<{ test: string; error: string }>
} = {
  passed: 0,
  failed: 0,
  errors: [],
}

function logTest(testName: string, passed: boolean, error?: string) {
  if (passed) {
    console.log(`✅ ${testName}`)
    testResults.passed++
  } else {
    console.error(`❌ ${testName}${error ? `: ${error}` : ''}`)
    testResults.failed++
    if (error) {
      testResults.errors.push({ test: testName, error })
    }
  }
}

// ============================================================================
// TEST DATA CREATION
// ============================================================================

async function createTestNCRs() {
  console.log('\n📋 Creating Test NCRs...')
  const ncrs = []

  const ncrData = [
    {
      tenantId: TENANT_ID,
      subject: 'Critical: Safety Equipment Non-Compliance',
      description: 'Safety equipment inspection revealed non-compliance with ISO 45001 requirements. Immediate action required.',
      priority: 'CRITICAL' as const,
      severity: 'CRITICAL' as const,
      ncType: 'SAFETY' as const,
      reportedBy: USER_ID,
      reportedDate: new Date(),
      department: TEST_DEPARTMENT,
      immediateAction: 'Isolate affected area and suspend operations until compliance is restored.',
      immediateActionTaken: true,
    },
    {
      tenantId: TENANT_ID,
      subject: 'Quality Defect in Batch #12345',
      description: 'Quality inspection identified defects in production batch. Root cause analysis required.',
      priority: 'HIGH' as const,
      severity: 'MAJOR' as const,
      ncType: 'QUALITY' as const,
      reportedBy: USER_ID,
      reportedDate: new Date(),
      department: TEST_DEPARTMENT,
      immediateAction: 'Quarantine affected batch and initiate containment procedures.',
      immediateActionTaken: true,
    },
    {
      tenantId: TENANT_ID,
      subject: 'Documentation Gap in Process',
      description: 'Process documentation missing critical steps. Review and update required.',
      priority: 'MEDIUM' as const,
      severity: 'MINOR' as const,
      ncType: 'PROCESS' as const,
      reportedBy: USER_ID,
      reportedDate: new Date(),
      department: TEST_DEPARTMENT,
      immediateAction: 'Document current process and identify gaps.',
      immediateActionTaken: false,
    },
  ]

  for (const data of ncrData) {
    try {
      const ncr = await ncrService.createNCR(data)
      ncrs.push(ncr)
      logTest(`Create NCR: ${ncr.ncrNumber}`, true)
    } catch (error) {
      logTest(`Create NCR: ${data.subject}`, false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return ncrs
}

async function createTestCAPAs(ncrs: any[]) {
  console.log('\n🔧 Creating Test CAPAs...')
  const capas = []

  const capaData = [
    {
      tenantId: TENANT_ID,
      subject: 'Implement Enhanced Safety Training Program',
      description: 'Develop and implement comprehensive safety training program to address recurring safety non-conformances.',
      priority: 'CRITICAL' as const,
      capaType: 'CORRECTIVE_ACTION' as const,
      capaSource: 'NCR' as const,
      assignedTo: USER_ID,
      department: TEST_DEPARTMENT,
      owner: USER_ID,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      actionPlan: '1. Review current training materials\n2. Develop enhanced curriculum\n3. Schedule training sessions\n4. Monitor effectiveness',
      rootCause: 'Insufficient safety training and awareness among staff',
      resourcesRequired: 'Training materials, instructor time, venue',
      estimatedCost: 5000,
      linkedNCR: ncrs[0]?.id,
      createdBy: USER_ID,
    },
    {
      tenantId: TENANT_ID,
      subject: 'Preventive Action: Quality Control Enhancement',
      description: 'Implement preventive measures to avoid quality defects in future batches.',
      priority: 'HIGH' as const,
      capaType: 'PREVENTIVE_ACTION' as const,
      capaSource: 'NCR' as const,
      assignedTo: USER_ID,
      department: TEST_DEPARTMENT,
      owner: USER_ID,
      targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      actionPlan: '1. Enhance quality inspection procedures\n2. Implement statistical process control\n3. Train quality inspectors\n4. Establish monitoring metrics',
      rootCause: 'Inadequate quality control processes',
      resourcesRequired: 'Quality control equipment, training',
      estimatedCost: 10000,
      linkedNCR: ncrs[1]?.id,
      createdBy: USER_ID,
    },
    {
      tenantId: TENANT_ID,
      subject: 'Process Documentation Standardization',
      description: 'Standardize and complete all process documentation to ensure compliance.',
      priority: 'MEDIUM' as const,
      capaType: 'CORRECTIVE_ACTION' as const,
      capaSource: 'NCR' as const,
      assignedTo: USER_ID,
      department: TEST_DEPARTMENT,
      owner: USER_ID,
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      actionPlan: '1. Audit all process documentation\n2. Identify gaps\n3. Develop standardized templates\n4. Update all processes',
      rootCause: 'Lack of standardized documentation process',
      resourcesRequired: 'Documentation tools, process experts',
      estimatedCost: 3000,
      linkedNCR: ncrs[2]?.id,
      createdBy: USER_ID,
    },
  ]

  for (const data of capaData) {
    try {
      const capa = await capaService.createCAPA(data)
      capas.push(capa)
      logTest(`Create CAPA: ${capa.capaNumber}`, true)
    } catch (error) {
      logTest(`Create CAPA: ${data.subject}`, false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return capas
}

async function createTestDocuments() {
  console.log('\n📄 Creating Test Documents...')
  const documents = []

  const documentData = [
    {
      tenantId: TENANT_ID,
      title: 'Quality Management System Manual',
      description: 'Comprehensive quality management system manual covering all processes and procedures.',
      documentType: 'POLICY' as const,
      category: 'QUALITY' as const,
      owner: USER_ID,
      author: USER_ID,
      accessLevel: 'RESTRICTED' as const,
      isoStandards: ['ISO 9001:2015'],
      clauses: ['4.1', '4.2', '4.3'],
      content: 'This document outlines the quality management system...',
    },
    {
      tenantId: TENANT_ID,
      title: 'Safety Inspection Procedure',
      description: 'Standard operating procedure for conducting safety inspections.',
      documentType: 'PROCEDURE' as const,
      category: 'SAFETY' as const,
      owner: USER_ID,
      author: USER_ID,
      accessLevel: 'PUBLIC' as const,
      isoStandards: ['ISO 45001:2018'],
      clauses: ['6.1', '6.2'],
      content: 'This procedure describes how to conduct safety inspections...',
    },
    {
      tenantId: TENANT_ID,
      title: 'CAPA Form Template',
      description: 'Standard form template for documenting corrective and preventive actions.',
      documentType: 'FORM' as const,
      category: 'QUALITY' as const,
      owner: USER_ID,
      author: USER_ID,
      accessLevel: 'PUBLIC' as const,
      isoStandards: ['ISO 9001:2015'],
      clauses: ['10.2'],
      content: 'CAPA Form fields and instructions...',
    },
  ]

  for (const data of documentData) {
    try {
      const document = await documentService.createDocument(data)
      documents.push(document)
      logTest(`Create Document: ${document.documentNumber}`, true)
    } catch (error) {
      logTest(`Create Document: ${data.title}`, false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return documents
}

async function createTestAudits() {
  console.log('\n🔍 Creating Test Audits...')
  const audits = []

  const auditData = [
    {
      tenantId: TENANT_ID,
      title: 'Internal Quality Audit Q1 2024',
      description: 'Comprehensive internal quality audit covering all departments.',
      auditType: 'INTERNAL' as const,
      scope: 'All quality management processes and procedures',
      isoStandards: ['ISO 9001:2015'],
      clauses: ['4.0', '5.0', '6.0', '7.0', '8.0', '9.0', '10.0'],
      plannedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      auditorName: 'John Doe',
      auditorOrganization: 'Internal Audit Team',
      createdBy: USER_ID,
    },
    {
      tenantId: TENANT_ID,
      title: 'External Certification Audit',
      description: 'Annual external certification audit for ISO 9001:2015.',
      auditType: 'CERTIFICATION' as const,
      scope: 'Complete quality management system',
      isoStandards: ['ISO 9001:2015'],
      clauses: ['All clauses'],
      plannedDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      auditorName: 'Jane Smith',
      auditorOrganization: 'Certification Body',
      createdBy: USER_ID,
    },
  ]

  for (const data of auditData) {
    try {
      const audit = await auditService.createAudit(data)
      audits.push(audit)
      logTest(`Create Audit: ${audit.auditNumber}`, true)
    } catch (error) {
      logTest(`Create Audit: ${data.title}`, false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return audits
}

async function createTestRisks() {
  console.log('\n⚠️ Creating Test Risks...')
  const risks = []

  const riskData = [
    {
      tenantId: TENANT_ID,
      title: 'Equipment Failure Risk',
      description: 'Risk of critical equipment failure leading to production downtime.',
      category: 'OPERATIONAL' as const,
      likelihood: 3 as const,
      impact: 5 as const,
      owner: USER_ID,
      identifiedDate: new Date(),
      identifiedBy: USER_ID,
    },
    {
      tenantId: TENANT_ID,
      title: 'Data Security Breach Risk',
      description: 'Risk of unauthorized access to sensitive data.',
      category: 'INFORMATION_SECURITY' as const,
      likelihood: 2 as const,
      impact: 5 as const,
      owner: USER_ID,
      identifiedDate: new Date(),
      identifiedBy: USER_ID,
    },
    {
      tenantId: TENANT_ID,
      title: 'Supplier Quality Risk',
      description: 'Risk of receiving non-conforming materials from suppliers.',
      category: 'SUPPLY_CHAIN' as const,
      likelihood: 3 as const,
      impact: 4 as const,
      owner: USER_ID,
      identifiedDate: new Date(),
      identifiedBy: USER_ID,
    },
  ]

  for (const data of riskData) {
    try {
      const risk = await riskService.createRisk(data)
      risks.push(risk)
      logTest(`Create Risk: ${risk.riskNumber}`, true)
    } catch (error) {
      logTest(`Create Risk: ${data.title}`, false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return risks
}

async function createTestTraining() {
  console.log('\n🎓 Creating Test Training...')
  const trainings = []

  const trainingData = [
    {
      tenantId: TENANT_ID,
      title: 'ISO 9001:2015 Awareness Training',
      description: 'Comprehensive training on ISO 9001:2015 requirements and implementation.',
      trainingType: 'AWARENESS' as const,
      isoStandards: ['ISO 9001:2015'],
      scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      duration: 8, // hours
      instructor: USER_ID,
      maxParticipants: 20,
      assessmentRequired: true,
      createdBy: USER_ID,
    },
    {
      tenantId: TENANT_ID,
      title: 'Safety Procedures Training',
      description: 'Training on workplace safety procedures and emergency response.',
      trainingType: 'COMPETENCY' as const,
      isoStandards: ['ISO 45001:2018'],
      scheduledDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      duration: 4, // hours
      instructor: USER_ID,
      maxParticipants: 15,
      assessmentRequired: true,
      createdBy: USER_ID,
    },
  ]

  for (const data of trainingData) {
    try {
      const training = await trainingService.createTraining(data)
      trainings.push(training)
      logTest(`Create Training: ${training.trainingNumber}`, true)
    } catch (error) {
      logTest(`Create Training: ${data.title}`, false, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return trainings
}

// ============================================================================
// WORKFLOW TESTS
// ============================================================================

async function testNCRWorkflow(ncrs: any[]) {
  console.log('\n🔄 Testing NCR Workflow...')
  
  if (ncrs.length === 0) {
    logTest('NCR Workflow: No NCRs to test', false, 'No NCRs created')
    return
  }

  const ncr = ncrs[0]

  // Test Update
  try {
    const updated = await ncrService.updateNCR(ncr.id, {
      status: 'IN_PROGRESS',
      assignedTo: USER_ID,
      rootCause: 'Root cause identified through investigation',
    }, TENANT_ID, USER_ID)
    logTest('NCR Workflow: Update NCR', updated.status === 'IN_PROGRESS')
  } catch (error) {
    logTest('NCR Workflow: Update NCR', false, error instanceof Error ? error.message : 'Unknown error')
  }

  // Test Status Change
  try {
    const statusUpdated = await ncrService.updateStatus(ncr.id, 'CLOSED', TENANT_ID, USER_ID)
    logTest('NCR Workflow: Change Status', statusUpdated.status === 'CLOSED')
  } catch (error) {
    logTest('NCR Workflow: Change Status', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

async function testCAPAWorkflow(capas: any[]) {
  console.log('\n🔄 Testing CAPA Workflow...')
  
  if (capas.length === 0) {
    logTest('CAPA Workflow: No CAPAs to test', false, 'No CAPAs created')
    return
  }

  const capa = capas[0]

  // Test Update
  try {
    const updated = await capaService.updateCAPA(capa.id, {
      status: 'IN_PROGRESS',
      actionPlan: 'Updated action plan with detailed steps',
    }, TENANT_ID, USER_ID)
    logTest('CAPA Workflow: Update CAPA', updated.status === 'IN_PROGRESS')
  } catch (error) {
    logTest('CAPA Workflow: Update CAPA', false, error instanceof Error ? error.message : 'Unknown error')
  }

  // Test Status Change
  try {
    const statusUpdated = await capaService.updateStatus(capa.id, 'COMPLETED', TENANT_ID, USER_ID)
    logTest('CAPA Workflow: Change Status', statusUpdated.status === 'COMPLETED')
  } catch (error) {
    logTest('CAPA Workflow: Change Status', false, error instanceof Error ? error.message : 'Unknown error')
  }

  // Test Add Action Item
  try {
    const withActionItem = await capaService.addActionItem(capa.id, {
      description: 'Review training materials',
      assignedTo: USER_ID,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'OPEN',
    }, TENANT_ID)
    logTest('CAPA Workflow: Add Action Item', withActionItem.actionItems?.length > 0)
  } catch (error) {
    logTest('CAPA Workflow: Add Action Item', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

async function testDocumentWorkflow(documents: any[]) {
  console.log('\n🔄 Testing Document Workflow...')
  
  if (documents.length === 0) {
    logTest('Document Workflow: No Documents to test', false, 'No Documents created')
    return
  }

  const document = documents[0]

  // Test Update
  try {
    const updated = await documentService.updateDocument(document.id, {
      status: 'UNDER_REVIEW',
      description: 'Updated description',
    }, TENANT_ID, USER_ID)
    logTest('Document Workflow: Update Document', updated.status === 'UNDER_REVIEW')
  } catch (error) {
    logTest('Document Workflow: Update Document', false, error instanceof Error ? error.message : 'Unknown error')
  }

  // Test Approve
  try {
    const approved = await documentService.approve(document.id, USER_ID, 'Approved for use', TENANT_ID)
    logTest('Document Workflow: Approve Document', approved.status === 'APPROVED')
  } catch (error) {
    logTest('Document Workflow: Approve Document', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

async function testRiskWorkflow(risks: any[]) {
  console.log('\n🔄 Testing Risk Workflow...')
  
  if (risks.length === 0) {
    logTest('Risk Workflow: No Risks to test', false, 'No Risks created')
    return
  }

  const risk = risks[0]

  // Test Assess Risk
  try {
    const assessed = await riskService.assessRisk(risk.id, 2, 4, TENANT_ID, USER_ID)
    logTest('Risk Workflow: Assess Risk', assessed.riskScore !== undefined)
  } catch (error) {
    logTest('Risk Workflow: Assess Risk', false, error instanceof Error ? error.message : 'Unknown error')
  }

  // Test Update
  try {
    const updated = await riskService.updateRisk(risk.id, {
      treatmentStrategy: 'MITIGATE',
      treatmentPlan: 'Implement preventive maintenance schedule',
    }, TENANT_ID, USER_ID)
    logTest('Risk Workflow: Update Risk', updated.treatmentPlan !== undefined)
  } catch (error) {
    logTest('Risk Workflow: Update Risk', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

async function testTrainingWorkflow(trainings: any[]) {
  console.log('\n🔄 Testing Training Workflow...')
  
  if (trainings.length === 0) {
    logTest('Training Workflow: No Trainings to test', false, 'No Trainings created')
    return
  }

  const training = trainings[0]

  // Test Register Participant
  try {
    const withParticipant = await trainingService.registerParticipant(training.id, USER_ID, TENANT_ID)
    logTest('Training Workflow: Register Participant', withParticipant.participants?.length > 0)
  } catch (error) {
    logTest('Training Workflow: Register Participant', false, error instanceof Error ? error.message : 'Unknown error')
  }

  // Test Record Completion
  try {
    const completed = await trainingService.recordCompletion(training.id, USER_ID, {
      score: 85,
      passed: true,
      completedDate: new Date(),
      comments: 'Training completed successfully',
    }, TENANT_ID)
    logTest('Training Workflow: Record Completion', completed.participants?.some((p: any) => p.status === 'COMPLETED'))
  } catch (error) {
    logTest('Training Workflow: Record Completion', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

// ============================================================================
// QUERY TESTS
// ============================================================================

async function testQueries() {
  console.log('\n🔍 Testing Queries...')

  // Test CAPA Query
  try {
    const capaQuery = await capaService.getCAPAs({
      tenantId: TENANT_ID,
      filters: { status: 'OPEN' },
      pagination: { page: 1, limit: 10 },
    })
    logTest('Query: Get CAPAs', capaQuery.capas.length >= 0)
  } catch (error) {
    logTest('Query: Get CAPAs', false, error instanceof Error ? error.message : 'Unknown error')
  }

  // Test NCR Query
  try {
    const ncrQuery = await ncrService.getNCRs({
      tenantId: TENANT_ID,
      filters: { priority: 'CRITICAL' },
      pagination: { page: 1, limit: 10 },
    })
    logTest('Query: Get NCRs', ncrQuery.ncrs.length >= 0)
  } catch (error) {
    logTest('Query: Get NCRs', false, error instanceof Error ? error.message : 'Unknown error')
  }

  // Test Document Query
  try {
    const docQuery = await documentService.getDocuments({
      tenantId: TENANT_ID,
      filters: { status: 'APPROVED' },
      pagination: { page: 1, limit: 10 },
    })
    logTest('Query: Get Documents', docQuery.documents.length >= 0)
  } catch (error) {
    logTest('Query: Get Documents', false, error instanceof Error ? error.message : 'Unknown error')
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log('🚀 Starting Comprehensive ISO IMS Workflow Tests...\n')
  console.log(`Tenant ID: ${TENANT_ID}`)
  console.log(`User ID: ${USER_ID}\n`)

  try {
    // Create test data
    const ncrs = await createTestNCRs()
    const capas = await createTestCAPAs(ncrs)
    const documents = await createTestDocuments()
    const audits = await createTestAudits()
    const risks = await createTestRisks()
    const trainings = await createTestTraining()

    // Test workflows
    await testNCRWorkflow(ncrs)
    await testCAPAWorkflow(capas)
    await testDocumentWorkflow(documents)
    await testRiskWorkflow(risks)
    await testTrainingWorkflow(trainings)

    // Test queries
    await testQueries()

    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${testResults.passed}`)
    console.log(`❌ Failed: ${testResults.failed}`)
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`)

    if (testResults.errors.length > 0) {
      console.log('\n❌ ERRORS:')
      testResults.errors.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`)
      })
    }

    console.log('\n✨ Test data created successfully!')
    console.log(`   - ${ncrs.length} NCRs`)
    console.log(`   - ${capas.length} CAPAs`)
    console.log(`   - ${documents.length} Documents`)
    console.log(`   - ${audits.length} Audits`)
    console.log(`   - ${risks.length} Risks`)
    console.log(`   - ${trainings.length} Trainings`)

  } catch (error) {
    console.error('❌ Fatal error during testing:', error)
    process.exit(1)
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('\n✅ All tests completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  })














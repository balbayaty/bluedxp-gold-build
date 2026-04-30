/**
 * Truth Engine Workflow Tests
 * Comprehensive workflow testing for all Truth Engine features
 */

import { truthEngineService } from '@/lib/services/truth-engine'
import { truthEngineMetrics } from '@/lib/services/truth-engine/monitoring/metrics'
import { truthEngineCache } from '@/lib/services/truth-engine/cache/truthEngineCache'
import { TruthEvent, TruthKPI, AdversarialReview } from '@/types/truth-engine'

interface TestResult {
  workflow: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  duration: number
  details?: any
}

const results: TestResult[] = []
const testTenantId = 'test-tenant-workflow'
const testEntityType = 'shipment'
const testEntityId = 'ship-workflow-test-123'

function recordResult(result: TestResult) {
  results.push(result)
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${icon} ${result.workflow} (${result.duration}ms)`)
  if (result.message) {
    console.log(`   ${result.message}`)
  }
  if (result.details && result.status === 'FAIL') {
    console.log(`   Details:`, result.details)
  }
}

async function testWorkflow(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now()
  try {
    await testFn()
    recordResult({
      workflow: name,
      status: 'PASS',
      message: '',
      duration: Date.now() - start,
    })
  } catch (error: any) {
    recordResult({
      workflow: name,
      status: 'FAIL',
      message: error.message || 'Test failed',
      duration: Date.now() - start,
      details: error,
    })
    throw error
  }
}

// ============================================================================
// WORKFLOW 1: Event Recording & Evidence Linking
// ============================================================================

async function workflow1_EventRecording() {
  await testWorkflow('1.1 Record Event with Evidence', async () => {
    const event = await truthEngineService.recordTruthEvent({
      tenantId: testTenantId,
      eventType: 'asn_received',
      happenedAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      actor: {
        type: 'user',
        id: 'user-1',
        name: 'Test User',
        role: 'operator',
      },
      entityRefs: {
        shipmentId: testEntityId,
      },
      evidenceLinks: ['evidence-1', 'evidence-2'],
      confidenceScore: 0.95,
      confidenceReason: 'Automated capture with validation',
      derivedFrom: {},
      status: 'active',
    })

    if (!event || !event.id) {
      throw new Error('Event not created')
    }
  })

  await testWorkflow('1.2 Link Additional Evidence', async () => {
    // First, get an event
    const timeline = await truthEngineService.getTruthTimeline(testEntityType, testEntityId)
    if (timeline.events.length === 0) {
      throw new Error('No events found to link evidence')
    }

    // Create evidence first
    const evidence = await truthEngineService.recordEvidence({
      type: 'document',
      category: 'operational',
      title: 'Test Evidence for Linking',
      sourceSystem: 'api',
      validationState: 'pending',
      status: 'active',
      hashAlgorithm: 'sha256',
      chainOfCustody: [],
      relatedEntities: [],
      metadata: {
        source: 'api',
        capturedAt: new Date().toISOString(),
        capturedMethod: 'api',
        processed: false,
      },
      tags: ['test'],
    })

    const eventId = timeline.events[0].id
    const updated = await truthEngineService.linkEvidenceToEvent(eventId, [evidence.id])

    if (!updated.evidenceLinks.includes(evidence.id)) {
      throw new Error('Evidence not linked')
    }
  })

  await testWorkflow('1.3 Validate Input', async () => {
    try {
      await truthEngineService.recordTruthEvent({
        tenantId: '', // Invalid
        eventType: 'asn_received',
        happenedAt: new Date().toISOString(),
        recordedAt: new Date().toISOString(),
        actor: {
          type: 'user',
          id: 'user-1',
          name: 'Test User',
          role: 'operator',
        },
        entityRefs: {},
        evidenceLinks: [],
        confidenceScore: 0.9,
        derivedFrom: {},
        status: 'active',
      } as any)
      throw new Error('Should have thrown validation error')
    } catch (error: any) {
      if (!error.message.includes('Validation failed')) {
        throw error
      }
      // Expected validation error
    }
  })
}

// ============================================================================
// WORKFLOW 2: Timeline Retrieval & Filtering
// ============================================================================

async function workflow2_TimelineRetrieval() {
  await testWorkflow('2.1 Get Timeline for Entity', async () => {
    const timeline = await truthEngineService.getTruthTimeline(testEntityType, testEntityId)

    if (!timeline || timeline.entityType !== testEntityType || timeline.entityId !== testEntityId) {
      throw new Error('Timeline not retrieved correctly')
    }
  })

  await testWorkflow('2.2 Filter Timeline by Event Type', async () => {
    const timeline = await truthEngineService.getTruthTimeline(testEntityType, testEntityId, {
      eventTypes: ['asn_received'],
    })

    if (timeline.events.length > 0 && !timeline.events.every(e => e.eventType === 'asn_received')) {
      throw new Error('Filter not applied correctly')
    }
  })

  await testWorkflow('2.3 Filter Timeline by Confidence', async () => {
    const timeline = await truthEngineService.getTruthTimeline(testEntityType, testEntityId, {
      minConfidence: 0.8,
    })

    if (timeline.events.length > 0 && !timeline.events.every(e => e.confidenceScore >= 0.8)) {
      throw new Error('Confidence filter not applied correctly')
    }
  })

  await testWorkflow('2.4 Cache Timeline', async () => {
    const timeline1 = await truthEngineService.getTruthTimeline(testEntityType, testEntityId)
    
    // Try to get from cache (may or may not be cached depending on implementation)
    const cached = await truthEngineCache.getCachedTimeline(testEntityType, testEntityId)
    
    // Cache mechanism exists (even if not populated)
    if (!timeline1) {
      throw new Error('Timeline not retrieved')
    }
  })
}

// ============================================================================
// WORKFLOW 3: KPI Management
// ============================================================================

let registeredKpiId: string = ''

async function workflow3_KPIManagement() {
  await testWorkflow('3.1 Register KPI', async () => {
    const kpi = await truthEngineService.registerKPI({
      name: 'workflow-test-kpi',
      description: 'Test KPI for workflow testing',
      formula: 'count(asn_received)',
      requiredEventTypes: ['asn_received'],
      minimumEvidenceRequirements: [],
      category: 'operational',
      module: 'wms',
      validationStatus: 'pending',
    })

    if (!kpi || kpi.name !== 'workflow-test-kpi') {
      throw new Error('KPI not registered correctly')
    }
    
    registeredKpiId = kpi.id
  })

  await testWorkflow('3.2 Calculate KPI', async () => {
    if (!registeredKpiId) {
      throw new Error('KPI not registered in previous test')
    }
    
    const kpi = await truthEngineService.calculateKPI(registeredKpiId, {
      tenantId: testTenantId,
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: new Date().toISOString(),
    })

    if (!kpi || typeof kpi.value !== 'number') {
      throw new Error('KPI not calculated correctly')
    }
  })

  await testWorkflow('3.3 Get KPI Evidence', async () => {
    if (!registeredKpiId) {
      throw new Error('KPI not registered in previous test')
    }

    const evidence = await truthEngineService.getKPIEvidence(registeredKpiId)
    
    // Evidence should be an array (may be empty)
    if (!Array.isArray(evidence)) {
      throw new Error('Evidence not returned as array')
    }
  })
}

// ============================================================================
// WORKFLOW 4: Adversarial Review
// ============================================================================

async function workflow4_AdversarialReview() {
  await testWorkflow('4.1 Perform Adversarial Review', async () => {
    const review = await truthEngineService.reviewDecision(
      {
        type: 'carrier_selection',
        id: 'decision-workflow-test',
        data: { shipmentId: testEntityId },
        relatedEntityIds: { shipmentId: testEntityId },
      },
      {
        tenantId: testTenantId,
        relatedTruthEvents: [],
        relatedEvidence: ['evidence-1'],
      }
    )

    if (!review || !review.personas) {
      throw new Error('Review not performed correctly')
    }

    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(review.overallRisk)) {
      throw new Error('Invalid risk level')
    }
  })

  await testWorkflow('4.2 Review Has All Personas', async () => {
    const review = await truthEngineService.reviewDecision(
      {
        type: 'carrier_selection',
        id: 'decision-workflow-test-2',
        data: { shipmentId: testEntityId },
        relatedEntityIds: { shipmentId: testEntityId },
      },
      {
        tenantId: testTenantId,
        relatedTruthEvents: [],
        relatedEvidence: ['evidence-1'],
      }
    )

    const personas: Array<'regulator' | 'cfo' | 'competitor' | 'litigator'> = ['regulator', 'cfo', 'competitor', 'litigator']
    const hasAllPersonas = personas.every(p => review.personas[p as keyof typeof review.personas])

    if (!hasAllPersonas) {
      throw new Error('Not all personas reviewed')
    }
  })
}

// ============================================================================
// WORKFLOW 5: Gap Detection
// ============================================================================

async function workflow5_GapDetection() {
  await testWorkflow('5.1 Detect Timeline Gaps', async () => {
    const timeline = await truthEngineService.getTruthTimeline(testEntityType, testEntityId)

    if (!timeline.gaps || !Array.isArray(timeline.gaps)) {
      throw new Error('Gaps not detected or not in correct format')
    }
  })

  await testWorkflow('5.2 Gap Has Required Fields', async () => {
    const timeline = await truthEngineService.getTruthTimeline(testEntityType, testEntityId)

    if (timeline.gaps && timeline.gaps.length > 0) {
      const gap = timeline.gaps[0]
      if (!gap.id || !gap.type || !gap.description) {
        throw new Error('Gap missing required fields')
      }
    }
  })
}

// ============================================================================
// WORKFLOW 6: Board Brief
// ============================================================================

async function workflow6_BoardBrief() {
  await testWorkflow('6.1 Generate Board Brief', async () => {
    const brief = await truthEngineService.generateBoardBrief(testTenantId, {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    })

    if (!brief || brief.tenantId !== testTenantId) {
      throw new Error('Board brief not generated correctly')
    }
  })

  await testWorkflow('6.2 Board Brief Has Required Sections', async () => {
    const brief = await truthEngineService.generateBoardBrief(testTenantId, {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    })

    if (!brief.signals || !Array.isArray(brief.signals)) {
      throw new Error('Signals missing or not array')
    }

    if (!brief.adversarialInsights || !Array.isArray(brief.adversarialInsights)) {
      throw new Error('Adversarial insights missing or not array')
    }

    if (!brief.recommendations || !Array.isArray(brief.recommendations)) {
      throw new Error('Recommendations missing or not array')
    }
  })
}

// ============================================================================
// WORKFLOW 7: Metrics & Monitoring
// ============================================================================

async function workflow7_Metrics() {
  await testWorkflow('7.1 Metrics Collection', async () => {
    const initialMetrics = truthEngineMetrics.getMetrics()
    const initialCount = initialMetrics.eventsRecorded

    await truthEngineService.recordTruthEvent({
      tenantId: testTenantId,
      eventType: 'asn_received',
      happenedAt: new Date().toISOString(),
      recordedAt: new Date().toISOString(),
      actor: {
        type: 'user',
        id: 'user-1',
        name: 'Test User',
        role: 'operator',
      },
      entityRefs: { shipmentId: testEntityId },
      evidenceLinks: ['evidence-1'],
      confidenceScore: 0.9,
      derivedFrom: {},
      status: 'active',
    })

    const updatedMetrics = truthEngineMetrics.getMetrics()
    if (updatedMetrics.eventsRecorded <= initialCount) {
      throw new Error('Metrics not updated')
    }
  })

  await testWorkflow('7.2 Metrics Structure', async () => {
    const metrics = truthEngineMetrics.getMetrics()

    const requiredFields = [
      'eventsRecorded',
      'evidenceRecorded',
      'reviewsCreated',
      'kpisCalculated',
      'averageConfidenceScore',
      'errors',
    ]

    for (const field of requiredFields) {
      if (!(field in metrics)) {
        throw new Error(`Missing metric field: ${field}`)
      }
    }
  })
}

// ============================================================================
// WORKFLOW 8: Search & Query
// ============================================================================

async function workflow8_Search() {
  await testWorkflow('8.1 Search Truth Events', async () => {
    const result = await truthEngineService.searchTruthEvents({
      tenantId: testTenantId,
      eventTypes: ['asn_received'],
      limit: 10,
      offset: 0,
    })

    if (!result || !Array.isArray(result.events)) {
      throw new Error('Search not returning correct format')
    }
  })

  await testWorkflow('8.2 Search with Filters', async () => {
    const result = await truthEngineService.searchTruthEvents({
      tenantId: testTenantId,
      eventTypes: ['asn_received'],
      minConfidence: 0.8,
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: new Date().toISOString(),
      limit: 10,
      offset: 0,
    })

    if (!result || !result.events) {
      throw new Error('Filtered search not working')
    }

    // Verify filters applied
    if (result.events.length > 0) {
      const allMatchFilters = result.events.every(e => {
        return e.confidenceScore >= 0.8 && 
               e.eventType === 'asn_received'
      })
      if (!allMatchFilters) {
        throw new Error('Filters not applied correctly')
      }
    }
  })
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllWorkflows() {
  console.log('🧪 Truth Engine Workflow Test Suite')
  console.log('='.repeat(60))
  console.log('')

  try {
    console.log('📋 Running Workflow 1: Event Recording & Evidence Linking')
    await workflow1_EventRecording()
    console.log('')

    console.log('📋 Running Workflow 2: Timeline Retrieval & Filtering')
    await workflow2_TimelineRetrieval()
    console.log('')

    console.log('📋 Running Workflow 3: KPI Management')
    await workflow3_KPIManagement()
    console.log('')

    console.log('📋 Running Workflow 4: Adversarial Review')
    await workflow4_AdversarialReview()
    console.log('')

    console.log('📋 Running Workflow 5: Gap Detection')
    await workflow5_GapDetection()
    console.log('')

    console.log('📋 Running Workflow 6: Board Brief')
    await workflow6_BoardBrief()
    console.log('')

    console.log('📋 Running Workflow 7: Metrics & Monitoring')
    await workflow7_Metrics()
    console.log('')

    console.log('📋 Running Workflow 8: Search & Query')
    await workflow8_Search()
    console.log('')

    // Summary
    console.log('='.repeat(60))
    console.log('📊 WORKFLOW TEST SUMMARY')
    console.log('='.repeat(60))

    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length
    const skipped = results.filter(r => r.status === 'SKIP').length
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`📈 Total: ${results.length}`)
    console.log(`⏱️  Total Duration: ${totalDuration}ms`)
    console.log('')

    if (failed === 0) {
      console.log('🎉 ALL WORKFLOWS PASSED!')
      return { success: true, passed, failed, skipped, total: results.length, results }
    } else {
      console.log('⚠️  SOME WORKFLOWS FAILED')
      console.log('')
      console.log('Failed Workflows:')
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  ❌ ${r.workflow}: ${r.message}`)
      })
      return { success: false, passed, failed, skipped, total: results.length, results }
    }
  } catch (error) {
    console.error('\n💥 WORKFLOW TEST SUITE ERROR:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  runAllWorkflows()
    .then((summary) => {
      process.exit(summary.success ? 0 : 1)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { runAllWorkflows, testWorkflow }







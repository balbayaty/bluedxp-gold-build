/**
 * Comprehensive Truth Engine Test Script
 * Tests all functionality, integrations, and workflows
 */

import { truthEngineService } from '../lib/services/truth-engine/truthEngineService'
import { truthSDK } from '../lib/services/truth-engine/sdk'
import { initializeTruthEngine } from '../lib/services/truth-engine/initialize'
import { initializeEcosystemIntegration } from '../lib/services/truth-engine/integrations/ecosystemIntegrationService'
import { eventBus } from '../lib/services/event-store'
import { DomainEvent } from '../types/cqrs'

const tenantId = 'test-tenant'

async function runTests() {
  console.log('🧪 Starting Comprehensive Truth Engine Tests...\n')

  let passed = 0
  let failed = 0

  const test = (name: string, fn: () => Promise<void> | void) => {
    return async () => {
      try {
        await fn()
        console.log(`✅ ${name}`)
        passed++
      } catch (error: any) {
        console.error(`❌ ${name}: ${error.message}`)
        failed++
      }
    }
  }

  // Initialize
  console.log('📦 Initializing Truth Engine...')
  await initializeTruthEngine({
    tenantId,
    enableRealTimeClaims: true,
    enableEcosystemIntegration: true,
  })
  console.log('✅ Truth Engine initialized\n')

  // Test 1: Evidence Recording
  await test('Evidence Recording', async () => {
    const evidence = await truthSDK.recordEvidence({
      tenantId,
      type: 'document',
      sourceSystem: 'wms',
      title: 'Test Document',
      storageRef: 's3://bucket/test.pdf',
    })
    if (!evidence || !evidence.id) throw new Error('Evidence not recorded')
  })()

  // Test 2: Truth Event Recording
  let testEventId: string
  await test('Truth Event Recording', async () => {
    const event = await truthSDK.recordTruthEvent({
      tenantId,
      eventType: 'ENTITY_CREATED',
      happenedAt: new Date(),
      recordedAt: new Date(),
      actor: {
        type: 'user',
        id: 'user-123',
        name: 'Test User',
      },
      entityRefs: {
        shipmentId: 'shipment-123',
      },
      confidenceScore: 0.95,
    })
    if (!event || !event.id) throw new Error('Event not recorded')
    testEventId = event.id
  })()

  // Test 3: Timeline Retrieval
  await test('Timeline Retrieval', async () => {
    const timeline = await truthEngineService.getTruthTimeline(
      'shipment',
      'shipment-123',
      {},
      tenantId
    )
    if (!timeline || !timeline.events) throw new Error('Timeline not retrieved')
  })()

  // Test 4: KPI Registration
  await test('KPI Registration', async () => {
    const kpi = await truthEngineService.registerKPI({
      tenantId,
      name: 'test-kpi',
      description: 'Test KPI',
      formula: 'SUM(events)',
      entityType: 'shipment',
      evidenceRequired: true,
    })
    if (!kpi || !kpi.name) throw new Error('KPI not registered')
  })()

  // Test 5: KPI Calculation
  await test('KPI Calculation', async () => {
    const kpi = await truthEngineService.calculateKPI(
      'test-kpi',
      'shipment-123',
      tenantId
    )
    if (!kpi || kpi.value === undefined) throw new Error('KPI not calculated')
  })()

  // Test 6: Adversarial Review
  await test('Adversarial Review', async () => {
    const review = await truthEngineService.reviewDecision(
      {
        type: 'approval',
        entityId: 'shipment-123',
        entityType: 'shipment',
        decision: 'approved',
        rationale: 'Test approval',
      },
      {
        tenantId,
        context: 'test-context',
      },
      tenantId
    )
    if (!review || !review.personas) throw new Error('Review not performed')
    if (review.personas.length !== 4) throw new Error('Expected 4 personas')
  })()

  // Test 7: Board Brief
  await test('Board Brief Generation', async () => {
    const brief = await truthEngineService.generateBoardBrief(
      tenantId,
      { timeRange: '30d' }
    )
    if (!brief || !brief.signals) throw new Error('Board brief not generated')
  })()

  // Test 8: Event Bus Integration
  await test('Event Bus Integration', async () => {
    const integration = initializeEcosystemIntegration(tenantId)
    if (!integration) throw new Error('Integration not initialized')

    // Publish test event
    const testEvent: DomainEvent = {
      id: 'test-event-123',
      type: 'wms.inventory.updated',
      aggregateId: 'warehouse-123',
      aggregateType: 'warehouse',
      version: 1,
      timestamp: new Date().toISOString(),
      metadata: {},
      payload: {
        warehouseId: 'warehouse-123',
      },
    }

    await eventBus.publish(testEvent)
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 200))

    // Verify truth event was created
    const timeline = await truthEngineService.getTruthTimeline(
      'warehouse',
      'warehouse-123',
      {},
      tenantId
    )
    if (timeline.events.length === 0) throw new Error('Event not captured')
  })()

  // Test 9: Search
  await test('Event Search', async () => {
    const result = await truthEngineService.searchTruthEvents({
      tenantId,
      eventTypes: ['ENTITY_CREATED'],
      limit: 10,
      offset: 0,
    })
    if (!result || !result.events) throw new Error('Search failed')
  })()

  // Test 10: Gap Detection
  await test('Gap Detection', async () => {
    const timeline = await truthEngineService.getTruthTimeline(
      'shipment',
      'shipment-123',
      {},
      tenantId
    )
    if (!timeline.gaps) throw new Error('Gap detection failed')
  })()

  // Summary
  console.log(`\n📊 Test Results:`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

  if (failed === 0) {
    console.log('\n🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed')
    process.exit(1)
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})






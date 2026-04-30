/**
 * Truth Engine API Endpoint Tests
 * Test all API routes for Truth Engine
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'

interface APITestResult {
  endpoint: string
  method: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  statusCode?: number
  message: string
  duration: number
  response?: any
}

const results: APITestResult[] = []
const testTenantId = 'test-tenant-api'
const testEntityType = 'shipment'
const testEntityId = 'ship-api-test-123'

function recordResult(result: APITestResult) {
  results.push(result)
  const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${icon} ${result.method} ${result.endpoint} (${result.duration}ms)`)
  if (result.message) {
    console.log(`   ${result.message}`)
  }
  if (result.statusCode) {
    console.log(`   Status: ${result.statusCode}`)
  }
}

async function testAPI(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  expectedStatus: number = 200
): Promise<void> {
  const start = Date.now()
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    const data = await response.json().catch(() => ({}))

    const duration = Date.now() - start

    if (response.status === expectedStatus) {
      recordResult({
        endpoint,
        method,
        status: 'PASS',
        statusCode: response.status,
        message: 'Request successful',
        duration,
        response: data,
      })
    } else {
      recordResult({
        endpoint,
        method,
        status: 'FAIL',
        statusCode: response.status,
        message: `Expected ${expectedStatus}, got ${response.status}`,
        duration,
        response: data,
      })
      throw new Error(`Unexpected status code: ${response.status}`)
    }
  } catch (error: any) {
    const duration = Date.now() - start
    recordResult({
      endpoint,
      method,
      status: 'FAIL',
      message: error.message || 'Request failed',
      duration,
    })
    throw error
  }
}

// ============================================================================
// API TESTS
// ============================================================================

async function testEventsAPI() {
  console.log('\n📋 Testing Events API')
  console.log('-'.repeat(60))

  // Test POST - Record event
  await testAPI(
    '/api/truth-engine/events',
    'POST',
    {
      event: {
        tenantId: testTenantId,
        eventType: 'shipment.created',
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
        evidenceLinks: ['evidence-1'],
        confidenceScore: 0.95,
      },
      tenantId: testTenantId,
    },
    200
  )

  // Test GET - Get timeline
  await testAPI(
    `/api/truth-engine/events?tenantId=${testTenantId}&entityType=${testEntityType}&entityId=${testEntityId}`,
    'GET',
    undefined,
    200
  )

  // Test GET - Search events
  await testAPI(
    `/api/truth-engine/events?tenantId=${testTenantId}&limit=10&offset=0`,
    'GET',
    undefined,
    200
  )

  // Test validation - should fail
  try {
    await testAPI(
      '/api/truth-engine/events',
      'POST',
      {
        event: {
          tenantId: '', // Invalid
          eventType: 'shipment.created',
        },
        tenantId: '',
      },
      400
    )
  } catch (error) {
    // Expected to fail validation
  }
}

async function testReviewsAPI() {
  console.log('\n📋 Testing Reviews API')
  console.log('-'.repeat(60))

  // Test POST - Create review
  await testAPI(
    '/api/truth-engine/reviews',
    'POST',
    {
      decision: {
        type: 'approve_shipment',
        id: 'decision-api-test',
        data: { shipmentId: testEntityId },
      },
      context: {
        tenantId: testTenantId,
        relatedTruthEvents: [],
        relatedEvidence: ['evidence-1'],
      },
    },
    200
  )

  // Test GET - Get review
  await testAPI(
    `/api/truth-engine/reviews?decisionId=decision-api-test`,
    'GET',
    undefined,
    200
  )
}

async function testKPIsAPI() {
  console.log('\n📋 Testing KPIs API')
  console.log('-'.repeat(60))

  // Test POST - Register KPI
  await testAPI(
    '/api/truth-engine/kpis',
    'POST',
    {
      kpi: {
        name: 'api-test-kpi',
        description: 'Test KPI for API testing',
        formula: 'count(shipment.created)',
        requiredEventTypes: ['shipment.created'],
        minimumEvidenceRequirements: [],
        category: 'operations',
        module: 'wms',
      },
    },
    200
  )

  // Test POST - Calculate KPI
  await testAPI(
    '/api/truth-engine/kpis/calculate',
    'POST',
    {
      kpiName: 'api-test-kpi',
      filters: {
        tenantId: testTenantId,
        dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        dateTo: new Date().toISOString(),
      },
    },
    200
  )

  // Test GET - Get KPI
  await testAPI(
    `/api/truth-engine/kpis?name=api-test-kpi`,
    'GET',
    undefined,
    200
  )
}

async function testBoardBriefAPI() {
  console.log('\n📋 Testing Board Brief API')
  console.log('-'.repeat(60))

  // Test GET - Generate board brief
  await testAPI(
    `/api/truth-engine/board-brief?tenantId=${testTenantId}&start=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&end=${new Date().toISOString()}`,
    'GET',
    undefined,
    200
  )
}

async function testExportAPI() {
  console.log('\n📋 Testing Export API')
  console.log('-'.repeat(60))

  // Test POST - Export JSON
  await testAPI(
    '/api/truth-engine/export',
    'POST',
    {
      entityType: testEntityType,
      entityId: testEntityId,
      format: 'json',
      timeline: {
        entityType: testEntityType,
        entityId: testEntityId,
        events: [],
        evidence: [],
        confidenceScore: 0.9,
        gaps: [],
      },
    },
    200
  )

  // Test POST - Export CSV
  await testAPI(
    '/api/truth-engine/export',
    'POST',
    {
      entityType: testEntityType,
      entityId: testEntityId,
      format: 'csv',
      timeline: {
        entityType: testEntityType,
        entityId: testEntityId,
        events: [
          {
            id: 'event-1',
            eventType: 'shipment.created',
            happenedAt: new Date().toISOString(),
            actor: { type: 'user', id: 'user-1', name: 'Test', role: 'operator' },
            entityRefs: {},
            evidenceLinks: [],
            confidenceScore: 0.9,
          },
        ],
        evidence: [],
        confidenceScore: 0.9,
        gaps: [],
      },
    },
    200
  )
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAPITests() {
  console.log('🧪 Truth Engine API Test Suite')
  console.log('='.repeat(60))
  console.log(`API Base URL: ${API_BASE_URL}`)
  console.log('')

  try {
    await testEventsAPI()
    await testReviewsAPI()
    await testKPIsAPI()
    await testBoardBriefAPI()
    await testExportAPI()

    // Summary
    console.log('')
    console.log('='.repeat(60))
    console.log('📊 API TEST SUMMARY')
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
      console.log('🎉 ALL API TESTS PASSED!')
      return { success: true, passed, failed, skipped, total: results.length, results }
    } else {
      console.log('⚠️  SOME API TESTS FAILED')
      console.log('')
      console.log('Failed Tests:')
      results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`  ❌ ${r.method} ${r.endpoint}: ${r.message}`)
      })
      return { success: false, passed, failed, skipped, total: results.length, results }
    }
  } catch (error) {
    console.error('\n💥 API TEST SUITE ERROR:', error)
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  runAPITests()
    .then((summary) => {
      process.exit(summary.success ? 0 : 1)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { runAPITests, testAPI }








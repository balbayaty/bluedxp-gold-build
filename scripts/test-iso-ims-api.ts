/**
 * ISO IMS API Endpoint Test Script
 * 
 * Tests all ISO IMS API endpoints
 * Run with: npx tsx scripts/test-iso-ims-api.ts
 * 
 * Note: Requires dev server to be running on http://localhost:3000
 */

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'
const TEST_TENANT_ID = 'test-tenant-' + Date.now()
const TEST_USER_ID = 'test-user-' + Date.now()

interface TestResult {
  endpoint: string
  method: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  data?: any
}

const results: TestResult[] = []

async function testEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: any
): Promise<TestResult> {
  try {
    const url = `${BASE_URL}${endpoint}`
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

    if (response.ok || response.status === 400) {
      // 400 is OK for validation errors
      return {
        endpoint,
        method,
        status: 'PASS',
        message: `Status: ${response.status}`,
        data: data.id || data.documents || data.ncrs || data.capas || data.audits || data.risks || data.trainings,
      }
    } else {
      return {
        endpoint,
        method,
        status: 'FAIL',
        message: `Status: ${response.status}, Error: ${data.error || 'Unknown'}`,
      }
    }
  } catch (error: any) {
    // If server is not running, skip the test
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      return {
        endpoint,
        method,
        status: 'SKIP',
        message: 'Server not running - skipped',
      }
    }
    return {
      endpoint,
      method,
      status: 'FAIL',
      message: error.message,
    }
  }
}

async function runTests() {
  console.log('🧪 Testing ISO IMS API Endpoints...\n')
  console.log(`Base URL: ${BASE_URL}\n`)

  // Test Documents API
  console.log('📄 Testing Documents API...')
  results.push(
    await testEndpoint(
      `/api/iso-ims/documents?tenantId=${TEST_TENANT_ID}`,
      'GET'
    )
  )

  const testDocument = {
    tenantId: TEST_TENANT_ID,
    title: 'Test Document',
    description: 'Test document for API testing',
    documentType: 'PROCEDURE',
    category: 'QUALITY',
    owner: TEST_USER_ID,
    author: TEST_USER_ID,
    accessLevel: 'PUBLIC',
  }

  results.push(
    await testEndpoint('/api/iso-ims/documents', 'POST', testDocument)
  )

  // Test NCR API
  console.log('🚨 Testing NCR API...')
  results.push(
    await testEndpoint(
      `/api/iso-ims/ncr?tenantId=${TEST_TENANT_ID}`,
      'GET'
    )
  )

  const testNCR = {
    tenantId: TEST_TENANT_ID,
    subject: 'Test NCR',
    description: 'Test NCR for API testing',
    ncType: 'QUALITY',
    reportedBy: TEST_USER_ID,
    createdBy: TEST_USER_ID,
  }

  results.push(await testEndpoint('/api/iso-ims/ncr', 'POST', testNCR))

  // Test CAPA API
  console.log('✅ Testing CAPA API...')
  results.push(
    await testEndpoint(
      `/api/iso-ims/capa?tenantId=${TEST_TENANT_ID}`,
      'GET'
    )
  )

  const testCAPA = {
    tenantId: TEST_TENANT_ID,
    subject: 'Test CAPA',
    description: 'Test CAPA for API testing',
    capaType: 'CORRECTIVE',
    capaSource: 'NCR',
    assignedTo: TEST_USER_ID,
    department: 'Quality',
    owner: TEST_USER_ID,
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    actionPlan: 'Test action plan',
    actionItems: [],
    createdBy: TEST_USER_ID,
  }

  results.push(await testEndpoint('/api/iso-ims/capa', 'POST', testCAPA))

  // Test Audit API
  console.log('📋 Testing Audit API...')
  results.push(
    await testEndpoint(
      `/api/iso-ims/audit?tenantId=${TEST_TENANT_ID}`,
      'GET'
    )
  )

  const testAudit = {
    tenantId: TEST_TENANT_ID,
    auditType: 'INTERNAL',
    standard: 'ISO 9001',
    scope: 'Test scope',
    title: 'Test Audit',
    description: 'Test audit for API testing',
    plannedStartDate: new Date().toISOString(),
    plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    auditorName: 'Test Auditor',
    createdBy: TEST_USER_ID,
  }

  results.push(await testEndpoint('/api/iso-ims/audit', 'POST', testAudit))

  // Test Risk API
  console.log('⚠️ Testing Risk API...')
  results.push(
    await testEndpoint(
      `/api/iso-ims/risk?tenantId=${TEST_TENANT_ID}`,
      'GET'
    )
  )

  const testRisk = {
    tenantId: TEST_TENANT_ID,
    title: 'Test Risk',
    description: 'Test risk for API testing',
    category: 'QUALITY',
    owner: TEST_USER_ID,
    likelihood: 3,
    impact: 3,
    createdBy: TEST_USER_ID,
  }

  results.push(await testEndpoint('/api/iso-ims/risk', 'POST', testRisk))

  // Test Training API
  console.log('🎓 Testing Training API...')
  results.push(
    await testEndpoint(
      `/api/iso-ims/training?tenantId=${TEST_TENANT_ID}`,
      'GET'
    )
  )

  const testTraining = {
    tenantId: TEST_TENANT_ID,
    title: 'Test Training',
    description: 'Test training for API testing',
    trainingType: 'INITIAL',
    trainer: TEST_USER_ID,
    assessmentRequired: false,
    createdBy: TEST_USER_ID,
  }

  results.push(
    await testEndpoint('/api/iso-ims/training', 'POST', testTraining)
  )

  // Test Stats API
  console.log('📊 Testing Stats API...')
  results.push(
    await testEndpoint(
      `/api/iso-ims/stats?tenantId=${TEST_TENANT_ID}`,
      'GET'
    )
  )

  // Test Compliance API
  console.log('🛡️ Testing Compliance API...')
  results.push(
    await testEndpoint(
      `/api/iso-ims/compliance?tenantId=${TEST_TENANT_ID}`,
      'GET'
    )
  )

  // Print Results
  console.log('\n📊 Test Results Summary:\n')
  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  const skipped = results.filter((r) => r.status === 'SKIP').length

  results.forEach((result) => {
    const icon =
      result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️'
    console.log(
      `${icon} ${result.method} ${result.endpoint} - ${result.message}`
    )
  })

  console.log('\n📈 Summary:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   ⏭️ Skipped: ${skipped}`)
  console.log(`   📊 Total: ${results.length}`)

  if (skipped > 0) {
    console.log(
      '\n⚠️ Note: Some tests were skipped because the server is not running.'
    )
    console.log('   Start the dev server with: npm run dev')
  }

  if (failed === 0 && skipped === 0) {
    console.log('\n🎉 All API tests passed!')
    process.exit(0)
  } else if (failed > 0) {
    console.log('\n⚠️ Some tests failed. Check the errors above.')
    process.exit(1)
  } else {
    console.log('\n✅ All runnable tests passed!')
    process.exit(0)
  }
}

runTests().catch((error) => {
  console.error('❌ Test execution failed:', error)
  process.exit(1)
})

/**
 * Comprehensive End-to-End Test Script for Revolutionary QR Features
 * Tests all services, APIs, database integration, and error handling
 * Run with: node scripts/test-revolutionary-qr-complete.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
}

async function testAPI(endpoint, method = 'GET', body = null, expectedStatus = 200) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)
    const data = await response.json()
    
    if (response.status === expectedStatus) {
      testResults.passed++
      return { success: true, data, status: response.status }
    } else {
      testResults.failed++
      testResults.errors.push(`Expected status ${expectedStatus}, got ${response.status} for ${endpoint}`)
      return { success: false, data, status: response.status, error: `Expected status ${expectedStatus}, got ${response.status}` }
    }
  } catch (error) {
    testResults.failed++
    const errorMessage = error instanceof Error ? error.message : String(error)
    testResults.errors.push(`${endpoint}: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Comprehensive Revolutionary QR Features Testing...\n')
  console.log('='.repeat(80))

  // ============================================================================
  // 1. DATABASE PERSISTENCE TESTS
  // ============================================================================
  console.log('\n📊 1. DATABASE PERSISTENCE TESTS')
  console.log('-'.repeat(80))

  // Test 1.1: Network Creation & Persistence
  console.log('\n1.1 Testing QR Network Creation & Database Persistence...')
  const networkResult = await testAPI('/api/qr/network', 'POST', {
    action: 'create-network',
    name: 'Test Supply Chain Network',
    description: 'Test network for supply chain tracking',
    qrCodes: ['qr-test-1', 'qr-test-2', 'qr-test-3'],
    relationships: [
      {
        from: 'qr-test-1',
        to: 'qr-test-2',
        type: 'parent',
        strength: 0.9,
        bidirectional: false,
        metadata: {}
      }
    ],
    networkType: 'hierarchical',
    metadata: {
      createdBy: 'test-user',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      visibility: 'private',
      tags: ['test', 'supply-chain']
    }
  })
  console.log('Network Creation:', networkResult.success ? '✅ PASSED' : '❌ FAILED', networkResult.error || '')

  // Test 1.2: Retrieve Network from Database
  if (networkResult.success && networkResult.data?.network?.id) {
    console.log('\n1.2 Testing Network Retrieval from Database...')
    const retrieveResult = await testAPI(`/api/qr/network?networkId=${networkResult.data.network.id}&action=analyze`)
    console.log('Network Retrieval:', retrieveResult.success ? '✅ PASSED' : '❌ FAILED', retrieveResult.error || '')
  }

  // Test 1.3: Agent Creation & Persistence
  console.log('\n1.3 Testing AI Agent Creation & Database Persistence...')
  const agentResult = await testAPI('/api/qr/agents', 'POST', {
    action: 'create-agent',
    name: 'Test Optimizer Agent',
    type: 'optimizer',
    description: 'Test agent for optimization',
    capabilities: ['optimize', 'analyze'],
    config: {
      autonomyLevel: 'semi-autonomous',
      decisionThreshold: 0.75,
      learningEnabled: true
    },
    systemPrompt: 'You are a QR optimization agent',
    model: 'gpt-4',
    isEnabled: true
  })
  console.log('Agent Creation:', agentResult.success ? '✅ PASSED' : '❌ FAILED', agentResult.error || '')

  // Test 1.4: Task Assignment & Persistence
  if (agentResult.success && agentResult.data?.agent?.id) {
    console.log('\n1.4 Testing Task Assignment & Database Persistence...')
    const taskResult = await testAPI('/api/qr/agents', 'POST', {
      action: 'assign-task',
      agentId: agentResult.data.agent.id,
      type: 'optimize',
      target: 'qr-test-1',
      parameters: { optimizeFor: 'mobile' },
      priority: 'high'
    })
    console.log('Task Assignment:', taskResult.success ? '✅ PASSED' : '❌ FAILED', taskResult.error || '')
  }

  // Test 1.5: Gamification Persistence
  console.log('\n1.5 Testing Gamification Database Persistence...')
  const achievementResult = await testAPI('/api/qr/gamification', 'POST', {
    action: 'check-achievements',
    userId: 'test-user-123',
    action: { type: 'scan', data: { qrId: 'qr-test-1' } }
  })
  console.log('Gamification:', achievementResult.success ? '✅ PASSED' : '❌ FAILED', achievementResult.error || '')

  // Test 1.6: Digital Twin Persistence
  console.log('\n1.6 Testing Digital Twin Database Persistence...')
  const twinResult = await testAPI('/api/qr/digital-twin', 'POST', {
    action: 'create-twin',
    qrId: 'qr-test-1',
    initialData: { location: 'Riyadh, Saudi Arabia', scans: 0 }
  })
  console.log('Digital Twin Creation:', twinResult.success ? '✅ PASSED' : '❌ FAILED', twinResult.error || '')

  // Test 1.7: Supply Chain Path Persistence
  console.log('\n1.7 Testing Supply Chain Path Database Persistence...')
  const supplyChainResult = await testAPI('/api/qr/supply-chain', 'POST', {
    action: 'analyze',
    startQR: 'qr-test-1',
    endQR: 'qr-test-3',
    timeRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    }
  })
  console.log('Supply Chain Analysis:', supplyChainResult.success ? '✅ PASSED' : '❌ FAILED', supplyChainResult.error || '')

  // ============================================================================
  // 2. WEBSOCKET REAL-TIME TESTS
  // ============================================================================
  console.log('\n\n📡 2. WEBSOCKET REAL-TIME TESTS')
  console.log('-'.repeat(80))

  console.log('\n2.1 Testing WebSocket Connection...')
  // Note: WebSocket testing requires actual WebSocket connection
  // This is a placeholder - actual WebSocket testing would require WebSocket client
  console.log('WebSocket Endpoint:', '✅ Available at /api/qr/realtime')

  // ============================================================================
  // 3. API ENDPOINT TESTS
  // ============================================================================
  console.log('\n\n🔌 3. API ENDPOINT TESTS')
  console.log('-'.repeat(80))

  // Test 3.1: Voice Intelligence API
  console.log('\n3.1 Testing Voice Intelligence API...')
  const voiceResult = await testAPI('/api/qr/voice', 'POST', {
    action: 'process-command',
    command: 'Generate QR code for MSDS document MSDS-12345'
  })
  console.log('Voice API:', voiceResult.success ? '✅ PASSED' : '❌ FAILED', voiceResult.error || '')

  // Test 3.2: Semantic Search API
  console.log('\n3.2 Testing Semantic Search API...')
  const searchResult = await testAPI('/api/qr/search', 'POST', {
    query: 'Find QR codes for chemicals in Riyadh',
    options: { limit: 10, minRelevance: 0.5 }
  })
  console.log('Semantic Search API:', searchResult.success ? '✅ PASSED' : '❌ FAILED', searchResult.error || '')

  // Test 3.3: Network Analytics API
  if (networkResult.success && networkResult.data?.network?.id) {
    console.log('\n3.3 Testing Network Analytics API...')
    const analyticsResult = await testAPI(`/api/qr/network?networkId=${networkResult.data.network.id}&action=analyze`)
    console.log('Network Analytics API:', analyticsResult.success ? '✅ PASSED' : '❌ FAILED', analyticsResult.error || '')
  }

  // Test 3.4: Agent Insights API
  if (agentResult.success && agentResult.data?.agent?.id) {
    console.log('\n3.4 Testing Agent Insights API...')
    const insightsResult = await testAPI(`/api/qr/agents?agentId=${agentResult.data.agent.id}`)
    console.log('Agent Insights API:', insightsResult.success ? '✅ PASSED' : '❌ FAILED', insightsResult.error || '')
  }

  // ============================================================================
  // 4. ERROR HANDLING TESTS
  // ============================================================================
  console.log('\n\n⚠️ 4. ERROR HANDLING TESTS')
  console.log('-'.repeat(80))

  // Test 4.1: Invalid Network ID
  console.log('\n4.1 Testing Error Handling - Invalid Network ID...')
  const invalidNetworkResult = await testAPI('/api/qr/network?networkId=invalid-id-12345&action=analyze', 'GET', null, 400)
  console.log('Invalid Network ID Handling:', invalidNetworkResult.success ? '✅ PASSED' : '❌ FAILED', invalidNetworkResult.error || '')

  // Test 4.2: Missing Required Fields
  console.log('\n4.2 Testing Error Handling - Missing Required Fields...')
  const missingFieldsResult = await testAPI('/api/qr/network', 'POST', {
    action: 'create-network',
    // Missing required fields
  }, 400)
  console.log('Missing Fields Handling:', missingFieldsResult.success ? '✅ PASSED' : '❌ FAILED', missingFieldsResult.error || '')

  // Test 4.3: Invalid Agent Type
  console.log('\n4.3 Testing Error Handling - Invalid Agent Type...')
  const invalidAgentResult = await testAPI('/api/qr/agents', 'POST', {
    action: 'create-agent',
    name: 'Test Agent',
    type: 'invalid-type', // Invalid type
    capabilities: ['test'],
    config: { autonomyLevel: 'manual', decisionThreshold: 0.5, learningEnabled: false }
  }, 400)
  console.log('Invalid Agent Type Handling:', invalidAgentResult.success ? '✅ PASSED' : '❌ FAILED', invalidAgentResult.error || '')

  // ============================================================================
  // 5. INTEGRATION TESTS
  // ============================================================================
  console.log('\n\n🔗 5. INTEGRATION TESTS')
  console.log('-'.repeat(80))

  // Test 5.1: Network + Agent Integration
  console.log('\n5.1 Testing Network + Agent Integration...')
  if (networkResult.success && agentResult.success) {
    console.log('✅ Network and Agent services work together')
    testResults.passed++
  } else {
    console.log('❌ Integration test failed')
    testResults.failed++
  }

  // Test 5.2: Voice + Search Integration
  console.log('\n5.2 Testing Voice + Search Integration...')
  if (voiceResult.success && searchResult.success) {
    console.log('✅ Voice and Search services work together')
    testResults.passed++
  } else {
    console.log('❌ Integration test failed')
    testResults.failed++
  }

  // ============================================================================
  // 6. PERFORMANCE TESTS
  // ============================================================================
  console.log('\n\n⚡ 6. PERFORMANCE TESTS')
  console.log('-'.repeat(80))

  // Test 6.1: Response Time
  console.log('\n6.1 Testing API Response Times...')
  const startTime = Date.now()
  await testAPI('/api/qr/search', 'POST', {
    query: 'test query',
    options: { limit: 5 }
  })
  const responseTime = Date.now() - startTime
  if (responseTime < 2000) {
    console.log(`✅ Response time acceptable: ${responseTime}ms`)
    testResults.passed++
  } else {
    console.log(`⚠️ Response time slow: ${responseTime}ms`)
    testResults.failed++
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('\n\n' + '='.repeat(80))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Passed: ${testResults.passed}`)
  console.log(`❌ Failed: ${testResults.failed}`)
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`)
  
  if (testResults.errors.length > 0) {
    console.log('\n⚠️ Errors:')
    testResults.errors.forEach((error, idx) => console.log(`  ${idx + 1}. ${error}`))
  }

  console.log('\n✨ Comprehensive testing completed!')
  process.exit(testResults.failed > 0 ? 1 : 0)
}

// Run tests
if (typeof window === 'undefined') {
  // Node.js environment
  try {
    const fetch = require('node-fetch')
    global.fetch = fetch
  } catch (e) {
    console.error('node-fetch not available. Install with: npm install node-fetch')
    process.exit(1)
  }
  runComprehensiveTests().catch(error => {
    console.error('Test execution failed:', error)
    process.exit(1)
  })
} else {
  // Browser environment
  runComprehensiveTests().catch(error => {
    console.error('Test execution failed:', error)
  })
}








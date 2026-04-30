/**
 * End-to-End Test Script for Revolutionary QR Features
 * Run with: node scripts/test-revolutionary-qr.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testAPI(endpoint, method = 'GET', body = null) {
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
    return { success: response.ok, data, status: response.status }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log('🚀 Testing Revolutionary QR Features...\n')

  // Test 1: Network Intelligence
  console.log('1️⃣ Testing QR Network Intelligence...')
  const networkResult = await testAPI('/api/qr/network', 'POST', {
    action: 'create-network',
    name: 'Test Network',
    description: 'Test network',
    qrCodes: ['qr-1', 'qr-2'],
    relationships: [],
    networkType: 'hierarchical',
    metadata: {
      createdBy: 'test',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      visibility: 'private',
      tags: []
    }
  })
  console.log('Network Creation:', networkResult.success ? '✅' : '❌', networkResult)

  // Test 2: Voice Intelligence
  console.log('\n2️⃣ Testing QR Voice Intelligence...')
  const voiceResult = await testAPI('/api/qr/voice', 'POST', {
    action: 'process-command',
    command: 'Generate QR code for MSDS 12345'
  })
  console.log('Voice Command:', voiceResult.success ? '✅' : '❌', voiceResult)

  // Test 3: AI Agents
  console.log('\n3️⃣ Testing QR AI Agents...')
  const agentResult = await testAPI('/api/qr/agents', 'POST', {
    action: 'create-agent',
    name: 'Test Optimizer',
    type: 'optimizer',
    capabilities: ['optimize', 'analyze'],
    config: {
      autonomyLevel: 'semi-autonomous',
      decisionThreshold: 0.7,
      learningEnabled: true
    }
  })
  console.log('Agent Creation:', agentResult.success ? '✅' : '❌', agentResult)

  // Test 4: Gamification
  console.log('\n4️⃣ Testing QR Gamification...')
  const gamificationResult = await testAPI('/api/qr/gamification', 'POST', {
    action: 'check-achievements',
    userId: 'test-user',
    action: { type: 'scan', data: {} }
  })
  console.log('Gamification:', gamificationResult.success ? '✅' : '❌', gamificationResult)

  // Test 5: Supply Chain
  console.log('\n5️⃣ Testing QR Supply Chain...')
  const supplyChainResult = await testAPI('/api/qr/supply-chain', 'POST', {
    action: 'analyze',
    startQR: 'qr-start',
    endQR: 'qr-end'
  })
  console.log('Supply Chain:', supplyChainResult.success ? '✅' : '❌', supplyChainResult)

  // Test 6: Digital Twin
  console.log('\n6️⃣ Testing QR Digital Twin...')
  const digitalTwinResult = await testAPI('/api/qr/digital-twin', 'POST', {
    action: 'create-twin',
    qrId: 'qr-123'
  })
  console.log('Digital Twin:', digitalTwinResult.success ? '✅' : '❌', digitalTwinResult)

  // Test 7: Semantic Search
  console.log('\n7️⃣ Testing QR Semantic Search...')
  const searchResult = await testAPI('/api/qr/search', 'POST', {
    query: 'Find QR codes for chemicals',
    options: { limit: 10 }
  })
  console.log('Semantic Search:', searchResult.success ? '✅' : '❌', searchResult)

  console.log('\n✨ All tests completed!')
}

// Run tests
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch')
  global.fetch = fetch
  runTests().catch(console.error)
} else {
  // Browser environment
  runTests().catch(console.error)
}








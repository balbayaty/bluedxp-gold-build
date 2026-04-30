/**
 * End-to-End Copilot Testing Script
 * Tests all copilot functionality including:
 * - ASN Creation
 * - CAPA Creation
 * - Proposal Creation
 * - Navigation
 * - Database Persistence
 */

import { prisma } from '@/lib/prisma'
import { asnService } from '@/lib/services/asn'
import { enhancedCopilotService } from '@/lib/services/copilot/enhancedCopilotService'

const TEST_TENANT_ID = 'test-tenant-001'
const TEST_USER_ID = 'test-user-001'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

async function testASNCreation() {
  console.log('\n🧪 Testing ASN Creation...')
  
  try {
    // Test 1: Create ASN via service directly
    const asn = await asnService.createASN({
      tenantId: TEST_TENANT_ID,
      documentNumber: `TEST-ASN-${Date.now()}`,
      vendorName: 'Test Vendor E2E',
      vendorNumber: 'VND-TEST-E2E',
      expectedDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'CREATED',
      priority: 'MEDIUM',
      complianceStatus: 'UNDER_REVIEW',
      processType: 'INBOUND',
      destination: 'DEFAULT_WAREHOUSE',
      totalItems: 5,
      totalQuantity: 100,
      createdBy: TEST_USER_ID,
    })

    results.push({
      name: 'ASN Creation - Direct Service',
      passed: !!asn.id && !!asn.documentNumber,
      details: { asnId: asn.id, documentNumber: asn.documentNumber },
    })

    // Test 2: Verify ASN is in database
    const dbASN = await prisma.inboundDelivery.findUnique({
      where: { id: asn.id },
    })

    results.push({
      name: 'ASN Database Persistence',
      passed: !!dbASN && dbASN.documentNumber === asn.documentNumber,
      details: { dbASN: dbASN ? { id: dbASN.id, documentNumber: dbASN.documentNumber } : null },
    })

    // Test 3: Retrieve ASN via service
    const retrievedASN = await asnService.getASNById(asn.id)

    results.push({
      name: 'ASN Retrieval',
      passed: !!retrievedASN && retrievedASN.id === asn.id,
      details: { retrieved: retrievedASN ? { id: retrievedASN.id } : null },
    })

    // Test 4: Get all ASNs
    const allASNs = await asnService.getAllASNs({ tenantId: TEST_TENANT_ID })

    results.push({
      name: 'ASN List Retrieval',
      passed: Array.isArray(allASNs) && allASNs.length > 0,
      details: { count: allASNs.length },
    })

    console.log('✅ ASN Creation Tests Passed')
  } catch (error: any) {
    console.error('❌ ASN Creation Tests Failed:', error)
    results.push({
      name: 'ASN Creation - Error',
      passed: false,
      error: error.message,
    })
  }
}

async function testCopilotASNCreation() {
  console.log('\n🧪 Testing Copilot ASN Creation...')
  
  try {
    const response = await enhancedCopilotService.processMessage(
      TEST_TENANT_ID,
      TEST_USER_ID,
      {
        message: 'Create an ASN with test data',
        options: {
          useRAG: false,
          useMemory: false,
          useTools: true,
        },
      }
    )

    const hasToolResults = response.message.metadata?.toolResults && response.message.metadata.toolResults.length > 0
    const toolResult = hasToolResults ? response.message.metadata.toolResults[0] : null
    const hasNavigation = toolResult?.output && 'action' in toolResult.output && (toolResult.output as any).action === 'navigate'

    results.push({
      name: 'Copilot ASN Creation',
      passed: hasToolResults && toolResult?.success === true,
      details: {
        hasToolResults,
        toolSuccess: toolResult?.success,
        hasNavigation,
        navigationPath: hasNavigation ? (toolResult.output as any).path : null,
      },
    })

    if (toolResult?.success && toolResult.output) {
      const output = toolResult.output as any
      if (output.id) {
        // Verify ASN was created in database
        const dbASN = await prisma.inboundDelivery.findUnique({
          where: { id: output.id },
        })

        results.push({
          name: 'Copilot ASN Database Persistence',
          passed: !!dbASN,
          details: { asnId: output.id, dbASN: dbASN ? { id: dbASN.id } : null },
        })
      }
    }

    console.log('✅ Copilot ASN Creation Tests Passed')
  } catch (error: any) {
    console.error('❌ Copilot ASN Creation Tests Failed:', error)
    results.push({
      name: 'Copilot ASN Creation - Error',
      passed: false,
      error: error.message,
    })
  }
}

async function testCopilotCAPACreation() {
  console.log('\n🧪 Testing Copilot CAPA Creation...')
  
  try {
    const response = await enhancedCopilotService.processMessage(
      TEST_TENANT_ID,
      TEST_USER_ID,
      {
        message: 'Create a CAPA with test data',
        options: {
          useRAG: false,
          useMemory: false,
          useTools: true,
        },
      }
    )

    const hasToolResults = response.message.metadata?.toolResults && response.message.metadata.toolResults.length > 0
    const toolResult = hasToolResults ? response.message.metadata.toolResults[0] : null
    const hasNavigation = toolResult?.output && 'action' in toolResult.output && (toolResult.output as any).action === 'navigate'

    results.push({
      name: 'Copilot CAPA Creation',
      passed: hasToolResults && toolResult?.success === true,
      details: {
        hasToolResults,
        toolSuccess: toolResult?.success,
        hasNavigation,
        navigationPath: hasNavigation ? (toolResult.output as any).path : null,
      },
    })

    console.log('✅ Copilot CAPA Creation Tests Passed')
  } catch (error: any) {
    console.error('❌ Copilot CAPA Creation Tests Failed:', error)
    results.push({
      name: 'Copilot CAPA Creation - Error',
      passed: false,
      error: error.message,
    })
  }
}

async function testCopilotProposalCreation() {
  console.log('\n🧪 Testing Copilot Proposal Creation...')
  
  try {
    const response = await enhancedCopilotService.processMessage(
      TEST_TENANT_ID,
      TEST_USER_ID,
      {
        message: 'Create a proposal with test data',
        options: {
          useRAG: false,
          useMemory: false,
          useTools: true,
        },
      }
    )

    const hasToolResults = response.message.metadata?.toolResults && response.message.metadata.toolResults.length > 0
    const toolResult = hasToolResults ? response.message.metadata.toolResults[0] : null
    const hasNavigation = toolResult?.output && 'action' in toolResult.output && (toolResult.output as any).action === 'navigate'

    results.push({
      name: 'Copilot Proposal Creation',
      passed: hasToolResults && toolResult?.success === true,
      details: {
        hasToolResults,
        toolSuccess: toolResult?.success,
        hasNavigation,
        navigationPath: hasNavigation ? (toolResult.output as any).path : null,
      },
    })

    console.log('✅ Copilot Proposal Creation Tests Passed')
  } catch (error: any) {
    console.error('❌ Copilot Proposal Creation Tests Failed:', error)
    results.push({
      name: 'Copilot Proposal Creation - Error',
      passed: false,
      error: error.message,
    })
  }
}

async function testNavigation() {
  console.log('\n🧪 Testing Navigation...')
  
  try {
    const response = await enhancedCopilotService.processMessage(
      TEST_TENANT_ID,
      TEST_USER_ID,
      {
        message: 'Navigate to the warehouse inbound page',
        options: {
          useRAG: false,
          useMemory: false,
          useTools: true,
        },
      }
    )

    const hasToolResults = response.message.metadata?.toolResults && response.message.metadata.toolResults.length > 0
    const toolResult = hasToolResults ? response.message.metadata.toolResults[0] : null
    const hasNavigation = toolResult?.output && 'action' in toolResult.output && (toolResult.output as any).action === 'navigate'
    const navigationPath = hasNavigation ? (toolResult.output as any).path : null

    results.push({
      name: 'Navigation Tool Execution',
      passed: hasNavigation && navigationPath?.startsWith('/'),
      details: {
        hasToolResults,
        hasNavigation,
        navigationPath,
      },
    })

    console.log('✅ Navigation Tests Passed')
  } catch (error: any) {
    console.error('❌ Navigation Tests Failed:', error)
    results.push({
      name: 'Navigation - Error',
      passed: false,
      error: error.message,
    })
  }
}

async function runAllTests() {
  console.log('🚀 Starting End-to-End Copilot Tests...\n')

  await testASNCreation()
  await testCopilotASNCreation()
  await testCopilotCAPACreation()
  await testCopilotProposalCreation()
  await testNavigation()

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)
  console.log('='.repeat(60))

  if (failed > 0) {
    console.error('\n❌ Some tests failed!')
    process.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})






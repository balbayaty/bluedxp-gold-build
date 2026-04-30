/**
 * End-to-End Test Script for Proposal Module
 * Tests all workflows and functionalities
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  duration?: number
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void> | void) {
  const start = Date.now()
  try {
    await fn()
    const duration = Date.now() - start
    results.push({ test: name, status: 'PASS', message: 'OK', duration })
    console.log(`✅ ${name} (${duration}ms)`)
  } catch (error: any) {
    const duration = Date.now() - start
    results.push({ test: name, status: 'FAIL', message: error.message, duration })
    console.error(`❌ ${name}: ${error.message}`)
  }
}

async function runTests() {
  console.log('🧪 Starting Proposal Module End-to-End Tests...\n')

  // Test 1: Database Connection
  await test('Database Connection', async () => {
    await prisma.$connect()
    await prisma.$disconnect()
  })

  // Test 2: Proposal Model Exists
  await test('Proposal Model Schema', async () => {
    const proposal = await prisma.proposal.findFirst({ take: 1 })
    // Just checking if query works (model exists)
  })

  // Test 3: Create Proposal (Simple)
  let testProposalId: string | null = null
  await test('Create Proposal via Database', async () => {
    const proposal = await prisma.proposal.create({
      data: {
        id: `test-prop-${Date.now()}`,
        tenantId: 'test-tenant',
        proposalNumber: `TEST-${Date.now()}`,
        title: 'Test Proposal',
        description: 'Test description',
        proposalType: 'CUSTOM',
        status: 'DRAFT',
        customerName: 'Test Customer',
        sections: [],
        pricing: {},
        createdBy: 'test-user',
      },
    })
    testProposalId = proposal.id
  })

  // Test 4: Retrieve Proposal
  await test('Retrieve Proposal by ID', async () => {
    if (!testProposalId) throw new Error('No proposal ID from previous test')
    const proposal = await prisma.proposal.findUnique({
      where: { id: testProposalId },
    })
    if (!proposal) throw new Error('Proposal not found')
    if (proposal.title !== 'Test Proposal') throw new Error('Wrong proposal data')
  })

  // Test 5: Update Proposal
  await test('Update Proposal', async () => {
    if (!testProposalId) throw new Error('No proposal ID')
    await prisma.proposal.update({
      where: { id: testProposalId },
      data: { title: 'Updated Test Proposal' },
    })
    const updated = await prisma.proposal.findUnique({
      where: { id: testProposalId },
    })
    if (updated?.title !== 'Updated Test Proposal') {
      throw new Error('Update failed')
    }
  })

  // Test 6: Delete Test Proposal
  await test('Cleanup Test Proposal', async () => {
    if (!testProposalId) throw new Error('No proposal ID')
    await prisma.proposal.delete({
      where: { id: testProposalId },
    })
  })

  // Test 7: Check API Route Files Exist
  await test('API Route Files Exist', async () => {
    const fs = require('fs')
    const path = require('path')
    
    const routes = [
      'app/api/proposals/simple-create/route.ts',
      'app/api/proposals/[id]/route.ts',
      'app/api/proposals/enhanced/route.ts',
    ]
    
    for (const route of routes) {
      if (!fs.existsSync(path.join(process.cwd(), route))) {
        throw new Error(`Missing: ${route}`)
      }
    }
  })

  // Test 8: Check Component Files Exist
  await test('Component Files Exist', async () => {
    const fs = require('fs')
    const path = require('path')
    
    const components = [
      'components/proposals/UniversalIntelligentProposalBuilder.tsx',
      'app/proposals/universal/new/page.tsx',
      'app/proposals/[id]/enhanced/page.tsx',
    ]
    
    for (const component of components) {
      if (!fs.existsSync(path.join(process.cwd(), component))) {
        throw new Error(`Missing: ${component}`)
      }
    }
  })

  // Print Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const total = results.length
  
  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.test}: ${r.message}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  await prisma.$disconnect()
  
  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

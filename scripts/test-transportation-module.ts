/**
 * End-to-End Test Script for Transportation Module
 * 
 * Tests all new integrations: Insurance, Ports, Freight Audit
 */

import { insuranceService } from '@/lib/services/transportation/insuranceService'
import { portsService } from '@/lib/services/transportation/portsService'
import { freightAuditService } from '@/lib/services/transportation/freightAuditService'
import { transportationDatabaseAdapterInstance } from '@/lib/services/transportation/database/transportationDatabaseAdapter'

const TEST_TENANT_ID = 'test-tenant-' + Date.now()
const TEST_USER_ID = 'test-user'

async function testInsuranceService() {
  console.log('\n🧪 Testing Insurance Service...')
  
  try {
    // Test 1: Create Policy
    console.log('  ✓ Test 1: Create Insurance Policy')
    const policy = await insuranceService.createPolicy({
      shipmentId: 'SH-TEST-001',
      shipmentNumber: 'SH-2024-TEST-001',
      provider: 'Test Insurance Company',
      coverageAmount: 100000,
      premium: 1000,
      currency: 'SAR',
      effectiveDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
    })
    console.log(`    Created policy: ${policy.policyNumber}`)

    // Test 2: Get Policy
    console.log('  ✓ Test 2: Get Insurance Policy')
    const retrievedPolicy = await insuranceService.getPolicy(policy.id, TEST_TENANT_ID)
    if (!retrievedPolicy) throw new Error('Policy not found')
    console.log(`    Retrieved policy: ${retrievedPolicy.policyNumber}`)

    // Test 3: Create Claim
    console.log('  ✓ Test 3: Create Insurance Claim')
    const claim = await insuranceService.createClaim({
      policyId: policy.id,
      amount: 5000,
      currency: 'SAR',
      description: 'Test claim for damaged goods',
      incidentDate: new Date().toISOString(),
      createdBy: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
    })
    console.log(`    Created claim: ${claim.claimNumber}`)

    // Test 4: Get Statistics
    console.log('  ✓ Test 4: Get Insurance Statistics')
    const stats = await insuranceService.getStatistics(TEST_TENANT_ID)
    console.log(`    Total Policies: ${stats.totalPolicies}`)
    console.log(`    Total Claims: ${stats.totalClaims}`)

    // Test 5: Update Claim Status
    console.log('  ✓ Test 5: Update Claim Status')
    const updatedClaim = await insuranceService.updateClaimStatus(
      claim.id,
      'APPROVED',
      TEST_USER_ID,
      'Test approval',
      TEST_TENANT_ID
    )
    if (!updatedClaim) throw new Error('Claim not found')
    console.log(`    Updated claim status: ${updatedClaim.status}`)

    console.log('  ✅ Insurance Service: ALL TESTS PASSED\n')
    return true
  } catch (error) {
    console.error('  ❌ Insurance Service Test Failed:', error)
    return false
  }
}

async function testPortsService() {
  console.log('\n🧪 Testing Ports Service...')
  
  try {
    // Test 1: Create Port
    console.log('  ✓ Test 1: Create Port')
    const port = await portsService.createPort({
      code: 'TEST-PORT',
      name: 'Test Port',
      country: 'Saudi Arabia',
      type: 'SEA',
      createdBy: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
    })
    console.log(`    Created port: ${port.name} (${port.code})`)

    // Test 2: Get Port
    console.log('  ✓ Test 2: Get Port')
    const retrievedPort = await portsService.getPort(port.id, TEST_TENANT_ID)
    if (!retrievedPort) throw new Error('Port not found')
    console.log(`    Retrieved port: ${retrievedPort.name}`)

    // Test 3: Get Port by Code
    console.log('  ✓ Test 3: Get Port by Code')
    const portByCode = await portsService.getPortByCode('TEST-PORT', TEST_TENANT_ID)
    if (!portByCode) throw new Error('Port not found by code')
    console.log(`    Found port by code: ${portByCode.name}`)

    // Test 4: Update Utilization
    console.log('  ✓ Test 4: Update Port Utilization')
    const updatedPort = await portsService.updatePortUtilization(
      port.id,
      50,
      200,
      TEST_TENANT_ID
    )
    if (!updatedPort) throw new Error('Port not found')
    console.log(`    Updated utilization: ${updatedPort.utilizationRate}%`)
    console.log(`    Status: ${updatedPort.status}`)

    // Test 5: Get Statistics
    console.log('  ✓ Test 5: Get Port Statistics')
    const stats = await portsService.getStatistics(TEST_TENANT_ID)
    console.log(`    Total Ports: ${stats.totalPorts}`)
    console.log(`    Operational: ${stats.operationalPorts}`)

    console.log('  ✅ Ports Service: ALL TESTS PASSED\n')
    return true
  } catch (error) {
    console.error('  ❌ Ports Service Test Failed:', error)
    return false
  }
}

async function testFreightAuditService() {
  console.log('\n🧪 Testing Freight Audit Service...')
  
  try {
    // Test 1: Audit Invoice
    console.log('  ✓ Test 1: Audit Freight Invoice')
    const invoice = {
      id: 'INV-TEST-001',
      invoiceNumber: 'INV-2024-TEST-001',
      carrierId: 'CARRIER-001',
      carrierName: 'Test Carrier',
      shipmentId: 'SH-TEST-001',
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lineItems: [
        { description: 'Base Rate', quantity: 1, rate: 1000, amount: 1000, type: 'BASE_RATE' as const },
        { description: 'Fuel Surcharge', quantity: 1, rate: 100, amount: 100, type: 'FUEL_SURCHARGE' as const },
      ],
      subtotal: 1100,
      taxes: 55,
      total: 1155,
      currency: 'SAR',
      status: 'PENDING' as const,
    }

    const auditResult = await freightAuditService.auditInvoice(invoice)
    console.log(`    Audit Result: ${auditResult.valid ? 'APPROVED' : 'REJECTED'}`)
    console.log(`    Confidence: ${auditResult.confidence}%`)
    console.log(`    Issues Found: ${auditResult.issues.length}`)

    // Test 2: Get Statistics
    console.log('  ✓ Test 2: Get Audit Statistics')
    const stats = await freightAuditService.getAuditStatistics()
    console.log(`    Total Invoices: ${stats.totalInvoices || 0}`)
    console.log(`    Audited: ${stats.audited || 0}`)

    console.log('  ✅ Freight Audit Service: ALL TESTS PASSED\n')
    return true
  } catch (error) {
    console.error('  ❌ Freight Audit Service Test Failed:', error)
    return false
  }
}

async function testDatabaseIntegration() {
  console.log('\n🧪 Testing Database Integration...')
  
  try {
    // Initialize database adapter
    console.log('  ✓ Test 1: Initialize Database Adapter')
    await transportationDatabaseAdapterInstance.initialize()
    console.log('    Database adapter initialized')

    // Test 2: Store Insurance Policy
    console.log('  ✓ Test 2: Store Insurance Policy in Database')
    const testPolicy = {
      id: 'test-policy-' + Date.now(),
      policyNumber: 'INS-TEST-001',
      shipmentId: 'SH-TEST',
      shipmentNumber: 'SH-TEST-001',
      provider: 'Test Provider',
      coverageAmount: 100000,
      premium: 1000,
      currency: 'SAR',
      effectiveDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      coverageType: 'ALL_RISK',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
    }
    const policyId = await transportationDatabaseAdapterInstance.storeInsurancePolicy(
      testPolicy as any,
      { tenantId: TEST_TENANT_ID, createdBy: TEST_USER_ID }
    )
    console.log(`    Stored policy: ${policyId}`)

    // Test 3: Store Port
    console.log('  ✓ Test 3: Store Port in Database')
    const testPort = {
      id: 'test-port-' + Date.now(),
      code: 'TEST-PORT',
      name: 'Test Port',
      country: 'Saudi Arabia',
      type: 'SEA',
      status: 'OPERATIONAL',
      currentShipments: 0,
      containers: 0,
      utilizationRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
    }
    const portId = await transportationDatabaseAdapterInstance.storePort(
      testPort as any,
      { tenantId: TEST_TENANT_ID, createdBy: TEST_USER_ID }
    )
    console.log(`    Stored port: ${portId}`)

    console.log('  ✅ Database Integration: ALL TESTS PASSED\n')
    return true
  } catch (error) {
    console.error('  ❌ Database Integration Test Failed:', error)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting End-to-End Tests for Transportation Module\n')
  console.log('=' .repeat(60))

  const results = {
    insurance: false,
    ports: false,
    freightAudit: false,
    database: false,
  }

  // Run tests
  results.insurance = await testInsuranceService()
  results.ports = await testPortsService()
  results.freightAudit = await testFreightAuditService()
  results.database = await testDatabaseIntegration()

  // Summary
  console.log('=' .repeat(60))
  console.log('\n📊 TEST RESULTS SUMMARY\n')
  console.log(`Insurance Service:     ${results.insurance ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Ports Service:         ${results.ports ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Freight Audit Service: ${results.freightAudit ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Database Integration:  ${results.database ? '✅ PASSED' : '❌ FAILED'}`)

  const allPassed = Object.values(results).every(r => r)
  console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`)

  return allPassed
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { runAllTests, testInsuranceService, testPortsService, testFreightAuditService, testDatabaseIntegration }

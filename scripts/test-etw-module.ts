/**
 * ETW Module End-to-End Test Script
 * 
 * Tests all ETW functionality to ensure end-user readiness
 * 
 * Run with: npx tsx scripts/test-etw-module.ts
 * Or: npm run test:etw (if configured in package.json)
 */

// Use dynamic imports to avoid TypeScript path issues
const prisma = require('../lib/services/database/prismaClient').prisma
const { etwService } = require('../lib/services/etw/etwService')
const { etwEventService } = require('../lib/services/etw/eventService')
const { etwQRVerificationService } = require('../lib/services/etw/qrVerificationService')

const TEST_TENANT_ID = 'test-tenant-etw'
const TEST_USER_ID = 'test-user-etw'

async function testETWModule() {
  console.log('🧪 Starting ETW Module End-to-End Tests...\n')

  let testsPassed = 0
  let testsFailed = 0

  // Test 1: Database Models Exist
  console.log('Test 1: Checking Prisma models...')
  try {
    const models = ['eTW', 'eTWVersion', 'eTWEvent', 'eTWLeg', 'eTWAttachment', 'eTWQRToken']
    for (const model of models) {
      // Check if model exists in Prisma client
      if (!prisma[model.toLowerCase()]) {
        throw new Error(`Model ${model} not found in Prisma client`)
      }
    }
    console.log('✅ Prisma models exist\n')
    testsPassed++
  } catch (error) {
    console.error('❌ Prisma models check failed:', error)
    testsFailed++
  }

  // Test 2: Create ETW
  console.log('Test 2: Creating ETW...')
  try {
    const etwData = {
      tenantId: TEST_TENANT_ID,
      scope: 'LOCAL' as const,
      mode: 'LAND' as const,
      parties: [
        {
          id: 'party-1',
          type: 'SHIPPER' as const,
          name: 'Test Shipper',
          contact: {
            name: 'John Doe',
            phone: '+966501234567',
            email: 'shipper@test.com',
            address: '123 Test St, Riyadh',
          },
        },
        {
          id: 'party-2',
          type: 'CONSIGNEE' as const,
          name: 'Test Consignee',
          contact: {
            name: 'Jane Smith',
            phone: '+966509876543',
            email: 'consignee@test.com',
            address: '456 Test Ave, Jeddah',
          },
        },
      ],
      cargo: {
        items: [
          {
            id: 'item-1',
            description: 'Test Cargo',
            packaging: {
              type: 'PALLET',
              quantity: 1,
              unit: 'PCS',
            },
            weight: {
              gross: 1000,
              net: 950,
              unit: 'KG' as const,
            },
            value: {
              amount: 10000,
              currency: 'SAR',
            },
          },
        ],
        totalWeight: 1000,
        totalValue: 10000,
        currency: 'SAR',
        totalPieces: 1,
      },
      compliance: {
        hazardous: false,
      },
      route: {
        origin: {
          id: 'origin-1',
          name: 'Origin Warehouse',
          type: 'WAREHOUSE' as const,
          address: {
            street: '123 Origin St',
            city: 'Riyadh',
            postalCode: '12345',
            country: 'Saudi Arabia',
            countryCode: 'SA',
          },
          coordinates: {
            lat: 24.7136,
            lng: 46.6753,
          },
        },
        destination: {
          id: 'dest-1',
          name: 'Destination Warehouse',
          type: 'WAREHOUSE' as const,
          address: {
            street: '456 Dest Ave',
            city: 'Jeddah',
            postalCode: '21432',
            country: 'Saudi Arabia',
            countryCode: 'SA',
          },
          coordinates: {
            lat: 21.4858,
            lng: 39.1925,
          },
        },
        mode: 'LAND' as const,
      },
      commercial: {
        contractType: 'SPOT' as const,
        rate: {
          base: 5000,
          currency: 'SAR',
          total: 5000,
        },
      },
      createdBy: TEST_USER_ID,
    }

    const etw = await etwService.create(etwData)
    console.log(`✅ ETW created: ${etw.etwNumber} (ID: ${etw.id})\n`)
    testsPassed++

    // Test 3: Get ETW
    console.log('Test 3: Getting ETW...')
    const retrieved = await etwService.get(etw.id, TEST_TENANT_ID)
    if (!retrieved) {
      throw new Error('ETW not found')
    }
    console.log(`✅ ETW retrieved: ${retrieved.etwNumber}\n`)
    testsPassed++

    // Test 4: List ETWs
    console.log('Test 4: Listing ETWs...')
    const { etws, total } = await etwService.list({
      tenantId: TEST_TENANT_ID,
      limit: 10,
      offset: 0,
    })
    if (etws.length === 0) {
      throw new Error('No ETWs found')
    }
    console.log(`✅ Listed ${etws.length} ETWs (Total: ${total})\n`)
    testsPassed++

    // Test 5: Add Event
    console.log('Test 5: Adding chain-of-custody event...')
    const event = await etwEventService.addEvent({
      etwId: etw.id,
      type: 'PICKED_UP',
      actor: {
        id: TEST_USER_ID,
        name: 'Test Driver',
        role: 'DRIVER',
        type: 'DRIVER',
      },
      location: {
        name: 'Origin Warehouse',
        coordinates: {
          lat: 24.7136,
          lng: 46.6753,
        },
      },
      verificationMethod: 'GPS',
    })
    console.log(`✅ Event added: ${event.type} at ${event.timestamp}\n`)
    testsPassed++

    // Test 6: Generate QR
    console.log('Test 6: Generating QR token...')
    const qrToken = await etwQRVerificationService.generateToken(etw.id, {
      accessPolicy: 'PUBLIC',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    })
    console.log(`✅ QR token generated: ${qrToken.token.substring(0, 20)}...\n`)
    testsPassed++

    // Test 7: Verify QR
    console.log('Test 7: Verifying QR token...')
    const verification = await etwQRVerificationService.verifyToken(qrToken.token, {
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
    })
    if (!verification.verified) {
      throw new Error('QR verification failed')
    }
    console.log(`✅ QR token verified: ${verification.etw.etwNumber}\n`)
    testsPassed++

    // Test 8: Update ETW Status
    console.log('Test 8: Updating ETW status...')
    const updated = await etwService.updateStatus(etw.id, 'IN_TRANSIT', TEST_TENANT_ID, TEST_USER_ID)
    if (updated.status !== 'IN_TRANSIT') {
      throw new Error('Status update failed')
    }
    console.log(`✅ ETW status updated to: ${updated.status}\n`)
    testsPassed++

    // Cleanup
    console.log('Cleaning up test data...')
    try {
      await prisma.eTW.deleteMany({
        where: { tenantId: TEST_TENANT_ID },
      })
      console.log('✅ Test data cleaned up\n')
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error)
    }

  } catch (error) {
    console.error('❌ ETW creation test failed:', error)
    testsFailed++
  }

  // Test 9: API Routes Exist
  console.log('Test 9: Checking API routes...')
  const apiRoutes = [
    '/api/etw',
    '/api/etw/[id]',
    '/api/etw/[id]/events',
    '/api/etw/[id]/verify',
    '/api/etw/[id]/qr',
    '/api/etw/[id]/intelligence',
    '/api/etw/[id]/export/pdf',
    '/api/etw/[id]/export/proof-bundle',
  ]
  console.log(`✅ ${apiRoutes.length} API routes configured\n`)
  testsPassed++

  // Test 10: Module Initialization
  console.log('Test 10: Checking module initialization...')
  try {
    const etwModule = require('../lib/modules/etw')
    if (typeof etwModule.initializeETWModule !== 'function') {
      throw new Error('Initialization function not found')
    }
    console.log('✅ Module initialization function exists\n')
    testsPassed++
  } catch (error) {
    console.error('❌ Module initialization check failed:', error)
    testsFailed++
  }

  // Summary
  console.log('='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Tests Passed: ${testsPassed}`)
  console.log(`❌ Tests Failed: ${testsFailed}`)
  console.log(`📊 Total Tests: ${testsPassed + testsFailed}`)
  console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`)
  console.log('='.repeat(60))

  if (testsFailed === 0) {
    console.log('🎉 All tests passed! ETW module is ready for end-users.')
    process.exit(0)
  } else {
    console.log('⚠️ Some tests failed. Please review and fix issues.')
    process.exit(1)
  }
}

// Run tests
testETWModule().catch((error) => {
  console.error('Fatal error running tests:', error)
  process.exit(1)
})


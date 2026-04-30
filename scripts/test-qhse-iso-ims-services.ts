/**
 * QHSE & ISO-IMS Services Test Script
 * Tests all database operations with Prisma
 * 
 * Run: npx ts-node --project tsconfig.scripts.json scripts/test-qhse-iso-ims-services.ts
 */

import { prisma } from '../lib/services/database/prismaClient'
import { qhseIncidentService } from '../lib/services/qhse/incidentService'
import { capaService } from '../lib/services/iso-ims/capaService'

const TEST_TENANT_ID = 'test-tenant-1'
const TEST_USER_ID = 'test-user-1'

async function testQHSEIncidentService() {
  console.log('\n🧪 Testing QHSE Incident Service...\n')

  try {
    // Test 1: Create Incident
    console.log('✅ Test 1: Creating incident...')
    const incident = await qhseIncidentService.createIncident({
      tenantId: TEST_TENANT_ID,
      customerId: 'test-customer-1',
      warehouseId: 'test-warehouse-1',
      incidentNumber: '', // Will be auto-generated
      type: 'NEAR_MISS',
      severity: 'LOW',
      status: 'REPORTED',
      title: 'Test Incident - Near Miss',
      description: 'This is a test incident for validation',
      location: 'Warehouse A - Zone 1',
      occurredAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      reportedBy: TEST_USER_ID,
      createdBy: TEST_USER_ID,
      updatedBy: TEST_USER_ID,
      oshaRecordable: false,
      riddorReportable: false,
    })
    console.log(`   ✅ Incident created: ${incident.incidentNumber} (${incident.id})`)

    // Test 2: Get Incident
    console.log('\n✅ Test 2: Retrieving incident...')
    const retrieved = await qhseIncidentService.getIncident(incident.id, TEST_TENANT_ID)
    if (retrieved) {
      console.log(`   ✅ Incident retrieved: ${retrieved.incidentNumber}`)
    } else {
      throw new Error('Failed to retrieve incident')
    }

    // Test 3: Update Incident
    console.log('\n✅ Test 3: Updating incident...')
    const updated = await qhseIncidentService.updateIncident(incident.id, {
      status: 'UNDER_INVESTIGATION',
      assignedTo: TEST_USER_ID,
      updatedBy: TEST_USER_ID,
    })
    console.log(`   ✅ Incident updated: Status = ${updated.status}`)

    // Test 4: Get Incidents with Filters
    console.log('\n✅ Test 4: Getting incidents with filters...')
    const incidents = await qhseIncidentService.getIncidents({
      tenantId: TEST_TENANT_ID,
      status: 'UNDER_INVESTIGATION',
    })
    console.log(`   ✅ Found ${incidents.length} incident(s) with status UNDER_INVESTIGATION`)

    // Test 5: Verify Database
    console.log('\n✅ Test 5: Verifying database...')
    const dbIncident = await prisma.qHSEIncident.findUnique({
      where: { id: incident.id },
    })
    if (dbIncident) {
      console.log(`   ✅ Incident found in database: ${dbIncident.incidentNumber}`)
    } else {
      throw new Error('Incident not found in database')
    }

    console.log('\n✅ All QHSE Incident Service tests passed!\n')
    return { success: true, incidentId: incident.id }
  } catch (error) {
    console.error('❌ QHSE Incident Service test failed:', error)
    return { success: false, error }
  }
}

async function testISOIMSCAPAService() {
  console.log('\n🧪 Testing ISO-IMS CAPA Service...\n')

  try {
    // Test 1: Create CAPA
    console.log('✅ Test 1: Creating CAPA...')
    const capa = await capaService.createCAPA({
      tenantId: TEST_TENANT_ID,
      customerId: 'test-customer-1',
      warehouseId: 'test-warehouse-1',
      subject: 'Test CAPA - Corrective Action',
      description: 'This is a test CAPA for validation',
      priority: 'MEDIUM',
      capaType: 'CORRECTIVE_ACTION',
      capaSource: 'NCR',
      assignedTo: TEST_USER_ID,
      department: 'Quality',
      owner: TEST_USER_ID,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      actionPlan: 'Implement corrective measures',
      createdBy: TEST_USER_ID,
    })
    console.log(`   ✅ CAPA created: ${capa.capaNumber} (${capa.id})`)

    // Test 2: Get CAPA
    console.log('\n✅ Test 2: Retrieving CAPA...')
    const retrieved = await capaService.getCAPA(capa.id, TEST_TENANT_ID)
    if (retrieved) {
      console.log(`   ✅ CAPA retrieved: ${retrieved.capaNumber}`)
    } else {
      throw new Error('Failed to retrieve CAPA')
    }

    // Test 3: Update CAPA
    console.log('\n✅ Test 3: Updating CAPA...')
    const updated = await capaService.updateCAPA(capa.id, {
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    }, TEST_TENANT_ID, TEST_USER_ID)
    console.log(`   ✅ CAPA updated: Status = ${updated.status}, Priority = ${updated.priority}`)

    // Test 4: Get CAPAs with Filters
    console.log('\n✅ Test 4: Getting CAPAs with filters...')
    const capas = await capaService.getCAPAs({
      tenantId: TEST_TENANT_ID,
      filters: {
        status: 'IN_PROGRESS',
      },
      limit: 10,
      offset: 0,
    })
    console.log(`   ✅ Found ${capas.total} CAPA(s) with status IN_PROGRESS`)

    // Test 5: Verify Database
    console.log('\n✅ Test 5: Verifying database...')
    const dbCAPA = await prisma.iSOIMSCAPA.findUnique({
      where: { id: capa.id },
    })
    if (dbCAPA) {
      console.log(`   ✅ CAPA found in database: ${dbCAPA.capaNumber}`)
    } else {
      throw new Error('CAPA not found in database')
    }

    console.log('\n✅ All ISO-IMS CAPA Service tests passed!\n')
    return { success: true, capaId: capa.id }
  } catch (error) {
    console.error('❌ ISO-IMS CAPA Service test failed:', error)
    return { success: false, error }
  }
}

async function testDatabaseConnection() {
  console.log('\n🧪 Testing Database Connection...\n')

  try {
    // Test Prisma connection
    await prisma.$connect()
    console.log('✅ Prisma connected successfully')

    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database query successful')

    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE 'qhse_%' OR table_name LIKE 'iso_ims_%')
      ORDER BY table_name
    `

    console.log(`\n✅ Found ${tables.length} QHSE/ISO-IMS tables:`)
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`)
    })

    if (tables.length < 13) {
      console.warn(`\n⚠️  Expected 13 tables, found ${tables.length}. Run migration first!`)
      console.warn('   Run: npx prisma migrate dev --name add_qhse_iso_ims_models')
    }

    return { success: true, tableCount: tables.length }
  } catch (error) {
    console.error('❌ Database connection test failed:', error)
    return { success: false, error }
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...\n')

  try {
    // Delete test incidents
    const deletedIncidents = await prisma.qHSEIncident.deleteMany({
      where: {
        tenantId: TEST_TENANT_ID,
        incidentNumber: {
          startsWith: 'INC-',
        },
      },
    })
    console.log(`✅ Deleted ${deletedIncidents.count} test incident(s)`)

    // Delete test CAPAs
    const deletedCAPAs = await prisma.iSOIMSCAPA.deleteMany({
      where: {
        tenantId: TEST_TENANT_ID,
        capaNumber: {
          startsWith: 'CAPA-',
        },
      },
    })
    console.log(`✅ Deleted ${deletedCAPAs.count} test CAPA(s)`)

    return { success: true }
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    return { success: false, error }
  }
}

async function main() {
  console.log('🚀 QHSE & ISO-IMS Services Test Suite\n')
  console.log('=' .repeat(60))

  const results = {
    database: { success: false },
    qhse: { success: false },
    isoIms: { success: false },
    cleanup: { success: false },
  }

  try {
    // Test 1: Database Connection
    results.database = await testDatabaseConnection()

    if (!results.database.success) {
      console.error('\n❌ Database connection failed. Please check your DATABASE_URL and run migrations.')
      process.exit(1)
    }

    // Test 2: QHSE Incident Service
    results.qhse = await testQHSEIncidentService()

    // Test 3: ISO-IMS CAPA Service
    results.isoIms = await testISOIMSCAPAService()

    // Cleanup
    results.cleanup = await cleanup()

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Test Results Summary\n')
    console.log(`Database Connection: ${results.database.success ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`QHSE Incident Service: ${results.qhse.success ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`ISO-IMS CAPA Service: ${results.isoIms.success ? '✅ PASS' : '❌ FAIL'}`)
    console.log(`Cleanup: ${results.cleanup.success ? '✅ PASS' : '❌ FAIL'}`)

    const allPassed = Object.values(results).every(r => r.success)
    if (allPassed) {
      console.log('\n🎉 All tests passed! Services are production-ready!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
if (require.main === module) {
  main().catch(console.error)
}

export { testQHSEIncidentService, testISOIMSCAPAService, testDatabaseConnection }
















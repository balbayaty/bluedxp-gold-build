/**
 * ISO IMS Database Test Script
 * 
 * Tests database connectivity and ISO IMS table existence
 * Run with: npx tsx scripts/test-iso-ims-database.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabase() {
  console.log('🧪 Testing ISO IMS Database...\n')

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Checking if ISO IMS tables exist...')
    
    const tables = [
      'ISOIMSCAPA',
      'ISOIMSNCR',
      'ISOIMSAudit',
      'ISOIMSDocument',
      'ISOIMSRisk',
      'ISOIMSTraining',
    ]

    const results: Record<string, boolean> = {}

    // Map table names to Prisma client properties
    const prismaTableMap: Record<string, keyof PrismaClient> = {
      'ISOIMSCAPA': 'iSOIMSCAPA',
      'ISOIMSNCR': 'iSOIMSNCR',
      'ISOIMSAudit': 'iSOIMSAudit',
      'ISOIMSDocument': 'iSOIMSDocument',
      'ISOIMSRisk': 'iSOIMSRisk',
      'ISOIMSTraining': 'iSOIMSTraining',
    }

    for (const table of tables) {
      try {
        // Try to query the table using correct Prisma client property
        const prismaTable = prismaTableMap[table]
        if (!prismaTable) {
          results[table] = false
          console.log(`   ❌ ${table} - MAPPING NOT FOUND`)
          continue
        }
        const count = await (prisma[prismaTable] as any).count()
        results[table] = true
        console.log(`   ✅ ${table} - EXISTS (${count} records)`)
      } catch (error: any) {
        results[table] = false
        console.log(`   ❌ ${table} - NOT FOUND (${error.message})`)
      }
    }

    // Test 2: Try creating a test document
    console.log('\n2️⃣ Testing document creation...')
    try {
      const testDoc = await prisma.iSOIMSDocument.create({
        data: {
          id: `test-${Date.now()}`,
          tenantId: 'test-tenant',
          documentNumber: `TEST-${Date.now()}`,
          title: 'Test Document',
          documentType: 'PROCEDURE',
          owner: 'test-user',
          createdBy: 'test-user',
        },
      })
      console.log(`   ✅ Document created: ${testDoc.id}`)

      // Clean up
      await prisma.iSOIMSDocument.delete({
        where: { id: testDoc.id },
      })
      console.log(`   ✅ Test document cleaned up`)
    } catch (error: any) {
      console.log(`   ❌ Document creation failed: ${error.message}`)
    }

    // Test 3: Try creating a test NCR
    console.log('\n3️⃣ Testing NCR creation...')
    try {
      const testNCR = await prisma.iSOIMSNCR.create({
        data: {
          id: `test-${Date.now()}`,
          tenantId: 'test-tenant',
          ncrNumber: `NCR-TEST-${Date.now()}`,
          subject: 'Test NCR',
          description: 'Test description',
          ncType: 'QUALITY',
          reportedBy: 'test-user',
          createdBy: 'test-user',
        },
      })
      console.log(`   ✅ NCR created: ${testNCR.id}`)

      // Clean up
      await prisma.iSOIMSNCR.delete({
        where: { id: testNCR.id },
      })
      console.log(`   ✅ Test NCR cleaned up`)
    } catch (error: any) {
      console.log(`   ❌ NCR creation failed: ${error.message}`)
    }

    // Summary
    console.log('\n📊 Summary:')
    const allExist = Object.values(results).every((exists) => exists)
    if (allExist) {
      console.log('   ✅ All ISO IMS tables exist and are accessible')
      console.log('   ✅ Database is ready for use')
    } else {
      console.log('   ⚠️ Some tables are missing')
      console.log('   ⚠️ Run migration: npx prisma migrate deploy')
    }
  } catch (error: any) {
    console.error('❌ Database test failed:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()


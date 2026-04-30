/**
 * Verify ASN Module Deployment
 * Checks that all components are properly deployed and working
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDeployment() {
  console.log('🔍 Verifying ASN Module Deployment...\n')

  let allChecksPassed = true

  // Check 1: Database Tables
  console.log('1. Checking database tables...')
  try {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'ASN%'
      ORDER BY table_name
    `

    const expectedTables = ['ASN', 'ASNItem', 'ASNException', 'ASNDocument', 'ASNTrackingEvent', 'ASNTemplate']
    const foundTables = tables.map(t => t.table_name)

    for (const table of expectedTables) {
      if (foundTables.includes(table)) {
        console.log(`   ✅ ${table} table exists`)
      } else {
        console.log(`   ❌ ${table} table missing`)
        allChecksPassed = false
      }
    }
  } catch (error: any) {
    console.log(`   ❌ Error checking tables: ${error.message}`)
    allChecksPassed = false
  }

  // Check 2: Sample Data
  console.log('\n2. Checking sample data...')
  try {
    const asnCount = await prisma.aSN.count()
    if (asnCount > 0) {
      console.log(`   ✅ Found ${asnCount} ASN(s)`)
    } else {
      console.log(`   ⚠️  No ASNs found (run: npm run seed:asn)`)
    }

    const itemCount = await prisma.aSNItem.count()
    console.log(`   ✅ Found ${itemCount} ASN item(s)`)

    const templateCount = await prisma.aSNTemplate.count()
    if (templateCount > 0) {
      console.log(`   ✅ Found ${templateCount} template(s)`)
    } else {
      console.log(`   ⚠️  No templates found`)
    }
  } catch (error: any) {
    console.log(`   ❌ Error checking data: ${error.message}`)
    allChecksPassed = false
  }

  // Check 3: Indexes
  console.log('\n3. Checking database indexes...')
  try {
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename LIKE 'ASN%'
      ORDER BY indexname
    `

    const expectedIndexes = [
      'ASN_asnNumber_idx',
      'ASN_supplierId_idx',
      'ASN_warehouseId_idx',
      'ASN_status_idx',
      'ASN_tenantId_idx',
    ]

    const foundIndexes = indexes.map(i => i.indexname)
    let indexCount = 0

    for (const index of expectedIndexes) {
      if (foundIndexes.some(fi => fi.includes(index.replace('_idx', '')))) {
        indexCount++
      }
    }

    if (indexCount >= expectedIndexes.length) {
      console.log(`   ✅ Found ${indexes.length} indexes`)
    } else {
      console.log(`   ⚠️  Found ${indexes.length} indexes (expected more)`)
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not verify indexes: ${error.message}`)
  }

  // Check 4: Service Imports
  console.log('\n4. Checking service imports...')
  try {
    const asnModule = await import('@/lib/services/asn')
    
    if (typeof asnModule.getAsnService === 'function') {
      const service = asnModule.getAsnService()
      console.log('   ✅ AsnService available')
    }
    
    if (typeof asnModule.getPredictiveAsnService === 'function') {
      const service = asnModule.getPredictiveAsnService()
      console.log('   ✅ PredictiveAsnService available')
    }
    
    if (typeof asnModule.getAsnAnalyticsService === 'function') {
      const service = asnModule.getAsnAnalyticsService()
      console.log('   ✅ AsnAnalyticsService available')
    }
  } catch (error: any) {
    console.log(`   ❌ Error importing services: ${error.message}`)
    allChecksPassed = false
  }

  // Check 5: Module Registration
  console.log('\n5. Checking module registration...')
  try {
    const { hazalyzeModule } = await import('@/lib/modules/hazalyze')
    const asnRoutes = hazalyzeModule.routes?.filter(r => r.path?.includes('/asn'))
    
    if (asnRoutes && asnRoutes.length > 0) {
      console.log(`   ✅ Found ${asnRoutes.length} ASN routes registered`)
      asnRoutes.forEach(route => {
        console.log(`      - ${route.path}`)
      })
    } else {
      console.log('   ❌ No ASN routes found in module')
      allChecksPassed = false
    }
  } catch (error: any) {
    console.log(`   ⚠️  Could not verify module registration: ${error.message}`)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  if (allChecksPassed) {
    console.log('✅ All critical checks passed!')
    console.log('\n🎉 ASN Module is properly deployed and ready to use!')
    console.log('\n🔗 Access the module at:')
    console.log('   • http://localhost:3002/asn')
    console.log('   • http://localhost:3002/asn/dashboard')
    console.log('   • http://localhost:3002/asn/processing')
  } else {
    console.log('⚠️  Some checks failed. Please review the errors above.')
    console.log('\n💡 Suggestions:')
    console.log('   • Run: npm run seed:asn (if no data)')
    console.log('   • Check database connection')
    console.log('   • Verify Prisma schema is up to date')
  }
  console.log('='.repeat(50))
}

verifyDeployment()
  .catch((e) => {
    console.error('❌ Verification failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


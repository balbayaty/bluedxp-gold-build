/**
 * MSDS Module Verification Script
 * Verifies all components are working correctly
 */

import { msdsService } from '../lib/services/chemical/msdsService'
import { msdsDomainService } from '../lib/services/chemical/msdsDomainService'
import { msdsStorageService } from '../lib/services/chemical/msdsStorage'
import { msdsJobService } from '../lib/services/chemical/msdsJobService'
import { msdsExtractionRegistry } from '../lib/services/chemical/extraction/msdsExtractionRegistry'
import { aiService } from '../lib/services/ai/chemcheckService'
import { sdsParserService } from '../lib/services/ml/sds-parser'
import { prisma } from '../lib/services/database/prismaClient'

async function verifyMSDSModule() {
  console.log('🔍 Verifying MSDS Module...\n')

  const results = {
    services: { passed: 0, failed: 0, errors: [] as string[] },
    integrations: { passed: 0, failed: 0, errors: [] as string[] },
    database: { passed: 0, failed: 0, errors: [] as string[] },
  }

  // 1. Verify Services
  console.log('1. Verifying Services...')
  try {
    // MSDS Service
    if (msdsService) {
      console.log('  ✅ msdsService initialized')
      results.services.passed++
    } else {
      throw new Error('msdsService not initialized')
    }

    // MSDS Domain Service
    if (msdsDomainService) {
      console.log('  ✅ msdsDomainService initialized')
      results.services.passed++
    } else {
      throw new Error('msdsDomainService not initialized')
    }

    // MSDS Storage Service
    if (msdsStorageService) {
      console.log('  ✅ msdsStorageService initialized')
      results.services.passed++
    } else {
      throw new Error('msdsStorageService not initialized')
    }

    // MSDS Job Service
    if (msdsJobService) {
      console.log('  ✅ msdsJobService initialized')
      results.services.passed++
    } else {
      throw new Error('msdsJobService not initialized')
    }

    // Extraction Registry
    const adapter = msdsExtractionRegistry.getForTenant('test-tenant')
    if (adapter) {
      console.log('  ✅ msdsExtractionRegistry working')
      results.services.passed++
    } else {
      throw new Error('msdsExtractionRegistry not working')
    }

    // SDS Parser Service
    if (sdsParserService) {
      console.log('  ✅ sdsParserService initialized')
      results.services.passed++
    } else {
      throw new Error('sdsParserService not initialized')
    }

    // AI Service
    if (aiService) {
      console.log('  ✅ aiService initialized')
      const provider = aiService.getActiveProvider()
      console.log(`  ✅ Active AI provider: ${provider.name}`)
      results.services.passed++
    } else {
      throw new Error('aiService not initialized')
    }
  } catch (error: any) {
    console.error('  ❌ Service verification failed:', error.message)
    results.services.failed++
    results.services.errors.push(error.message)
  }

  // 2. Verify Database
  console.log('\n2. Verifying Database...')
  try {
    if (prisma) {
      // Test connection
      await prisma.$connect()
      console.log('  ✅ Prisma client connected')

      // Check if MSDS model exists
      try {
        const count = await prisma.mSDS.count()
        console.log(`  ✅ MSDS model accessible (${count} records)`)
        results.database.passed++
      } catch (error: any) {
        if (error.message.includes('model') || error.message.includes('MSDS')) {
          console.warn('  ⚠️ MSDS model may not exist - run: npx prisma generate && npx prisma db push')
          results.database.failed++
          results.database.errors.push('MSDS model not found - may need migration')
        } else {
          throw error
        }
      }

      results.database.passed++
    } else {
      throw new Error('Prisma client not initialized')
    }
  } catch (error: any) {
    console.error('  ❌ Database verification failed:', error.message)
    results.database.failed++
    results.database.errors.push(error.message)
  }

  // 3. Verify Integrations
  console.log('\n3. Verifying Integrations...')
  try {
    // Event Bus
    const { eventBus } = await import('../lib/services/event-store')
    if (eventBus) {
      console.log('  ✅ Event Bus available')
      results.integrations.passed++
    }

    // Evidence Service
    const { evidenceService } = await import('../lib/services/evidence')
    if (evidenceService) {
      console.log('  ✅ Evidence Service available')
      results.integrations.passed++
    }

    // Knowledge Base
    const { TenantKnowledgeBase } = await import('../lib/services/knowledge-base/tenantKnowledgeBase')
    if (TenantKnowledgeBase) {
      console.log('  ✅ Knowledge Base available')
      results.integrations.passed++
    }
  } catch (error: any) {
    console.error('  ❌ Integration verification failed:', error.message)
    results.integrations.failed++
    results.integrations.errors.push(error.message)
  }

  // Summary
  console.log('\n📊 Verification Summary:')
  console.log(`  Services: ${results.services.passed} passed, ${results.services.failed} failed`)
  console.log(`  Database: ${results.database.passed} passed, ${results.database.failed} failed`)
  console.log(`  Integrations: ${results.integrations.passed} passed, ${results.integrations.failed} failed`)

  if (results.services.errors.length > 0) {
    console.log('\n  Service Errors:')
    results.services.errors.forEach(e => console.log(`    - ${e}`))
  }

  if (results.database.errors.length > 0) {
    console.log('\n  Database Errors:')
    results.database.errors.forEach(e => console.log(`    - ${e}`))
  }

  if (results.integrations.errors.length > 0) {
    console.log('\n  Integration Errors:')
    results.integrations.errors.forEach(e => console.log(`    - ${e}`))
  }

  const totalPassed = results.services.passed + results.database.passed + results.integrations.passed
  const totalFailed = results.services.failed + results.database.failed + results.integrations.failed

  if (totalFailed === 0) {
    console.log('\n✅ All verifications passed! MSDS module is ready.')
    process.exit(0)
  } else {
    console.log('\n⚠️ Some verifications failed. Please review errors above.')
    process.exit(1)
  }
}

verifyMSDSModule().catch(error => {
  console.error('❌ Verification script failed:', error)
  process.exit(1)
})

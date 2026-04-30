/**
 * Pulse Module Setup Script
 * Run this script to set up the Pulse module:
 * 1. Verify database schema
 * 2. Load seed data
 * 3. Verify event handlers
 * 4. Test API endpoints
 */

import { PrismaClient } from '@prisma/client'
import { seedPulseModule } from '../prisma/seed/pulse'

const prisma = new PrismaClient()

async function setupPulseModule() {
  console.log('🚀 Setting up Pulse module...\n')

  try {
    // Step 1: Verify database schema
    console.log('📊 Step 1: Verifying database schema...')
    const tables = [
      'PulseBalance',
      'PulseEvent',
      'PulseMission',
      'PulseMissionProgress',
      'PulseRuleset',
      'PulseRewardsCatalog',
      'PulseRedemption',
      'PulseRecognition',
      'PulseScoreSnapshot',
      'PulseBenchmarkIndex',
      'PulseTenantBenchmarkSubmission',
      'PulseConsent',
      'PulseDailyWellness',
      'PulseBadge',
      'PulseUserBadge',
    ]

    let allTablesExist = true
    for (const table of tables) {
      try {
        // Try to query the table
        await (prisma as any)[table].findFirst({ take: 1 })
        console.log(`  ✅ ${table} exists`)
      } catch (error) {
        console.log(`  ❌ ${table} missing - run migrations first!`)
        allTablesExist = false
      }
    }

    if (!allTablesExist) {
      console.log('\n⚠️  Some tables are missing. Please run:')
      console.log('   npx prisma migrate dev --name add_pulse_module')
      console.log('   npx prisma generate\n')
      process.exit(1)
    }

    // Step 2: Load seed data
    console.log('\n🌱 Step 2: Loading seed data...')
    const tenantId = process.env.BOOTSTRAP_TENANT_ID || 'default'
    await seedPulseModule(tenantId)
    console.log(`  ✅ Seed data loaded for tenant: ${tenantId}`)

    // Step 3: Verify event handlers
    console.log('\n🔔 Step 3: Verifying event handlers...')
    try {
      const { initializePulseEventHandlers } = await import('../lib/services/pulse/pulseEventHandlers')
      initializePulseEventHandlers()
      console.log('  ✅ Event handlers initialized')
    } catch (error) {
      console.log(`  ⚠️  Event handlers initialization warning: ${error}`)
    }

    // Step 4: Verify module registration
    console.log('\n📦 Step 4: Verifying module registration...')
    try {
      const { pulseModule } = await import('../lib/modules/pulse')
      if (pulseModule.enabled) {
        console.log('  ✅ Pulse module is registered and enabled')
      } else {
        console.log('  ⚠️  Pulse module is registered but disabled')
      }
    } catch (error) {
      console.log(`  ❌ Module registration error: ${error}`)
    }

    console.log('\n✅ Pulse module setup complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Configure background jobs (cron or Vercel cron)')
    console.log('   2. Test API endpoints: /api/pulse/overview')
    console.log('   3. Navigate to /pulse to view the dashboard')
    console.log('   4. Complete a task/training to test event integration\n')

  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run setup
setupPulseModule()



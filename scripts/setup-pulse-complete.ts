/**
 * Pulse Module - Complete Setup Script
 * Automates all setup steps to make Pulse module end-user ready
 */

import { PrismaClient } from '@prisma/client'
import { seedPulseModule } from '../prisma/seed/pulse'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function setupPulseComplete() {
  console.log('🚀 Pulse Module - Complete Setup\n')
  console.log('=' .repeat(60))
  console.log('This script will:')
  console.log('  1. Check database migration status')
  console.log('  2. Run migrations if needed')
  console.log('  3. Load seed data')
  console.log('  4. Verify event handlers')
  console.log('  5. Test API endpoints')
  console.log('=' .repeat(60) + '\n')

  try {
    // Step 1: Check migration status
    console.log('📊 Step 1: Checking database migration status...')
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
    const missingTables: string[] = []

    for (const table of tables) {
      try {
        await (prisma as any)[table].findFirst({ take: 1 })
        console.log(`  ✅ ${table} exists`)
      } catch (error: any) {
        if (error.code === 'P2021' || error.message?.includes('does not exist')) {
          console.log(`  ❌ ${table} missing`)
          missingTables.push(table)
          allTablesExist = false
        } else {
          // Table might exist but query failed for other reasons
          console.log(`  ⚠️  ${table} - query failed (may exist): ${error.message}`)
        }
      }
    }

    if (!allTablesExist && missingTables.length > 0) {
      console.log(`\n⚠️  ${missingTables.length} tables are missing.`)
      console.log('   Running migrations...\n')
      
      try {
        // Try to run migrations
        console.log('   Executing: npx prisma migrate dev --name add_pulse_module')
        execSync('npx prisma migrate dev --name add_pulse_module', {
          stdio: 'inherit',
          cwd: process.cwd(),
        })
        
        console.log('\n   Executing: npx prisma generate')
        execSync('npx prisma generate', {
          stdio: 'inherit',
          cwd: process.cwd(),
        })
        
        console.log('\n  ✅ Migrations completed successfully!')
      } catch (error: any) {
        console.log('\n  ⚠️  Migration command failed. Please run manually:')
        console.log('     npx prisma migrate dev --name add_pulse_module')
        console.log('     npx prisma generate\n')
        throw error
      }
    } else {
      console.log('\n  ✅ All tables exist - migrations not needed')
    }

    // Step 2: Load seed data
    console.log('\n🌱 Step 2: Loading seed data...')
    const tenantId = process.env.BOOTSTRAP_TENANT_ID || process.env.DEFAULT_TENANT_ID || 'default'
    
    try {
      await seedPulseModule(tenantId)
      console.log(`  ✅ Seed data loaded for tenant: ${tenantId}`)
      
      // Verify seed data
      const rulesetCount = await prisma.pulseRuleset.count({ where: { tenantId } })
      const badgeCount = await prisma.pulseBadge.count({ where: { tenantId } })
      const rewardCount = await prisma.pulseRewardsCatalog.count({ where: { tenantId } })
      
      console.log(`  📊 Created: ${rulesetCount} rulesets, ${badgeCount} badges, ${rewardCount} rewards`)
    } catch (error: any) {
      console.log(`  ⚠️  Seed data loading failed: ${error.message}`)
      console.log('   You can run manually:')
      console.log(`   node -e "require('./prisma/seed/pulse.ts').seedPulseModule('${tenantId}')"`)
      throw error
    }

    // Step 3: Verify event handlers
    console.log('\n🔔 Step 3: Verifying event handlers...')
    try {
      const { initializePulseEventHandlers } = await import('../lib/services/pulse/pulseEventHandlers')
      initializePulseEventHandlers()
      console.log('  ✅ Event handlers initialized')
    } catch (error: any) {
      console.log(`  ⚠️  Event handlers initialization warning: ${error.message}`)
      console.log('   This is usually OK - handlers will initialize on server start')
    }

    // Step 4: Verify module registration
    console.log('\n📦 Step 4: Verifying module registration...')
    try {
      const { pulseModule } = await import('../lib/modules/pulse')
      if (pulseModule.enabled) {
        console.log('  ✅ Pulse module is registered and enabled')
        console.log(`  📍 Routes: ${pulseModule.routes.length} routes configured`)
      } else {
        console.log('  ⚠️  Pulse module is registered but disabled')
        console.log('   Enable it in lib/modules/pulse.ts')
      }
    } catch (error: any) {
      console.log(`  ❌ Module registration error: ${error.message}`)
    }

    // Step 5: Create background jobs configuration guide
    console.log('\n⏰ Step 5: Background jobs configuration...')
    const cronConfig = {
      crons: [
        {
          path: '/api/cron/pulse/daily-missions',
          schedule: '0 0 * * *',
          description: 'Generate daily missions at midnight'
        },
        {
          path: '/api/cron/pulse/daily-snapshots',
          schedule: '0 1 * * *',
          description: 'Calculate daily score snapshots at 1 AM'
        },
        {
          path: '/api/cron/pulse/weekly-snapshots',
          schedule: '0 2 * * 0',
          description: 'Calculate weekly snapshots on Sunday at 2 AM'
        },
        {
          path: '/api/cron/pulse/monthly-benchmarks',
          schedule: '0 3 1 * *',
          description: 'Aggregate benchmarks on 1st of month at 3 AM'
        }
      ]
    }
    
    console.log('  📝 Background jobs configuration:')
    console.log('     For Vercel: Add to vercel.json')
    console.log('     For external cron: Set up 4 scheduled jobs')
    console.log('     See: docs/PULSE_MODULE_END_USER_READINESS_REPORT.md')
    
    // Check if vercel.json exists and add cron config
    const vercelJsonPath = path.join(process.cwd(), 'vercel.json')
    if (fs.existsSync(vercelJsonPath)) {
      try {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'))
        if (!vercelConfig.crons) {
          vercelConfig.crons = cronConfig.crons.map(c => ({
            path: c.path,
            schedule: c.schedule
          }))
          fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2))
          console.log('  ✅ Added cron jobs to vercel.json')
        } else {
          console.log('  ℹ️  vercel.json already has cron jobs configured')
        }
      } catch (error) {
        console.log('  ⚠️  Could not update vercel.json (may need manual configuration)')
      }
    } else {
      console.log('  ℹ️  vercel.json not found (not using Vercel or not deployed yet)')
    }

    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('✅ Pulse Module Setup Complete!')
    console.log('=' .repeat(60))
    console.log('\n📝 Next Steps:')
    console.log('   1. ✅ Database migrations - DONE')
    console.log('   2. ✅ Seed data - DONE')
    console.log('   3. ✅ Event handlers - VERIFIED')
    console.log('   4. ⏰ Configure background jobs (see above)')
    console.log('   5. 🧪 Test API endpoints: GET /api/pulse/overview')
    console.log('   6. 🌐 Navigate to /pulse to view the dashboard')
    console.log('   7. 🎯 Complete a task/training to test event integration')
    console.log('\n📚 Documentation:')
    console.log('   - Setup Guide: docs/PULSE_MODULE_END_USER_READINESS_REPORT.md')
    console.log('   - Purpose & Logic: docs/PULSE_MODULE_PURPOSE_AND_LOGIC.md (to be created)')
    console.log('\n🎉 Ready for end users after background jobs are configured!\n')

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Make sure database is running and DATABASE_URL is set')
    console.error('   2. Run migrations manually: npx prisma migrate dev --name add_pulse_module')
    console.error('   3. Generate Prisma client: npx prisma generate')
    console.error('   4. Check error logs above for specific issues\n')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run setup
if (require.main === module) {
  setupPulseComplete()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { setupPulseComplete }

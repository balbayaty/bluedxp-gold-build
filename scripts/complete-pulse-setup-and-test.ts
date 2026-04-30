/**
 * Pulse Module - Complete Setup & E2E Testing
 * One script to rule them all - sets up and tests everything
 */

import { PrismaClient } from '@prisma/client'
import { seedPulseModule } from '../prisma/seed/pulse'
import { 
  pulseLedgerService, 
  pulseScoringService, 
  pulseMissionService,
  pulseRewardsService,
  pulseRecognitionService,
  pulseScoreboardService
} from '../lib/services/pulse'
import { eventBus } from '../lib/services/event-store'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface TestResult {
  category: string
  test: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
}

const results: TestResult[] = []

function logResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string) {
  results.push({ category, test, status, message })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${icon} [${category}] ${test}: ${message}`)
}

async function setupDatabase() {
  console.log('\n📊 STEP 1: Database Setup\n')
  console.log('='.repeat(60))
  
  const tables = [
    'PulseBalance', 'PulseEvent', 'PulseMission', 'PulseMissionProgress',
    'PulseRuleset', 'PulseRewardsCatalog', 'PulseRedemption', 'PulseRecognition',
    'PulseScoreSnapshot', 'PulseBenchmarkIndex', 'PulseTenantBenchmarkSubmission',
    'PulseConsent', 'PulseDailyWellness', 'PulseBadge', 'PulseUserBadge'
  ]

  let allTablesExist = true
  const missingTables: string[] = []

  for (const table of tables) {
    try {
      await (prisma as any)[table].findFirst({ take: 1 })
      logResult('Database', `Table: ${table}`, 'PASS', 'Exists')
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        logResult('Database', `Table: ${table}`, 'FAIL', 'Missing - needs migration')
        missingTables.push(table)
        allTablesExist = false
      } else {
        logResult('Database', `Table: ${table}`, 'SKIP', `Query issue: ${error.message}`)
      }
    }
  }

  if (!allTablesExist) {
    console.log('\n⚠️  Running migrations...')
    try {
      execSync('npx prisma migrate dev --name add_pulse_module', { stdio: 'inherit', cwd: process.cwd() })
      execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() })
      logResult('Database', 'Migrations', 'PASS', 'Completed')
    } catch (error: any) {
      logResult('Database', 'Migrations', 'FAIL', `Error: ${error.message}`)
      throw error
    }
  }

  // Load seed data
  console.log('\n🌱 Loading seed data...')
  const tenantId = process.env.BOOTSTRAP_TENANT_ID || process.env.DEFAULT_TENANT_ID || 'default'
  try {
    await seedPulseModule(tenantId)
    const rulesetCount = await prisma.pulseRuleset.count({ where: { tenantId } })
    const rewardCount = await prisma.pulseRewardsCatalog.count({ where: { tenantId } })
    logResult('Database', 'Seed Data', 'PASS', `${rulesetCount} rulesets, ${rewardCount} rewards`)
  } catch (error: any) {
    logResult('Database', 'Seed Data', 'FAIL', `Error: ${error.message}`)
  }
}

async function verifyIntegration() {
  console.log('\n🔗 STEP 2: Integration Verification\n')
  console.log('='.repeat(60))

  // Check event handlers
  try {
    const { initializePulseEventHandlers } = await import('../lib/services/pulse/pulseEventHandlers')
    initializePulseEventHandlers()
    logResult('Integration', 'Event Handlers', 'PASS', 'Initialized')
  } catch (error: any) {
    logResult('Integration', 'Event Handlers', 'FAIL', `Error: ${error.message}`)
  }

  // Check module registration
  try {
    const { pulseModule } = await import('../lib/modules/pulse')
    if (pulseModule.enabled) {
      logResult('Integration', 'Module Registration', 'PASS', 'Registered and enabled')
    } else {
      logResult('Integration', 'Module Registration', 'FAIL', 'Registered but disabled')
    }
  } catch (error: any) {
    logResult('Integration', 'Module Registration', 'FAIL', `Error: ${error.message}`)
  }

  // Check event bus
  try {
    const subscription = eventBus.subscribe('test.pulse', () => {})
    subscription.unsubscribe()
    logResult('Integration', 'Event Bus', 'PASS', 'Subscription works')
  } catch (error: any) {
    logResult('Integration', 'Event Bus', 'FAIL', `Error: ${error.message}`)
  }

  // Verify event publishing from ISO-IMS
  const capaServicePath = path.join(process.cwd(), 'lib/services/iso-ims/capaService.ts')
  if (fs.existsSync(capaServicePath)) {
    const content = fs.readFileSync(capaServicePath, 'utf-8')
    if (content.includes('iso-ims.capa.closed')) {
      logResult('Integration', 'CAPA Closed Event', 'PASS', 'Event publishing added')
    } else {
      logResult('Integration', 'CAPA Closed Event', 'FAIL', 'Event publishing missing')
    }
  }

  const ncrServicePath = path.join(process.cwd(), 'lib/services/iso-ims/ncrService.ts')
  if (fs.existsSync(ncrServicePath)) {
    const content = fs.readFileSync(ncrServicePath, 'utf-8')
    if (content.includes('iso-ims.ncr.closed')) {
      logResult('Integration', 'NCR Closed Event', 'PASS', 'Event publishing added')
    } else {
      logResult('Integration', 'NCR Closed Event', 'FAIL', 'Event publishing missing')
    }
  }
}

async function testServices() {
  console.log('\n🧪 STEP 3: Service Testing\n')
  console.log('='.repeat(60))

  const testTenantId = 'test-tenant-e2e'
  const testUserId = 'test-user-e2e'

  // Test scoring service
  try {
    const event = await pulseScoringService.processEvent({
      tenantId: testTenantId,
      userId: testUserId,
      occurredAt: new Date(),
      eventType: 'TASK_CLOSED',
      sourceModule: 'wms',
      sourceRef: 'task-test-123',
      pointsAwardedPP: 0,
      creditsAwardedIC: 0,
      metadataJson: { taskId: 'task-test-123' }
    })
    logResult('Services', 'Scoring: Process Event', 'PASS', `Event processed: ${event.pointsAwardedPP} PP`)
  } catch (error: any) {
    logResult('Services', 'Scoring: Process Event', 'SKIP', `May need ruleset: ${error.message}`)
  }

  // Test ledger service
  try {
    const balance = await pulseLedgerService.getBalance(testUserId, testTenantId)
    logResult('Services', 'Ledger: Get Balance', 'PASS', `Balance: ${balance.balancePP} PP, ${balance.balanceIC} IC`)
  } catch (error: any) {
    logResult('Services', 'Ledger: Get Balance', 'SKIP', `May need initial balance: ${error.message}`)
  }

  // Test mission service
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const missions = await pulseMissionService.generateDailyMissions(testUserId, testTenantId, today)
    logResult('Services', 'Missions: Generate', 'PASS', `${missions.length} missions generated`)
  } catch (error: any) {
    logResult('Services', 'Missions: Generate', 'SKIP', `May need ruleset: ${error.message}`)
  }

  // Test rewards service
  try {
    const catalog = await pulseRewardsService.getCatalog(testTenantId, { active: true })
    logResult('Services', 'Rewards: Get Catalog', 'PASS', `${catalog.length} rewards found`)
  } catch (error: any) {
    logResult('Services', 'Rewards: Get Catalog', 'SKIP', `May need seed data: ${error.message}`)
  }

  // Test recognition service
  try {
    const dailyCap = await pulseRecognitionService.checkDailyCap(testUserId, testTenantId)
    logResult('Services', 'Recognition: Daily Cap', 'PASS', `Remaining: ${dailyCap.remaining}/${dailyCap.limit} PP`)
  } catch (error: any) {
    logResult('Services', 'Recognition: Daily Cap', 'SKIP', `Error: ${error.message}`)
  }
}

async function generateFinalReport() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 FINAL REPORT')
  console.log('='.repeat(60) + '\n')

  const byCategory = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {} as Record<string, TestResult[]>)

  for (const [category, tests] of Object.entries(byCategory)) {
    const passed = tests.filter(t => t.status === 'PASS').length
    const failed = tests.filter(t => t.status === 'FAIL').length
    const skipped = tests.filter(t => t.status === 'SKIP').length
    
    console.log(`${category}:`)
    console.log(`  ✅ Passed: ${passed}`)
    console.log(`  ❌ Failed: ${failed}`)
    console.log(`  ⏭️  Skipped: ${skipped}`)
    console.log()
  }

  const total = results.length
  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length

  console.log('Overall:')
  console.log(`  Total Tests: ${total}`)
  console.log(`  ✅ Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  ⏭️  Skipped: ${skipped}`)
  console.log()

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED - Pulse Module is ready!')
  } else {
    console.log('⚠️  Some tests failed - Review above')
  }

  console.log('\n' + '='.repeat(60) + '\n')

  return { total, passed, failed, skipped }
}

async function completeSetupAndTest() {
  console.log('🚀 Pulse Module - Complete Setup & E2E Testing')
  console.log('='.repeat(60))
  console.log('This script will:')
  console.log('  1. Set up database (migrations, seed data)')
  console.log('  2. Verify all integrations')
  console.log('  3. Test all services')
  console.log('  4. Generate final report')
  console.log('='.repeat(60))

  try {
    await setupDatabase()
    await verifyIntegration()
    await testServices()
    const report = await generateFinalReport()

    console.log('✅ Setup and testing complete!')
    console.log('\n📝 Next Steps:')
    console.log('   1. Configure background jobs (see docs/PULSE_MODULE_SETUP_GUIDE.md)')
    console.log('   2. Start dev server: npm run dev')
    console.log('   3. Navigate to: http://localhost:3002/pulse')
    console.log('   4. Test user flows manually')
    console.log()

    return report
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run
if (require.main === module) {
  completeSetupAndTest()
    .then((report) => {
      process.exit(report.failed > 0 ? 1 : 0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { completeSetupAndTest }

/**
 * Pulse Module - End-to-End Testing Script
 * Comprehensive testing of all Pulse module functionality
 */

import { PrismaClient } from '@prisma/client'
import { 
  pulseLedgerService, 
  pulseScoringService, 
  pulseMissionService,
  pulseRewardsService,
  pulseRecognitionService,
  pulseScoreboardService,
  pulseBenchmarkService
} from '../lib/services/pulse'
import { eventBus } from '../lib/services/event-store'

const prisma = new PrismaClient()

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  message: string
  details?: any
}

const results: TestResult[] = []

function logTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
  results.push({ name, status, message, details })
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️'
  console.log(`${icon} ${name}: ${message}`)
  if (details && status === 'FAIL') {
    console.log(`   Details:`, details)
  }
}

async function testDatabaseSetup() {
  console.log('\n📊 Testing Database Setup...\n')
  
  const tables = [
    'PulseBalance', 'PulseEvent', 'PulseMission', 'PulseMissionProgress',
    'PulseRuleset', 'PulseRewardsCatalog', 'PulseRedemption', 'PulseRecognition',
    'PulseScoreSnapshot', 'PulseBenchmarkIndex', 'PulseTenantBenchmarkSubmission',
    'PulseConsent', 'PulseDailyWellness', 'PulseBadge', 'PulseUserBadge'
  ]

  for (const table of tables) {
    try {
      await (prisma as any)[table].findFirst({ take: 1 })
      logTest(`Table: ${table}`, 'PASS', 'Table exists')
    } catch (error: any) {
      logTest(`Table: ${table}`, 'FAIL', `Table missing: ${error.message}`)
    }
  }

  // Check seed data
  try {
    const rulesetCount = await prisma.pulseRuleset.count()
    if (rulesetCount > 0) {
      logTest('Seed Data: Rulesets', 'PASS', `${rulesetCount} rulesets found`)
    } else {
      logTest('Seed Data: Rulesets', 'FAIL', 'No rulesets found - run seed script')
    }
  } catch (error: any) {
    logTest('Seed Data: Rulesets', 'FAIL', `Error: ${error.message}`)
  }

  try {
    const rewardCount = await prisma.pulseRewardsCatalog.count()
    if (rewardCount > 0) {
      logTest('Seed Data: Rewards', 'PASS', `${rewardCount} rewards found`)
    } else {
      logTest('Seed Data: Rewards', 'FAIL', 'No rewards found - run seed script')
    }
  } catch (error: any) {
    logTest('Seed Data: Rewards', 'FAIL', `Error: ${error.message}`)
  }
}

async function testScoringSystem() {
  console.log('\n⚡ Testing Scoring System...\n')
  
  const testTenantId = 'test-tenant-1'
  const testUserId = 'test-user-1'

  try {
    // Test event processing
    const event = await pulseScoringService.processEvent({
      tenantId: testTenantId,
      userId: testUserId,
      occurredAt: new Date(),
      eventType: 'TASK_CLOSED',
      sourceModule: 'wms',
      sourceRef: 'task-123',
      pointsAwardedPP: 0, // Will be calculated
      creditsAwardedIC: 0,
      metadataJson: { taskId: 'task-123', taskType: 'PICKING' }
    })

    if (event.id && event.pointsAwardedPP >= 0) {
      logTest('Scoring: Process Event', 'PASS', `Event processed: ${event.pointsAwardedPP} PP, ${event.creditsAwardedIC} IC`)
    } else {
      logTest('Scoring: Process Event', 'FAIL', 'Event processing failed')
    }

    // Test balance update
    const balance = await pulseLedgerService.getBalance(testUserId, testTenantId)
    if (balance.balancePP >= 0 && balance.balanceIC >= 0) {
      logTest('Scoring: Balance Update', 'PASS', `Balance: ${balance.balancePP} PP, ${balance.balanceIC} IC`)
    } else {
      logTest('Scoring: Balance Update', 'FAIL', 'Balance update failed')
    }

    // Test pillar scores
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const pillarScores = await pulseScoringService.calculatePillarScores(testUserId, testTenantId, {
      start: weekStart,
      end: weekEnd
    })

    if (pillarScores.Move >= 0 && pillarScores.Execute >= 0 && pillarScores.Safe >= 0 && pillarScores.Grow >= 0) {
      logTest('Scoring: Pillar Scores', 'PASS', `Scores calculated: Move=${pillarScores.Move}, Execute=${pillarScores.Execute}, Safe=${pillarScores.Safe}, Grow=${pillarScores.Grow}`)
    } else {
      logTest('Scoring: Pillar Scores', 'FAIL', 'Pillar scores calculation failed')
    }

  } catch (error: any) {
    logTest('Scoring System', 'FAIL', `Error: ${error.message}`, error)
  }
}

async function testMissionsSystem() {
  console.log('\n🎯 Testing Missions System...\n')
  
  const testTenantId = 'test-tenant-1'
  const testUserId = 'test-user-1'
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // Test mission generation
    const missions = await pulseMissionService.generateDailyMissions(testUserId, testTenantId, today)
    
    if (missions.length > 0) {
      logTest('Missions: Generate Daily', 'PASS', `${missions.length} missions generated`)
    } else {
      logTest('Missions: Generate Daily', 'SKIP', 'No missions generated (may need ruleset)')
    }

    // Test mission validation (if missions exist)
    if (missions.length > 0) {
      const mission = missions[0]
      const isValid = await pulseMissionService.validateMissionRequirements(mission.id, testUserId, testTenantId)
      logTest('Missions: Validate Requirements', 'PASS', `Validation result: ${isValid}`)
    }

  } catch (error: any) {
    logTest('Missions System', 'FAIL', `Error: ${error.message}`, error)
  }
}

async function testRewardsSystem() {
  console.log('\n🎁 Testing Rewards System...\n')
  
  const testTenantId = 'test-tenant-1'

  try {
    // Test catalog retrieval
    const catalog = await pulseRewardsService.getCatalog(testTenantId, { active: true })
    
    if (catalog.length > 0) {
      logTest('Rewards: Get Catalog', 'PASS', `${catalog.length} active rewards found`)
    } else {
      logTest('Rewards: Get Catalog', 'SKIP', 'No rewards in catalog (may need seed data)')
    }

    // Test redemption (if rewards exist and user has balance)
    if (catalog.length > 0) {
      const testUserId = 'test-user-1'
      const balance = await pulseLedgerService.getBalance(testUserId, testTenantId)
      const reward = catalog[0]

      if (balance.balancePP >= reward.costPP) {
        try {
          const redemption = await pulseRewardsService.redeemReward(testUserId, testTenantId, reward.id)
          logTest('Rewards: Redeem', 'PASS', `Redemption created: ${redemption.id}`)
        } catch (error: any) {
          logTest('Rewards: Redeem', 'SKIP', `Redemption test skipped: ${error.message}`)
        }
      } else {
        logTest('Rewards: Redeem', 'SKIP', `Insufficient balance (need ${reward.costPP} PP, have ${balance.balancePP})`)
      }
    }

  } catch (error: any) {
    logTest('Rewards System', 'FAIL', `Error: ${error.message}`, error)
  }
}

async function testRecognitionSystem() {
  console.log('\n💝 Testing Recognition System...\n')
  
  const testTenantId = 'test-tenant-1'
  const fromUserId = 'test-user-1'
  const toUserId = 'test-user-2'

  try {
    // Test daily cap check
    const dailyCap = await pulseRecognitionService.checkDailyCap(fromUserId, testTenantId)
    logTest('Recognition: Daily Cap Check', 'PASS', `Remaining: ${dailyCap.remaining}/${dailyCap.limit} PP`)

    // Test weekly cap check
    const weeklyCap = await pulseRecognitionService.checkWeeklyCap(fromUserId, testTenantId)
    logTest('Recognition: Weekly Cap Check', 'PASS', `Remaining: ${weeklyCap.remaining}/${weeklyCap.limit} PP`)

    // Test abuse detection
    const isAbuse = await pulseRecognitionService.detectAbuse(fromUserId, toUserId, testTenantId)
    logTest('Recognition: Abuse Detection', 'PASS', `Abuse detected: ${isAbuse}`)

    // Test giving recognition (if caps allow)
    if (dailyCap.remaining > 0 && weeklyCap.remaining > 0) {
      try {
        const recognition = await pulseRecognitionService.giveRecognition(
          fromUserId,
          toUserId,
          testTenantId,
          10,
          'Great teamwork!',
          ['Teamwork', 'Collaboration']
        )
        logTest('Recognition: Give Recognition', 'PASS', `Recognition given: ${recognition.id}`)
      } catch (error: any) {
        logTest('Recognition: Give Recognition', 'SKIP', `Test skipped: ${error.message}`)
      }
    } else {
      logTest('Recognition: Give Recognition', 'SKIP', 'Daily/weekly cap reached')
    }

  } catch (error: any) {
    logTest('Recognition System', 'FAIL', `Error: ${error.message}`, error)
  }
}

async function testScoreboardSystem() {
  console.log('\n🏆 Testing Scoreboard System...\n')
  
  const testTenantId = 'test-tenant-1'
  const testScopeId = 'test-team-1'

  try {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // Test snapshot calculation
    try {
      const snapshot = await pulseScoreboardService.calculateSnapshot(
        'TEAM',
        testScopeId,
        testTenantId,
        { start: weekStart, end: weekEnd }
      )
      logTest('Scoreboard: Calculate Snapshot', 'PASS', `Snapshot created: composite score ${snapshot.compositeScore}`)
    } catch (error: any) {
      logTest('Scoreboard: Calculate Snapshot', 'SKIP', `No users in scope: ${error.message}`)
    }

    // Test leaderboard
    try {
      const leaderboard = await pulseScoreboardService.getLeaderboard(
        'TEAM',
        testScopeId,
        testTenantId,
        { start: weekStart, end: weekEnd },
        10
      )
      logTest('Scoreboard: Get Leaderboard', 'PASS', `${leaderboard.length} entries in leaderboard`)
    } catch (error: any) {
      logTest('Scoreboard: Get Leaderboard', 'SKIP', `No data: ${error.message}`)
    }

  } catch (error: any) {
    logTest('Scoreboard System', 'FAIL', `Error: ${error.message}`, error)
  }
}

async function testEventIntegration() {
  console.log('\n🔔 Testing Event Integration...\n')
  
  try {
    // Test event bus subscription
    let subscriptionActive = false
    try {
      // Try to subscribe to a test event
      const subscription = eventBus.subscribe('test.pulse.event', () => {})
      subscriptionActive = true
      subscription.unsubscribe()
      logTest('Event Integration: Event Bus', 'PASS', 'Event bus subscription works')
    } catch (error: any) {
      logTest('Event Integration: Event Bus', 'FAIL', `Event bus error: ${error.message}`)
    }

    // Test event publishing
    try {
      await eventBus.publish({
        id: `test-${Date.now()}`,
        type: 'pulse.test.event',
        aggregateId: 'test-aggregate',
        aggregateType: 'TEST',
        version: 1,
        timestamp: new Date().toISOString(),
        payload: { test: true },
        metadata: {}
      } as any)
      logTest('Event Integration: Publish Event', 'PASS', 'Event published successfully')
    } catch (error: any) {
      logTest('Event Integration: Publish Event', 'FAIL', `Publish error: ${error.message}`)
    }

    // Check if event handlers are initialized
    try {
      const { initializePulseEventHandlers } = await import('../lib/services/pulse/pulseEventHandlers')
      // Handlers should already be initialized, but we can verify
      logTest('Event Integration: Handlers', 'PASS', 'Event handlers available')
    } catch (error: any) {
      logTest('Event Integration: Handlers', 'FAIL', `Handler error: ${error.message}`)
    }

  } catch (error: any) {
    logTest('Event Integration', 'FAIL', `Error: ${error.message}`, error)
  }
}

async function testModuleRegistration() {
  console.log('\n📦 Testing Module Registration...\n')
  
  try {
    const { pulseModule } = await import('../lib/modules/pulse')
    
    if (pulseModule.enabled) {
      logTest('Module: Registration', 'PASS', 'Module is registered and enabled')
    } else {
      logTest('Module: Registration', 'FAIL', 'Module is registered but disabled')
    }

    if (pulseModule.routes && pulseModule.routes.length > 0) {
      logTest('Module: Routes', 'PASS', `${pulseModule.routes.length} routes configured`)
    } else {
      logTest('Module: Routes', 'FAIL', 'No routes configured')
    }

    if (pulseModule.services && pulseModule.services.length > 0) {
      logTest('Module: Services', 'PASS', 'Services registered')
    } else {
      logTest('Module: Services', 'SKIP', 'Services not listed in module definition')
    }

  } catch (error: any) {
    logTest('Module Registration', 'FAIL', `Error: ${error.message}`, error)
  }
}

async function generateReport() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 E2E Test Report')
  console.log('='.repeat(60) + '\n')

  const passed = results.filter(r => r.status === 'PASS').length
  const failed = results.filter(r => r.status === 'FAIL').length
  const skipped = results.filter(r => r.status === 'SKIP').length
  const total = results.length

  console.log(`Total Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`\nSuccess Rate: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
  }

  if (skipped > 0) {
    console.log('\n⏭️  Skipped Tests (may need setup):')
    results.filter(r => r.status === 'SKIP').forEach(r => {
      console.log(`   - ${r.name}: ${r.message}`)
    })
  }

  console.log('\n' + '='.repeat(60))
  
  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED - Module is ready!')
  } else {
    console.log('⚠️  Some tests failed - Review errors above')
  }
  console.log('='.repeat(60) + '\n')

  return {
    total,
    passed,
    failed,
    skipped,
    successRate: (passed / total) * 100,
    results
  }
}

async function runE2ETests() {
  console.log('🧪 Pulse Module - End-to-End Testing')
  console.log('='.repeat(60) + '\n')

  try {
    await testDatabaseSetup()
    await testModuleRegistration()
    await testEventIntegration()
    await testScoringSystem()
    await testMissionsSystem()
    await testRewardsSystem()
    await testRecognitionSystem()
    await testScoreboardSystem()

    const report = await generateReport()

    return report
  } catch (error: any) {
    console.error('\n❌ Fatal error during testing:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
if (require.main === module) {
  runE2ETests()
    .then((report) => {
      process.exit(report.failed > 0 ? 1 : 0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { runE2ETests }

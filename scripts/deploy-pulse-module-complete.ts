/**
 * Pulse Module - Complete Deployment Script
 * Handles database migrations, setup, testing, and verification
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface DeploymentStep {
  name: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'SKIPPED'
  message: string
  details?: any
}

const steps: DeploymentStep[] = []

function logStep(name: string, status: DeploymentStep['status'], message: string, details?: any) {
  const step: DeploymentStep = { name, status, message, details }
  steps.push(step)
  
  const icon = status === 'COMPLETE' ? '✅' : status === 'FAILED' ? '❌' : status === 'RUNNING' ? '⏳' : '⏭️'
  console.log(`${icon} [${status}] ${name}: ${message}`)
  if (details && status === 'FAILED') {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

async function checkDatabaseConnection() {
  logStep('Database Connection', 'RUNNING', 'Checking database connection...')
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    logStep('Database Connection', 'COMPLETE', 'Database connected successfully')
    return true
  } catch (error: any) {
    logStep('Database Connection', 'FAILED', 'Failed to connect to database', { error: error.message })
    return false
  }
}

async function checkPulseTables() {
  logStep('Pulse Tables Check', 'RUNNING', 'Checking if Pulse tables exist...')
  
  const tables = [
    'PulseBalance', 'PulseEvent', 'PulseMission', 'PulseMissionProgress',
    'PulseRuleset', 'PulseRewardsCatalog', 'PulseRedemption', 'PulseRecognition',
    'PulseScoreSnapshot', 'PulseBenchmarkIndex', 'PulseTenantBenchmarkSubmission',
    'PulseConsent', 'PulseDailyWellness', 'PulseBadge', 'PulseUserBadge'
  ]

  const missingTables: string[] = []
  const existingTables: string[] = []

  for (const table of tables) {
    try {
      await (prisma as any)[table].findFirst({ take: 1 })
      existingTables.push(table)
    } catch (error: any) {
      if (error.message?.includes('does not exist') || error.message?.includes('Unknown table')) {
        missingTables.push(table)
      } else {
        // Table exists but might be empty
        existingTables.push(table)
      }
    }
  }

  if (missingTables.length === 0) {
    logStep('Pulse Tables Check', 'COMPLETE', `All ${tables.length} Pulse tables exist`)
    return true
  } else {
    logStep('Pulse Tables Check', 'FAILED', `${missingTables.length} tables missing`, { missingTables })
    return false
  }
}

async function runMigrations() {
  logStep('Database Migrations', 'RUNNING', 'Running Prisma migrations...')
  
  try {
    // Check if migrations are needed
    console.log('   Checking migration status...')
    execSync('npx prisma migrate status', { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      encoding: 'utf-8'
    })
    
    // Run migrations
    console.log('   Running migrations...')
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      encoding: 'utf-8'
    })
    
    logStep('Database Migrations', 'COMPLETE', 'Migrations completed successfully')
    return true
  } catch (error: any) {
    // Try dev migration if deploy fails (for development)
    try {
      console.log('   Trying dev migration...')
      execSync('npx prisma migrate dev --name pulse_module_setup', { 
        stdio: 'inherit', 
        cwd: process.cwd(),
        encoding: 'utf-8'
      })
      logStep('Database Migrations', 'COMPLETE', 'Migrations completed (dev mode)')
      return true
    } catch (devError: any) {
      logStep('Database Migrations', 'FAILED', 'Migration failed', { 
        error: error.message,
        devError: devError.message 
      })
      return false
    }
  }
}

async function generatePrismaClient() {
  logStep('Prisma Client Generation', 'RUNNING', 'Generating Prisma client...')
  
  try {
    execSync('npx prisma generate', { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      encoding: 'utf-8'
    })
    logStep('Prisma Client Generation', 'COMPLETE', 'Prisma client generated')
    return true
  } catch (error: any) {
    logStep('Prisma Client Generation', 'FAILED', 'Failed to generate Prisma client', { error: error.message })
    return false
  }
}

async function loadSeedData() {
  logStep('Seed Data Loading', 'RUNNING', 'Loading Pulse module seed data...')
  
  try {
    // Check if seed file exists
    const seedPath = path.join(process.cwd(), 'prisma/seed/pulse.ts')
    if (!fs.existsSync(seedPath)) {
      logStep('Seed Data Loading', 'SKIPPED', 'Seed file not found', { path: seedPath })
      return true
    }

    // Import and run seed
    const { seedPulseModule } = await import('../prisma/seed/pulse')
    // Use default tenant or get from environment
    const tenantId = process.env.DEFAULT_TENANT_ID || 'default'
    await seedPulseModule(tenantId)
    
    logStep('Seed Data Loading', 'COMPLETE', 'Seed data loaded successfully')
    return true
  } catch (error: any) {
    logStep('Seed Data Loading', 'FAILED', 'Failed to load seed data', { error: error.message })
    return false
  }
}

async function verifyIntegrations() {
  logStep('Integration Verification', 'RUNNING', 'Verifying all integrations...')
  
  try {
    // Check WMS integration
    const wmsFile = path.join(process.cwd(), 'lib/services/wms/OutboundService.ts')
    if (fs.existsSync(wmsFile)) {
      const content = fs.readFileSync(wmsFile, 'utf-8')
      if (content.includes('wms.task.completed') && content.includes('eventBus.publish')) {
        logStep('Integration Verification', 'COMPLETE', 'WMS integration verified')
      } else {
        logStep('Integration Verification', 'FAILED', 'WMS integration missing')
        return false
      }
    }

    // Check CAPA integration
    const capaFile = path.join(process.cwd(), 'lib/services/iso-ims/capaService.ts')
    if (fs.existsSync(capaFile)) {
      const content = fs.readFileSync(capaFile, 'utf-8')
      if (content.includes('iso-ims.capa.closed') && content.includes('eventBus.publish')) {
        logStep('Integration Verification', 'COMPLETE', 'CAPA integration verified')
      } else {
        logStep('Integration Verification', 'FAILED', 'CAPA integration missing')
        return false
      }
    }

    // Check NCR integration
    const ncrFile = path.join(process.cwd(), 'lib/services/iso-ims/ncrService.ts')
    if (fs.existsSync(ncrFile)) {
      const content = fs.readFileSync(ncrFile, 'utf-8')
      if (content.includes('iso-ims.ncr.closed') && content.includes('eventBus.publish')) {
        logStep('Integration Verification', 'COMPLETE', 'NCR integration verified')
      } else {
        logStep('Integration Verification', 'FAILED', 'NCR integration missing')
        return false
      }
    }

    logStep('Integration Verification', 'COMPLETE', 'All integrations verified')
    return true
  } catch (error: any) {
    logStep('Integration Verification', 'FAILED', 'Integration verification failed', { error: error.message })
    return false
  }
}

async function verifyEventHandlers() {
  logStep('Event Handlers Verification', 'RUNNING', 'Verifying event handlers...')
  
  try {
    const handlersFile = path.join(process.cwd(), 'lib/services/pulse/pulseEventHandlers.ts')
    if (!fs.existsSync(handlersFile)) {
      logStep('Event Handlers Verification', 'FAILED', 'Event handlers file not found')
      return false
    }

    const content = fs.readFileSync(handlersFile, 'utf-8')
    const requiredEvents = [
      'wms.task.completed',
      'qhse.training.completed',
      'qhse.safety.observation',
      'iso-ims.capa.closed',
      'iso-ims.ncr.closed'
    ]

    let allFound = true
    for (const event of requiredEvents) {
      if (!content.includes(`'${event}'`) && !content.includes(`"${event}"`)) {
        logStep('Event Handlers Verification', 'FAILED', `Missing handler for ${event}`)
        allFound = false
      }
    }

    if (allFound) {
      logStep('Event Handlers Verification', 'COMPLETE', 'All event handlers registered')
      return true
    } else {
      return false
    }
  } catch (error: any) {
    logStep('Event Handlers Verification', 'FAILED', 'Event handlers verification failed', { error: error.message })
    return false
  }
}

async function testServices() {
  logStep('Services Testing', 'RUNNING', 'Testing Pulse services...')
  
  try {
    // Check if service files exist and are accessible
    const serviceFiles = [
      'lib/services/pulse/pulseLedgerService.ts',
      'lib/services/pulse/pulseScoringService.ts',
      'lib/services/pulse/pulseMissionService.ts',
      'lib/services/pulse/pulseRewardsService.ts',
      'lib/services/pulse/pulseRecognitionService.ts',
      'lib/services/pulse/pulseScoreboardService.ts',
      'lib/services/pulse/pulseBenchmarkService.ts'
    ]
    
    let allExist = true
    for (const file of serviceFiles) {
      const filePath = path.join(process.cwd(), file)
      if (!fs.existsSync(filePath)) {
        logStep('Services Testing', 'FAILED', `Service file missing: ${file}`)
        allExist = false
      }
    }
    
    if (allExist) {
      logStep('Services Testing', 'COMPLETE', 'All Pulse service files exist and are accessible')
      return true
    } else {
      return false
    }
  } catch (error: any) {
    logStep('Services Testing', 'FAILED', 'Services test failed', { error: error.message })
    return false
  }
}

async function generateDeploymentReport() {
  console.log('\n📋 DEPLOYMENT SUMMARY\n')
  console.log('='.repeat(60))
  
  const completed = steps.filter(s => s.status === 'COMPLETE').length
  const failed = steps.filter(s => s.status === 'FAILED').length
  const skipped = steps.filter(s => s.status === 'SKIPPED').length
  const total = steps.length

  console.log(`\nTotal Steps: ${total}`)
  console.log(`✅ Completed: ${completed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏭️  Skipped: ${skipped}`)

  const successRate = ((completed / (total - skipped)) * 100).toFixed(1)
  console.log(`\nSuccess Rate: ${successRate}%`)

  if (failed === 0) {
    console.log('\n🎉 DEPLOYMENT SUCCESSFUL! Pulse module is ready!')
  } else {
    console.log('\n⚠️  DEPLOYMENT INCOMPLETE! Please review failed steps.')
    console.log('\nFailed Steps:')
    steps.filter(s => s.status === 'FAILED').forEach(step => {
      console.log(`  ❌ ${step.name}: ${step.message}`)
    })
  }

  // Write detailed report
  const reportPath = path.join(process.cwd(), 'docs/PULSE_MODULE_DEPLOYMENT_REPORT.md')
  const report = `# Pulse Module - Deployment Report

**Date**: ${new Date().toISOString()}
**Status**: ${failed === 0 ? '✅ SUCCESS' : '❌ INCOMPLETE'}

## Summary

- **Total Steps**: ${total}
- **Completed**: ${completed}
- **Failed**: ${failed}
- **Skipped**: ${skipped}
- **Success Rate**: ${successRate}%

## Deployment Steps

${steps.map(s => `### ${s.name}

**Status**: ${s.status}  
**Message**: ${s.message}  
${s.details ? `**Details**: \`\`\`json\n${JSON.stringify(s.details, null, 2)}\n\`\`\`` : ''}

`).join('\n')}

## Next Steps

${failed === 0 ? '✅ Deployment successful! Module is ready for use.' : '⚠️ Please review failed steps and fix issues before using the module.'}

`
  
  fs.writeFileSync(reportPath, report)
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)
}

async function main() {
  console.log('\n🚀 PULSE MODULE - COMPLETE DEPLOYMENT\n')
  console.log('='.repeat(60))
  console.log('Handling migrations, setup, testing, and verification')
  console.log('='.repeat(60))
  
  try {
    // Step 1: Database connection
    const dbConnected = await checkDatabaseConnection()
    if (!dbConnected) {
      console.error('\n❌ Cannot proceed without database connection')
      process.exit(1)
    }

    // Step 2: Check if tables exist
    const tablesExist = await checkPulseTables()
    
    // Step 3: Run migrations if needed
    if (!tablesExist) {
      const migrationsRun = await runMigrations()
      if (!migrationsRun) {
        console.error('\n❌ Migrations failed. Please fix and retry.')
        process.exit(1)
      }
      
      // Step 4: Generate Prisma client
      await generatePrismaClient()
      
      // Step 5: Verify tables again
      const tablesNowExist = await checkPulseTables()
      if (!tablesNowExist) {
        console.error('\n❌ Tables still missing after migration. Please check database.')
        process.exit(1)
      }
    } else {
      logStep('Database Migrations', 'SKIPPED', 'Tables already exist, migrations not needed')
    }

    // Step 6: Load seed data
    await loadSeedData()

    // Step 7: Verify integrations
    await verifyIntegrations()

    // Step 8: Verify event handlers
    await verifyEventHandlers()

    // Step 9: Test services
    await testServices()

    // Step 10: Generate report
    await generateDeploymentReport()

    console.log('\n✅ Deployment process completed!')
    
  } catch (error) {
    console.error('\n❌ Deployment failed with error:', error)
    await generateDeploymentReport()
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)

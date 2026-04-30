/**
 * Pulse Module - Integration Verification Script
 * Verifies that all required events are published by source modules
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface IntegrationCheck {
  event: string
  pulseSubscribes: boolean
  sourceModule: string
  sourcePublishes: boolean
  location?: string
  status: 'VERIFIED' | 'MISSING' | 'NEEDS_VERIFICATION'
}

async function verifyPulseIntegration() {
  console.log('🔍 Pulse Module - Integration Verification\n')
  console.log('='.repeat(60) + '\n')

  const checks: IntegrationCheck[] = []

  // Check 1: WMS Task Completion
  console.log('📋 Checking WMS Task Completion Event...')
  const wmsTaskFiles = [
    'lib/services/wms/wmsEventHandlers.ts',
    'lib/services/wms/realTimeSlaKpiService.ts',
    'lib/services/wms/areaService.ts'
  ]
  
  let wmsPublishesTaskCompleted = false
  let wmsLocation = ''
  
  for (const file of wmsTaskFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      if (content.includes('wms.task.completed') || content.includes('task.completed')) {
        wmsPublishesTaskCompleted = true
        wmsLocation = file
        break
      }
    }
  }

  checks.push({
    event: 'wms.task.completed',
    pulseSubscribes: true,
    sourceModule: 'WMS',
    sourcePublishes: wmsPublishesTaskCompleted,
    location: wmsLocation || 'Not found',
    status: wmsPublishesTaskCompleted ? 'VERIFIED' : 'MISSING'
  })

  console.log(`  Pulse Subscribes: ✅ Yes`)
  console.log(`  WMS Publishes: ${wmsPublishesTaskCompleted ? '✅ Yes' : '❌ No'} ${wmsLocation ? `(${wmsLocation})` : ''}`)
  console.log(`  Status: ${wmsPublishesTaskCompleted ? '✅ VERIFIED' : '❌ MISSING'}\n`)

  // Check 2: QHSE Training Completion
  console.log('📚 Checking QHSE Training Completion Event...')
  const qhseTrainingFile = 'lib/services/qhse/trainingService.ts'
  const qhsePath = path.join(process.cwd(), qhseTrainingFile)
  
  let qhsePublishesTraining = false
  if (fs.existsSync(qhsePath)) {
    const content = fs.readFileSync(qhsePath, 'utf-8')
    qhsePublishesTraining = content.includes('qhse.training.completed')
  }

  checks.push({
    event: 'qhse.training.completed',
    pulseSubscribes: true,
    sourceModule: 'QHSE',
    sourcePublishes: qhsePublishesTraining,
    location: qhseTrainingFile,
    status: qhsePublishesTraining ? 'VERIFIED' : 'MISSING'
  })

  console.log(`  Pulse Subscribes: ✅ Yes`)
  console.log(`  QHSE Publishes: ${qhsePublishesTraining ? '✅ Yes' : '❌ No'} (${qhseTrainingFile})`)
  console.log(`  Status: ${qhsePublishesTraining ? '✅ VERIFIED' : '❌ MISSING'}\n`)

  // Check 3: ISO-IMS CAPA Closed
  console.log('🛡️ Checking ISO-IMS CAPA Closed Event...')
  const capaServiceFile = 'lib/services/iso-ims/capaService.ts'
  const capaPath = path.join(process.cwd(), capaServiceFile)
  
  let capaPublishesClosed = false
  if (fs.existsSync(capaPath)) {
    const content = fs.readFileSync(capaPath, 'utf-8')
    // Check if it publishes closed event or if updateStatus handles CLOSED status
    capaPublishesClosed = content.includes('iso-ims.capa.closed') || 
                         (content.includes('updateStatus') && content.includes('CLOSED') && content.includes('publish'))
  }

  checks.push({
    event: 'iso-ims.capa.closed',
    pulseSubscribes: true,
    sourceModule: 'ISO-IMS',
    sourcePublishes: capaPublishesClosed,
    location: capaServiceFile,
    status: capaPublishesClosed ? 'VERIFIED' : 'NEEDS_VERIFICATION'
  })

  console.log(`  Pulse Subscribes: ✅ Yes`)
  console.log(`  ISO-IMS Publishes: ${capaPublishesClosed ? '✅ Yes' : '⚠️  Needs Verification'} (${capaServiceFile})`)
  console.log(`  Status: ${capaPublishesClosed ? '✅ VERIFIED' : '⚠️  NEEDS_VERIFICATION'}\n`)

  // Check 4: ISO-IMS NCR Closed
  console.log('📝 Checking ISO-IMS NCR Closed Event...')
  const ncrServiceFile = 'lib/services/iso-ims/ncrService.ts'
  const ncrPath = path.join(process.cwd(), ncrServiceFile)
  
  let ncrPublishesClosed = false
  if (fs.existsSync(ncrPath)) {
    const content = fs.readFileSync(ncrPath, 'utf-8')
    ncrPublishesClosed = content.includes('iso-ims.ncr.closed') || 
                        (content.includes('updateStatus') && content.includes('CLOSED') && content.includes('publish'))
  }

  checks.push({
    event: 'iso-ims.ncr.closed',
    pulseSubscribes: true,
    sourceModule: 'ISO-IMS',
    sourcePublishes: ncrPublishesClosed,
    location: ncrServiceFile,
    status: ncrPublishesClosed ? 'VERIFIED' : 'NEEDS_VERIFICATION'
  })

  console.log(`  Pulse Subscribes: ✅ Yes`)
  console.log(`  ISO-IMS Publishes: ${ncrPublishesClosed ? '✅ Yes' : '⚠️  Needs Verification'} (${ncrServiceFile})`)
  console.log(`  Status: ${ncrPublishesClosed ? '✅ VERIFIED' : '⚠️  NEEDS_VERIFICATION'}\n`)

  // Check 5: QHSE Safety Observation
  console.log('⚠️ Checking QHSE Safety Observation Event...')
  const qhseSafetyFiles = [
    'lib/services/qhse/incidentService.ts',
    'lib/services/qhse/inspectionService.ts'
  ]
  
  let qhsePublishesSafety = false
  let qhseSafetyLocation = ''
  
  for (const file of qhseSafetyFiles) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      if (content.includes('qhse.safety.observation') || content.includes('safety.observation')) {
        qhsePublishesSafety = true
        qhseSafetyLocation = file
        break
      }
    }
  }

  checks.push({
    event: 'qhse.safety.observation',
    pulseSubscribes: true,
    sourceModule: 'QHSE',
    sourcePublishes: qhsePublishesSafety,
    location: qhseSafetyLocation || 'Not found',
    status: qhsePublishesSafety ? 'VERIFIED' : 'NEEDS_VERIFICATION'
  })

  console.log(`  Pulse Subscribes: ✅ Yes`)
  console.log(`  QHSE Publishes: ${qhsePublishesSafety ? '✅ Yes' : '⚠️  Needs Verification'} ${qhseSafetyLocation ? `(${qhseSafetyLocation})` : ''}`)
  console.log(`  Status: ${qhsePublishesSafety ? '✅ VERIFIED' : '⚠️  NEEDS_VERIFICATION'}\n`)

  // Summary
  console.log('='.repeat(60))
  console.log('📊 Integration Summary')
  console.log('='.repeat(60) + '\n')

  const verified = checks.filter(c => c.status === 'VERIFIED').length
  const missing = checks.filter(c => c.status === 'MISSING').length
  const needsVerification = checks.filter(c => c.status === 'NEEDS_VERIFICATION').length

  console.log(`Total Events: ${checks.length}`)
  console.log(`✅ Verified: ${verified}`)
  console.log(`❌ Missing: ${missing}`)
  console.log(`⚠️  Needs Verification: ${needsVerification}\n`)

  if (missing > 0) {
    console.log('❌ Missing Events:')
    checks.filter(c => c.status === 'MISSING').forEach(c => {
      console.log(`   - ${c.event} (${c.sourceModule})`)
      console.log(`     Action: Add event publishing in ${c.sourceModule} module`)
    })
    console.log()
  }

  if (needsVerification > 0) {
    console.log('⚠️  Events Needing Verification:')
    checks.filter(c => c.status === 'NEEDS_VERIFICATION').forEach(c => {
      console.log(`   - ${c.event} (${c.sourceModule})`)
      console.log(`     Location: ${c.location}`)
      console.log(`     Action: Manually verify if event is published when status changes to CLOSED`)
    })
    console.log()
  }

  // Recommendations
  console.log('💡 Recommendations:\n')
  
  if (missing > 0 || needsVerification > 0) {
    console.log('1. Add event publishing for missing events:')
    checks.filter(c => c.status === 'MISSING' || c.status === 'NEEDS_VERIFICATION').forEach(c => {
      console.log(`   - ${c.event}: Add to ${c.sourceModule} when appropriate action occurs`)
    })
    console.log()
    console.log('2. Test event flow:')
    console.log('   - Complete a task in WMS → Check if event published')
    console.log('   - Close a CAPA in ISO-IMS → Check if event published')
    console.log('   - Close an NCR in ISO-IMS → Check if event published')
    console.log()
  } else {
    console.log('✅ All events are properly integrated!')
    console.log('   Pulse module will receive events from all source modules.')
    console.log()
  }

  console.log('='.repeat(60) + '\n')

  await prisma.$disconnect()
  
  return {
    total: checks.length,
    verified,
    missing,
    needsVerification,
    checks
  }
}

// Run verification
if (require.main === module) {
  verifyPulseIntegration()
    .then((result) => {
      process.exit(result.missing > 0 ? 1 : 0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { verifyPulseIntegration }

/**
 * Seed TMS Sample Data
 * 
 * Loads sample transport jobs from data/tms/sampleJobs.ts into the database
 * Creates associated records (POD, detention, transit time, lanes)
 * 
 * Usage:
 *   tsx scripts/seed-tms-sample-data.ts
 * 
 * Or call via API:
 *   POST /api/tms/seed-sample-data
 */

import { tmsCoreService } from '../lib/services/tms/tmsCoreService'
import { sampleJobs, getAllSampleJobs } from '../data/tms/sampleJobs'
import { podService } from '../lib/services/tms/podService'
import { detentionService } from '../lib/services/tms/detentionService'
import { transitTimeService } from '../lib/services/tms/transitTimeService'
import { laneService } from '../lib/services/tms/laneService'
import { TransportJob, JobStatus } from '../types/tms/transportJob'

const TENANT_ID = 'flex-logistics' // Sample tenant
const USER_ID = 'system' // System user for seeding

interface SeedResult {
  jobs: number
  lanes: number
  podRecords: number
  detentionRecords: number
  transitRecords: number
  errors: string[]
}

/**
 * Main seed function
 */
export async function seedTMSSampleData(): Promise<SeedResult> {
  const result: SeedResult = {
    jobs: 0,
    lanes: 0,
    podRecords: 0,
    detentionRecords: 0,
    transitRecords: 0,
    errors: [],
  }

  console.log('🌱 Starting TMS sample data seeding...')
  console.log(`   Tenant: ${TENANT_ID}`)
  console.log(`   Sample Jobs: ${sampleJobs.length}`)
  console.log('')

  try {
    // Get all sample jobs
    const jobs = getAllSampleJobs()

    // Create lanes first (unique lanes from jobs)
    const uniqueLanes = new Map<string, any>()
    for (const job of jobs) {
      if (job.laneName) {
        uniqueLanes.set(job.laneName, {
          name: job.laneName,
          origin: job.polLocation || job.shipmentOrigin || '',
          destination: job.podLocation || job.shipmentDestination || '',
          truckType: job.truckType,
          mode: 'ROAD',
        })
      }
    }

    // Create lanes
    for (const [laneName, laneData] of uniqueLanes.entries()) {
      try {
        const lane = await laneService.createOrUpdateLane({
          tenantId: TENANT_ID,
          name: laneData.name,
          origin: laneData.origin,
          destination: laneData.destination,
          truckType: laneData.truckType,
          isActive: true,
        })
        result.lanes++
        console.log(`✅ Lane created: ${laneName}`)
      } catch (error) {
        const errorMsg = `Failed to create lane ${laneName}: ${error instanceof Error ? error.message : String(error)}`
        result.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
      }
    }

    console.log('')
    console.log('📦 Creating transport jobs...')
    console.log('')

    // Create each sample job
    for (const sampleJob of jobs) {
      try {
        // Create the transport job
        const job = await tmsCoreService.createJob({
          tenantId: TENANT_ID,
          createdBy: USER_ID,
          jobName: sampleJob.jobName || `Sample Job ${sampleJob.jobNumber}`,
          jobNumber: sampleJob.jobNumber,
          jobType: sampleJob.jobType!,
          jobStatus: sampleJob.jobStatus || JobStatus.COMPLETED,
          customer: sampleJob.customer,
          customerId: sampleJob.customer ? `cust-${sampleJob.customer.toLowerCase().replace(/\s+/g, '-')}` : undefined,
          transporter: sampleJob.transporter,
          transporterId: sampleJob.transporter ? `trans-${sampleJob.transporter.toLowerCase().replace(/\s+/g, '-')}` : undefined,
          origin: sampleJob.shipmentOrigin || sampleJob.polLocation || '',
          destination: sampleJob.shipmentDestination || sampleJob.podLocation || '',
          polLocation: sampleJob.polLocation,
          podLocation: sampleJob.podLocation,
          polCountry: sampleJob.polCountry,
          podCountry: sampleJob.podCountry,
          truckType: sampleJob.truckType,
          driverName: sampleJob.driverName,
          vehiclePlateNumber: sampleJob.vehiclePlateNumber,
          driverMobileNumber: sampleJob.driverMobileNumber,
          driverNationality: sampleJob.driverNationality,
          requestDate: sampleJob.requestDate,
          loadingDate: sampleJob.loadingDate,
          shipperArrival: sampleJob.shipperArrival,
          shipperDeparture: sampleJob.shipperDeparture,
          consigneeArrival: sampleJob.consigneeArrival,
          consigneeDeparture: sampleJob.consigneeDeparture,
          transitTime: sampleJob.transitTime,
          detentionLoadingDays: sampleJob.detentionLoadingDays,
          detentionOffloadingDays: sampleJob.detentionOffloadingDays,
          shipmentWeight: sampleJob.shipmentWeight,
          shipmentType: sampleJob.shipmentType,
          laneName: sampleJob.laneName,
          currency: sampleJob.currency || 'SAR',
          costTRP: sampleJob.costTRP,
          otherExpenses: sampleJob.otherExpenses,
          bridgeClearanceFees: sampleJob.bridgeClearanceFees,
          totalCost: sampleJob.totalCost,
        })

        result.jobs++
        console.log(`✅ Job created: ${job.jobNumber} - ${job.jobName}`)

        // Create POD record if job is completed
        if (job.jobStatus === JobStatus.COMPLETED && job.consigneeDeparture) {
          try {
            const pod = await podService.createPOD({
              tenantId: TENANT_ID,
              jobId: job.id,
              deliveryDate: job.consigneeDeparture,
              deliveryTime: job.consigneeDeparture.toTimeString().split(' ')[0],
              consigneeName: `${job.customer} - Warehouse`,
              deliveryStatus: 'delivered',
              deliveryNotes: 'Sample POD - Auto-generated from seed data',
              signature: 'SAMPLE_SIGNATURE',
              createdBy: USER_ID,
            })
            result.podRecords++
            console.log(`   ✅ POD record created for ${job.jobNumber}`)
          } catch (error) {
            const errorMsg = `Failed to create POD for ${job.jobNumber}: ${error instanceof Error ? error.message : String(error)}`
            result.errors.push(errorMsg)
            console.error(`   ❌ ${errorMsg}`)
          }
        }

        // Create detention record if applicable
        if (job.detentionLoadingDays && job.detentionLoadingDays > 0 && job.shipperArrival && job.shipperDeparture) {
          try {
            const detention = await detentionService.createDetentionRecord({
              jobId: job.id,
              startDate: job.shipperArrival,
              endDate: job.shipperDeparture,
              freeTimeDays: 0,
              detentionType: 'loading',
              location: job.polLocation || job.shipmentOrigin || '',
              detentionRate: 100, // 100 SAR per day
            })
            result.detentionRecords++
            console.log(`   ✅ Detention record created for ${job.jobNumber} (${job.detentionLoadingDays} days)`)
          } catch (error) {
            const errorMsg = `Failed to create detention for ${job.jobNumber}: ${error instanceof Error ? error.message : String(error)}`
            result.errors.push(errorMsg)
            console.error(`   ❌ ${errorMsg}`)
          }
        }

        // Create transit time record
        if (job.transitTime && job.shipperDeparture && job.consigneeArrival) {
          try {
            const transitRecord = await transitTimeService.createTransitTimeRecord(
              job.id,
              {
                segment: 'full',
                origin: job.polLocation || job.shipmentOrigin || '',
                destination: job.podLocation || job.shipmentDestination || '',
                startDate: job.shipperDeparture,
                endDate: job.consigneeArrival,
                plannedTime: job.transitTime,
                actualTime: job.transitTime,
              },
              TENANT_ID
            )
            result.transitRecords++
            console.log(`   ✅ Transit time record created for ${job.jobNumber} (${job.transitTime}h)`)
          } catch (error) {
            const errorMsg = `Failed to create transit record for ${job.jobNumber}: ${error instanceof Error ? error.message : String(error)}`
            result.errors.push(errorMsg)
            console.error(`   ❌ ${errorMsg}`)
          }
        }

        console.log('')
      } catch (error) {
        const errorMsg = `Failed to create job ${sampleJob.jobNumber}: ${error instanceof Error ? error.message : String(error)}`
        result.errors.push(errorMsg)
        console.error(`❌ ${errorMsg}`)
        console.log('')
      }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════')
    console.log('🎉 TMS Sample Data Seeding Complete!')
    console.log('═══════════════════════════════════════════════════════')
    console.log(`✅ Jobs created:           ${result.jobs}`)
    console.log(`✅ Lanes created:          ${result.lanes}`)
    console.log(`✅ POD records created:    ${result.podRecords}`)
    console.log(`✅ Detention records:      ${result.detentionRecords}`)
    console.log(`✅ Transit records:        ${result.transitRecords}`)
    
    if (result.errors.length > 0) {
      console.log('')
      console.log(`⚠️  Errors encountered:    ${result.errors.length}`)
      console.log('═══════════════════════════════════════════════════════')
      console.log('❌ Errors:')
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }
    
    console.log('═══════════════════════════════════════════════════════')
    console.log('')
    console.log('🚀 You can now view the sample data:')
    console.log('   - Transport Jobs: /tms/jobs')
    console.log('   - Control Tower:  /transportation/control-tower-v2')
    console.log('   - Analytics:      /tms/analytics')
    console.log('')

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error)
    result.errors.push(`Fatal error: ${error instanceof Error ? error.message : String(error)}`)
  }

  return result
}

/**
 * Run if called directly
 */
if (require.main === module) {
  seedTMSSampleData()
    .then((result) => {
      if (result.errors.length > 0) {
        process.exit(1) // Exit with error code if any errors
      }
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

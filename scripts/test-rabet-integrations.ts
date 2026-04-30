/**
 * Rabet.sa Integration Test Suite
 * 
 * Comprehensive test script for all Rabet.sa integrations
 * Run with: npx tsx scripts/test-rabet-integrations.ts
 */

import { getOrInitializeAthrNaqlService } from '@/lib/services/athr-naql/initialize'
import { getOrInitializeWaslService } from '@/lib/services/wasl/initialize'
import { getOrInitializeBayanService } from '@/lib/services/bayan/initialize'
import { getOrInitializeDaleelService } from '@/lib/services/daleel/initialize'

// Test configuration
const TEST_CONFIG = {
  vehiclePlate: process.env.TEST_VEHICLE_PLATE || 'TEST-1234',
  driverNationalId: process.env.TEST_DRIVER_NATIONAL_ID || '1234567890',
  licenseNumber: process.env.TEST_LICENSE_NUMBER || 'LIC-TEST-123',
  enableDetailedLogs: process.env.TEST_DETAILED_LOGS === 'true',
}

interface TestResult {
  name: string
  success: boolean
  message: string
  duration: number
  error?: string
}

class TestRunner {
  private results: TestResult[] = []

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now()
    try {
      await testFn()
      const duration = Date.now() - startTime
      this.results.push({
        name,
        success: true,
        message: 'PASSED',
        duration,
      })
      console.log(`✅ ${name} (${duration}ms)`)
    } catch (error: any) {
      const duration = Date.now() - startTime
      this.results.push({
        name,
        success: false,
        message: 'FAILED',
        duration,
        error: error.message,
      })
      console.error(`❌ ${name} (${duration}ms): ${error.message}`)
    }
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    
    const passed = this.results.filter(r => r.success).length
    const failed = this.results.filter(r => !r.success).length
    const total = this.results.length
    
    console.log(`Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`)
        })
    }
    
    console.log('='.repeat(60))
  }

  getResults(): TestResult[] {
    return this.results
  }
}

async function main() {
  console.log('🚀 Starting Rabet.sa Integration Tests...\n')
  console.log('Test Configuration:')
  console.log(`  Vehicle Plate: ${TEST_CONFIG.vehiclePlate}`)
  console.log(`  Driver National ID: ${TEST_CONFIG.driverNationalId}`)
  console.log(`  License Number: ${TEST_CONFIG.licenseNumber}`)
  console.log('')

  const runner = new TestRunner()

  // ============================================================================
  // ATHR NAQL TESTS
  // ============================================================================
  console.log('📋 Testing Athr Naql (Pre-Validation)...\n')

  await runner.runTest('Athr Naql - Connection', async () => {
    const service = await getOrInitializeAthrNaqlService()
    const result = await service.testConnection()
    if (!result.success) {
      throw new Error(result.message)
    }
  })

  await runner.runTest('Athr Naql - Operation Card Verification', async () => {
    const service = await getOrInitializeAthrNaqlService()
    const result = await service.verifyOperationCard({
      plateNumber: TEST_CONFIG.vehiclePlate,
    })
    if (TEST_CONFIG.enableDetailedLogs) {
      console.log(`   Status: ${result.operationCardStatus?.status || 'N/A'}`)
    }
  })

  await runner.runTest('Athr Naql - Driver Card Verification', async () => {
    const service = await getOrInitializeAthrNaqlService()
    const result = await service.verifyDriverCard({
      nationalId: TEST_CONFIG.driverNationalId,
    })
    if (TEST_CONFIG.enableDetailedLogs) {
      console.log(`   Status: ${result.driverCardStatus?.status || 'N/A'}`)
    }
  })

  await runner.runTest('Athr Naql - Complete Verification', async () => {
    const service = await getOrInitializeAthrNaqlService()
    const result = await service.verifyVehicleAndDriver(
      TEST_CONFIG.vehiclePlate,
      TEST_CONFIG.driverNationalId
    )
    if (TEST_CONFIG.enableDetailedLogs) {
      console.log(`   All Valid: ${result.allValid}`)
    }
  })

  await runner.runTest('Athr Naql - Get Operation Card Types', async () => {
    const service = await getOrInitializeAthrNaqlService()
    const types = await service.getOperationCardTypes()
    if (types.length === 0) {
      throw new Error('No operation card types returned')
    }
    if (TEST_CONFIG.enableDetailedLogs) {
      console.log(`   Found ${types.length} types`)
    }
  })

  // ============================================================================
  // WASL TESTS
  // ============================================================================
  console.log('\n📋 Testing WASL (Basic Compliance)...\n')

  await runner.runTest('WASL - Connection', async () => {
    const service = await getOrInitializeWaslService()
    const result = await service.testConnection()
    if (!result.success) {
      throw new Error(result.message)
    }
  })

  await runner.runTest('WASL - Vehicle Registration', async () => {
    const service = await getOrInitializeWaslService()
    try {
      await service.registerVehicle({
        plateNumber: TEST_CONFIG.vehiclePlate,
        vehicleType: 'TRUCK',
        vehicleModel: 'Test Model',
        ownerName: 'Test Owner',
        ownerNationalId: TEST_CONFIG.driverNationalId,
      })
    } catch (error: any) {
      // Vehicle might already exist, that's okay for testing
      if (!error.message.includes('already') && !error.message.includes('exists')) {
        throw error
      }
    }
  })

  await runner.runTest('WASL - Driver Registration', async () => {
    const service = await getOrInitializeWaslService()
    try {
      await service.registerDriver({
        nationalId: TEST_CONFIG.driverNationalId,
        fullName: 'Test Driver',
        mobileNumber: '+966501234567',
        licenseNumber: TEST_CONFIG.licenseNumber,
      })
    } catch (error: any) {
      // Driver might already exist, that's okay for testing
      if (!error.message.includes('already') && !error.message.includes('exists')) {
        throw error
      }
    }
  })

  await runner.runTest('WASL - Trip Registration', async () => {
    const service = await getOrInitializeWaslService()
    const trip = await service.registerTrip({
      vehiclePlate: { plateNumber: TEST_CONFIG.vehiclePlate },
      driverNationalId: TEST_CONFIG.driverNationalId,
      origin: {
        address: 'Riyadh, King Fahd Road',
        city: 'Riyadh',
      },
      destination: {
        address: 'Jeddah, Corniche Road',
        city: 'Jeddah',
      },
      plannedStartDate: new Date().toISOString(),
    })
    if (TEST_CONFIG.enableDetailedLogs) {
      console.log(`   Trip Number: ${trip.tripNumber}`)
    }
  })

  // ============================================================================
  // BAYAN TESTS
  // ============================================================================
  console.log('\n📋 Testing Bayan (Advanced Operations)...\n')

  await runner.runTest('Bayan - Connection', async () => {
    const service = await getOrInitializeBayanService()
    const result = await service.testConnection()
    if (!result.success) {
      throw new Error(result.message)
    }
  })

  await runner.runTest('Bayan - Create Freight Forwarder Trip', async () => {
    const service = await getOrInitializeBayanService()
    const trip = await service.createFreightForwarderTrip({
      vehicle: {
        vehiclePlate: { plateNumber: TEST_CONFIG.vehiclePlate },
        vehicleType: 'TRUCK',
      },
      driver: {
        nationalId: TEST_CONFIG.driverNationalId,
        fullName: 'Test Driver',
        licenseNumber: TEST_CONFIG.licenseNumber,
      },
      origin: {
        address: 'Riyadh, King Fahd Road',
        city: 'Riyadh',
      },
      destination: {
        address: 'Jeddah, Corniche Road',
        city: 'Jeddah',
      },
      plannedStartDate: new Date().toISOString(),
    })
    if (TEST_CONFIG.enableDetailedLogs) {
      console.log(`   Trip ID: ${trip.tripId}`)
    }
  })

  // ============================================================================
  // DALEEL TESTS
  // ============================================================================
  console.log('\n📋 Testing Daleel (Real-Time Tracking)...\n')

  await runner.runTest('Daleel - Connection', async () => {
    const service = await getOrInitializeDaleelService()
    const result = await service.testConnection()
    if (!result.success) {
      throw new Error(result.message)
    }
  })

  await runner.runTest('Daleel - Get Current Location', async () => {
    const service = await getOrInitializeDaleelService()
    const location = await service.getCurrentLocationDetails({
      plateNumber: TEST_CONFIG.vehiclePlate,
    })
    if (!location) {
      // Location might not be available for test vehicle - that's okay
      console.log('   ⚠️ No location data available (this is normal for test vehicles)')
    } else if (TEST_CONFIG.enableDetailedLogs) {
      console.log(`   Location: ${location.location.latitude}, ${location.location.longitude}`)
    }
  })

  await runner.runTest('Daleel - Start/Stop Tracking', async () => {
    const service = await getOrInitializeDaleelService()
    await service.startTracking({ plateNumber: TEST_CONFIG.vehiclePlate })
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
    await service.stopTracking({ plateNumber: TEST_CONFIG.vehiclePlate })
  })

  // ============================================================================
  // SUMMARY
  // ============================================================================
  runner.printSummary()

  // Exit with appropriate code
  const failed = runner.getResults().filter(r => !r.success).length
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { main as runRabetTests }




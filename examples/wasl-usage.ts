/**
 * WASL Integration Usage Examples
 * 
 * This file demonstrates how to use the WASL integration
 * Run with: npx tsx examples/wasl-usage.ts
 */

import { initializeWaslService } from '@/lib/services/wasl/initialize'
import type { EffVehicleCreateDto, EffDriverCreateDto, EffTripCreateDto } from '@/types/wasl'

async function main() {
  console.log('🚀 WASL Integration Examples\n')

  // Initialize WASL service
  const waslService = await initializeWaslService({
    appId: process.env.WASL_APP_ID || process.env.RABET_APP_ID || '',
    appKey: process.env.WASL_APP_KEY || process.env.RABET_APP_KEY || '',
    apiBaseUrl: 'https://www.rabet.sa',
    environment: 'production',
    enableLogging: true,
  })

  if (!process.env.WASL_APP_ID && !process.env.RABET_APP_ID) {
    console.warn('⚠️ Missing WASL/Rabet credentials (WASL_APP_ID or RABET_APP_ID).')
    console.warn('   Set them in `.env.local` before running this example.')
  }

  console.log('✅ WASL Service initialized\n')

  // Example 1: Register a vehicle
  console.log('📝 Example 1: Register Vehicle')
  try {
    const vehicleData: EffVehicleCreateDto = {
      plateNumber: 'ABC-1234',
      plateType: 'PRIVATE',
      vehicleType: 'TRUCK',
      vehicleModel: 'Mercedes Actros',
      vehicleYear: 2023,
      vehicleColor: 'White',
      chassisNumber: 'WDB1234567890',
      engineNumber: 'ENG123456',
      ownerName: 'John Doe',
      ownerNationalId: '1234567890',
      registrationExpiryDate: '2025-12-31',
      insuranceExpiryDate: '2025-12-31',
    }

    const vehicle = await waslService.registerVehicle(vehicleData)
    console.log('✅ Vehicle registered:', vehicle.plateNumber)
    console.log('   Status:', vehicle.status)
    console.log('   Registered at:', vehicle.registeredAt)
  } catch (error: any) {
    console.error('❌ Error registering vehicle:', error.message)
  }

  console.log('\n')

  // Example 2: Register a driver
  console.log('📝 Example 2: Register Driver')
  try {
    const driverData: EffDriverCreateDto = {
      nationalId: '1234567890',
      fullName: 'John Doe',
      mobileNumber: '+966501234567',
      email: 'john.doe@example.com',
      licenseNumber: 'DL-123456',
      licenseType: 'HEAVY',
      licenseExpiryDate: '2025-12-31',
      dateOfBirth: '1990-01-01',
      address: 'Riyadh, Saudi Arabia',
    }

    const driver = await waslService.registerDriver(driverData)
    console.log('✅ Driver registered:', driver.fullName)
    console.log('   National ID:', driver.nationalId)
    console.log('   License:', driver.licenseNumber)
    console.log('   Status:', driver.status)
  } catch (error: any) {
    console.error('❌ Error registering driver:', error.message)
  }

  console.log('\n')

  // Example 3: Register a trip
  console.log('📝 Example 3: Register Trip')
  try {
    const tripData: EffTripCreateDto = {
      vehiclePlate: {
        plateNumber: 'ABC-1234',
        plateType: 'PRIVATE',
      },
      driverNationalId: '1234567890',
      origin: {
        address: 'Riyadh, King Fahd Road, Building 123',
        city: 'Riyadh',
        region: 'Riyadh',
        coordinates: {
          latitude: 24.7136,
          longitude: 46.6753,
        },
      },
      destination: {
        address: 'Jeddah, Corniche Road, Building 456',
        city: 'Jeddah',
        region: 'Makkah',
        coordinates: {
          latitude: 21.4858,
          longitude: 39.1925,
        },
      },
      plannedStartDate: new Date().toISOString(),
      plannedEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      cargoDescription: 'Electronics and consumer goods',
      cargoWeight: 5000, // kg
      cargoValue: 100000, // SAR
      tripType: 'FREIGHT',
    }

    const trip = await waslService.registerTrip(tripData)
    console.log('✅ Trip registered:', trip.tripNumber)
    console.log('   Origin:', trip.origin.address)
    console.log('   Destination:', trip.destination.address)
    console.log('   Status:', trip.status)
    console.log('   Planned start:', trip.plannedStartDate)
  } catch (error: any) {
    console.error('❌ Error registering trip:', error.message)
  }

  console.log('\n')

  // Example 4: Update trip status
  console.log('📝 Example 4: Update Trip')
  try {
    const tripNumber = 'TRIP-123456' // Use actual trip number from previous step
    const updatedTrip = await waslService.updateTrip(tripNumber, {
      tripNumber,
      status: 'IN_PROGRESS',
      actualStartDate: new Date().toISOString(),
      currentLocation: {
        address: 'Riyadh, Exit 15',
        coordinates: {
          latitude: 24.7136,
          longitude: 46.6753,
        },
        timestamp: new Date().toISOString(),
      },
    })
    console.log('✅ Trip updated:', updatedTrip.tripNumber)
    console.log('   Status:', updatedTrip.status)
    console.log('   Current location:', updatedTrip.currentLocation?.address)
  } catch (error: any) {
    console.error('❌ Error updating trip:', error.message)
  }

  console.log('\n')

  // Example 5: Test connection
  console.log('📝 Example 5: Test Connection')
  try {
    const testResult = await waslService.testConnection()
    console.log('✅ Connection test:', testResult.message)
  } catch (error: any) {
    console.error('❌ Connection test failed:', error.message)
  }

  console.log('\n✅ All examples completed!')
}

// Run examples
if (require.main === module) {
  main().catch(console.error)
}

export { main as runWaslExamples }




/**
 * Direct Rabet.sa Test - Uses credentials directly
 * 
 * Run with: npx tsx scripts/test-rabet-direct.ts
 */

// Credentials MUST come from environment variables (never hardcode secrets in repo)
const CREDENTIALS = {
  // Accept either RABET_* or WASL_* naming (some services share the same credentials)
  appId: process.env.RABET_APP_ID || process.env.WASL_APP_ID || '',
  appKey: process.env.RABET_APP_KEY || process.env.WASL_APP_KEY || '',
  // Daleel needs username/password
  daleelUsername: process.env.DALEEL_USERNAME || process.env.RABET_USERNAME || '',
  daleelPassword: process.env.DALEEL_PASSWORD || process.env.RABET_PASSWORD || '',
}

async function testDirect() {
  console.log('🧪 Testing Rabet.sa APIs with Direct Credentials...\n')
  if (!CREDENTIALS.appId || !CREDENTIALS.appKey) {
    console.log('❌ Missing credentials.')
    console.log('💡 Set environment variables in `.env.local`, for example:')
    console.log('   RABET_APP_ID=...')
    console.log('   RABET_APP_KEY=...')
    console.log('   (or WASL_APP_ID / WASL_APP_KEY)')
    process.exit(1)
  }
  console.log('App ID: [set]')
  console.log('App Key: [set]')
  console.log('')

  const results: Array<{ name: string; success: boolean; message: string; error?: any }> = []

  // Test 1: Athr Naql
  console.log('1️⃣ Testing Athr Naql...')
  try {
    const { initializeAthrNaqlService } = await import('@/lib/services/athr-naql/initialize')
    const service = await initializeAthrNaqlService({
      appId: CREDENTIALS.appId,
      appKey: CREDENTIALS.appKey,
      apiBaseUrl: 'https://www.rabet.sa',
    })
    const result = await service.testConnection()
    results.push({ name: 'Athr Naql', success: result.success, message: result.message })
    console.log(`   ${result.success ? '✅' : '❌'} ${result.message}`)
    
    // Try actual API call
    if (result.success) {
      try {
        const verification = await service.verifyOperationCard({
          plateNumber: 'TEST-1234',
        })
        console.log(`   📋 Operation Card Check: ${verification.operationCardValid ? 'Valid' : 'Invalid'}`)
      } catch (e: any) {
        console.log(`   ⚠️ Operation Card Check: ${e.message}`)
      }
    }
  } catch (error: any) {
    results.push({ name: 'Athr Naql', success: false, message: error.message, error })
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Test 2: WASL
  console.log('\n2️⃣ Testing WASL...')
  try {
    const { initializeWaslService } = await import('@/lib/services/wasl/initialize')
    const service = await initializeWaslService({
      appId: CREDENTIALS.appId,
      appKey: CREDENTIALS.appKey,
      apiBaseUrl: 'https://www.rabet.sa',
    })
    const result = await service.testConnection()
    results.push({ name: 'WASL', success: result.success, message: result.message })
    console.log(`   ${result.success ? '✅' : '❌'} ${result.message}`)
    
    // Try actual API call
    if (result.success) {
      try {
        const trip = await service.registerTrip({
          vehiclePlate: { plateNumber: 'TEST-1234' },
          driverNationalId: '1234567890',
          origin: { address: 'Riyadh' },
          destination: { address: 'Jeddah' },
          plannedStartDate: new Date().toISOString(),
        })
        console.log(`   📋 Trip Registration: Success - ${trip.tripNumber}`)
      } catch (e: any) {
        console.log(`   ⚠️ Trip Registration: ${e.message}`)
      }
    }
  } catch (error: any) {
    results.push({ name: 'WASL', success: false, message: error.message, error })
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Test 3: Bayan
  console.log('\n3️⃣ Testing Bayan...')
  try {
    const { initializeBayanService } = await import('@/lib/services/bayan/initialize')
    const service = await initializeBayanService({
      appId: CREDENTIALS.appId,
      appKey: CREDENTIALS.appKey,
      apiBaseUrl: 'https://www.rabet.sa',
    })
    const result = await service.testConnection()
    results.push({ name: 'Bayan', success: result.success, message: result.message })
    console.log(`   ${result.success ? '✅' : '❌'} ${result.message}`)
    
    // Try actual API call
    if (result.success) {
      try {
        const trip = await service.createFreightForwarderTrip({
          vehicle: { vehiclePlate: { plateNumber: 'TEST-1234' } },
          driver: { nationalId: '1234567890', fullName: 'Test Driver' },
          origin: { address: 'Riyadh' },
          destination: { address: 'Jeddah' },
          plannedStartDate: new Date().toISOString(),
        })
        console.log(`   📋 Trip Creation: Success - ${trip.tripId}`)
      } catch (e: any) {
        console.log(`   ⚠️ Trip Creation: ${e.message}`)
      }
    }
  } catch (error: any) {
    results.push({ name: 'Bayan', success: false, message: error.message, error })
    console.log(`   ❌ Error: ${error.message}`)
  }

  // Test 4: Daleel
  console.log('\n4️⃣ Testing Daleel...')
  if (!CREDENTIALS.daleelUsername || !CREDENTIALS.daleelPassword) {
    results.push({ name: 'Daleel', success: false, message: 'Username/password not provided' })
    console.log('   ⚠️ Skipped: Daleel requires username/password (not app_id/app_key)')
    console.log('   💡 Set DALEEL_USERNAME and DALEEL_PASSWORD environment variables')
  } else {
    try {
      const { initializeDaleelService } = await import('@/lib/services/daleel/initialize')
      const service = await initializeDaleelService({
        username: CREDENTIALS.daleelUsername,
        password: CREDENTIALS.daleelPassword,
        apiBaseUrl: 'https://www.rabet.sa',
      })
      const result = await service.testConnection()
      results.push({ name: 'Daleel', success: result.success, message: result.message })
      console.log(`   ${result.success ? '✅' : '❌'} ${result.message}`)
    } catch (error: any) {
      results.push({ name: 'Daleel', success: false, message: error.message, error })
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST RESULTS')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.success).length
  const total = results.length
  
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}: ${r.message}`)
    if (r.error && r.error.stack) {
      console.log(`   Details: ${r.error.message}`)
    }
  })
  
  console.log('='.repeat(60))
  console.log(`Results: ${passed}/${total} passed`)
  console.log('='.repeat(60))

  // Detailed error info
  const failed = results.filter(r => !r.success)
  if (failed.length > 0) {
    console.log('\n❌ FAILED TESTS DETAILS:')
    failed.forEach(r => {
      console.log(`\n${r.name}:`)
      console.log(`  Message: ${r.message}`)
      if (r.error) {
        console.log(`  Error: ${r.error.message || r.error}`)
        if (r.error.cause) {
          console.log(`  Cause: ${JSON.stringify(r.error.cause, null, 2)}`)
        }
      }
    })
  }

  return results
}

if (require.main === module) {
  testDirect()
    .then(results => {
      const allPassed = results.every(r => r.success)
      process.exit(allPassed ? 0 : 1)
    })
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { testDirect }




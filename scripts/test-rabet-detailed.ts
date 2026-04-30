/**
 * Detailed Rabet.sa Test - Shows actual API responses
 */

const CREDENTIALS = {
  // Accept either RABET_* or WASL_* naming (some services share the same credentials)
  appId: process.env.RABET_APP_ID || process.env.WASL_APP_ID || '',
  appKey: process.env.RABET_APP_KEY || process.env.WASL_APP_KEY || '',
}

async function testDetailed() {
  console.log('🔍 Detailed API Test - Checking Actual Responses...\n')
  if (!CREDENTIALS.appId || !CREDENTIALS.appKey) {
    console.log('❌ Missing credentials.')
    console.log('💡 Set environment variables in `.env.local`, for example:')
    console.log('   RABET_APP_ID=...')
    console.log('   RABET_APP_KEY=...')
    console.log('   (or WASL_APP_ID / WASL_APP_KEY)')
    process.exit(1)
  }

  // Test WASL POST /eff/v1/trips directly
  console.log('Testing WASL POST /eff/v1/trips...')
  try {
    const url = 'https://www.rabet.sa/eff/v1/trips'
    const headers = {
      'app_id': CREDENTIALS.appId,
      'app_key': CREDENTIALS.appKey,
      'Content-Type': 'application/json',
    }
    const body = JSON.stringify({
      vehiclePlate: { plateNumber: 'TEST-1234' },
      driverNationalId: '1234567890',
      origin: { address: 'Riyadh' },
      destination: { address: 'Jeddah' },
      plannedStartDate: new Date().toISOString(),
    })

    console.log('Request URL:', url)
    console.log('Request Headers:', JSON.stringify(headers, null, 2))
    console.log('Request Body:', body)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })

    console.log('Response Status:', response.status, response.statusText)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)

    if (!response.ok) {
      console.log('\n❌ Request failed!')
      console.log('Status:', response.status)
      console.log('Status Text:', response.statusText)
      console.log('Response:', responseText)
    } else {
      console.log('\n✅ Request successful!')
      console.log('Response:', responseText)
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }

  // Test Bayan POST /api/v1/freight-forwarder/trip
  console.log('\n\nTesting Bayan POST /api/v1/freight-forwarder/trip...')
  try {
    const url = 'https://www.rabet.sa/api/v1/freight-forwarder/trip'
    const headers = {
      'app_id': CREDENTIALS.appId,
      'app_key': CREDENTIALS.appKey,
      'Content-Type': 'application/json',
    }
    const body = JSON.stringify({
      vehicle: {
        vehiclePlate: { plateNumber: 'TEST-1234' },
        vehicleType: 'TRUCK',
      },
      driver: {
        nationalId: '1234567890',
        fullName: 'Test Driver',
      },
      origin: { address: 'Riyadh' },
      destination: { address: 'Jeddah' },
      plannedStartDate: new Date().toISOString(),
    })

    console.log('Request URL:', url)
    console.log('Request Headers:', JSON.stringify(headers, null, 2))
    console.log('Request Body:', body)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })

    console.log('Response Status:', response.status, response.statusText)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)

    if (!response.ok) {
      console.log('\n❌ Request failed!')
      console.log('Status:', response.status)
      console.log('Status Text:', response.statusText)
      console.log('Response:', responseText)
    } else {
      console.log('\n✅ Request successful!')
      console.log('Response:', responseText)
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }

  // Test Athr Naql POST /naql/v1/operation-card/inquiry/status
  console.log('\n\nTesting Athr Naql POST /naql/v1/operation-card/inquiry/status...')
  try {
    const url = 'https://www.rabet.sa/naql/v1/operation-card/inquiry/status'
    const headers = {
      'app_id': CREDENTIALS.appId,
      'app_key': CREDENTIALS.appKey,
      'Content-Type': 'application/json',
    }
    const body = JSON.stringify({
      plateNumber: 'TEST-1234',
    })

    console.log('Request URL:', url)
    console.log('Request Headers:', JSON.stringify(headers, null, 2))
    console.log('Request Body:', body)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    })

    console.log('Response Status:', response.status, response.statusText)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('Response Body:', responseText)

    if (!response.ok) {
      console.log('\n❌ Request failed!')
      console.log('Status:', response.status)
      console.log('Status Text:', response.statusText)
      console.log('Response:', responseText)
    } else {
      console.log('\n✅ Request successful!')
      console.log('Response:', responseText)
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  }
}

testDetailed().catch(console.error)




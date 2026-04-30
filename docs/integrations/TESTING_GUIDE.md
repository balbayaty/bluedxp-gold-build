# Rabet.sa Integration Testing Guide

## 🎯 Overview

This guide helps you test all Rabet.sa integrations to ensure they work correctly.

## 📋 Prerequisites

1. **Environment Variables** - Set up all credentials
2. **Test Data** - Prepare test vehicle plates, driver IDs, etc.
3. **API Access** - Ensure your account has access to all APIs

## 🔧 Setup

### 1. Environment Variables

Create a `.env.test` file or add to your `.env`:

```env
# WASL (EFF) - Basic Compliance
WASL_APP_ID=YOUR_APP_ID
WASL_APP_KEY=YOUR_APP_KEY
WASL_API_BASE_URL=https://www.rabet.sa

# Bayan (EFF) - Advanced Operations
BAYAN_APP_ID=YOUR_APP_ID
BAYAN_APP_KEY=YOUR_APP_KEY
BAYAN_API_BASE_URL=https://www.rabet.sa

# Daleel (Waybill) - Real-Time Tracking
DALEEL_USERNAME=your_username
DALEEL_PASSWORD=your_password
DALEEL_API_BASE_URL=https://www.rabet.sa

# Athr Naql - Pre-Validation
ATHR_NAQL_APP_ID=YOUR_APP_ID
ATHR_NAQL_APP_KEY=YOUR_APP_KEY
ATHR_NAQL_API_BASE_URL=https://www.rabet.sa
```

### 2. Test Data

Prepare test data:

```typescript
// Test vehicle
const testVehicle = {
  plateNumber: 'TEST-1234',
  plateType: 'PRIVATE',
  vehicleType: 'TRUCK',
  vehicleModel: 'Mercedes Actros',
  vehicleYear: 2023,
  ownerName: 'Test Owner',
  ownerNationalId: '1234567890',
}

// Test driver
const testDriver = {
  nationalId: '1234567890',
  fullName: 'Test Driver',
  mobileNumber: '+966501234567',
  licenseNumber: 'DL-TEST-123',
  licenseType: 'HEAVY',
}

// Test trip
const testTrip = {
  origin: {
    address: 'Riyadh, King Fahd Road',
    city: 'Riyadh',
    region: 'Riyadh',
  },
  destination: {
    address: 'Jeddah, Corniche Road',
    city: 'Jeddah',
    region: 'Makkah',
  },
}
```

## 🧪 Testing Each API

### Test 1: Athr Naql (Pre-Validation)

```typescript
import { getOrInitializeAthrNaqlService } from '@/lib/services/athr-naql/initialize'

async function testAthrNaql() {
  console.log('🧪 Testing Athr Naql...')
  
  const service = await getOrInitializeAthrNaqlService()
  
  // Test 1.1: Connection
  const connection = await service.testConnection()
  console.log('✅ Connection:', connection.success ? 'OK' : 'FAILED')
  
  // Test 1.2: Verify Operation Card
  const vehicleVerification = await service.verifyOperationCard({
    plateNumber: 'TEST-1234',
  })
  console.log('✅ Operation Card:', vehicleVerification.operationCardValid ? 'VALID' : 'INVALID')
  
  // Test 1.3: Verify Driver Card
  const driverVerification = await service.verifyDriverCard({
    nationalId: '1234567890',
  })
  console.log('✅ Driver Card:', driverVerification.driverCardValid ? 'VALID' : 'INVALID')
  
  // Test 1.4: Complete Verification
  const completeVerification = await service.verifyVehicleAndDriver(
    'TEST-1234',
    '1234567890'
  )
  console.log('✅ Complete Verification:', completeVerification.allValid ? 'ALL VALID' : 'FAILED')
  
  // Test 1.5: Get Types
  const operationCardTypes = await service.getOperationCardTypes()
  console.log('✅ Operation Card Types:', operationCardTypes.length)
  
  const licenseTypes = await service.getLicenseTypes()
  console.log('✅ License Types:', licenseTypes.length)
  
  const driverCardCategories = await service.getDriverCardCategoryTypes()
  console.log('✅ Driver Card Categories:', driverCardCategories.length)
}

testAthrNaql().catch(console.error)
```

### Test 2: WASL (Basic Compliance)

```typescript
import { getOrInitializeWaslService } from '@/lib/services/wasl/initialize'

async function testWASL() {
  console.log('🧪 Testing WASL...')
  
  const service = await getOrInitializeWaslService()
  
  // Test 2.1: Connection
  const connection = await service.testConnection()
  console.log('✅ Connection:', connection.success ? 'OK' : 'FAILED')
  
  // Test 2.2: Register Vehicle
  try {
    const vehicle = await service.registerVehicle({
      plateNumber: 'TEST-1234',
      vehicleType: 'TRUCK',
      vehicleModel: 'Mercedes Actros',
      ownerName: 'Test Owner',
      ownerNationalId: '1234567890',
    })
    console.log('✅ Vehicle Registered:', vehicle.plateNumber)
  } catch (error: any) {
    console.log('⚠️ Vehicle Registration:', error.message)
  }
  
  // Test 2.3: Register Driver
  try {
    const driver = await service.registerDriver({
      nationalId: '1234567890',
      fullName: 'Test Driver',
      mobileNumber: '+966501234567',
      licenseNumber: 'DL-TEST-123',
    })
    console.log('✅ Driver Registered:', driver.fullName)
  } catch (error: any) {
    console.log('⚠️ Driver Registration:', error.message)
  }
  
  // Test 2.4: Register Trip
  try {
    const trip = await service.registerTrip({
      vehiclePlate: { plateNumber: 'TEST-1234' },
      driverNationalId: '1234567890',
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
    console.log('✅ Trip Registered:', trip.tripNumber)
  } catch (error: any) {
    console.log('⚠️ Trip Registration:', error.message)
  }
}

testWASL().catch(console.error)
```

### Test 3: Bayan (Advanced Operations)

```typescript
import { getOrInitializeBayanService } from '@/lib/services/bayan/initialize'

async function testBayan() {
  console.log('🧪 Testing Bayan...')
  
  const service = await getOrInitializeBayanService()
  
  // Test 3.1: Connection
  const connection = await service.testConnection()
  console.log('✅ Connection:', connection.success ? 'OK' : 'FAILED')
  
  // Test 3.2: Create Freight Forwarder Trip
  try {
    const trip = await service.createFreightForwarderTrip({
      vehicle: {
        vehiclePlate: { plateNumber: 'TEST-1234' },
        vehicleType: 'TRUCK',
      },
      driver: {
        nationalId: '1234567890',
        fullName: 'Test Driver',
        licenseNumber: 'DL-TEST-123',
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
    console.log('✅ Trip Created:', trip.tripId)
    
    // Test 3.3: Add Waybill
    try {
      const waybill = await service.addWaybill({
        tripId: trip.tripId,
        customer: {
          name: 'Test Customer',
          nationalId: '9876543210',
        },
        items: [
          {
            description: 'Test Cargo',
            quantity: 10,
            weight: 500,
            value: 10000,
          },
        ],
        origin: {
          address: 'Riyadh',
        },
        destination: {
          address: 'Jeddah',
        },
      })
      console.log('✅ Waybill Added:', waybill.waybillId || waybill.waybillNumber)
    } catch (error: any) {
      console.log('⚠️ Waybill Addition:', error.message)
    }
  } catch (error: any) {
    console.log('⚠️ Trip Creation:', error.message)
  }
}

testBayan().catch(console.error)
```

### Test 4: Daleel (Real-Time Tracking)

```typescript
import { getOrInitializeDaleelService } from '@/lib/services/daleel/initialize'

async function testDaleel() {
  console.log('🧪 Testing Daleel...')
  
  const service = await getOrInitializeDaleelService()
  
  // Test 4.1: Connection
  const connection = await service.testConnection()
  console.log('✅ Connection:', connection.success ? 'OK' : 'FAILED')
  
  // Test 4.2: Get Current Location
  try {
    const location = await service.getCurrentLocationDetails({
      plateNumber: 'TEST-1234',
    })
    if (location) {
      console.log('✅ Current Location:', {
        lat: location.location.latitude,
        lng: location.location.longitude,
        address: location.address,
        speed: location.speed,
      })
    } else {
      console.log('⚠️ No location data available')
    }
  } catch (error: any) {
    console.log('⚠️ Location Query:', error.message)
  }
  
  // Test 4.3: Get Location History
  try {
    const history = await service.getLocationHistory(
      { plateNumber: 'TEST-1234' },
      new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      new Date()
    )
    console.log('✅ Location History:', history.length, 'points')
  } catch (error: any) {
    console.log('⚠️ History Query:', error.message)
  }
  
  // Test 4.4: Start Tracking
  try {
    await service.startTracking({ plateNumber: 'TEST-1234' })
    console.log('✅ Tracking Started')
    
    // Wait a bit for updates
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Stop tracking
    await service.stopTracking({ plateNumber: 'TEST-1234' })
    console.log('✅ Tracking Stopped')
  } catch (error: any) {
    console.log('⚠️ Tracking:', error.message)
  }
}

testDaleel().catch(console.error)
```

## 🔄 Integration Testing

### Test Complete Workflow

```typescript
import { getAthrNaqlService } from '@/lib/services/athr-naql/initialize'
import { getWaslService } from '@/lib/services/wasl/initialize'
import { getBayanService } from '@/lib/services/bayan/initialize'
import { getDaleelService } from '@/lib/services/daleel/initialize'

async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete Workflow...')
  
  const vehiclePlate = 'TEST-1234'
  const driverNationalId = '1234567890'
  
  // Step 1: Pre-Validate
  console.log('\n1️⃣ Pre-Validation (Athr Naql)...')
  const athrNaqlService = getAthrNaqlService()
  if (athrNaqlService) {
    const verification = await athrNaqlService.verifyVehicleAndDriver(
      vehiclePlate,
      driverNationalId
    )
    console.log('   ✅ Verification:', verification.allValid ? 'PASSED' : 'FAILED')
    if (!verification.allValid) {
      console.log('   ⚠️ Cannot proceed - validation failed')
      return
    }
  }
  
  // Step 2: Register (WASL)
  console.log('\n2️⃣ Registration (WASL)...')
  const waslService = getWaslService()
  if (waslService) {
    try {
      const trip = await waslService.registerTrip({
        vehiclePlate: { plateNumber: vehiclePlate },
        driverNationalId,
        origin: { address: 'Riyadh' },
        destination: { address: 'Jeddah' },
        plannedStartDate: new Date().toISOString(),
      })
      console.log('   ✅ Trip Registered:', trip.tripNumber)
    } catch (error: any) {
      console.log('   ⚠️ Registration:', error.message)
    }
  }
  
  // Step 3: Create Trip (Bayan)
  console.log('\n3️⃣ Create Trip (Bayan)...')
  const bayanService = getBayanService()
  if (bayanService) {
    try {
      const trip = await bayanService.createFreightForwarderTrip({
        vehicle: { vehiclePlate: { plateNumber: vehiclePlate } },
        driver: { nationalId: driverNationalId, fullName: 'Test Driver' },
        origin: { address: 'Riyadh' },
        destination: { address: 'Jeddah' },
        plannedStartDate: new Date().toISOString(),
      })
      console.log('   ✅ Trip Created:', trip.tripId)
    } catch (error: any) {
      console.log('   ⚠️ Trip Creation:', error.message)
    }
  }
  
  // Step 4: Start Tracking (Daleel)
  console.log('\n4️⃣ Start Tracking (Daleel)...')
  const daleelService = getDaleelService()
  if (daleelService) {
    try {
      await daleelService.startTracking({ plateNumber: vehiclePlate })
      console.log('   ✅ Tracking Started')
    } catch (error: any) {
      console.log('   ⚠️ Tracking:', error.message)
    }
  }
  
  console.log('\n✅ Complete Workflow Test Finished!')
}

testCompleteWorkflow().catch(console.error)
```

## 🛠️ Running Tests

### Option 1: Using Node.js

```bash
# Run individual tests
npx tsx scripts/test-athr-naql.ts
npx tsx scripts/test-wasl.ts
npx tsx scripts/test-bayan.ts
npx tsx scripts/test-daleel.ts

# Run complete workflow test
npx tsx scripts/test-complete-workflow.ts
```

### Option 2: Using Test Runner

```bash
# Install test dependencies
npm install --save-dev jest @types/jest ts-jest

# Run all tests
npm test
```

### Option 3: Manual Testing via API Routes

Create API routes for testing:

```typescript
// app/api/test/rabet/route.ts
import { NextResponse } from 'next/server'
import { getOrInitializeAthrNaqlService } from '@/lib/services/athr-naql/initialize'

export async function GET() {
  try {
    const service = await getOrInitializeAthrNaqlService()
    const result = await service.testConnection()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}
```

Then test via:
- Browser: `http://localhost:3000/api/test/rabet`
- curl: `curl http://localhost:3000/api/test/rabet`

## ✅ Test Checklist

### Athr Naql
- [ ] Connection test
- [ ] Operation card verification
- [ ] License verification
- [ ] Driver card verification
- [ ] Complete verification
- [ ] Get types (operation card, license, driver card)

### WASL
- [ ] Connection test
- [ ] Vehicle registration
- [ ] Driver registration
- [ ] Trip registration
- [ ] Trip update
- [ ] Vehicle deletion
- [ ] Driver deletion

### Bayan
- [ ] Connection test
- [ ] Create freight forwarder trip
- [ ] Create carrier trip
- [ ] Add waybill
- [ ] Update waybill
- [ ] Close waybill
- [ ] Cancel waybill
- [ ] Print trip

### Daleel
- [ ] Connection test
- [ ] Get current location
- [ ] Get location history
- [ ] Start tracking
- [ ] Stop tracking
- [ ] Polygon search
- [ ] Weight drop locations

### Integration
- [ ] Complete workflow (all APIs)
- [ ] Event Bus integration
- [ ] Error handling
- [ ] Retry logic
- [ ] Circuit breaker

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check credentials in `.env`
   - Verify app_id and app_key are correct
   - Check if account has API access

2. **Connection Timeout**
   - Check network connectivity
   - Verify API base URL
   - Check firewall settings

3. **Invalid Data**
   - Verify test data format
   - Check required fields
   - Validate data types

4. **Rate Limiting**
   - Reduce request frequency
   - Implement retry with backoff
   - Check API rate limits

## 📊 Expected Results

### Successful Test Output

```
🧪 Testing Athr Naql...
✅ Connection: OK
✅ Operation Card: VALID
✅ Driver Card: VALID
✅ Complete Verification: ALL VALID
✅ Operation Card Types: 5
✅ License Types: 3
✅ Driver Card Categories: 4

🧪 Testing WASL...
✅ Connection: OK
✅ Vehicle Registered: TEST-1234
✅ Driver Registered: Test Driver
✅ Trip Registered: TRIP-123456

🧪 Testing Bayan...
✅ Connection: OK
✅ Trip Created: TRIP-789012
✅ Waybill Added: WB-345678

🧪 Testing Daleel...
✅ Connection: OK
✅ Current Location: { lat: 24.7136, lng: 46.6753, ... }
✅ Location History: 150 points
✅ Tracking Started
✅ Tracking Stopped
```

## 🎯 Next Steps

1. **Run Tests**: Execute all test scripts
2. **Review Results**: Check for any failures
3. **Fix Issues**: Address any problems found
4. **Document**: Update documentation with findings
5. **Deploy**: Once all tests pass, deploy to production




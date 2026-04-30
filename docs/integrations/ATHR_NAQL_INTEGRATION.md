# Athr Naql (Transportation Impact) Integration Guide

## 🎯 Overview

Athr Naql (Transportation Impact) API provides **verification and inquiry services** for transportation operations. This API allows you to:

- **Verify Operation Cards**: Check if vehicles have valid operation permits
- **Verify Licenses**: Check if transportation licenses are valid
- **Verify Driver Cards**: Check if drivers have valid driver cards
- **Pre-validate**: Verify vehicles and drivers before creating trips

## ✅ What Athr Naql Adds to Your Platform

### 1. **Pre-Validation** ✅
- Verify vehicles before trip creation
- Verify drivers before assignment
- Verify licenses before operations
- Prevent invalid operations

### 2. **Operation Card Verification** ✅
- Check operation card status
- Get operation card types
- Validate vehicle permits

### 3. **License Verification** ✅
- Check license status (V1 and V2)
- Get license types
- Validate transportation licenses

### 4. **Driver Card Verification** ✅
- Check driver card status
- Verify by sponsor ID
- Get driver card categories

### 5. **Integration with TMS** ✅
- Auto-verify before trip creation
- Event-driven validation
- Prevent invalid trips

## 📡 API Endpoints

### Operation Card Endpoints

✅ **POST** `/naql/v1/operation-card/inquiry/status` - Inquire operation card status  
✅ **GET** `/naql/v1/operation-card/inquiry/types` - Get all operation card types  
✅ **GET** `/naql/v1/operation-card/inquiry/types/{id}` - Get operation card type  

### License Endpoints

✅ **POST** `/naql/v1/license/inquiry/status` - Inquire license status (V1)  
✅ **POST** `/naql/v2/license/inquiry/status` - Inquire license status (V2)  
✅ **GET** `/naql/v1/license/inquiry/types` - Get all license types  
✅ **GET** `/naql/v1/license/inquiry/types/{id}` - Get license type  

### Driver Card Endpoints

✅ **POST** `/naql/v1/driver-card/inquiry/status` - Inquire driver card status  
✅ **POST** `/naql/v1/driver-card/inquiry/status/by-sponsor-id` - Inquire by sponsor ID  
✅ **GET** `/naql/v1/driver-card/inquiry/category-type` - Get driver card categories  

## 🚀 Quick Start

### 1. Environment Variables

Add to your `.env` file:

```env
# Never commit real credentials. Use `.env.local` for local development.
ATHR_NAQL_APP_ID=YOUR_APP_ID
ATHR_NAQL_APP_KEY=YOUR_APP_KEY
ATHR_NAQL_API_BASE_URL=https://www.rabet.sa
```

### 2. Initialize Service

```typescript
import { getOrInitializeAthrNaqlService } from '@/lib/services/athr-naql/initialize'

const athrNaqlService = await getOrInitializeAthrNaqlService()
```

### 3. Use the Service

```typescript
// Verify vehicle and driver before trip
const verification = await athrNaqlService.verifyVehicleAndDriver(
  'ABC-1234',  // Vehicle plate
  '1234567890' // Driver national ID
)

if (verification.allValid) {
  console.log('✅ All valid - can proceed with trip')
} else {
  console.log('❌ Validation failed:', {
    vehicle: verification.vehicle.operationCardValid,
    driver: verification.driver.driverCardValid,
  })
}

// Verify operation card
const vehicleVerification = await athrNaqlService.verifyOperationCard({
  plateNumber: 'ABC-1234',
})

// Verify driver card
const driverVerification = await athrNaqlService.verifyDriverCard({
  nationalId: '1234567890',
})

// Verify license
const licenseValid = await athrNaqlService.verifyLicense({
  licenseNumber: 'LIC-123456',
})
```

## 🔗 Integration with Your Platform

### Automatic Pre-Validation

```typescript
import { eventBus } from '@/lib/services/event-store'
import { getAthrNaqlService } from '@/lib/services/athr-naql/initialize'

// Verify before trip creation
eventBus.subscribe('tms.shipment.creating', async (event) => {
  const shipment = event.payload
  const athrNaqlService = getAthrNaqlService()
  
  if (athrNaqlService) {
    const verification = await athrNaqlService.verifyVehicleAndDriver(
      shipment.vehiclePlateNumber,
      shipment.driverNationalId
    )
    
    if (!verification.allValid) {
      // Prevent trip creation
      throw new Error('Vehicle or driver validation failed')
    }
  }
})
```

## 📊 Complete Rabet.sa Solution

### Four APIs Working Together

| API | Purpose | Features |
|-----|---------|----------|
| **WASL (EFF)** | Basic Compliance | Vehicle/Driver/Trip registration |
| **Bayan (EFF)** | Advanced Operations | Waybill management, Carrier operations |
| **Daleel (Waybill)** | Real-Time Tracking | GPS tracking, Location history |
| **Athr Naql** | Verification | Pre-validation, Status inquiry |

### Recommended Workflow

```
1. Pre-Validate (Athr Naql)
   ↓
2. Register (WASL)
   ↓
3. Create Trip (Bayan)
   ↓
4. Track (Daleel)
```

## 💡 Use Cases

### Use Case 1: Pre-Validation Before Trip
1. **Verify** vehicle operation card (Athr Naql)
2. **Verify** driver card (Athr Naql)
3. **Verify** license (Athr Naql)
4. **Create trip** only if all valid (Bayan)
5. **Track** in real-time (Daleel)

### Use Case 2: Automated Validation
1. User creates shipment
2. System **automatically verifies** vehicle and driver
3. If valid, proceed with trip creation
4. If invalid, show error and prevent creation

### Use Case 3: Periodic Verification
1. **Schedule** periodic verification of all vehicles
2. **Check** operation cards and licenses
3. **Alert** if any expire soon
4. **Update** status in your system

## 🔧 Implementation Example

```typescript
import { getAthrNaqlService } from '@/lib/services/athr-naql/initialize'
import { getBayanService } from '@/lib/services/bayan/initialize'
import { eventBus } from '@/lib/services/event-store'

// Before creating trip, verify everything
eventBus.subscribe('tms.shipment.creating', async (event) => {
  const shipment = event.payload
  
  // 1. Verify with Athr Naql
  const athrNaqlService = getAthrNaqlService()
  if (athrNaqlService) {
    const verification = await athrNaqlService.verifyVehicleAndDriver(
      shipment.vehiclePlateNumber,
      shipment.driverNationalId
    )
    
    if (!verification.allValid) {
      throw new Error('Validation failed - cannot create trip')
    }
  }
  
  // 2. Create trip in Bayan (if verified)
  const bayanService = getBayanService()
  if (bayanService) {
    await bayanService.createFreightForwarderTrip({ /* ... */ })
  }
})
```

## 📝 Summary

### What Athr Naql Provides:
- ✅ **Pre-validation** before operations
- ✅ **Operation card verification**
- ✅ **License verification**
- ✅ **Driver card verification**
- ✅ **Complete verification** (vehicle + driver)
- ✅ **Prevent invalid operations**

### Combined Solution:
- ✅ **Pre-validation** (Athr Naql)
- ✅ **Basic compliance** (WASL)
- ✅ **Advanced operations** (Bayan)
- ✅ **Real-time tracking** (Daleel)
- ✅ **Complete freight forwarding** solution

## 🎉 Complete Verification Solution!

With Athr Naql integrated, you can:
- ✅ Verify vehicles before use
- ✅ Verify drivers before assignment
- ✅ Verify licenses before operations
- ✅ Prevent invalid trips
- ✅ Ensure compliance from the start

**This completes your freight forwarding solution with pre-validation!** ✅🚚




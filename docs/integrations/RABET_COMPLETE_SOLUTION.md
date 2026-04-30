# Rabet.sa Complete Integration Guide

## 🎯 Overview

Rabet.sa provides **four APIs** that work together to give you a complete transportation solution:

1. **Athr Naql (Transportation Impact)** - Pre-validation & verification
2. **WASL (Electronic Freight Forwarder)** - Basic government compliance
3. **Bayan (Electronic Freight Forwarder)** - Advanced operations & waybill management
4. **Daleel (Waybill Package)** - Real-time GPS tracking

## 📊 Comparison

| Feature | Athr Naql | WASL (EFF) | Bayan (EFF) | Daleel (Waybill) |
|---------|-----------|------------|-------------|------------------|
| **Purpose** | Verification | Basic Compliance | Advanced Operations | Real-Time Tracking |
| **Authentication** | app_id + app_key | app_id + app_key | app_id + app_key | Username + Password |
| **Pre-Validation** | ✅ **YES!** | ❌ No | ❌ No | ❌ No |
| **Operation Card Check** | ✅ **YES!** | ❌ No | ❌ No | ❌ No |
| **License Verification** | ✅ **YES!** | ❌ No | ❌ No | ❌ No |
| **Driver Card Check** | ✅ **YES!** | ❌ No | ❌ No | ❌ No |
| **Real-time GPS** | ❌ No | ❌ No | ❌ No | ✅ **YES!** |
| **Vehicle Registration** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Driver Registration** | ❌ No | ✅ Yes | ❌ No | ❌ No |
| **Trip Registration** | ❌ No | ✅ Basic | ✅ Advanced | ❌ No |
| **Waybill Management** | ❌ No | ❌ No | ✅ **YES!** | ❌ No |
| **Carrier Operations** | ❌ No | ❌ No | ✅ **YES!** | ❌ No |
| **Trip Printing** | ❌ No | ❌ No | ✅ **YES!** | ❌ No |
| **Government Compliance** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Polygon Search** | ❌ No | ❌ No | ❌ No | ✅ **YES!** |

## 🏗️ Recommended Architecture

```
┌─────────────────────────────────────────┐
│   Your BlueDXP Platform                │
│   - TMS Module                         │
│   - Tracking Dashboard                 │
│   - Shipment Management                │
└─────────────────────────────────────────┘
              │
              ├─── Athr Naql ────► Pre-Validation
              │    Authentication: app_id + app_key
              │    Purpose: Verification & Inquiry
              │    - Operation card verification
              │    - License verification
              │    - Driver card verification
              │    - Pre-validation before operations
              │
              ├─── WASL (EFF) ────► Basic Compliance
              │    Authentication: app_id + app_key
              │    Purpose: Basic Registration
              │    - Vehicle registration
              │    - Driver registration
              │    - Basic trip registration
              │
              ├─── Bayan (EFF) ────► Advanced Operations
              │    Authentication: app_id + app_key
              │    Purpose: Waybill & Carrier Management
              │    - Advanced trip management
              │    - Waybill creation/management
              │    - Carrier operations
              │    - Trip printing
              │
              └─── Daleel (Waybill) ────► Real-Time Tracking
                   Authentication: username + password
                   Purpose: Real-Time GPS Tracking
                   - Real-time GPS coordinates
                   - Location history
                   - Speed, heading, fuel level
                   - Polygon search (geofencing)
                   - Weight drop tracking
```

## 🚀 Complete Workflow

### Step 1: Pre-Validate (Athr Naql)
```typescript
import { getAthrNaqlService } from '@/lib/services/athr-naql/initialize'

const athrNaqlService = getAthrNaqlService()

// Verify before proceeding
const verification = await athrNaqlService.verifyVehicleAndDriver(
  'ABC-1234',  // Vehicle plate
  '1234567890' // Driver national ID
)

if (!verification.allValid) {
  throw new Error('Validation failed - cannot proceed')
}
```

### Step 2: Register Vehicle & Driver (WASL)

```typescript
import { getWaslService } from '@/lib/services/wasl/initialize'

const waslService = getWaslService()

// Register vehicle
await waslService.registerVehicle({
  plateNumber: 'ABC-1234',
  vehicleType: 'TRUCK',
  ownerName: 'John Doe',
})

// Register driver
await waslService.registerDriver({
  nationalId: '1234567890',
  fullName: 'John Doe',
  licenseNumber: 'DL-123456',
})
```

### Step 3: Start Real-Time Tracking (Daleel)

```typescript
import { getDaleelService } from '@/lib/services/daleel/initialize'

const daleelService = getDaleelService()

// Start tracking
await daleelService.startTracking({ plateNumber: 'ABC-1234' })
```

### Step 4: Register Trip (WASL/Bayan)

```typescript
// Register trip for compliance
await waslService.registerTrip({
  vehiclePlate: { plateNumber: 'ABC-1234' },
  driverNationalId: '1234567890',
  origin: { address: 'Riyadh' },
  destination: { address: 'Jeddah' },
  plannedStartDate: new Date().toISOString(),
})
```

### Step 5: Track in Real-Time (Daleel)

```typescript
// Get current location (automatic updates every 30 seconds)
const location = await daleelService.getCurrentLocationDetails({
  plateNumber: 'ABC-1234'
})

console.log('Real-time location:', {
  lat: location.location.latitude,
  lng: location.location.longitude,
  speed: location.speed,
  heading: location.heading,
  address: location.address,
})
```

### Step 6: Sync to WASL (Automatic)

```typescript
// Location updates automatically sync to WASL
eventBus.subscribe('daleel.location.updated', async (event) => {
  const { vehiclePlate, location } = event.payload
  
  // Update WASL for compliance
  await waslService.updateTrip(tripNumber, {
    tripNumber,
    currentLocation: {
      address: location.address,
      coordinates: {
        latitude: location.location.latitude,
        longitude: location.location.longitude,
      },
      timestamp: location.timestamp,
    },
  })
})
```

## 📡 API Endpoints Summary

### WASL (EFF) Endpoints
- `POST /eff/v1/vehicles` - Register vehicle
- `POST /eff/v1/drivers` - Register driver
- `POST /eff/v1/trips` - Register trip
- `PATCH /eff/v1/trips/{tripNumber}` - Update trip

### Daleel (Waybill) Endpoints
- `POST /api/v1/location/current` - Get current location
- `POST /api/v1/location/current/details` - Get location with details
- `POST /api/v1/location/history` - Get location history
- `POST /api/v1/location/polygon` - Find vehicles in polygon
- `POST /api/v1/location/weightdrop` - Get weight drops
- `POST /api/v1/vehicle/assignTag` - Assign vehicle
- `POST /api/v1/notification/subscribe` - Subscribe to notifications

## 🔧 Environment Variables

```env
# WASL (EFF) - Basic Compliance
WASL_APP_ID=YOUR_APP_ID
WASL_APP_KEY=YOUR_APP_KEY
WASL_API_BASE_URL=https://www.rabet.sa

# Bayan (EFF) - Advanced Operations
BAYAN_APP_ID=YOUR_APP_ID
BAYAN_APP_KEY=YOUR_APP_KEY
BAYAN_API_BASE_URL=https://www.rabet.sa

# Athr Naql - Pre-Validation
ATHR_NAQL_APP_ID=YOUR_APP_ID
ATHR_NAQL_APP_KEY=YOUR_APP_KEY
ATHR_NAQL_API_BASE_URL=https://www.rabet.sa

# Daleel (Waybill) - Real-Time Tracking
DALEEL_USERNAME=your_username
DALEEL_PASSWORD=your_password
DALEEL_API_BASE_URL=https://www.rabet.sa
DALEEL_POLLING_INTERVAL=30000
```

## 💡 Best Practices

### 1. Use Both APIs Together
- **WASL** for compliance and registration
- **Daleel** for real-time tracking

### 2. Automatic Sync
- Daleel provides real-time location
- Automatically sync to WASL for compliance

### 3. Event-Driven Architecture
- Subscribe to Daleel location updates
- Update WASL automatically
- Update your tracking dashboard

### 4. Error Handling
- Both APIs have retry logic
- Circuit breaker patterns
- Comprehensive error handling

## 📚 Documentation

- **Athr Naql Integration**: [ATHR_NAQL_INTEGRATION.md](./ATHR_NAQL_INTEGRATION.md)
- **WASL Integration**: [WASL_INTEGRATION.md](./WASL_INTEGRATION.md)
- **WASL Platform Value**: [WASL_PLATFORM_VALUE.md](./WASL_PLATFORM_VALUE.md)
- **Bayan Integration**: [BAYAN_INTEGRATION.md](./BAYAN_INTEGRATION.md)
- **Daleel Tracking**: [DALEEL_TRACKING.md](./DALEEL_TRACKING.md)

## ✅ Summary

### What You Get:

1. **Pre-Validation** (Athr Naql)
   - Operation card verification
   - License verification
   - Driver card verification
   - Pre-validation before operations
   - Prevent invalid trips

2. **Basic Compliance** (WASL)
   - Vehicle registration
   - Driver registration
   - Basic trip registration
   - Regulatory compliance

3. **Advanced Operations** (Bayan)
   - Advanced trip management
   - Waybill creation and management
   - Carrier operations
   - Exceptional waybills
   - Trip printing

4. **Real-Time Tracking** (Daleel)
   - Real-time GPS coordinates
   - Automatic location updates
   - Speed, heading, fuel level
   - Location history
   - Geofencing (polygon search)

5. **Complete Solution**
   - All four APIs integrated
   - Pre-validation workflow
   - Automatic sync
   - Event-driven architecture
   - Full tracking dashboard
   - Complete freight forwarding workflow

## 🎉 You Have Everything You Need!

With Athr Naql + WASL + Bayan + Daleel integrated, you have:
- ✅ Pre-validation and verification
- ✅ Government compliance
- ✅ Waybill management
- ✅ Carrier operations
- ✅ Real-time GPS tracking
- ✅ Complete location history
- ✅ Automatic updates
- ✅ Geofencing capabilities
- ✅ Trip printing
- ✅ Full integration with your platform

**This is a complete, enterprise-grade freight forwarding and transportation tracking solution with pre-validation!** ✅🚚📦📍


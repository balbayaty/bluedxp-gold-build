# WASL Integration - Quick Start Guide

## ✅ What's Been Implemented

Your WASL integration is **complete and ready to use**! Here's what has been built:

### 🏗️ Architecture Components

1. **Types & Interfaces** (`types/wasl.ts`)
   - Complete type definitions for all WASL EFF services
   - Vehicle, Driver, and Trip types
   - Request/Response types

2. **Authentication** (`lib/adapters/wasl/auth.ts`)
   - App ID and App Key authentication
   - Header-based authentication (not OAuth)

3. **API Client** (`lib/adapters/wasl/client.ts`)
   - HTTP client with retry logic
   - Circuit breaker pattern
   - Comprehensive error handling

4. **EFF Adapter** (`lib/adapters/wasl/adapter.ts`)
   - Vehicle registration/deletion
   - Driver registration/deletion
   - Trip registration/updates

5. **Transportation Adapter** (`lib/adapters/wasl/transportationAdapter.ts`)
   - Implements TransportationAdapter interface
   - Maps WASL trips to shipments
   - Integrates with TMS module

6. **Service Layer** (`lib/services/wasl/waslService.ts`)
   - Business logic
   - Event Bus integration
   - High-level operations

7. **Initialization** (`lib/services/wasl/initialize.ts`)
   - Service initialization
   - Environment variable support

## 🚀 Quick Start (3 Steps)

### Step 1: Set Environment Variables

Add to your `.env` file:

```env
# Never commit real credentials. Use `.env.local` for local development.
WASL_APP_ID=YOUR_APP_ID
WASL_APP_KEY=YOUR_APP_KEY
WASL_API_BASE_URL=https://www.rabet.sa
```

### Step 2: Initialize Service

```typescript
import { getOrInitializeWaslService } from '@/lib/services/wasl/initialize'

const waslService = await getOrInitializeWaslService()
```

### Step 3: Use the Service

```typescript
// Register a vehicle
const vehicle = await waslService.registerVehicle({
  plateNumber: 'ABC-1234',
  vehicleType: 'TRUCK',
  vehicleModel: 'Mercedes Actros',
  ownerName: 'John Doe',
  ownerNationalId: '1234567890',
})

// Register a driver
const driver = await waslService.registerDriver({
  nationalId: '1234567890',
  fullName: 'John Doe',
  mobileNumber: '+966501234567',
  licenseNumber: 'DL-123456',
})

// Register a trip
const trip = await waslService.registerTrip({
  vehiclePlate: { plateNumber: 'ABC-1234' },
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
  cargoDescription: 'Electronics',
})
```

## 🔗 TMS Integration

WASL is automatically integrated with the TMS module:

```typescript
import { getTransportationAdapter } from '@/lib/adapters/transportation'

// Get WASL adapter
const adapter = getTransportationAdapter('wasl')

// Use as any other transportation adapter
const shipment = await adapter.createShipment({
  origin: { /* ... */ },
  destination: { /* ... */ },
})
```

## 📡 API Endpoints Supported

✅ **POST** `/eff/v1/vehicles` - Register vehicle  
✅ **DELETE** `/eff/v1/vehicles` - Delete vehicle  
✅ **POST** `/eff/v1/drivers` - Register driver  
✅ **DELETE** `/eff/v1/drivers` - Delete driver  
✅ **POST** `/eff/v1/trips` - Register trip  
✅ **PATCH** `/eff/v1/trips/{tripNumber}` - Update trip  

## 🔄 Event Bus Integration

WASL automatically publishes and subscribes to events:

**Published Events:**
- `wasl.vehicle.registered`
- `wasl.vehicle.deleted`
- `wasl.driver.registered`
- `wasl.driver.deleted`
- `wasl.trip.registered`
- `wasl.trip.updated`

**Subscribed Events:**
- `tms.shipment.created` → Auto-registers trip
- `tms.shipment.updated` → Auto-updates trip

## 📚 Documentation

- Full documentation: [WASL_INTEGRATION.md](./WASL_INTEGRATION.md)
- Types: `types/wasl.ts`
- Service: `lib/services/wasl/waslService.ts`

## ⚠️ Important Notes

1. **Credentials**: Never commit app_id and app_key to version control
2. **API Base URL**: Default is `https://www.rabet.sa` - verify this is correct
3. **Authentication**: Uses app_id and app_key headers (not Bearer tokens)
4. **Rate Limits**: Be aware of API rate limits
5. **Testing**: Use sandbox environment for testing

## 🎉 You're Ready!

Your WASL integration is complete and ready to use. The information you provided was sufficient to build a comprehensive, enterprise-grade integration following all BlueDXP platform principles.




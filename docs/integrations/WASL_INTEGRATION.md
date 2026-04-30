# WASL (Electronic Freight Forwarder) Integration Guide

## 🎯 Overview

WASL is a service within the Rabet.sa platform (Saudi Arabia Government Platform) that provides Electronic Freight Forwarder (EFF) services. This integration enables BlueDXP to:

- Register and manage vehicles for freight forwarding
- Register and manage drivers
- Register and track trips (shipments)
- Integrate with TMS module for seamless transportation management

## 📋 Prerequisites

1. **WASL Account**: You need an account on Rabet.sa with EFF services enabled
2. **App Credentials**: 
   - App ID (Client ID): `YOUR_APP_ID`
   - App Key (Client Secret): `YOUR_APP_KEY`
3. **API Access**: Ensure your account has access to EFF API endpoints

## 🏗️ Architecture

### Integration Layers

```
┌─────────────────────────────────────────┐
│   Transportation Adapter Interface     │
│   (Unified API for all integrations)   │
└─────────────────────────────────────────┘
              │
              └─── WASL Transportation Adapter
                   └─── WASL EFF Adapter
                        └─── WASL API Client
                             └─── WASL Auth (app_id/app_key)
```

### Components

1. **WASL Auth** (`lib/adapters/wasl/auth.ts`)
   - Handles app_id and app_key authentication
   - Header-based authentication (not OAuth)

2. **WASL Client** (`lib/adapters/wasl/client.ts`)
   - HTTP client with retry logic
   - Circuit breaker pattern
   - Error handling

3. **WASL EFF Adapter** (`lib/adapters/wasl/adapter.ts`)
   - Implements EFF service interface
   - Vehicle, driver, and trip management

4. **WASL Transportation Adapter** (`lib/adapters/wasl/transportationAdapter.ts`)
   - Implements TransportationAdapter interface
   - Maps WASL trips to shipments
   - Integrates with TMS module

5. **WASL Service** (`lib/services/wasl/waslService.ts`)
   - Business logic layer
   - Event Bus integration
   - High-level operations

## 🚀 Quick Start

### 1. Environment Variables

Add to your `.env` file:

```env
# Never commit real credentials. Use `.env.local` for local development.
# You can use either the service-specific names:
WASL_APP_ID=YOUR_APP_ID
WASL_APP_KEY=YOUR_APP_KEY
# ...or the shared Rabet names (many initializers accept these too):
RABET_APP_ID=YOUR_APP_ID
RABET_APP_KEY=YOUR_APP_KEY
WASL_API_BASE_URL=https://www.rabet.sa
WASL_ENVIRONMENT=production
WASL_TIMEOUT=30000
WASL_RETRY_ATTEMPTS=3
WASL_ENABLE_LOGGING=false
```

### 2. Initialize Service

```typescript
import { initializeWaslService } from '@/lib/services/wasl/initialize'

const waslService = await initializeWaslService({
  appId: process.env.WASL_APP_ID || process.env.RABET_APP_ID || '',
  appKey: process.env.WASL_APP_KEY || process.env.RABET_APP_KEY || '',
  apiBaseUrl: 'https://www.rabet.sa',
  environment: 'production',
})
```

### 3. Use the Service

```typescript
// Register a vehicle
const vehicle = await waslService.registerVehicle({
  plateNumber: 'ABC-1234',
  plateType: 'PRIVATE',
  vehicleType: 'TRUCK',
  vehicleModel: 'Mercedes Actros',
  vehicleYear: 2023,
  ownerName: 'John Doe',
  ownerNationalId: '1234567890',
})

// Register a driver
const driver = await waslService.registerDriver({
  nationalId: '1234567890',
  fullName: 'John Doe',
  mobileNumber: '+966501234567',
  licenseNumber: 'DL-123456',
  licenseType: 'HEAVY',
})

// Register a trip
const trip = await waslService.registerTrip({
  vehiclePlate: { plateNumber: 'ABC-1234' },
  driverNationalId: '1234567890',
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
  plannedStartDate: new Date().toISOString(),
  cargoDescription: 'Electronics',
  cargoWeight: 5000,
  cargoValue: 100000,
})
```

## 📡 API Endpoints

### Vehicle Management

- **POST** `/eff/v1/vehicles` - Register vehicle
- **DELETE** `/eff/v1/vehicles` - Delete vehicle

### Driver Management

- **POST** `/eff/v1/drivers` - Register driver
- **DELETE** `/eff/v1/drivers` - Delete driver

### Trip Management

- **POST** `/eff/v1/trips` - Register trip
- **PATCH** `/eff/v1/trips/{tripNumber}` - Update trip

## 🔗 TMS Integration

WASL integrates seamlessly with the TMS module:

```typescript
import { WaslTransportationAdapter } from '@/lib/adapters/wasl'

const adapter = new WaslTransportationAdapter({
  appId: process.env.WASL_APP_ID || process.env.RABET_APP_ID || '',
  appKey: process.env.WASL_APP_KEY || process.env.RABET_APP_KEY || '',
})

// Use as TransportationAdapter
const shipment = await adapter.createShipment({
  origin: { /* ... */ },
  destination: { /* ... */ },
  // ... other shipment fields
})
```

## 📊 Event Bus Integration

WASL service automatically publishes events:

- `wasl.vehicle.registered` - When a vehicle is registered
- `wasl.vehicle.deleted` - When a vehicle is deleted
- `wasl.driver.registered` - When a driver is registered
- `wasl.driver.deleted` - When a driver is deleted
- `wasl.trip.registered` - When a trip is registered
- `wasl.trip.updated` - When a trip is updated

The service also subscribes to TMS events:

- `tms.shipment.created` - Auto-registers trip in WASL
- `tms.shipment.updated` - Auto-updates trip in WASL

## 🔒 Security

- **Credentials**: Never commit app_id and app_key to version control
- **Environment Variables**: Use environment variables for credentials
- **HTTPS**: All API calls use HTTPS
- **Rate Limiting**: Client includes retry logic with exponential backoff
- **Circuit Breaker**: Prevents cascading failures

## 🛠️ Error Handling

The WASL client includes comprehensive error handling:

- **Retry Logic**: Automatic retry with exponential backoff
- **Circuit Breaker**: Prevents overwhelming the API during outages
- **Error Types**: Structured error responses with codes and messages

```typescript
try {
  const vehicle = await waslService.registerVehicle({ /* ... */ })
} catch (error) {
  console.error('WASL Error:', error.message)
  // Handle error
}
```

## 📝 Type Safety

All WASL types are defined in `types/wasl.ts`:

- `WaslAdapterConfig` - Configuration
- `EffVehicleCreateDto` - Vehicle registration
- `EffDriverCreateDto` - Driver registration
- `EffTripCreateDto` - Trip registration
- `EffTripUpdateDto` - Trip updates
- `WaslResponse<T>` - API responses

## 🔄 Data Mapping

### Shipment to Trip

- Shipment → Trip
- Origin/Destination → Trip origin/destination
- Status → Trip status (mapped)
- Dates → Trip dates

### Trip to Shipment

- Trip → Shipment
- Trip number → Shipment ID
- Status → Shipment status (mapped)
- Location → Current location

## 🧪 Testing

```typescript
// Test connection
const testResult = await waslService.testConnection()
console.log(testResult) // { success: true, message: '...' }
```

## 📚 Additional Resources

- [Rabet.sa Platform](https://www.rabet.sa)
- [OpenAPI Documentation](https://www.rabet.sa/docs) (if available)
- [WASL Service Types](../../types/wasl.ts)
- [Transportation Adapter Interface](../adapters/transportation/base/TransportationAdapter.ts)

## ⚠️ Important Notes

1. **API Base URL**: Default is `https://www.rabet.sa` - verify this is correct
2. **Authentication**: Uses app_id and app_key headers (not Bearer tokens)
3. **Rate Limits**: Be aware of API rate limits
4. **Sandbox**: Use sandbox environment for testing
5. **Data Validation**: Validate all data before sending to WASL

## 🚧 Future Enhancements

- [ ] Trip status polling
- [ ] Batch operations
- [ ] Webhook support (if available)
- [ ] Caching layer
- [ ] Metrics and monitoring
- [ ] Full OpenAPI spec integration




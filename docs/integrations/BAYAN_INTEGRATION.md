# Bayan Electronic Freight Forwarder Integration Guide

## 🎯 Overview

Bayan Electronic Freight Forwarder API provides **advanced freight forwarding and waybill management** capabilities. This extends WASL with:

- **Waybill Management**: Create, update, close, and cancel waybills
- **Carrier Operations**: Carrier-specific trip and waybill management
- **Exceptional Waybills**: Handle special cases and exceptions
- **Trip Printing**: Generate printable trip documents
- **Enhanced Trip Management**: More detailed trip operations

## ✅ What Bayan Adds to Your Platform

### 1. **Waybill Management** ✅
- Create waybills for trips
- Update waybill details
- Close waybills when completed
- Cancel waybills when needed
- Track waybill status

### 2. **Carrier Operations** ✅
- Create carrier trips
- Update vehicle/driver on trips
- Manage carrier waybills
- Create exceptional waybills
- Print carrier trip documents

### 3. **Freight Forwarder Operations** ✅
- Create freight forwarder trips
- Manage waybills
- Print trip documents
- Update trip details

### 4. **Integration with TMS** ✅
- Auto-syncs shipments to Bayan trips
- Event-driven integration via Event Bus
- Waybill management for shipments

## 📡 API Endpoints

### Freight Forwarder Endpoints

✅ **POST** `/api/v1/freight-forwarder/trip` - Create trip  
✅ **PUT** `/api/v1/freight-forwarder/trip` - Update trip  
✅ **GET** `/api/v1/freight-forwarder/trip/{tripId}` - Get trip  
✅ **GET** `/api/v1/freight-forwarder/trip/{tripId}/print` - Print trip  
✅ **POST** `/api/v1/freight-forwarder/trip/waybill` - Add waybill  
✅ **PUT** `/api/v1/freight-forwarder/trip/waybill` - Update waybill  
✅ **PUT** `/api/v1/freight-forwarder/trip/waybill/close` - Close waybill  
✅ **PUT** `/api/v1/freight-forwarder/trip/waybill/cancel` - Cancel waybill  

### Carrier Endpoints

✅ **POST** `/api/v1/carrier/trip` - Create carrier trip  
✅ **PUT** `/api/v1/carrier/trip` - Update vehicle/driver  
✅ **GET** `/api/v1/carrier/trip/{tripId}` - Get carrier trip  
✅ **GET** `/api/v1/carrier/trip/{tripId}/print` - Print carrier trip  
✅ **POST** `/api/v1/carrier/trip/waybill` - Add carrier waybill  
✅ **PUT** `/api/v1/carrier/trip/waybill` - Update carrier waybill  
✅ **PUT** `/api/v1/carrier/trip/waybill/close` - Close carrier waybill  
✅ **PUT** `/api/v1/carrier/trip/waybill/cancel` - Cancel carrier waybill  
✅ **POST** `/api/v1/carrier/trip/carrier/exWaybill` - Create exceptional waybill  

## 🚀 Quick Start

### 1. Environment Variables

Add to your `.env` file:

```env
# Never commit real credentials. Use `.env.local` for local development.
BAYAN_APP_ID=YOUR_APP_ID
BAYAN_APP_KEY=YOUR_APP_KEY
BAYAN_API_BASE_URL=https://www.rabet.sa
```

### 2. Initialize Service

```typescript
import { getOrInitializeBayanService } from '@/lib/services/bayan/initialize'

const bayanService = await getOrInitializeBayanService()
```

### 3. Use the Service

```typescript
// Create freight forwarder trip
const trip = await bayanService.createFreightForwarderTrip({
  vehicle: {
    vehiclePlate: { plateNumber: 'ABC-1234' },
    vehicleType: 'TRUCK',
  },
  driver: {
    nationalId: '1234567890',
    fullName: 'John Doe',
    licenseNumber: 'DL-123456',
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

// Add waybill to trip
const waybill = await bayanService.addWaybill({
  tripId: trip.tripId,
  customer: {
    name: 'Customer Name',
    nationalId: '9876543210',
  },
  items: [
    {
      description: 'Electronics',
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

// Close waybill when delivered
await bayanService.closeWaybill({
  waybillId: waybill.waybillId || '',
})
```

## 🔗 Integration with Your Platform

### Automatic Integration

Bayan service automatically:
1. **Subscribes** to TMS shipment events
2. **Creates trips** when shipments are created
3. **Publishes events** for waybill operations
4. **Integrates** with Event Bus

### Manual Integration

```typescript
import { eventBus } from '@/lib/services/event-store'
import { getBayanService } from '@/lib/services/bayan/initialize'

// Subscribe to waybill events
eventBus.subscribe('bayan.waybill.added', async (event) => {
  const { waybill, tripId } = event.payload
  console.log('Waybill added:', waybill.waybillNumber)
  // Update your system
})

eventBus.subscribe('bayan.waybill.closed', async (event) => {
  const { waybillId } = event.payload
  console.log('Waybill closed:', waybillId)
  // Mark shipment as delivered
})
```

## 📊 Complete Rabet.sa Solution

### Three APIs Working Together

| API | Purpose | Features |
|-----|---------|----------|
| **WASL (EFF)** | Basic Compliance | Vehicle/Driver/Trip registration |
| **Bayan (EFF)** | Advanced Operations | Waybill management, Carrier operations |
| **Daleel (Waybill)** | Real-Time Tracking | GPS tracking, Location history |

### Recommended Architecture

```
┌─────────────────────────────────────────┐
│   Your BlueDXP Platform                │
│   - TMS Module                         │
│   - Shipment Management                │
└─────────────────────────────────────────┘
              │
              ├─── WASL ────► Basic Compliance
              │    - Vehicle registration
              │    - Driver registration
              │    - Basic trip registration
              │
              ├─── Bayan ────► Advanced Operations
              │    - Waybill management
              │    - Carrier operations
              │    - Trip printing
              │
              └─── Daleel ────► Real-Time Tracking
                   - GPS tracking
                   - Location history
```

## 💡 Use Cases

### Use Case 1: Complete Freight Forwarding Workflow
1. **Register** vehicle/driver in WASL
2. **Create trip** in Bayan
3. **Add waybills** for each shipment
4. **Track** in real-time with Daleel
5. **Close waybills** when delivered
6. **Print** trip documents

### Use Case 2: Carrier Operations
1. **Create carrier trip** in Bayan
2. **Add waybills** for cargo
3. **Update vehicle/driver** if needed
4. **Create exceptional waybill** for special cases
5. **Close waybills** on delivery

### Use Case 3: Multi-Waybill Trip
1. **Create trip** with vehicle/driver
2. **Add multiple waybills** for different customers
3. **Track** all waybills in real-time
4. **Close waybills** individually as delivered
5. **Print** complete trip document

## 🔧 Implementation Example

```typescript
import { getBayanService } from '@/lib/services/bayan/initialize'
import { getDaleelService } from '@/lib/services/daleel/initialize'
import { eventBus } from '@/lib/services/event-store'

// When shipment is created
eventBus.subscribe('tms.shipment.created', async (event) => {
  const shipment = event.payload
  
  // 1. Create trip in Bayan
  const bayanService = getBayanService()
  if (bayanService) {
    const trip = await bayanService.syncShipmentToBayan(shipment)
    
    // 2. Add waybill
    await bayanService.addWaybill({
      tripId: trip.tripId,
      customer: { /* ... */ },
      items: [ /* ... */ ],
      origin: { /* ... */ },
      destination: { /* ... */ },
    })
  }
  
  // 3. Start real-time tracking
  const daleelService = getDaleelService()
  if (daleelService && shipment.vehiclePlateNumber) {
    await daleelService.startTracking({
      plateNumber: shipment.vehiclePlateNumber
    })
  }
})

// When waybill is closed
eventBus.subscribe('bayan.waybill.closed', async (event) => {
  const { waybillId } = event.payload
  
  // Update shipment status
  // Send notifications
  // Update dashboard
})
```

## 📝 Summary

### What Bayan Provides:
- ✅ **Waybill management** (create, update, close, cancel)
- ✅ **Carrier operations** (carrier trips, waybills)
- ✅ **Exceptional waybills** (special cases)
- ✅ **Trip printing** (generate documents)
- ✅ **Enhanced trip management** (detailed operations)

### Combined Solution:
- ✅ **Basic compliance** (WASL)
- ✅ **Advanced operations** (Bayan)
- ✅ **Real-time tracking** (Daleel)
- ✅ **Complete freight forwarding** solution

## 🎉 Complete Freight Forwarding Solution!

With WASL + Bayan + Daleel integrated, you have:
- ✅ Government compliance
- ✅ Waybill management
- ✅ Carrier operations
- ✅ Real-time GPS tracking
- ✅ Complete freight forwarding workflow

**This is a complete, enterprise-grade freight forwarding solution!** 🚚📦




# Daleel API (Waybill Package) - Real-Time Location Tracking

## 🎯 Overview

**YES! This is REAL-TIME GPS TRACKING!** 🚚📍

Daleel API (Waybill Package) provides **real-time location tracking** for vehicles in Saudi Arabia. This is exactly what you need to track trucks in real-time!

## ✅ What Daleel Adds to Your Platform

### 1. **Real-Time GPS Tracking** ✅
- **Current Location**: Get real-time GPS coordinates of vehicles
- **Location Details**: Speed, heading, address, fuel level, engine status
- **Historical Tracking**: Complete location history for any time period
- **Multi-Vehicle Tracking**: Track multiple vehicles simultaneously

### 2. **Advanced Location Services** ✅
- **Polygon Search**: Find all vehicles inside a geographic area
- **Weight Drop Locations**: Track where vehicles dropped weight
- **Current + History**: Get both current location and historical data in one call

### 3. **Vehicle Management** ✅
- **Assign Vehicles**: Assign vehicles to clients/tags
- **Bulk Operations**: Assign multiple vehicles at once
- **Vehicle Information**: Get vehicle details and sequence numbers

### 4. **Notifications** ✅
- **Subscribe to Updates**: Get real-time notifications via webhooks
- **Event-Based**: Subscribe to specific event types

## 🚚 Real-Time Truck Tracking

### How It Works

```typescript
import { getOrInitializeDaleelService } from '@/lib/services/daleel/initialize'

const daleelService = await getOrInitializeDaleelService()

// Start tracking a vehicle
await daleelService.startTracking({ plateNumber: 'ABC-1234' })

// Get current location
const location = await daleelService.getCurrentLocationDetails({
  plateNumber: 'ABC-1234'
})

console.log('Current Location:', {
  latitude: location.location.latitude,
  longitude: location.location.longitude,
  address: location.address,
  speed: location.speed,
  heading: location.heading,
  timestamp: location.timestamp
})
```

### Automatic Real-Time Updates

The service automatically:
1. **Polls** for location updates every 30 seconds (configurable)
2. **Publishes** events to Event Bus
3. **Integrates** with your TMS module
4. **Updates** your tracking dashboard in real-time

## 📡 API Endpoints

### Location Services

✅ **POST** `/api/v1/location/current` - Get current location  
✅ **POST** `/api/v1/location/current/details` - Get current location with details  
✅ **POST** `/api/v1/location/current/details/list` - Get current location for multiple vehicles  
✅ **POST** `/api/v1/location/history` - Get historical location data  
✅ **POST** `/api/v1/location/current-history` - Get current + historical data  
✅ **POST** `/api/v1/location/polygon` - Find vehicles in polygon  
✅ **POST** `/api/v1/location/weightdrop` - Get weight drop locations  

### Vehicle Management

✅ **POST** `/api/v1/vehicle/assignTag` - Assign vehicle to client  
✅ **POST** `/api/v1/vehicle/bulkAssignTag` - Bulk assign vehicles  
✅ **PUT** `/api/v1/vehicle/unassignTag` - Unassign vehicle  
✅ **GET** `/api/v1/vehicle/info` - Get vehicle information  
✅ **GET** `/api/v1/vehicle/sequenceNumber` - Get sequence number  

### Notifications

✅ **POST** `/api/v1/notification/subscribe` - Subscribe to notifications  

## 🚀 Quick Start

### 1. Environment Variables

Add to your `.env` file:

```env
DALEEL_USERNAME=your_username
DALEEL_PASSWORD=your_password
DALEEL_API_BASE_URL=https://www.rabet.sa
DALEEL_POLLING_INTERVAL=30000
```

### 2. Initialize Service

```typescript
import { getOrInitializeDaleelService } from '@/lib/services/daleel/initialize'

const daleelService = await getOrInitializeDaleelService()
```

### 3. Start Tracking

```typescript
// Start real-time tracking
await daleelService.startTracking({ plateNumber: 'ABC-1234' })

// Get current location
const location = await daleelService.getCurrentLocationDetails({
  plateNumber: 'ABC-1234'
})
```

## 🔗 Integration with Your Platform

### Automatic Integration

Daleel service automatically integrates with:

1. **Event Bus**: Publishes `daleel.location.updated` events
2. **TMS Module**: Publishes `transportation.shipment.location.updated` events
3. **Tracking Dashboard**: Real-time updates via WebSocket

### Manual Integration

```typescript
import { eventBus } from '@/lib/services/event-store'
import { getDaleelService } from '@/lib/services/daleel/initialize'

// Subscribe to location updates
eventBus.subscribe('daleel.location.updated', async (event) => {
  const { vehiclePlate, location } = event.payload
  
  console.log('Vehicle:', vehiclePlate.plateNumber)
  console.log('Location:', location.location.latitude, location.location.longitude)
  console.log('Speed:', location.speed)
  console.log('Address:', location.address)
  
  // Update your tracking dashboard
  // Update WASL for compliance
  // Send notifications
})
```

## 📊 Complete Tracking Solution

### Combined: WASL + Daleel

| Feature | WASL (EFF) | Daleel (Waybill) |
|---------|------------|------------------|
| **Real-time GPS** | ❌ No | ✅ **YES!** |
| **Current Location** | ❌ Manual | ✅ **Automatic** |
| **Location History** | ❌ No | ✅ **YES!** |
| **Speed/Heading** | ❌ No | ✅ **YES!** |
| **Government Compliance** | ✅ Yes | ❌ No |
| **Trip Registration** | ✅ Yes | ❌ No |

### Recommended Architecture

```
┌─────────────────────────────────────────┐
│   Your Platform (TMS Module)            │
│   - Shipment management                 │
│   - Tracking dashboard                  │
└─────────────────────────────────────────┘
              │
              ├─── WASL (EFF) ────► Government Compliance
              │    - Vehicle registration
              │    - Trip registration
              │    - Manual location sync
              │
              └─── Daleel (Waybill) ────► Real-Time Tracking
                   - Real-time GPS
                   - Location history
                   - Speed/heading
                   - Automatic updates
```

## 💡 Use Cases

### Use Case 1: Real-Time Fleet Tracking
1. **Register** vehicles in WASL (compliance)
2. **Start tracking** vehicles with Daleel
3. **Monitor** real-time location, speed, heading
4. **View** location history
5. **Get alerts** for geofence violations

### Use Case 2: Shipment Tracking
1. **Create shipment** in your platform
2. **Auto-start** Daleel tracking
3. **Track** in real-time on dashboard
4. **Update** WASL for compliance
5. **Complete** when delivered

### Use Case 3: Geofence Monitoring
1. **Define** geofence areas
2. **Query** vehicles in polygon
3. **Get alerts** when vehicles enter/exit
4. **Track** weight drops

## 🔧 Implementation Example

```typescript
import { getDaleelService } from '@/lib/services/daleel/initialize'
import { getWaslService } from '@/lib/services/wasl/initialize'
import { eventBus } from '@/lib/services/event-store'

// When shipment is created
eventBus.subscribe('tms.shipment.created', async (event) => {
  const shipment = event.payload
  
  // 1. Register trip in WASL (compliance)
  const waslService = getWaslService()
  if (waslService) {
    await waslService.syncShipmentToWasl(shipment)
  }
  
  // 2. Start real-time tracking with Daleel
  const daleelService = getDaleelService()
  if (daleelService && shipment.vehiclePlateNumber) {
    await daleelService.startTracking({
      plateNumber: shipment.vehiclePlateNumber
    })
  }
})

// When location updates from Daleel
eventBus.subscribe('daleel.location.updated', async (event) => {
  const { vehiclePlate, location } = event.payload
  
  // Update WASL for compliance
  const waslService = getWaslService()
  if (waslService) {
    // Find trip by vehicle plate
    // Update location in WASL
  }
  
  // Update your tracking dashboard
  // Send real-time updates to clients
})
```

## 📝 Summary

### What Daleel Provides:
- ✅ **Real-time GPS tracking** (automatic)
- ✅ **Current location** with details
- ✅ **Location history** for any period
- ✅ **Speed, heading, fuel level** data
- ✅ **Multi-vehicle tracking**
- ✅ **Polygon search** (geofencing)
- ✅ **Weight drop tracking**

### Combined Solution:
- ✅ **Real-time tracking** (Daleel)
- ✅ **Government compliance** (WASL)
- ✅ **Automatic sync** between both
- ✅ **Complete tracking solution**

## 🎉 You Can Now Track Trucks in Real-Time!

With Daleel integration, you have:
- ✅ Real-time GPS coordinates
- ✅ Automatic location updates
- ✅ Speed and heading data
- ✅ Location history
- ✅ Multi-vehicle tracking
- ✅ Integration with your platform

**This is exactly what you need for real-time truck tracking!** 🚚📍




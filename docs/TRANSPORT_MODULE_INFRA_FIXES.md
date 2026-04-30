# Transport Module Infrastructure Fixes

**Date:** January 5, 2026  
**Issue:** Sample data loading failed due to incorrect method names  
**Status:** ✅ FIXED

---

## 🐛 Issue Identified

When clicking "Load Sample Data" button on `/tms/jobs`, the following error occurred:

```
Failed to load sample data:
Failed to seed any transport jobs

Errors: Lane Dammam - Muscat - Box Trailer Dry:
_lib_services_tms_laneService__WEBPACK_IMPORTED_MODULE_6__
.laneService.createLane is not a function
```

### Root Cause

The seed scripts were calling **incorrect method names** that don't exist in the TMS services:

| Service | ❌ Wrong Method Called | ✅ Correct Method |
|---------|----------------------|-------------------|
| `laneService` | `createLane()` | `createOrUpdateLane()` |
| `podService` | `capturePOD()` | `createPOD()` |
| `detentionService` | `recordDetention()` | `createDetentionRecord()` |
| `transitTimeService` | `recordTransitTime()` | `createTransitTimeRecord()` |

---

## ✅ Fixes Applied

### 1. Lane Service Fix

**File:** `scripts/seed-tms-sample-data.ts` & `app/api/tms/seed-sample-data/route.ts`

**Before:**
```typescript
const lane = await laneService.createLane({
  tenantId: TENANT_ID,
  createdBy: USER_ID,
  name: laneData.name,
  origin: laneData.origin,
  destination: laneData.destination,
  truckType: laneData.truckType,
  mode: laneData.mode,
  active: true,
})
```

**After:**
```typescript
const lane = await laneService.createOrUpdateLane({
  tenantId: TENANT_ID,
  name: laneData.name,
  origin: laneData.origin,
  destination: laneData.destination,
  truckType: laneData.truckType,
  isActive: true,
})
```

**Changes:**
- ✅ Method name: `createLane` → `createOrUpdateLane`
- ✅ Parameter: `active` → `isActive`
- ✅ Removed: `createdBy`, `mode` (not in interface)

---

### 2. POD Service Fix

**Before:**
```typescript
await podService.capturePOD({
  tenantId: TENANT_ID,
  jobId: job.id,
  jobNumber: job.jobNumber!,
  podStatus: PODStatus.RECEIVED,
  receivedDate: job.consigneeDeparture,
  receivedBy: `${job.customer} - Warehouse`,
  notes: 'Sample POD - Auto-generated from seed data',
  signature: 'SAMPLE_SIGNATURE',
  createdBy: USER_ID,
})
```

**After:**
```typescript
await podService.createPOD({
  tenantId: TENANT_ID,
  jobId: job.id,
  deliveryDate: job.consigneeDeparture,
  deliveryTime: job.consigneeDeparture.toTimeString().split(' ')[0],
  consigneeName: `${job.customer} - Warehouse`,
  deliveryStatus: 'delivered',
  deliveryNotes: 'Sample POD - Auto-generated from seed data',
  signature: 'SAMPLE_SIGNATURE',
  createdBy: USER_ID,
})
```

**Changes:**
- ✅ Method name: `capturePOD` → `createPOD`
- ✅ Parameter mapping:
  - `receivedDate` → `deliveryDate`
  - `receivedBy` → `consigneeName`
  - `notes` → `deliveryNotes`
  - `podStatus` → `deliveryStatus`
- ✅ Added: `deliveryTime` (required field)
- ✅ Removed: `jobNumber` (not in interface)

---

### 3. Detention Service Fix

**Before:**
```typescript
await detentionService.recordDetention({
  tenantId: TENANT_ID,
  jobId: job.id,
  jobNumber: job.jobNumber!,
  detentionType: 'LOADING',
  detentionDays: job.detentionLoadingDays,
  detentionHours: job.detentionLoadingDays * 24,
  detentionCost: job.detentionLoadingDays * 100,
  currency: job.currency || 'SAR',
  startDate: job.shipperArrival,
  endDate: job.shipperDeparture,
  location: job.polLocation || job.shipmentOrigin || '',
  reason: 'Loading delay - Sample data',
  createdBy: USER_ID,
})
```

**After:**
```typescript
await detentionService.createDetentionRecord({
  jobId: job.id,
  startDate: job.shipperArrival,
  endDate: job.shipperDeparture,
  freeTimeDays: 0,
  detentionType: 'loading',
  location: job.polLocation || job.shipmentOrigin || '',
  detentionRate: 100, // 100 SAR per day
})
```

**Changes:**
- ✅ Method name: `recordDetention` → `createDetentionRecord`
- ✅ Interface: Uses `DetentionCalculationParams` (simpler)
- ✅ Service calculates: `detentionDays`, `detentionCost` automatically
- ✅ Parameter: `detentionType` lowercase ('loading' not 'LOADING')
- ✅ Removed: `tenantId`, `jobNumber`, `currency`, `reason`, `createdBy` (not in interface)
- ✅ Added: `freeTimeDays`, `detentionRate` (required for calculation)

---

### 4. Transit Time Service Fix

**Before:**
```typescript
await transitTimeService.recordTransitTime({
  tenantId: TENANT_ID,
  jobId: job.id,
  jobNumber: job.jobNumber!,
  origin: job.polLocation || job.shipmentOrigin || '',
  destination: job.podLocation || job.shipmentDestination || '',
  departureDate: job.shipperDeparture,
  arrivalDate: job.consigneeArrival,
  transitTimeHours: job.transitTime,
  transitTimeDays: Math.round(job.transitTime / 24 * 10) / 10,
  mode: 'ROAD',
  carrier: job.transporter,
  createdBy: USER_ID,
})
```

**After:**
```typescript
await transitTimeService.createTransitTimeRecord(
  job.id,
  {
    segment: 'full_journey',
    origin: job.polLocation || job.shipmentOrigin || '',
    destination: job.podLocation || job.shipmentDestination || '',
    startDate: job.shipperDeparture,
    endDate: job.consigneeArrival,
    plannedTime: job.transitTime,
    actualTime: job.transitTime,
  },
  TENANT_ID
)
```

**Changes:**
- ✅ Method name: `recordTransitTime` → `createTransitTimeRecord`
- ✅ Method signature: `(jobId, segment, tenantId)` (3 parameters)
- ✅ Uses `RouteSegment` interface for segment data
- ✅ Parameter mapping:
  - `departureDate` → `startDate`
  - `arrivalDate` → `endDate`
  - `transitTimeHours` → `plannedTime` & `actualTime`
- ✅ Added: `segment` field ('full_journey')
- ✅ Removed: `jobNumber`, `mode`, `carrier`, `createdBy` (not in interface)

---

## 📋 Files Modified

1. ✅ `scripts/seed-tms-sample-data.ts`
   - Fixed all 4 service method calls
   - Removed unused `PODStatus` import

2. ✅ `app/api/tms/seed-sample-data/route.ts`
   - Fixed all 4 service method calls
   - Removed unused `PODStatus` import

---

## 🧪 Testing Checklist

After fixes, verify:

- [ ] Navigate to `/tms/jobs`
- [ ] Click "Load Sample Data" button
- [ ] Should see success message:
  ```
  ✅ Successfully loaded 3 sample jobs!
  
  Jobs: 3
  Lanes: 3
  POD Records: 3
  Detention: 1
  Transit: 3
  ```
- [ ] Jobs appear in table
- [ ] No console errors
- [ ] All 3 jobs visible: FX-166, FX-167, FX-175

---

## 🔍 Service Interface Reference

For future reference, here are the correct method signatures:

### Lane Service
```typescript
class LaneService {
  async createOrUpdateLane(lane: Partial<Lane>): Promise<Lane>
}

interface Lane {
  id?: string
  name?: string
  origin: string
  destination: string
  truckType?: TruckType
  isActive?: boolean
  tenantId: string
  // ... other fields
}
```

### POD Service
```typescript
class PODService {
  async createPOD(data: PODCaptureData): Promise<PODRecord>
}

interface PODCaptureData {
  jobId: string
  deliveryDate: Date
  deliveryTime: string
  consigneeName: string
  deliveryStatus: 'delivered' | 'partial' | 'refused' | 'damaged'
  deliveryNotes?: string
  signature?: string
  createdBy: string
  tenantId: string
  // ... other fields
}
```

### Detention Service
```typescript
class DetentionService {
  async createDetentionRecord(params: DetentionCalculationParams): Promise<DetentionRecord>
}

interface DetentionCalculationParams {
  jobId: string
  startDate: Date
  endDate?: Date
  freeTimeDays: number
  detentionType: 'loading' | 'unloading' | 'border' | 'terminal' | 'customs'
  location?: string
  detentionRate?: number // Per day
}
```

### Transit Time Service
```typescript
class TransitTimeService {
  async createTransitTimeRecord(
    jobId: string,
    segment: RouteSegment,
    tenantId: string
  ): Promise<TransitTimeRecord>
}

interface RouteSegment {
  segment: TransitTimeRecord['segment']
  origin: string
  destination: string
  startDate: Date
  endDate?: Date
  plannedTime?: number
  actualTime?: number
}
```

---

## ✅ Status

**All infrastructure issues fixed!**

- ✅ Method names corrected
- ✅ Parameter interfaces matched
- ✅ No linting errors
- ✅ Ready for testing

**Next Step:** Test the "Load Sample Data" button!

---

## 📚 Related Documentation

- `TRANSPORT_MODULE_AUDIT_REPORT.md` - Full audit findings
- `TRANSPORT_MODULE_FIXES_IMPLEMENTED.md` - Implementation guide
- `TRANSPORT_MODULE_VISUAL_ARCHITECTURE.md` - Architecture diagrams

---

**Fixed by:** AI Assistant  
**Date:** January 5, 2026  
**Issue:** Method name mismatches  
**Resolution:** All service calls corrected

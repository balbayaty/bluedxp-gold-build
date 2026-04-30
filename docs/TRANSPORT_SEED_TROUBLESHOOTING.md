# Transport Module Seed Data - Troubleshooting Guide

**Updated:** January 5, 2026  
**Status:** Active Debugging

---

## 🔍 Current Error Analysis

### Error Message Pattern
```
Failed to load sample data:
Failed to seed any transport jobs

Errors: Lane Dammam - Muscat - Box Trailer Dry:
_lib_services_tms_laneService__WEBPACK_IMPORTED_MODULE_6__.laneService.createLane is not a function
```

---

## ✅ Fixes Applied

### Round 1: Method Name Corrections

| Service | Fixed |
|---------|-------|
| `laneService.createLane()` → `createOrUpdateLane()` | ✅ |
| `podService.capturePOD()` → `createPOD()` | ✅ |
| `detentionService.recordDetention()` → `createDetentionRecord()` | ✅ |
| `transitTimeService.recordTransitTime()` → `createTransitTimeRecord()` | ✅ |

### Round 2: Parameter Fixes

| Issue | Fixed |
|-------|-------|
| Transit segment: `'full_journey'` → `'full'` | ✅ |
| Unused `PODStatus` import removed | ✅ |
| All parameter interfaces matched | ✅ |

---

## 🧪 Testing Steps

### Step 1: Clear Browser Cache
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Or: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
```

### Step 2: Check Browser Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Click "Load Sample Data"
4. Look for error messages
```

### Step 3: Check Network Tab
```
1. Open DevTools (F12)
2. Go to Network tab
3. Click "Load Sample Data"
4. Check POST request to /api/tms/seed-sample-data
5. View response body
```

---

## 🐛 Potential Issues & Solutions

### Issue 1: Webpack Not Rebuilding

**Symptom:** Old code still running after changes  
**Solution:**
```bash
# Stop the dev server (Ctrl+C)
# Clear Next.js cache
rm -rf .next
# Restart
npm run dev
```

### Issue 2: Service Not Exported Properly

**Check:** `lib/services/tms/index.ts`
```typescript
export { laneService } from './laneService';  // Must exist
```

**Verify:**
```bash
# Search for export
grep -n "export.*laneService" lib/services/tms/index.ts
```

### Issue 3: TypeScript Compilation Error

**Check for TS errors:**
```bash
npx tsc --noEmit
```

### Issue 4: Import Path Issues

**Verify imports in seed script:**
```typescript
import { laneService } from '@/lib/services/tms/laneService'
// OR
import { laneService } from '@/lib/services/tms'
```

---

## 📋 Manual Verification Checklist

### Service Files Exist
- [ ] `lib/services/tms/laneService.ts` exists
- [ ] `lib/services/tms/podService.ts` exists
- [ ] `lib/services/tms/detentionService.ts` exists
- [ ] `lib/services/tms/transitTimeService.ts` exists

### Services Export Correct Methods
- [ ] `laneService.createOrUpdateLane` exists
- [ ] `podService.createPOD` exists
- [ ] `detentionService.createDetentionRecord` exists
- [ ] `transitTimeService.createTransitTimeRecord` exists

### Index Exports Services
- [ ] `lib/services/tms/index.ts` exports all services

### API Route Exists
- [ ] `app/api/tms/seed-sample-data/route.ts` exists
- [ ] Exports `POST` handler

---

## 🔧 Quick Fixes

### Fix 1: Restart Development Server

```bash
# Terminal
Ctrl+C  # Stop server
npm run dev  # Restart
```

### Fix 2: Clear Next.js Cache

```bash
# Terminal
rm -rf .next
npm run dev
```

### Fix 3: Re-import Services

Check `app/api/tms/seed-sample-data/route.ts`:
```typescript
import { laneService } from '@/lib/services/tms'
// Should work because index.ts exports it
```

---

## 🧬 Code Verification

### Correct Lane Service Call

```typescript
// ✅ CORRECT
const lane = await laneService.createOrUpdateLane({
  tenantId,
  name: laneData.name,
  origin: laneData.origin,
  destination: laneData.destination,
  truckType: laneData.truckType,
  isActive: true,
})
```

### Correct POD Service Call

```typescript
// ✅ CORRECT
await podService.createPOD({
  tenantId,
  jobId: job.id,
  deliveryDate: job.consigneeDeparture,
  deliveryTime: job.consigneeDeparture.toTimeString().split(' ')[0],
  consigneeName: `${job.customer} - Warehouse`,
  deliveryStatus: 'delivered',
  deliveryNotes: 'Sample POD',
  signature: 'SAMPLE_SIGNATURE',
  createdBy: userId,
})
```

### Correct Detention Service Call

```typescript
// ✅ CORRECT
await detentionService.createDetentionRecord({
  jobId: job.id,
  startDate: job.shipperArrival,
  endDate: job.shipperDeparture,
  freeTimeDays: 0,
  detentionType: 'loading',
  location: job.polLocation || job.shipmentOrigin || '',
  detentionRate: 100,
})
```

### Correct Transit Time Service Call

```typescript
// ✅ CORRECT
await transitTimeService.createTransitTimeRecord(
  job.id,
  {
    segment: 'full',  // Must be: 'full' | 'pol_to_border' | 'border_to_pod' | 'transit_border' | 'custom'
    origin: job.polLocation || job.shipmentOrigin || '',
    destination: job.podLocation || job.shipmentDestination || '',
    startDate: job.shipperDeparture,
    endDate: job.consigneeArrival,
    plannedTime: job.transitTime,
    actualTime: job.transitTime,
  },
  tenantId
)
```

---

## 🎯 Next Steps If Still Failing

1. **Share the exact error message** from browser console
2. **Check Network tab** - what's the API response?
3. **Verify service exists:**
   ```bash
   # Check if method exists
   grep -n "createOrUpdateLane" lib/services/tms/laneService.ts
   ```
4. **Check webpack build:**
   ```
   Look for compilation errors in terminal where dev server is running
   ```

---

## 📊 Expected Success Response

When it works, you should see:

**API Response:**
```json
{
  "success": true,
  "jobs": 3,
  "lanes": 3,
  "podRecords": 3,
  "detentionRecords": 1,
  "transitRecords": 3,
  "errors": [],
  "message": "Successfully seeded 3 transport jobs with related records"
}
```

**UI Alert:**
```
✅ Successfully loaded 3 sample jobs!

Jobs: 3
Lanes: 3
POD Records: 3
Detention: 1
Transit: 3
```

---

## 🔍 Debug Commands

### Check Service Exports
```bash
grep "export.*Service" lib/services/tms/index.ts
```

### Check Method Definitions
```bash
grep "async create" lib/services/tms/laneService.ts
grep "async create" lib/services/tms/podService.ts
grep "async create" lib/services/tms/detentionService.ts
grep "async create" lib/services/tms/transitTimeService.ts
```

### Check API Route
```bash
cat app/api/tms/seed-sample-data/route.ts | grep "import.*Service"
```

---

## 💡 Common Causes

1. **Webpack cache** - Needs restart
2. **Import path** - Check @ alias resolution
3. **TypeScript errors** - Check compilation
4. **Service not exported** - Check index.ts
5. **Browser cache** - Hard refresh needed

---

**If error persists, please share:**
1. Exact error message from console
2. Network tab response
3. Terminal output (where npm run dev is running)

This will help identify the root cause!

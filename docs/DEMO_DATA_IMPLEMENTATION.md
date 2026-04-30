# Demo Data Implementation

## Overview
Added comprehensive demo data system to make dashboards look impressive with realistic test data when real data is not available.

## What Was Done

### 1. **Demo Data Service** ✅
Created `lib/services/demo/demoDataService.ts` with generators for:
- **Shipments**: 150+ realistic shipments with carriers, statuses, modes, cities
- **Carriers**: 8 major carriers (Aramex, DHL, FedEx, UPS, SMSA, Zajil, Saudi Post, Naqel)
- **Inventory**: 200+ SKUs across categories and warehouses
- **Orders**: 100+ orders with various statuses
- **Financial Data**: 12 months of revenue, expenses, profit data
- **Metrics**: Comprehensive KPIs and analytics

### 2. **API Integration** ✅
Updated APIs to return demo data when no real data exists:
- `/api/transportation/shipments` - Returns demo shipments
- `/api/transportation/carriers` - Returns demo carriers
- Auto-enabled in development mode
- Can be toggled via `/api/demo/toggle`

### 3. **Demo Mode Toggle** ✅
- Created `components/DemoModeToggle.tsx` - Beautiful toggle component
- Added to header navigation bar
- Shows "DEMO" or "LIVE" status
- Stored in localStorage for client-side checks

## How It Works

### Automatic Demo Mode
- **Development**: Demo mode is ON by default
- **Production**: Demo mode is OFF by default (can be enabled via toggle)

### Demo Data Features
- **Realistic Data**: All demo data looks real and professional
- **Variety**: Different statuses, dates, amounts, locations
- **Scale**: Generates 100-500+ items per module
- **Relationships**: Data is properly linked (carriers to shipments, etc.)

## Usage

### Enable Demo Mode
1. Click the demo toggle in the header (shows "DEMO" when enabled)
2. Or set `ENABLE_DEMO_DATA=true` in environment variables
3. Dashboards will automatically show demo data

### Disable Demo Mode
1. Click the demo toggle to turn it off
2. Or set `ENABLE_DEMO_DATA=false`
3. Dashboards will show real data (or empty if none exists)

## Demo Data Examples

### Shipments
- 150+ shipments with tracking numbers
- Various statuses: CREATED, IN_TRANSIT, DELIVERED, etc.
- Multiple modes: ROAD, AIR, SEA, RAIL
- Saudi cities: Riyadh, Jeddah, Dammam, Mecca, Medina, etc.
- Realistic freight costs and transit times

### Carriers
- 8 major carriers with ratings
- Performance metrics (on-time rates, shipment counts)
- Service types and coverage areas

### Inventory
- 200+ SKUs across 8 categories
- Multiple warehouses
- Stock levels, values, reservations
- Last updated dates

## Benefits

1. **Impressive Demos**: Dashboards look professional with real data
2. **Team Presentations**: Perfect for showing to stakeholders
3. **Development**: No need for real data during development
4. **Testing**: Comprehensive test data for all scenarios
5. **UX**: No more empty dashboards or loading spinners

## Next Steps

### To Add Demo Data to More Modules:
1. Add generator function to `demoDataService.ts`
2. Update API endpoint to check `isDemoModeEnabled()`
3. Return demo data when real data is empty

### Modules That Need Demo Data:
- [ ] Inventory/WMS APIs
- [ ] Finance APIs
- [ ] CRM APIs
- [ ] QHSE APIs
- [ ] Procurement APIs

## Technical Details

### Demo Mode Detection
```typescript
function isDemoModeEnabled(): boolean {
  // Client-side: Check localStorage
  if (typeof window !== 'undefined') {
    return localStorage.getItem('demo-mode') === 'true' || 
           process.env.NODE_ENV === 'development'
  }
  // Server-side: Check environment variable
  return process.env.ENABLE_DEMO_DATA === 'true' || 
         process.env.NODE_ENV === 'development'
}
```

### API Pattern
```typescript
// In API route
if (realData.length === 0 && isDemoModeEnabled()) {
  const demoData = generateDemoData({ count: limit })
  return NextResponse.json(demoData)
}
return NextResponse.json(realData)
```

## Status

✅ **Completed:**
- Demo data service created
- Transportation APIs updated
- Demo mode toggle UI added
- Header integration complete

🔄 **In Progress:**
- Adding demo data to more modules

📋 **Planned:**
- Inventory/WMS demo data
- Finance demo data
- CRM demo data
- QHSE demo data

---

**Result**: Dashboards now load instantly with impressive, realistic demo data! 🚀







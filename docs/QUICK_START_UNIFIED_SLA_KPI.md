# Quick Start: Unified SLA/KPI Service

## 🚀 Get Started in 5 Minutes

### Step 1: Add Database Schema (One-Time)

```bash
# Run the script to add schema to Prisma
npx tsx scripts/add-unified-sla-kpi-to-prisma.ts

# Format and generate Prisma client
npx prisma format
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_unified_sla_kpi
```

### Step 2: Service Auto-Initializes

The service automatically initializes when your app starts (already configured in `app/layout.tsx`).

No additional code needed! ✅

### Step 3: View Dashboard

Navigate to: **`/sla-kpi/dashboard`**

You'll see:
- Overall SLA compliance metrics
- KPI performance indicators
- Recent breaches
- Module-wise breakdowns

### Step 4: Use in Your Code

```typescript
import { transportationSlaKpiAdapter } from '@/lib/services/sla-kpi'

// Check SLA compliance
const compliance = await transportationSlaKpiAdapter.checkSLACompliance(
  'shipment-123',
  'carrier-123',
  { actual: 48, target: 48 },
  tenantId
)

console.log(`Compliance: ${compliance.compliancePercentage}%`)
console.log(`Status: ${compliance.status}`)
```

## 📊 What You Get

### Automatic Tracking
- ✅ Transportation shipments → Auto-tracked
- ✅ WMS operations → Auto-tracked
- ✅ Geofence events → Auto-tracked
- ✅ Customs clearance → Auto-tracked

### Real-Time Monitoring
- Compliance checked every 5 minutes
- KPIs calculated every 15 minutes
- Events processed instantly

### Unified Dashboard
- Single view across all modules
- Performance metrics
- Breach alerts
- Trend analysis

## 🎯 Common Tasks

### Create an SLA

```typescript
import { unifiedSlaKpiService } from '@/lib/services/sla-kpi'

const sla = await unifiedSlaKpiService.createSLA({
  name: 'On-Time Delivery',
  partyType: 'CARRIER',
  partyId: 'carrier-123',
  partyName: 'ABC Logistics',
  partyRole: 'PROVIDER',
  serviceCategory: 'TRANSPORTATION',
  serviceType: 'On-Time Delivery',
  targetDuration: 48 * 3600, // 48 hours in seconds
  warningThreshold: 80,
  criticalThreshold: 100,
  metric: 'duration',
  responsibleParty: 'CARRIER',
  responsiblePartyId: 'carrier-123',
  isActive: true,
}, tenantId)
```

### Check Compliance

```typescript
const compliance = await unifiedSlaKpiService.calculateSLACompliance(
  sla,
  {
    id: 'shipment-123',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-03T14:00:00Z'),
  },
  tenantId
)
```

### Get Dashboard Data

```typescript
const dashboard = await unifiedSlaKpiService.getSLADashboard(tenantId)
console.log(`Overall Compliance: ${dashboard.overallCompliance}%`)
console.log(`Active SLAs: ${dashboard.activeSLAs}`)
```

## 🔗 API Endpoints

### Get Unified Dashboard
```bash
GET /api/sla-kpi/unified?tenantId=default&type=both
```

### Create SLA
```bash
POST /api/sla-kpi/unified
Content-Type: application/json

{
  "tenantId": "default",
  "sla": {
    "name": "On-Time Delivery",
    "partyType": "CARRIER",
    ...
  }
}
```

### Get Compliance Results
```bash
GET /api/sla-kpi/unified/compliance?tenantId=default&status=BREACH
```

## 📚 Learn More

- **Complete Guide**: `docs/UNIFIED_SLA_KPI_IMPLEMENTATION.md`
- **Migration Guide**: `docs/MIGRATION_GUIDE_UNIFIED_SLA_KPI.md`
- **Full Summary**: `docs/UNIFIED_SLA_KPI_COMPLETE.md`

## ✅ That's It!

The unified service is now:
- ✅ Initialized automatically
- ✅ Tracking events from all modules
- ✅ Ready to use in your code
- ✅ Dashboard available at `/sla-kpi/dashboard`

**No additional setup needed!** 🎉

---

**Need Help?** Check the documentation files or review the code in `lib/services/sla-kpi/`



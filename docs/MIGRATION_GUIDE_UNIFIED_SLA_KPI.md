# Migration Guide: Unified SLA/KPI Service

## Overview

This guide helps you migrate from module-specific SLA/KPI services to the unified service.

## Step 1: Add Database Schema

### Option A: Using Prisma (Recommended)

```bash
# Run the script to add schema to schema.prisma
npx tsx scripts/add-unified-sla-kpi-to-prisma.ts

# Format and generate Prisma client
npx prisma format
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_unified_sla_kpi
```

### Option B: Direct SQL

```bash
# Apply SQL migration directly
psql $DATABASE_URL < prisma/migrations/add_unified_sla_kpi_schema.sql
```

## Step 2: Initialize Service

Add initialization to your app startup (e.g., in `app/layout.tsx` or middleware):

```typescript
import { unifiedSlaKpiService } from '@/lib/services/sla-kpi'

// Initialize for default tenant (or get from auth)
await unifiedSlaKpiService.initialize('default')
```

## Step 3: Migrate Existing Data

Run the migration service to move existing SLAs/KPIs:

```typescript
import { slaKpiMigrationService } from '@/lib/services/sla-kpi'

const result = await slaKpiMigrationService.migrateAll(tenantId)
console.log(`Migrated ${result.slasMigrated} SLAs and ${result.kpisMigrated} KPIs`)

if (result.errors.length > 0) {
  console.error('Migration errors:', result.errors)
}
```

## Step 4: Update Module Code

### Transportation Module

**Before:**
```typescript
const metrics = await moduleIntegrationService.getSLAMetrics(shipmentId)
```

**After:**
```typescript
import { transportationSlaKpiAdapter } from '@/lib/services/sla-kpi'

const compliance = await transportationSlaKpiAdapter.checkSLACompliance(
  shipmentId,
  carrierId,
  { actual: 48, target: 48 },
  tenantId
)
```

### WMS Module

**Before:**
```typescript
const metrics = await wmsSlaKpiService.getSlaMetrics(warehouseId)
```

**After:**
```typescript
import { wmsSlaKpiAdapter } from '@/lib/services/sla-kpi'

const metrics = await wmsSlaKpiAdapter.getSlaMetrics(warehouseId, undefined, tenantId)
```

### Geofence Module

**Before:**
```typescript
const compliance = await geofenceSlaKpiService.checkSLACompliance(event, zone)
```

**After:**
```typescript
import { geofenceSlaKpiAdapter } from '@/lib/services/sla-kpi'

const compliance = await geofenceSlaKpiAdapter.checkSLACompliance(event, zone, tenantId)
```

## Step 5: Update API Calls

### Old Endpoints (Deprecated)
- `/api/geofence/sla-kpi/*` - Use unified service
- `/api/wms/sla-kpi/*` - Use unified service

### New Unified Endpoints
- `GET /api/sla-kpi/unified` - Unified dashboard
- `POST /api/sla-kpi/unified` - Create SLA
- `POST /api/sla-kpi/unified/kpi` - Create KPI
- `GET /api/sla-kpi/unified/compliance` - Get compliance results

## Step 6: Update UI Components

Replace module-specific dashboards with unified dashboard:

```typescript
// Navigate to unified dashboard
router.push('/sla-kpi/dashboard')
```

Or use the API directly:

```typescript
const response = await fetch(`/api/sla-kpi/unified?tenantId=${tenantId}&type=both`)
const { sla, kpi } = await response.json()
```

## Step 7: Remove Old Services (After Verification)

Once migration is complete and verified:

1. **Mark as deprecated** (already done):
   - `lib/services/geofence/sla-kpi/geofenceSlaKpiService.ts` → Use adapter
   - `lib/services/process-lifecycle/wms/wmsSlaKpiService.ts` → Use adapter

2. **Update imports** throughout codebase:
   ```bash
   # Find all imports
   grep -r "geofenceSlaKpiService" --include="*.ts" --include="*.tsx"
   grep -r "wmsSlaKpiService" --include="*.ts" --include="*.tsx"
   ```

3. **Replace with adapter imports**:
   ```typescript
   // Old
   import { geofenceSlaKpiService } from '@/lib/services/geofence/sla-kpi/geofenceSlaKpiService'
   
   // New
   import { geofenceSlaKpiAdapter } from '@/lib/services/sla-kpi'
   ```

## Step 8: Verify Integration

### Checklist

- [ ] Database schema applied
- [ ] Service initialized
- [ ] Data migrated successfully
- [ ] Module code updated
- [ ] API endpoints working
- [ ] UI components updated
- [ ] Events being published and received
- [ ] Compliance tracking working
- [ ] Dashboard showing correct data

### Test Scenarios

1. **Create SLA**:
   ```typescript
   const sla = await unifiedSlaKpiService.createSLA({...}, tenantId)
   ```

2. **Check Compliance**:
   ```typescript
   const compliance = await unifiedSlaKpiService.calculateSLACompliance(sla, transaction, tenantId)
   ```

3. **View Dashboard**:
   - Navigate to `/sla-kpi/dashboard`
   - Verify metrics are displayed correctly

4. **Test Event Integration**:
   - Create a shipment
   - Verify SLA tracking is automatic
   - Check compliance results

## Troubleshooting

### Service Not Initialized
**Error**: Service methods fail
**Solution**: Ensure `initialize()` is called before use

### No Compliance Results
**Issue**: Results not appearing
**Solution**: 
- Check events are being published
- Verify SLA is active and applicable
- Check transaction context

### Migration Errors
**Issue**: Some SLAs/KPIs fail to migrate
**Solution**: 
- Check error details
- Manually migrate problematic items
- Verify source data format

### Database Errors
**Issue**: Schema not found
**Solution**: 
- Run migration script
- Apply Prisma migration
- Verify database connection

## Rollback Plan

If issues occur:

1. **Keep old services** until migration is verified
2. **Use feature flags** to switch between old/new
3. **Monitor** both systems in parallel initially
4. **Gradual rollout** by module

## Support

For issues:
1. Check this guide
2. Review `docs/UNIFIED_SLA_KPI_IMPLEMENTATION.md`
3. Check service logs
4. Review event bus activity

---

**Last Updated**: 2024-01-XX
**Version**: 1.0.0



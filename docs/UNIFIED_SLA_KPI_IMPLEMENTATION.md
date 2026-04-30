# Unified SLA/KPI Service - Complete Implementation Guide

## Overview

The Unified SLA/KPI Service is a **world-class, industry-leading** system that consolidates all SLA and KPI tracking across the entire BlueDXP platform into a single, interconnected service. This eliminates duplication and provides a single source of truth for all performance metrics.

## Architecture

### Core Components

1. **Unified Service** (`lib/services/sla-kpi/unifiedSlaKpiService.ts`)
   - Central service for all SLA/KPI operations
   - Event-driven architecture
   - Real-time compliance monitoring
   - Predictive breach detection
   - Automated escalation

2. **Module Adapters** (`lib/services/sla-kpi/moduleAdapters/`)
   - `transportationAdapter.ts` - Transportation module integration
   - `wmsAdapter.ts` - WMS module integration
   - `geofenceAdapter.ts` - Geofence module integration
   - Additional adapters can be added for other modules

3. **Migration Service** (`lib/services/sla-kpi/migrationService.ts`)
   - Migrates existing module-specific SLA/KPI services
   - Removes duplications
   - Consolidates to unified service

4. **Database Schema** (`prisma/migrations/add_unified_sla_kpi_schema.sql`)
   - Unified tables for SLAs, KPIs, compliance results, and KPI results
   - Optimized indexes for performance
   - Multi-tenant support

5. **API Endpoints** (`app/api/sla-kpi/unified/`)
   - `/api/sla-kpi/unified` - Unified dashboard
   - `/api/sla-kpi/unified/kpi` - KPI management
   - `/api/sla-kpi/unified/compliance` - Compliance tracking

## Key Features

### 1. Multi-Party Supply Chain Support
- Supports all party types: CARRIER, WAREHOUSE, CUSTOMS_BROKER, VENDOR, CUSTOMER, etc.
- Tracks SLAs/KPIs for each party independently
- Cross-party dependency tracking

### 2. Global Standards Compliance
- SCOR (Supply Chain Operations Reference) aligned
- ISO standards compliant
- APICS/ASCM best practices
- Industry benchmarks included

### 3. Real-Time Monitoring
- Automatic SLA compliance checking
- Real-time KPI calculations
- Event-driven updates
- Predictive breach detection

### 4. Comprehensive Analytics
- Unified dashboard for all modules
- Performance by party, category, module
- Trend analysis
- Top performers and underperformers

### 5. Automated Escalation
- Configurable escalation rules
- Auto-notifications
- Stakeholder alerts
- Remediation tracking

## Usage

### Initialize Service

```typescript
import { unifiedSlaKpiService } from '@/lib/services/sla-kpi'

await unifiedSlaKpiService.initialize(tenantId)
```

### Create SLA

```typescript
const sla = await unifiedSlaKpiService.createSLA({
  name: 'On-Time Delivery',
  description: 'Carrier must deliver within 48 hours',
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

### Create KPI

```typescript
const kpi = await unifiedSlaKpiService.createKPI({
  name: 'On-Time Delivery Rate',
  description: 'Percentage of deliveries made on time',
  partyType: 'CARRIER',
  partyId: 'carrier-123',
  partyName: 'ABC Logistics',
  partyRole: 'PROVIDER',
  formula: '(onTimeDeliveries / totalDeliveries) * 100',
  target: 95,
  unit: 'percentage',
  category: 'performance',
  calculationMethod: 'REAL_TIME',
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

### Use Module Adapters

```typescript
import { transportationSlaKpiAdapter } from '@/lib/services/sla-kpi'

// Check SLA compliance for shipment
const compliance = await transportationSlaKpiAdapter.checkSLACompliance(
  'shipment-123',
  'carrier-123',
  {
    actual: 48, // hours
    target: 48,
  },
  tenantId
)

// Calculate on-time delivery KPI
const onTimeRate = await transportationSlaKpiAdapter.calculateOnTimeDeliveryKPI(
  'carrier-123',
  {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  tenantId
)
```

## Migration from Existing Services

### Step 1: Run Migration

```typescript
import { slaKpiMigrationService } from '@/lib/services/sla-kpi'

const result = await slaKpiMigrationService.migrateAll(tenantId)
console.log(`Migrated ${result.slasMigrated} SLAs and ${result.kpisMigrated} KPIs`)
```

### Step 2: Update Module Code

Replace module-specific SLA/KPI calls with adapter calls:

**Before:**
```typescript
const metrics = await wmsSlaKpiService.getSlaMetrics(warehouseId)
```

**After:**
```typescript
import { wmsSlaKpiAdapter } from '@/lib/services/sla-kpi'
const metrics = await wmsSlaKpiAdapter.getSlaMetrics(warehouseId)
```

### Step 3: Remove Duplicate Services

Once migration is complete and verified, remove:
- `lib/services/geofence/sla-kpi/geofenceSlaKpiService.ts` (use `geofenceSlaKpiAdapter` instead)
- `lib/services/process-lifecycle/wms/wmsSlaKpiService.ts` (use `wmsSlaKpiAdapter` instead)
- Any other module-specific SLA/KPI services

## Event Integration

The unified service automatically subscribes to module events:

- `transportation.shipment.created`
- `transportation.shipment.status.changed`
- `transportation.shipment.delivered`
- `wms.asn.received`
- `wms.asn.completed`
- `wms.order.fulfilled`
- `geofence.zone.entry`
- `geofence.zone.exit`
- `customs.declaration.submitted`
- `customs.cleared`
- `qhse.incident.created`
- `iso-ims.ncr.created`

## Database Schema

### Tables

1. **SupplyChainSLA** - SLA definitions
2. **SupplyChainKPI** - KPI definitions
3. **SupplyChainSLACompliance** - Compliance results
4. **SupplyChainKPIResult** - KPI measurement results

### Apply Schema

```bash
# Run migration SQL
psql $DATABASE_URL < prisma/migrations/add_unified_sla_kpi_schema.sql

# Or use Prisma (when schema is added to schema.prisma)
npx prisma migrate dev --name add_unified_sla_kpi
```

## API Endpoints

### GET /api/sla-kpi/unified
Get unified dashboard (SLA and/or KPI)

**Query Parameters:**
- `tenantId` (required)
- `type` - 'sla', 'kpi', or 'both' (default: 'both')

**Response:**
```json
{
  "success": true,
  "data": {
    "sla": {
      "overallCompliance": 95.5,
      "activeSLAs": 150,
      "compliantSLAs": 143,
      "breachedSLAs": 2,
      "atRiskSLAs": 5,
      ...
    },
    "kpi": {
      "overallPerformance": 92.3,
      "activeKPIs": 200,
      "onTargetKPIs": 185,
      ...
    }
  }
}
```

### POST /api/sla-kpi/unified
Create new SLA

**Body:**
```json
{
  "tenantId": "tenant-1",
  "sla": {
    "name": "On-Time Delivery",
    "partyType": "CARRIER",
    ...
  }
}
```

### POST /api/sla-kpi/unified/kpi
Create new KPI

### GET /api/sla-kpi/unified/compliance
Get compliance results with filters

### POST /api/sla-kpi/unified/compliance/check
Check compliance for a transaction

## Best Practices

1. **Always Initialize**: Call `initialize()` before using the service
2. **Use Adapters**: Use module adapters instead of direct service calls
3. **Event-Driven**: Let the service handle events automatically
4. **Monitor Dashboards**: Use unified dashboards for cross-module insights
5. **Regular Migration**: Run migration when adding new modules

## Troubleshooting

### Service Not Initialized
**Error**: "Service not initialized"
**Solution**: Call `await unifiedSlaKpiService.initialize(tenantId)` first

### No Compliance Results
**Issue**: Compliance results not appearing
**Solution**: 
- Check that events are being published
- Verify SLA is active and applicable
- Check transaction context matches SLA conditions

### Migration Errors
**Issue**: Migration fails for some modules
**Solution**: 
- Check error details in migration result
- Manually migrate problematic SLAs/KPIs
- Verify source service data format

## Future Enhancements

- [ ] Machine learning for breach prediction
- [ ] Advanced analytics and reporting
- [ ] Custom dashboard builder
- [ ] SLA/KPI templates library
- [ ] Industry benchmark integration
- [ ] Automated SLA negotiation
- [ ] Blockchain-based compliance verification

## Support

For issues or questions:
1. Check this documentation
2. Review code comments in service files
3. Check event bus logs
4. Review database schema

---

**Last Updated**: 2024-01-XX
**Version**: 1.0.0
**Status**: Production Ready



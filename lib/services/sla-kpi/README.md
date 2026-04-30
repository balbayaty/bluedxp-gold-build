# Unified SLA/KPI Service

**World-Class, Industry-Leading SLA/KPI Management System**

A comprehensive, unified service for tracking Service Level Agreements (SLAs) and Key Performance Indicators (KPIs) across all modules in the BlueDXP platform.

## 🎯 Overview

The Unified SLA/KPI Service provides:
- **Single Source of Truth** - One service for all SLA/KPI operations
- **Zero Duplications** - Eliminates module-specific implementations
- **Real-Time Monitoring** - Automatic compliance checking and KPI calculations
- **Predictive Analytics** - Breach risk prediction and recommendations
- **Global Standards** - SCOR, ISO, APICS/ASCM compliant
- **Multi-Party Support** - Tracks SLAs/KPIs for all supply chain parties
- **Event-Driven** - Automatic tracking via event bus integration

## 📁 Structure

```
lib/services/sla-kpi/
├── unifiedSlaKpiService.ts      # Core unified service
├── migrationService.ts           # Migration from old services
├── initialization.ts             # Service initialization
├── utils.ts                      # Utility functions
├── index.ts                      # Main exports
├── moduleAdapters/              # Module integration adapters
│   ├── transportationAdapter.ts
│   ├── wmsAdapter.ts
│   └── geofenceAdapter.ts
└── README.md                     # This file
```

## 🚀 Quick Start

### 1. Initialize Service

The service auto-initializes on app startup (configured in `app/layout.tsx`).

Manual initialization:
```typescript
import { initializeUnifiedSlaKpi } from '@/lib/services/sla-kpi'

await initializeUnifiedSlaKpi('default', { autoMigrate: true })
```

### 2. Use Module Adapters

```typescript
import { transportationSlaKpiAdapter } from '@/lib/services/sla-kpi'

const compliance = await transportationSlaKpiAdapter.checkSLACompliance(
  'shipment-123',
  'carrier-123',
  { actual: 48, target: 48 },
  'default'
)
```

### 3. Seed Initial Data

```bash
npx tsx scripts/seed-unified-sla-kpi.ts default
```

## 📚 Core Components

### Unified Service

The main service (`unifiedSlaKpiService.ts`) provides:

- **SLA Management**
  - Create, update, get SLAs
  - Detect applicable SLAs
  - Calculate compliance
  - Predict breach risk
  - Handle escalation

- **KPI Management**
  - Create, update, get KPIs
  - Calculate KPI values
  - Track performance
  - Compare vs benchmarks

- **Dashboard & Analytics**
  - Unified SLA dashboard
  - Unified KPI dashboard
  - Performance metrics
  - Trend analysis

### Module Adapters

Adapters provide module-specific interfaces:

- **Transportation Adapter** - Shipment SLA/KPI tracking
- **WMS Adapter** - Warehouse operations SLA/KPI
- **Geofence Adapter** - Zone-based SLA/KPI tracking

### Migration Service

Automatically migrates existing SLAs/KPIs from:
- Geofence module
- WMS module
- Other module-specific services

## 🔗 Integration

### Event Bus Integration

The service automatically subscribes to:

| Module | Events |
|--------|--------|
| Transportation | `shipment.created`, `shipment.status.changed`, `shipment.delivered` |
| WMS | `asn.received`, `asn.completed`, `order.fulfilled` |
| Geofence | `zone.entry`, `zone.exit` |
| Customs | `declaration.submitted`, `cleared` |
| QHSE | `incident.created` |
| ISO-IMS | `ncr.created` |

### Database Integration

Uses Prisma for persistence:
- `SupplyChainSLA` - SLA definitions
- `SupplyChainKPI` - KPI definitions
- `SupplyChainSLACompliance` - Compliance results
- `SupplyChainKPIResult` - KPI measurements

## 📊 Usage Examples

### Create SLA

```typescript
import { unifiedSlaKpiService } from '@/lib/services/sla-kpi'

const sla = await unifiedSlaKpiService.createSLA({
  name: 'On-Time Delivery',
  partyType: 'CARRIER',
  partyId: 'carrier-123',
  serviceCategory: 'TRANSPORTATION',
  targetDuration: 48 * 3600,
  // ... other fields
}, tenantId)
```

### Check Compliance

```typescript
const compliance = await unifiedSlaKpiService.calculateSLACompliance(
  sla,
  {
    id: 'shipment-123',
    startTime: new Date(),
    endTime: new Date(),
  },
  tenantId
)
```

### Get Dashboard

```typescript
const dashboard = await unifiedSlaKpiService.getSLADashboard(tenantId)
console.log(`Compliance: ${dashboard.overallCompliance}%`)
```

## 🛠️ Utilities

Helper functions available in `utils.ts`:

- `formatDuration()` - Format seconds to human-readable
- `formatKPIValue()` - Format KPI values with units
- `getSLAStatusColor()` - Get status color for UI
- `calculateCompliancePercentage()` - Calculate compliance
- `validateSLAData()` - Validate SLA before creation
- `validateKPIData()` - Validate KPI before creation

## 📖 Documentation

- **Implementation Guide**: `docs/UNIFIED_SLA_KPI_IMPLEMENTATION.md`
- **Code Examples**: `docs/UNIFIED_SLA_KPI_EXAMPLES.md`
- **Migration Guide**: `docs/MIGRATION_GUIDE_UNIFIED_SLA_KPI.md`
- **Quick Start**: `docs/QUICK_START_UNIFIED_SLA_KPI.md`
- **Complete Summary**: `docs/UNIFIED_SLA_KPI_COMPLETE.md`

## 🔧 Configuration

### Environment Variables

- `DATABASE_URL` - Database connection (for persistence)
- `USE_DATABASE` - Enable/disable database (default: true)

### Initialization Options

```typescript
await initializeUnifiedSlaKpi(tenantId, {
  autoMigrate: true,    // Auto-migrate existing SLAs/KPIs
  skipMigration: false  // Skip migration step
})
```

## 🎯 Best Practices

1. **Always Initialize** - Call `initialize()` before use
2. **Use Adapters** - Use module adapters instead of direct service calls
3. **Event-Driven** - Let the service handle events automatically
4. **Monitor Dashboards** - Use unified dashboards for insights
5. **Validate Data** - Use validation utilities before creating SLAs/KPIs

## 🐛 Troubleshooting

### Service Not Initialized
**Error**: Methods fail or return null
**Solution**: Ensure `initialize()` is called first

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

## 📈 Performance

- **Compliance Checks**: Every 5 minutes
- **KPI Calculations**: Every 15 minutes
- **Event Processing**: Real-time
- **Dashboard Updates**: On-demand

## 🔐 Security

- Multi-tenant isolation
- RBAC integration
- Input validation
- Audit logging

## 🌍 Standards Compliance

- **SCOR** (Supply Chain Operations Reference)
- **ISO** standards (9001, 14001)
- **APICS/ASCM** best practices
- Industry benchmarks included

## 📝 License

Part of BlueDXP Platform

---

**Version**: 1.0.0  
**Status**: Production Ready  
**Last Updated**: 2024-01-XX



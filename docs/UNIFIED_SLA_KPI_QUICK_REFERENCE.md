# Unified SLA/KPI Service - Quick Reference Card

## 🚀 Quick Commands

### Setup
```bash
# Add schema to Prisma
npx tsx scripts/add-unified-sla-kpi-to-prisma.ts

# Format and generate
npx prisma format && npx prisma generate

# Create migration
npx prisma migrate dev --name add_unified_sla_kpi

# Verify installation
npx tsx scripts/verify-unified-sla-kpi.ts default

# Seed initial data
npx tsx scripts/seed-unified-sla-kpi.ts default
```

## 📝 Code Snippets

### Initialize
```typescript
import { initializeUnifiedSlaKpi } from '@/lib/services/sla-kpi'
await initializeUnifiedSlaKpi('default')
```

### Use Adapter
```typescript
import { transportationSlaKpiAdapter } from '@/lib/services/sla-kpi'

// Check compliance
const compliance = await transportationSlaKpiAdapter.checkSLACompliance(
  'shipment-123',
  'carrier-123',
  { actual: 48, target: 48 },
  'default'
)
```

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
}, 'default')
```

### Get Dashboard
```typescript
const dashboard = await unifiedSlaKpiService.getSLADashboard('default')
```

## 🔗 API Endpoints

- `GET /api/sla-kpi/unified?tenantId=default&type=both` - Dashboard
- `POST /api/sla-kpi/unified` - Create SLA
- `POST /api/sla-kpi/unified/kpi` - Create KPI
- `GET /api/sla-kpi/unified/compliance` - Compliance results

## 📊 UI Access

- Dashboard: `/sla-kpi/dashboard`

## 🛠️ Utilities

```typescript
import {
  formatDuration,
  formatKPIValue,
  getSLAStatusColor,
  validateSLAData,
} from '@/lib/services/sla-kpi'

formatDuration(172800) // "2d"
formatKPIValue(95.5, 'percentage') // "95.50%"
getSLAStatusColor('MET') // "green"
```

## 📚 Documentation

- Quick Start: `docs/QUICK_START_UNIFIED_SLA_KPI.md`
- Examples: `docs/UNIFIED_SLA_KPI_EXAMPLES.md`
- Integration: `docs/UNIFIED_SLA_KPI_INTEGRATION_EXAMPLES.md`

## ✅ Status

**Production Ready** ✅



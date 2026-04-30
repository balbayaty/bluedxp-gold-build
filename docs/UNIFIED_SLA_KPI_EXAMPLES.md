# Unified SLA/KPI Service - Code Examples

## 📚 Complete Usage Examples

### Basic Usage

#### Initialize Service
```typescript
import { initializeUnifiedSlaKpi } from '@/lib/services/sla-kpi'

// Initialize for default tenant
await initializeUnifiedSlaKpi('default')

// Initialize with options
await initializeUnifiedSlaKpi('tenant-1', {
  autoMigrate: true,  // Auto-migrate existing SLAs/KPIs
  skipMigration: false
})
```

#### Create SLA
```typescript
import { unifiedSlaKpiService } from '@/lib/services/sla-kpi'

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
}, 'default')
```

#### Create KPI
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
}, 'default')
```

### Using Module Adapters

#### Transportation Module
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
  'default'
)

console.log(`Compliance: ${compliance.compliancePercentage}%`)
console.log(`Status: ${compliance.status}`)
console.log(`Risk Level: ${compliance.riskLevel}`)

// Calculate SLA risk
const risk = await transportationSlaKpiAdapter.calculateSLARisk(
  'shipment-123',
  'carrier-123',
  50, // estimated transit time in hours
  'default'
)

console.log(`Breach Probability: ${risk.probability}`)
console.log(`Recommendations:`, risk.recommendations)

// Get on-time delivery KPI
const onTimeRate = await transportationSlaKpiAdapter.calculateOnTimeDeliveryKPI(
  'carrier-123',
  {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date(),
  },
  'default'
)
```

#### WMS Module
```typescript
import { wmsSlaKpiAdapter } from '@/lib/services/sla-kpi'

// Get SLA metrics
const metrics = await wmsSlaKpiAdapter.getSlaMetrics(
  'warehouse-123',
  undefined, // entityType (optional)
  'default'
)

// Get performance dashboard
const dashboard = await wmsSlaKpiAdapter.getPerformanceDashboard(
  'warehouse-123',
  '7d', // timeRange
  'default'
)

console.log(`Overall Efficiency: ${dashboard.overallEfficiency}%`)
console.log(`SLA Compliance: ${dashboard.slaCompliance}%`)

// Calculate picking efficiency
const pickingEfficiency = await wmsSlaKpiAdapter.calculatePickingEfficiency(
  'warehouse-123',
  {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  'default'
)
```

#### Geofence Module
```typescript
import { geofenceSlaKpiAdapter } from '@/lib/services/sla-kpi'
import type { GeofenceEvent, GeofenceZone } from '@/lib/services/geofence/types'

// Check SLA compliance for geofence event
const complianceResults = await geofenceSlaKpiAdapter.checkSLACompliance(
  event, // GeofenceEvent
  zone,  // GeofenceZone
  'default'
)

for (const compliance of complianceResults) {
  console.log(`SLA: ${compliance.status}`)
  console.log(`Compliance: ${compliance.compliancePercentage}%`)
}
```

### Using Utilities

```typescript
import {
  getActiveSLAsForParty,
  formatDuration,
  calculateCompliancePercentage,
  getSLAStatusColor,
  formatKPIValue,
  calculateKPIPerformance,
} from '@/lib/services/sla-kpi'

// Get active SLAs
const slas = await getActiveSLAsForParty('CARRIER', 'carrier-123', 'default')

// Format duration
const formatted = formatDuration(172800) // "2d"

// Calculate compliance
const compliance = calculateCompliancePercentage(172800, 172800) // 100%

// Get status color
const color = getSLAStatusColor('MET') // "green"

// Format KPI value
const formattedKPI = formatKPIValue(95.5, 'percentage') // "95.50%"

// Calculate KPI performance
const performance = calculateKPIPerformance(95, 100)
// { percentage: 95, status: 'BELOW_TARGET' }
```

### Dashboard Usage

```typescript
import { unifiedSlaKpiService } from '@/lib/services/sla-kpi'

// Get SLA dashboard
const slaDashboard = await unifiedSlaKpiService.getSLADashboard('default', {
  partyType: 'CARRIER',
  serviceCategory: 'TRANSPORTATION',
  timeRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
})

console.log(`Overall Compliance: ${slaDashboard.overallCompliance}%`)
console.log(`Active SLAs: ${slaDashboard.activeSLAs}`)
console.log(`Breached SLAs: ${slaDashboard.breachedSLAs}`)

// Get KPI dashboard
const kpiDashboard = await unifiedSlaKpiService.getKPIDashboard('default', {
  partyType: 'CARRIER',
  category: 'performance',
})

console.log(`Overall Performance: ${kpiDashboard.overallPerformance}%`)
console.log(`On Target KPIs: ${kpiDashboard.onTargetKPIs}`)
```

### Event-Driven Usage

The service automatically handles events, but you can also manually trigger compliance checks:

```typescript
import { unifiedSlaKpiService } from '@/lib/services/sla-kpi'

// Detect applicable SLAs for a transaction
const context = {
  transactionType: 'SHIPMENT',
  partyType: 'CARRIER',
  partyId: 'carrier-123',
  serviceCategory: 'TRANSPORTATION',
  attributes: {
    shipmentType: 'STANDARD',
    priority: 'NORMAL',
  },
}

const applicableSLAs = await unifiedSlaKpiService.detectApplicableSLAs(
  context,
  'default'
)

// Calculate compliance
for (const sla of applicableSLAs) {
  const compliance = await unifiedSlaKpiService.calculateSLACompliance(
    sla,
    {
      id: 'shipment-123',
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-03T14:00:00Z'),
    },
    'default'
  )
  
  console.log(`SLA: ${sla.name}`)
  console.log(`Status: ${compliance.status}`)
  console.log(`Compliance: ${compliance.compliancePercentage}%`)
}
```

### API Usage

#### Get Dashboard
```typescript
const response = await fetch('/api/sla-kpi/unified?tenantId=default&type=both')
const { sla, kpi } = await response.json()

console.log(`SLA Compliance: ${sla.overallCompliance}%`)
console.log(`KPI Performance: ${kpi.overallPerformance}%`)
```

#### Create SLA via API
```typescript
const response = await fetch('/api/sla-kpi/unified', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'default',
    sla: {
      name: 'On-Time Delivery',
      partyType: 'CARRIER',
      // ... other fields
    },
  }),
})

const { data } = await response.json()
console.log(`Created SLA: ${data.id}`)
```

#### Get Compliance Results
```typescript
const response = await fetch(
  '/api/sla-kpi/unified/compliance?tenantId=default&status=BREACH'
)
const { results } = await response.json()

for (const result of results) {
  console.log(`SLA: ${result.slaName}`)
  console.log(`Status: ${result.status}`)
}
```

### Migration Example

```typescript
import { slaKpiMigrationService } from '@/lib/services/sla-kpi'

// Migrate all existing SLAs/KPIs
const result = await slaKpiMigrationService.migrateAll('default')

console.log(`Migrated ${result.slasMigrated} SLAs`)
console.log(`Migrated ${result.kpisMigrated} KPIs`)

if (result.errors.length > 0) {
  console.error('Migration errors:', result.errors)
}
```

### Validation Example

```typescript
import { validateSLAData, validateKPIData } from '@/lib/services/sla-kpi'

// Validate SLA before creating
const validation = validateSLAData({
  name: 'On-Time Delivery',
  partyType: 'CARRIER',
  // ... other fields
})

if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
  return
}

// Create SLA if valid
const sla = await unifiedSlaKpiService.createSLA(slaData, tenantId)
```

## 🎯 Real-World Scenarios

### Scenario 1: Track Shipment SLA
```typescript
// When shipment is created
const applicableSLAs = await unifiedSlaKpiService.detectApplicableSLAs({
  transactionType: 'SHIPMENT',
  partyType: 'CARRIER',
  partyId: shipment.carrierId,
  serviceCategory: 'TRANSPORTATION',
  attributes: { ...shipment },
}, tenantId)

// When shipment is delivered
for (const sla of applicableSLAs) {
  await unifiedSlaKpiService.calculateSLACompliance(
    sla,
    {
      id: shipment.id,
      startTime: shipment.pickupTime,
      endTime: shipment.deliveryTime,
    },
    tenantId
  )
}
```

### Scenario 2: Monitor Warehouse Performance
```typescript
// Get WMS performance dashboard
const dashboard = await wmsSlaKpiAdapter.getPerformanceDashboard(
  warehouseId,
  '30d',
  tenantId
)

// Check if performance is below target
if (dashboard.overallEfficiency < 90) {
  // Send alert
  await sendAlert({
    type: 'PERFORMANCE_WARNING',
    message: `Warehouse efficiency is ${dashboard.overallEfficiency}%`,
  })
}
```

### Scenario 3: Predict SLA Breach
```typescript
// Check risk before shipment starts
const risk = await transportationSlaKpiAdapter.calculateSLARisk(
  shipmentId,
  carrierId,
  estimatedTransitTime,
  tenantId
)

if (risk.riskLevel === 'CRITICAL') {
  // Take preventive action
  await escalateToManager(shipmentId, risk.recommendations)
}
```

---

**More Examples**: See `docs/UNIFIED_SLA_KPI_IMPLEMENTATION.md` for detailed documentation.



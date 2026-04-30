# Truth Engine / Digital Doppelgänger Layer

## Overview

The Truth Engine is a foundational platform layer that makes BlueDXP **evidence-based, audit-ready, and adversarially reviewed**. Every KPI is "click-to-proof" - you can drill down from any metric to the exact evidence that supports it.

## Core Principles

1. **Evidence-First**: Every business event must have evidence
2. **Click-to-Proof**: Every KPI links to supporting evidence
3. **Adversarial Review**: Every decision is stress-tested through 4 personas
4. **Audit-Ready**: Full chain of custody and immutable logs
5. **Confidence Scoring**: Every event has a confidence score (0-1)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              TRUTH ENGINE LAYER                          │
├─────────────────────────────────────────────────────────┤
│ • TruthEvent (Reality Timeline)                         │
│ • TruthEvidenceItem (Evidence Spine)                    │
│ • AdversarialReview (Decision Stress Testing)           │
│ • TruthKPI (Click-to-Proof Metrics)                     │
│ • BoardBrief (Executive Signals)                        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│         EXISTING SYSTEMS (Integrated)                    │
├─────────────────────────────────────────────────────────┤
│ • Evidence Service (extended)                           │
│ • Event Store (storage)                                  │
│ • Audit Service (audit trails)                          │
│ • Process Lifecycle (evidence linking)                  │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. TruthEvent

Represents a canonical event in the business reality timeline.

```typescript
interface TruthEvent {
  id: string
  eventType: TruthEventType
  happenedAt: Date // Business time
  recordedAt: Date // System time
  actor: { type, id, name, role }
  entityRefs: { shipmentId?, customerId?, ... }
  evidenceLinks: string[] // EvidenceItem.id[]
  confidenceScore: number // 0-1
  derivedFrom: { rulesetId?, modelId?, humanConfirmation? }
}
```

### 2. TruthEvidenceItem

Extends existing Evidence with Truth Engine specific fields.

```typescript
interface TruthEvidenceItem extends Evidence {
  sourceSystem: 'gmail' | 'wms' | 'tms' | 'iot' | ...
  chainOfCustody: CustodyEvent[]
  truthMetadata: {
    automaticallyCaptured?: boolean
    requiresValidation?: boolean
    relatedTruthEventIds?: string[]
  }
}
```

### 3. AdversarialReview

Multi-persona stress testing of decisions.

```typescript
interface AdversarialReview {
  decisionId: string
  personas: {
    regulator: PersonaReview
    cfo: PersonaReview
    competitor: PersonaReview
    litigator: PersonaReview
  }
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  missingEvidence: string[]
  requiredControls: Control[]
  blockers: Blocker[]
}
```

### 4. TruthKPI

Evidence-backed KPIs with click-to-proof.

```typescript
interface TruthKPI {
  name: string
  formula: string
  value: number
  evidenceIds: string[] // All evidence used
  breakdown: KPIBreakdown[] // Dimensional breakdowns
  minimumEvidenceRequirements: [...]
}
```

## Integration

### Using the SDK

```typescript
import { truthSDK } from '@/lib/services/truth-engine'

// Record evidence + event
const { event, evidence } = await truthSDK.recordWithEvidence(
  {
    eventType: 'delivered',
    tenantId: 'tenant-1',
    happenedAt: new Date(),
    actor: { type: 'driver', id: 'driver-1' },
    entityRefs: { shipmentId: 'ship-123' },
    confidenceScore: 0.95,
  },
  [{
    type: 'document',
    title: 'POD Signature',
    sourceSystem: 'telematics',
    fileUrl: 'https://...',
  }]
)
```

### Module Integration

```typescript
import { createModuleIntegration } from '@/lib/services/truth-engine'

const integration = createModuleIntegration('wms', tenantId)

// Record module event
await integration.recordModuleEvent(
  'putaway_completed',
  { warehouseId: 'wh-1', orderId: 'order-123' },
  { type: 'system', name: 'WMS' },
  [evidence]
)

// Register module KPI
await integration.registerModuleKPI(
  'putaway_efficiency',
  'Average putaway time',
  'average(putaway_completed - inbound_received)',
  ['inbound_received', 'putaway_completed'],
  'operational'
)
```

## API Endpoints

### Events
- `POST /api/truth-engine/events` - Record truth event
- `GET /api/truth-engine/events?entityType=X&entityId=Y` - Get timeline

### Reviews
- `POST /api/truth-engine/reviews` - Create adversarial review
- `GET /api/truth-engine/reviews?decisionId=X` - Get reviews

### KPIs
- `POST /api/truth-engine/kpis` - Register/calculate KPI
- `GET /api/truth-engine/kpis?kpiId=X` - Get KPI evidence

### Board Brief
- `GET /api/truth-engine/board-brief?tenantId=X` - Generate board brief

## UI Components

### Truth Timeline
- `/truth-timeline/[entityType]/[entityId]` - Unified event timeline with evidence drill-down

### Board Brief
- `/truth-board` - Executive dashboard with top signals and adversarial insights

## Event Taxonomy

### Logistics
- `quote_sent`, `quote_accepted`, `truck_departed`, `delivered`, `pod_captured`

### MSDS/Hazalyze
- `msds_received`, `msds_approved`, `hazard_detected`, `compliance_verified`

### Financial
- `invoice_generated`, `payment_received`, `margin_calculated`

### WMS
- `asn_received`, `putaway_completed`, `cycle_count_performed`

### Compliance
- `violation_detected`, `audit_completed`, `license_expired`

## Best Practices

1. **Always Link Evidence**: Every TruthEvent should have at least one evidence link
2. **Set Confidence Scores**: Use confidence scores to indicate reliability
3. **Use Adversarial Review**: Review significant decisions through 4 personas
4. **Register KPIs**: Register KPIs with evidence requirements
5. **Validate Timelines**: Regularly validate timelines for gaps

## Future Enhancements

- LLM-based adversarial review (currently rules-based)
- Blockchain integration for immutable evidence
- Real-time evidence validation
- Automated gap detection and filling
- Predictive evidence requirements










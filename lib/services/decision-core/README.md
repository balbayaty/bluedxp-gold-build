# Decision Infrastructure Core

Unified Decision Ontology + Decision Primitives for BlueDXP Ecosystem

## Quick Start

```typescript
import { DecisionPrimitives } from '@/lib/services/decision-core'
import type { DecisionContext } from '@/lib/services/decision-core/types'

const context: DecisionContext = {
  module: 'hazalyze',
  entityType: 'msds',
  entityId: 'msds-123',
  tenantId: 'tenant-123',
  userId: 'user-123',
  data: { /* entity data */ },
}

// Make a decision
await DecisionPrimitives.ALLOW(context, {
  reason: 'MSDS is compliant',
})
```

## Features

- ✅ 14 Decision Primitives
- ✅ 9 Decision Status States
- ✅ Controls Registry (SOP, Regulation, Iktva)
- ✅ Evidence Integration
- ✅ Audit Logging
- ✅ Event Publishing
- ✅ Statistics & Analytics
- ✅ Saudi Compliance Alignment

## Decision Primitives

| Primitive | Category | Description |
|-----------|----------|-------------|
| ALLOW | Approval | Permit the action |
| ALLOW_WITH_CONDITIONS | Approval | Permit with conditions |
| BLOCK | Blocking | Prevent the action |
| HOLD_UNTIL | Workflow | Hold until condition met |
| ESCALATE_TO | Workflow | Escalate to authority |
| OPEN_NCR | Compliance | Open Non-Conformance Report |
| OPEN_CAPA | Compliance | Open CAPA |
| REQUEST_EVIDENCE | Compliance | Request evidence |
| REROUTE | Operational | Reroute shipment |
| RESCHEDULE | Operational | Reschedule operation |
| ASSIGN_RESOURCE | Operational | Assign resource |
| APPROVE_SPEND | Financial | Approve spend |
| FLAG_FOR_PAYMENT_HOLD | Financial | Flag payment hold |
| OVERRIDE | Approval | Override with authority |

## Status Grammar

- **DRAFT**: Initial creation
- **PENDING**: Awaiting decision
- **APPROVED**: Approved without conditions
- **APPROVED_WITH_CONDITIONS**: Approved with conditions
- **REJECTED**: Rejected
- **ESCALATED**: Escalated to authority
- **CLOSED**: Finalized
- **ON_HOLD**: Temporarily paused
- **OVERRIDE_APPLIED**: Override applied

## Module Integrations

Ready-to-use integrations:

- `hazalyzeIntegration.ts` - MSDS decisions
- `procurementIntegration.ts` - PO/vendor decisions
- `routeOpsIntegration.ts` - Route/shipment decisions
- `legalEvidenceIntegration.ts` - Legal decisions

## API

### Decision Service

```typescript
import { decisionService } from '@/lib/services/decision-core'

// Create decision
const decision = await decisionService.createDecision(context, 'ALLOW', 'APPROVED')

// Update status
await decisionService.updateDecisionStatus(decisionId, 'APPROVED')

// Query decisions
const { decisions } = await decisionService.queryDecisions({
  status: ['PENDING'],
  module: 'hazalyze',
})

// Get statistics
const stats = await decisionService.getStatistics(tenantId)
```

### Controls Registry

```typescript
import { controlsRegistry } from '@/lib/services/decision-core'

// Get applicable controls
const controls = await controlsRegistry.getApplicableControls('hazalyze', 'msds', tenantId)

// Validate controls
const results = await controlsRegistry.validateControls('hazalyze', 'msds', context, tenantId)
```

## Dashboard

Interactive dashboard available at `/decision-infrastructure`

Features:
- Real-time decision viewing
- Statistics and analytics
- Filtering and search
- Decision details modal

## Testing

```bash
# Run tests
npm test lib/services/decision-core
```

## Documentation

- [Decision Ontology](./docs/decision-ontology.md)
- [Complete Implementation](./docs/decision-infrastructure-complete.md)

## Architecture

```
Decision Infrastructure
├── Decision Service (lifecycle management)
├── Decision Primitives (14 atomic actions)
├── Controls Registry (SOPs, regulations, Iktva)
├── Evidence Integration (existing service)
├── Audit Integration (existing service)
└── Event Bus Integration (existing service)
```

## No Duplication

This module:
- ✅ Reuses Evidence Service
- ✅ Reuses Audit Service
- ✅ Reuses Event Bus
- ✅ Unifies decision patterns
- ✅ Preserves business logic

## Saudi Compliance

Aligned with:
- TGA (Transport General Authority)
- SFDA (Saudi Food and Drug Authority)
- SASO (Saudi Standards Organization)
- Iktva (configurable, not hardcoded)

## License

Part of BlueDXP Platform












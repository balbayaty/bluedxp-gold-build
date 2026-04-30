# Decision Infrastructure Ontology

## Overview

The Decision Infrastructure provides a unified decision-making framework across the entire BlueDXP ecosystem. It enables consistent, auditable, and traceable decisions while avoiding duplication of existing functionality.

## Core Concepts

### Decision Record

A **Decision Record** is an immutable, versioned record of a decision made in the system. It captures:

- **Context**: Module, entity type, entity ID
- **Decision**: Status, primitive action, reason
- **Controls**: Applied controls (SOPs, regulations, Iktva)
- **Compliance**: Compliance check results
- **Evidence**: Links to evidence with hashes
- **Audit**: Full audit trail with correlation IDs

### Decision Status Grammar

The decision status grammar covers all possible states:

- **DRAFT**: Initial creation, not yet submitted
- **PENDING**: Awaiting decision
- **APPROVED**: Approved without conditions
- **APPROVED_WITH_CONDITIONS**: Approved but requires follow-up
- **REJECTED**: Rejected
- **ESCALATED**: Escalated to higher authority
- **CLOSED**: Decision finalized and closed
- **ON_HOLD**: Temporarily paused
- **OVERRIDE_APPLIED**: Override applied (with audit trail)

### Decision Primitives

Decision primitives are atomic decision actions:

#### Approval Primitives
- **ALLOW**: Permit the action
- **ALLOW_WITH_CONDITIONS**: Permit with conditions
- **OVERRIDE**: Override decision with authority

#### Blocking Primitives
- **BLOCK**: Prevent the action

#### Workflow Primitives
- **HOLD_UNTIL**: Temporarily hold until condition met
- **ESCALATE_TO**: Escalate to higher authority

#### Compliance Primitives
- **OPEN_NCR**: Open Non-Conformance Report
- **OPEN_CAPA**: Open Corrective Action Preventive Action
- **REQUEST_EVIDENCE**: Request additional evidence

#### Operational Primitives
- **REROUTE**: Reroute shipment/transport
- **RESCHEDULE**: Reschedule operation
- **ASSIGN_RESOURCE**: Assign resource to task

#### Financial Primitives
- **APPROVE_SPEND**: Approve financial spend
- **FLAG_FOR_PAYMENT_HOLD**: Flag for payment hold

## Controls Registry

The Controls Registry manages configurable controls that influence decisions:

- **SOP Controls**: Internal Standard Operating Procedures
- **Regulation Controls**: Saudi and global regulations
- **Iktva Controls**: Iktva requirements (configurable, not hardcoded)
- **Internal Policy Controls**: Internal policies

Controls are NOT hardcoded legal claims - they are structured as configurable rules that can be enabled/disabled and versioned.

## Integration Points

### Existing Services

The Decision Infrastructure integrates with:

- **Evidence Service**: Links decisions to evidence with immutable hashes
- **Audit Service**: Logs all decision actions
- **Event Bus**: Publishes decision events for cross-module communication
- **Compliance Service**: Checks compliance requirements

### Module Integrations

#### Hazalyze/MSDS
- MSDS acceptance/rejection decisions
- Conditional approvals with revision requirements
- Evidence requests for missing data

#### Procurement
- Purchase order approvals with spend limits
- Vendor payment hold flags
- Escalation for high-value purchases

#### Route Operations
- Route hold decisions (border hours)
- Reroute decisions
- Reschedule operations

#### Legal Evidence
- Escalation for legal review
- Payment hold flags for legal issues
- NCR creation for compliance violations

## Status Transitions

Valid status transitions are enforced:

```
DRAFT → PENDING → APPROVED/REJECTED/ESCALATED/ON_HOLD → CLOSED
PENDING → APPROVED_WITH_CONDITIONS → APPROVED/REJECTED → CLOSED
ESCALATED → APPROVED/REJECTED/ON_HOLD → CLOSED
ON_HOLD → PENDING/APPROVED/REJECTED/ESCALATED → CLOSED
```

## Evidence Integration

All decisions can link to evidence:

- Evidence IDs reference the Evidence Service
- Evidence hashes provide immutable integrity verification
- Evidence can be requested via REQUEST_EVIDENCE primitive

## Audit & Tracing

Every decision includes:

- **Correlation ID**: For tracing across services
- **Trace ID**: For distributed tracing
- **Request ID**: Original request identifier
- **Full audit log**: Via Audit Service integration

## Compliance Alignment

The system aligns with:

- **Saudi Compliance Practices**: TGA, SFDA, SASO, etc.
- **Internal IMS**: Internal Management System requirements
- **Iktva Considerations**: Configurable Iktva controls (not hardcoded)

## No Duplication Principle

The Decision Infrastructure:

- **Reuses** existing Evidence Service (doesn't duplicate)
- **Reuses** existing Audit Service (doesn't duplicate)
- **Reuses** existing Event Bus (doesn't duplicate)
- **Unifies** decision patterns across modules
- **Preserves** all business logic in modules

## Usage Examples

### MSDS Approval
```typescript
await decideMSDSAcceptance(msdsId, tenantId, userId, {
  complianceStatus: 'COMPLIANT',
  evidenceId: 'evd-123',
})
```

### Purchase Order Approval
```typescript
await decidePOApproval(poId, tenantId, userId, {
  amount: 50000,
  currency: 'SAR',
  vendorId: 'vendor-123',
  approvalLimit: 100000,
})
```

### Route Hold
```typescript
await decideRouteHold(shipmentId, tenantId, userId, {
  reason: 'Border closed outside operating hours',
  holdUntil: new Date('2024-01-15T08:00:00Z'),
  borderHours: { open: 6, close: 22 },
})
```

## Future Enhancements

- Machine learning for decision recommendations
- Automated decision workflows
- Decision analytics and insights
- Integration with more modules
- Advanced control validation rules












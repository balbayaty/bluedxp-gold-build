# ETW Module - Developer Quick Start Guide

## Overview

The ETW (e-Waybill) module is a production-grade, evidence-grade e-Waybill system integrated into BlueDXP. This guide helps developers quickly understand and work with the ETW module.

## Architecture

### Module Structure
```
lib/services/etw/
├── etwService.ts              # Core CRUD operations
├── eventService.ts            # Chain-of-custody events
├── qrVerificationService.ts   # QR verification
├── intelligence/              # Intelligence service (ETA, detention, congestion)
│   ├── intelligenceOrchestrator.ts
│   ├── baseIntelligenceService.ts
│   └── historicalIntelligenceService.ts
├── permitService.ts           # Permit workflow
├── pdfService.ts              # PDF export
├── rulesEngine.ts             # Business rules
├── integrationService.ts      # External integrations
├── errorHandler.ts            # Error handling
├── seedData.ts                # Seed data
└── i18n/                      # Internationalization
    └── translations.ts

app/etw/
├── page.tsx                   # Main list page
├── create/page.tsx            # Create ETW
├── [id]/page.tsx              # ETW details
├── [id]/edit/page.tsx         # Edit ETW
├── [id]/print/page.tsx        # Print view
└── verify/[token]/page.tsx    # Public verification

components/etw/
└── ETWCreateForm.tsx          # Creation form component
```

## Key Concepts

### 1. ETW Lifecycle
```
DRAFT → PENDING → IN_PROGRESS → IN_TRANSIT → 
AT_BORDER/AT_PORT → CUSTOMS_CLEARANCE → 
OUT_FOR_DELIVERY → DELIVERED → COMPLETED
```

### 2. Event Types
- `CREATED` - ETW created
- `PICKED_UP` - Cargo picked up
- `IN_TRANSIT` - In transit
- `AT_FACILITY` - At facility
- `HANDOVER` - Handover to next party
- `BORDER_CROSSING` - Border crossing
- `CUSTOMS_CLEARED` - Customs cleared
- `OUT_FOR_DELIVERY` - Out for delivery
- `DELIVERED` - Delivered
- `EXCEPTION` - Exception occurred
- `EXCEPTION_RESOLVED` - Exception resolved
- `CANCELLED` - Cancelled

### 3. Scope Types
- `LOCAL` - Within city
- `INTERCITY` - Inter-city domestic
- `CROSS_BORDER` - Cross-border
- `MULTIMODAL` - Multiple transport modes

## API Usage

### Create ETW
```typescript
const response = await fetch('/api/etw', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'tenant-1',
    scope: 'CROSS_BORDER',
    mode: 'LAND',
    parties: [
      { type: 'SHIPPER', name: '...', ... },
      { type: 'CONSIGNEE', name: '...', ... }
    ],
    cargo: { items: [...], totalWeight: 1000, ... },
    compliance: { hazardous: false, ... },
    route: { origin: {...}, destination: {...}, ... },
    commercial: { contractType: 'SPOT', rate: {...}, ... },
    createdBy: 'user-id'
  })
})
```

### Get ETW
```typescript
const response = await fetch(`/api/etw/${etwId}`)
const { data } = await response.json()
```

### Add Event
```typescript
const response = await fetch(`/api/etw/${etwId}/events`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'PICKED_UP',
    actor: { id: 'user-id', name: 'Driver Name', role: 'DRIVER', type: 'DRIVER' },
    location: { name: 'Origin Warehouse', ... },
    description: 'Cargo picked up',
    verificationMethod: 'GPS'
  })
})
```

### Generate QR
```typescript
const response = await fetch(`/api/etw/${etwId}/qr`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessPolicy: 'PUBLIC',
    expiresAt: '2024-12-31T23:59:59Z'
  })
})
```

### Get Intelligence
```typescript
const response = await fetch(`/api/etw/${etwId}/intelligence`)
const { data } = await response.json()
// Returns: ETA, detention exposure, congestion levels, risk snapshot
```

## Service Usage

### Using ETW Service
```typescript
import { etwService } from '@/lib/services/etw/etwService'

// Create ETW
const etw = await etwService.create({
  tenantId: 'tenant-1',
  scope: 'CROSS_BORDER',
  mode: 'LAND',
  // ... other fields
})

// Get ETW
const etw = await etwService.get(etwId, tenantId)

// List ETWs
const { etws, total } = await etwService.list({
  tenantId: 'tenant-1',
  status: 'IN_TRANSIT',
  limit: 50,
  offset: 0
})

// Update ETW
const updated = await etwService.update(etwId, {
  status: 'DELIVERED'
}, userId)

// Update status
await etwService.updateStatus(etwId, 'DELIVERED', tenantId, userId)
```

### Using Event Service
```typescript
import { etwEventService } from '@/lib/services/etw/eventService'

// Add event
const event = await etwEventService.addEvent({
  etwId: 'etw-id',
  type: 'PICKED_UP',
  actor: { id: 'user-id', name: 'Driver', role: 'DRIVER', type: 'DRIVER' },
  location: { name: 'Origin', ... },
  verificationMethod: 'GPS'
})

// Get events
const events = await etwEventService.getEvents(etwId, tenantId)
```

### Using QR Verification Service
```typescript
import { etwQRVerificationService } from '@/lib/services/etw/qrVerificationService'

// Generate QR token
const qrToken = await etwQRVerificationService.generateToken(etwId, {
  accessPolicy: 'PUBLIC',
  expiresAt: new Date('2024-12-31')
})

// Verify token
const result = await etwQRVerificationService.verifyToken(token, {
  ipAddress: '1.2.3.4',
  userAgent: 'Mozilla/5.0...'
})
```

### Using Intelligence Service
```typescript
import { getETWIntelligenceService } from '@/lib/services/etw'

const intelligenceService = await getETWIntelligenceService()
const intelligence = await intelligenceService.getIntelligence(etwId, tenantId)
// Returns: ETA, detention exposure, congestion, risk snapshot
```

## Event Bus Integration

### Publishing Events
ETW service automatically publishes events:
- `etw.created` - When ETW is created
- `etw.updated` - When ETW is updated
- `etw.status.changed` - When status changes
- `etw.delivered` - When delivered
- `etw.exception` - When exception occurs
- `etw.event.added` - When chain-of-custody event is added

### Subscribing to Events
```typescript
import { eventBus } from '@/lib/services/event-store'

eventBus.subscribe('etw.created', async (event) => {
  console.log('ETW created:', event.payload.etwId)
  // Your logic here
})

eventBus.subscribe('etw.status.changed', async (event) => {
  console.log('Status changed:', event.payload.status)
  // Your logic here
})
```

## Database Models

### eTW Model
```typescript
{
  id: string
  etwNumber: string
  tenantId: string
  status: ETWStatus
  version: number
  scope: ETWScope
  mode: TransportMode
  isMultimodal: boolean
  references: TransportReferenceMatrix
  parties: Party[]
  cargo: CargoDeclaration
  compliance: ComplianceFlags
  permits: PermitRecord[]
  route: ETWRoute
  commercial: CommercialContext
  riskSnapshot?: RiskSnapshot
  milestones?: MilestoneEstimate
  events: ETWEvent[]
  legs?: ETWLeg[]
  delivery?: DeliveryAcknowledgment
  verification?: VerificationPayload
  attachments: ETWAttachment[]
  // ... audit fields
}
```

## Common Patterns

### Creating ETW with Auto-Link to Shipment
```typescript
const etw = await etwService.create({
  ...etwData,
  shipmentId: 'shipment-id' // Auto-links to shipment
})
```

### Adding Chain-of-Custody Event
```typescript
await etwEventService.addEvent({
  etwId: 'etw-id',
  type: 'HANDOVER',
  actor: { id: 'user-id', name: 'Driver', role: 'DRIVER', type: 'DRIVER' },
  location: { name: 'Border Crossing', coordinates: { lat: 24.5, lng: 46.7 } },
  handoverTo: { id: 'next-driver-id', name: 'Next Driver', role: 'DRIVER' },
  verificationMethod: 'GPS'
})
```

### Getting ETW with Full Details
```typescript
const etw = await etwService.get(etwId, tenantId)
// Includes: events, legs, attachments, qrTokens
```

### Filtering ETWs
```typescript
const { etws } = await etwService.list({
  tenantId: 'tenant-1',
  status: 'IN_TRANSIT',
  scope: 'CROSS_BORDER',
  search: 'ETW-123',
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  limit: 50,
  offset: 0
})
```

## Error Handling

### Service Errors
```typescript
try {
  const etw = await etwService.create(data)
} catch (error) {
  if (error instanceof z.ZodError) {
    // Validation error
    console.error('Validation errors:', error.errors)
  } else {
    // Other error
    console.error('Error:', error.message)
  }
}
```

### API Errors
```typescript
const response = await fetch('/api/etw', { ... })
if (!response.ok) {
  const error = await response.json()
  console.error('API error:', error.error, error.details)
}
```

## Testing

### Unit Testing
```typescript
import { etwService } from '@/lib/services/etw/etwService'

describe('ETW Service', () => {
  it('should create ETW', async () => {
    const etw = await etwService.create({
      tenantId: 'test-tenant',
      scope: 'LOCAL',
      mode: 'LAND',
      // ... test data
    })
    expect(etw.etwNumber).toBeDefined()
    expect(etw.status).toBe('DRAFT')
  })
})
```

### Integration Testing
```typescript
// Test API endpoint
const response = await fetch('/api/etw', {
  method: 'POST',
  body: JSON.stringify(testData)
})
expect(response.ok).toBe(true)
```

## Best Practices

1. **Always include tenantId** - Multi-tenant isolation is required
2. **Use event service for chain-of-custody** - Don't directly modify events
3. **Verify before status changes** - Use verification methods (GPS, signature, OTP)
4. **Handle exceptions properly** - Use exception event type
5. **Use intelligence service** - For ETA and risk predictions
6. **Generate QR for public access** - Use appropriate access policy
7. **Track all changes** - Version history is automatic
8. **Use evidence service** - Chain-of-custody is evidence-grade

## Troubleshooting

### ETW not appearing in list
- Check tenantId matches
- Verify RBAC permissions (`tms.etw` feature)
- Check status filter

### Events not being published
- Verify module initialization ran
- Check event bus is initialized
- Check console for errors

### QR verification failing
- Check token hasn't expired
- Verify token isn't revoked
- Check access policy matches

### Intelligence not available
- Verify intelligence service is enabled
- Check intelligence sources are configured
- Verify historical data exists

## Resources

- **Module Definition**: `lib/modules/etw.ts`
- **Type Definitions**: `types/etw.ts`
- **API Routes**: `app/api/etw/`
- **Pages**: `app/etw/`
- **Services**: `lib/services/etw/`
- **Documentation**: `docs/ETW_*.md`

## Support

For issues or questions:
1. Check documentation in `docs/ETW_*.md`
2. Review module definition in `lib/modules/etw.ts`
3. Check event handlers in module initialization
4. Review integration points in other modules

---

**Last Updated**: Integration completed
**Module Version**: 1.0.0



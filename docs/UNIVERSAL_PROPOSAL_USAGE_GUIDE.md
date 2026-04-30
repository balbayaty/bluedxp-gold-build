# 📖 Universal Intelligent Proposal System - Usage Guide

## Quick Start

### 1. From Any Module Page

Add the `ProposalQuickActions` component to any module page:

```tsx
import ProposalQuickActions from '@/components/proposals/ProposalQuickActions'

// In your component
<ProposalQuickActions
  moduleId="wms"
  proposalType="WMS_WAREHOUSING"
  customerId="cust-123"
  customerName="ABC Company"
  relatedEntityId="warehouse-456"
  relatedEntityType="WAREHOUSE"
/>
```

### 2. Direct Navigation

Navigate directly to the universal proposal builder:

```tsx
router.push('/proposals/universal/new?moduleId=wms&customerId=cust-123')
```

### 3. Programmatic Generation

Use the module integration helpers:

```tsx
import { generateWMSProposal } from '@/lib/services/proposals/proposalModuleIntegrations'

const result = await generateWMSProposal({
  warehouseId: 'warehouse-123',
  warehouseName: 'Main Warehouse',
  customerId: 'cust-456',
  customerName: 'ABC Company',
  tenantId: 'tenant-1',
  userId: 'user-123',
})

console.log('Win Probability:', result.winStrategy.winProbability)
console.log('Insights:', result.insights)
```

## Module-Specific Examples

### WMS Module

```tsx
import { generateWMSProposal } from '@/lib/services/proposals/proposalModuleIntegrations'

// From warehouse page
const handleCreateProposal = async () => {
  const result = await generateWMSProposal({
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    capacity: warehouse.capacity,
    utilization: warehouse.utilization,
    services: ['Storage', 'Pick & Pack', 'Fulfillment'],
    customerId: selectedCustomer.id,
    customerName: selectedCustomer.name,
    tenantId: currentTenant.id,
    userId: currentUser.id,
  })

  // Navigate to proposal
  router.push(`/proposals/${result.proposal.id}`)
}
```

### TMS Module

```tsx
import { generateTMSProposal } from '@/lib/services/proposals/proposalModuleIntegrations'

// From shipment page
const handleCreateProposal = async () => {
  const result = await generateTMSProposal({
    shipmentId: shipment.id,
    origin: shipment.origin,
    destination: shipment.destination,
    customerId: shipment.customerId,
    customerName: shipment.customerName,
    tenantId: currentTenant.id,
    userId: currentUser.id,
  })

  // Show win probability
  alert(`Win Probability: ${result.winStrategy.winProbability}%`)
}
```

### Marketplace Module

```tsx
import { generateMarketplaceProposal } from '@/lib/services/proposals/proposalModuleIntegrations'
import ProposalQuickActions from '@/components/proposals/ProposalQuickActions'

// In listing detail page
<ProposalQuickActions
  moduleId="marketplace"
  proposalType="MARKETPLACE_STORAGE"
  customerId={inquiry.customerId}
  customerName={inquiry.customerName}
  relatedEntityId={listing.id}
  relatedEntityType="SERVICE_LISTING"
/>

// Or programmatically
const result = await generateMarketplaceProposal({
  listingId: listing.id,
  listingType: 'STORAGE',
  customerId: inquiry.customerId,
  customerName: inquiry.customerName,
  tenantId: currentTenant.id,
  userId: currentUser.id,
})
```

### Trade Compliance Module

```tsx
import { generateTradeComplianceProposal } from '@/lib/services/proposals/proposalModuleIntegrations'

const result = await generateTradeComplianceProposal({
  complianceCaseId: case.id,
  customerId: case.customerId,
  customerName: case.customerName,
  serviceType: 'CUSTOMS_CLEARANCE',
  tenantId: currentTenant.id,
  userId: currentUser.id,
})
```

## Displaying Insights

### In Proposal Page

```tsx
import ProposalInsightsWidget from '@/components/proposals/ProposalInsightsWidget'

// Full widget
<ProposalInsightsWidget
  proposalId={proposal.id}
/>

// Compact version
<ProposalInsightsWidget
  insights={proposal.insights}
  compact
/>
```

### In Dashboard

```tsx
import ProposalInsightsWidget from '@/components/proposals/ProposalInsightsWidget'

// Show insights for active proposal
<ProposalInsightsWidget
  proposalId={activeProposalId}
  compact
/>
```

## API Usage

### Generate Full Proposal

```typescript
POST /api/proposals/universal/generate

{
  "moduleId": "wms",
  "proposalType": "WMS_WAREHOUSING",
  "customerId": "cust-123",
  "customerName": "ABC Company",
  "relatedEntityId": "warehouse-456",
  "relatedEntityType": "WAREHOUSE",
  "context": {
    "title": "Warehousing Services Proposal",
    "validUntil": "2026-01-30"
  },
  "tenantId": "tenant-1",
  "userId": "user-123"
}

// Response
{
  "success": true,
  "proposal": { ... },
  "insights": [ ... ],
  "winStrategy": { ... }
}
```

### Generate Insights Only

```typescript
POST /api/proposals/universal/generate-insights

{
  "moduleId": "marketplace",
  "proposalType": "MARKETPLACE_SERVICE",
  "customerId": "cust-123",
  "customerName": "ABC Company",
  "tenantId": "tenant-1",
  "userId": "user-123"
}

// Response
{
  "success": true,
  "insights": [ ... ],
  "winStrategy": { ... }
}
```

## Component Props

### ProposalQuickActions

```typescript
interface ProposalQuickActionsProps {
  moduleId: string                    // Module ID (wms, tms, marketplace, etc.)
  proposalType?: string               // Optional proposal type
  customerId?: string                 // Optional customer ID
  customerName?: string               // Optional customer name
  relatedEntityId?: string            // Optional related entity ID
  relatedEntityType?: string          // Optional related entity type
  compact?: boolean                   // Compact mode (default: false)
}
```

### ProposalInsightsWidget

```typescript
interface ProposalInsightsWidgetProps {
  proposalId?: string                 // Proposal ID to load insights
  insights?: AIProposalInsight[]      // Pre-loaded insights
  loading?: boolean                   // Loading state
  compact?: boolean                   // Compact mode (default: false)
}
```

## Best Practices

### 1. Pre-fill Context

Always provide as much context as possible:

```tsx
<ProposalQuickActions
  moduleId="wms"
  customerId={customer.id}
  customerName={customer.name}
  relatedEntityId={warehouse.id}
  relatedEntityType="WAREHOUSE"
/>
```

### 2. Show Win Probability

Display win probability prominently:

```tsx
{winStrategy && (
  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
    <div className="text-2xl font-bold text-green-600">
      {winStrategy.winProbability}% Win Probability
    </div>
    <div className="text-sm text-gray-600">
      {winStrategy.keyStrengths.length} key strengths identified
    </div>
  </div>
)}
```

### 3. Act on Critical Insights

Filter and display critical insights:

```tsx
const criticalInsights = insights.filter(i => i.priority === 'CRITICAL')

{criticalInsights.map(insight => (
  <div key={insight.id} className="bg-red-50 p-3 rounded-lg">
    <div className="font-semibold text-red-800">{insight.title}</div>
    <div className="text-sm text-red-600">{insight.recommendation}</div>
  </div>
))}
```

### 4. Use Module Integrations

Prefer module integration helpers over direct service calls:

```tsx
// ✅ Good
import { generateWMSProposal } from '@/lib/services/proposals/proposalModuleIntegrations'
const result = await generateWMSProposal({ ... })

// ❌ Avoid
import { universalIntelligentProposalService } from '@/lib/services/proposals/universalIntelligentProposalService'
const result = await universalIntelligentProposalService.generateUniversalProposal({ ... })
```

### 5. Handle Loading States

Always show loading states:

```tsx
const [loading, setLoading] = useState(false)

const handleGenerate = async () => {
  setLoading(true)
  try {
    const result = await generateProposal(...)
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false)
  }
}
```

## Integration Examples

### WMS Warehouse Page

```tsx
'use client'

import { useState } from 'react'
import ProposalQuickActions from '@/components/proposals/ProposalQuickActions'
import { generateWMSProposal } from '@/lib/services/proposals/proposalModuleIntegrations'

export default function WarehousePage({ warehouse, customer }) {
  const [proposal, setProposal] = useState(null)

  return (
    <div>
      <h1>{warehouse.name}</h1>
      
      {/* Quick Actions */}
      <ProposalQuickActions
        moduleId="wms"
        proposalType="WMS_WAREHOUSING"
        customerId={customer?.id}
        customerName={customer?.name}
        relatedEntityId={warehouse.id}
        relatedEntityType="WAREHOUSE"
      />
      
      {/* Warehouse details */}
      ...
    </div>
  )
}
```

### Marketplace Listing Page

```tsx
'use client'

import ProposalQuickActions from '@/components/proposals/ProposalQuickActions'
import ProposalInsightsWidget from '@/components/proposals/ProposalInsightsWidget'

export default function ListingPage({ listing, inquiry }) {
  return (
    <div>
      <h1>{listing.title}</h1>
      
      {/* Quick Actions */}
      <ProposalQuickActions
        moduleId="marketplace"
        proposalType="MARKETPLACE_STORAGE"
        customerId={inquiry?.customerId}
        customerName={inquiry?.customerName}
        relatedEntityId={listing.id}
        relatedEntityType="SERVICE_LISTING"
      />
      
      {/* Listing details */}
      ...
    </div>
  )
}
```

### TMS Shipment Page

```tsx
'use client'

import { useState } from 'react'
import ProposalQuickActions from '@/components/proposals/ProposalQuickActions'
import { generateTMSProposal } from '@/lib/services/proposals/proposalModuleIntegrations'

export default function ShipmentPage({ shipment }) {
  const [winStrategy, setWinStrategy] = useState(null)

  const handleGenerate = async () => {
    const result = await generateTMSProposal({
      shipmentId: shipment.id,
      origin: shipment.origin,
      destination: shipment.destination,
      customerId: shipment.customerId,
      customerName: shipment.customerName,
      tenantId: 'tenant-1',
      userId: 'user-123',
    })
    
    setWinStrategy(result.winStrategy)
  }

  return (
    <div>
      <h1>Shipment {shipment.id}</h1>
      
      {/* Quick Actions */}
      <ProposalQuickActions
        moduleId="tms"
        proposalType="TMS_TRANSPORTATION"
        customerId={shipment.customerId}
        customerName={shipment.customerName}
        relatedEntityId={shipment.id}
        relatedEntityType="SHIPMENT"
      />
      
      {/* Win Strategy */}
      {winStrategy && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-xl font-bold">
            {winStrategy.winProbability}% Win Probability
          </div>
        </div>
      )}
      
      {/* Shipment details */}
      ...
    </div>
  )
}
```

## Troubleshooting

### Insights Not Loading

1. Check proposal ID is valid
2. Verify API endpoint is accessible
3. Check browser console for errors
4. Ensure tenant ID and user ID are provided

### Win Probability Always 50%

This is the baseline. Insights need to be generated to adjust it. Ensure:
- Customer data is provided
- Related entity data is available
- Knowledge base has relevant content

### Module Data Not Appearing

1. Verify module is enabled in module registry
2. Check related entity ID is correct
3. Ensure module service is accessible
4. Check event bus integration

## Support

For issues or questions:
1. Check `docs/UNIVERSAL_INTELLIGENT_PROPOSAL_SYSTEM.md` for complete documentation
2. Review service implementation in `lib/services/proposals/universalIntelligentProposalService.ts`
3. Check component implementations for examples

---

**Last Updated**: 2025-01-20



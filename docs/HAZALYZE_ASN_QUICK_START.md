# 🚀 ASN Module - Quick Start Guide
## Get Started in 5 Minutes

**Date:** 2025-01-27  
**Version:** 2.0.0

---

## ⚡ Quick Setup

### 1. Database Migration (2 minutes)

```bash
# Run Prisma migration
npx prisma migrate dev --name add_asn_models

# Generate Prisma client
npx prisma generate
```

### 2. Seed Sample Data (1 minute)

```bash
# Seed ASN module with sample data
npm run seed:asn
```

This creates:
- 10 sample ASNs
- Multiple suppliers and warehouses
- Sample exceptions
- Tracking events
- Templates

### 3. Access the Module (30 seconds)

Open your browser and navigate to:
- **Main Dashboard:** `http://localhost:3002/asn`
- **Processing:** `http://localhost:3002/asn/processing`
- **Analytics:** `http://localhost:3002/asn/dashboard?tab=analytical`

---

## 📍 Key Locations

### Pages
- `/asn` - Main ASN page
- `/asn/dashboard` - Dashboard with tabs
- `/asn/processing` - Processing list
- `/asn/processing/[id]` - Individual ASN

### Components
- `components/asn/ExecutiveDashboard.tsx`
- `components/asn/OperationalDashboard.tsx`
- `components/asn/AnalyticalDashboard.tsx`
- `components/asn/AsnProcessingInterface.tsx`
- `components/asn/AsnList.tsx`

### Services
- `lib/services/asn/core/asnService.ts`
- `lib/services/asn/intelligence/`
- `lib/services/asn/analytics/`
- `lib/services/asn/processing/`

### Hooks
- `hooks/useAsn.ts`

### Utilities
- `utils/asnHelpers.ts`

### API Routes
- `app/api/asn/`

---

## 💻 Code Examples

### Using Hooks

```typescript
import { useAsnList, useAsn, useCreateAsn } from '@/hooks/useAsn'

// List ASNs
function AsnListComponent() {
  const { data, loading, error } = useAsnList({
    status: ['pending', 'in_transit'],
    page: 1,
    limit: 20,
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {data?.data.map(asn => (
        <div key={asn.id}>{asn.asnNumber}</div>
      ))}
    </div>
  )
}

// Get single ASN
function AsnDetailComponent({ asnId }: { asnId: string }) {
  const { data: asn, loading } = useAsn(asnId, {
    includeItems: true,
    includeExceptions: true,
  })

  // Use asn data...
}

// Create ASN
function CreateAsnComponent() {
  const { createAsn, loading } = useCreateAsn()

  const handleCreate = async () => {
    try {
      const newAsn = await createAsn({
        supplierId: 'supplier-1',
        warehouseId: 'warehouse-1',
        expectedArrivalDate: new Date(),
        items: [
          {
            lineNumber: 1,
            sku: 'SKU-001',
            description: 'Sample Item',
            quantity: 100,
            unitPrice: 50,
            unitOfMeasure: 'PCS',
          },
        ],
      })
      console.log('Created:', newAsn)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return <button onClick={handleCreate}>Create ASN</button>
}
```

### Using Utilities

```typescript
import {
  getStatusColor,
  formatStatus,
  isOverdue,
  calculateProgress,
  formatCurrency,
} from '@/utils/asnHelpers'

// Get status styling
const statusColor = getStatusColor(asn.status)
const statusText = formatStatus(asn.status)

// Check if overdue
if (isOverdue(asn)) {
  console.log('ASN is overdue!')
}

// Calculate progress
const progress = calculateProgress(asn) // 0-100

// Format currency
const formatted = formatCurrency(asn.totalValue, asn.currency)
```

### API Calls

```typescript
// List ASNs
const response = await fetch('/api/asn?status=pending&page=1&limit=20')
const data = await response.json()

// Get ASN
const response = await fetch('/api/asn/asn-id?includeItems=true')
const asn = await response.json()

// Create ASN
const response = await fetch('/api/asn', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    supplierId: 'supplier-1',
    warehouseId: 'warehouse-1',
    expectedArrivalDate: new Date().toISOString(),
    items: [...],
  }),
})
const newAsn = await response.json()

// Update ASN
const response = await fetch('/api/asn/asn-id', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'receiving',
  }),
})

// Get predictions
const response = await fetch('/api/asn/asn-id/predict?type=arrival')
const prediction = await response.json()

// Get dashboard data
const response = await fetch('/api/asn/analytics/dashboard?type=executive&days=30')
const dashboard = await response.json()
```

---

## 🎯 Common Tasks

### Create an ASN
```typescript
const { createAsn } = useCreateAsn()
await createAsn({
  supplierId: 'supplier-1',
  warehouseId: 'warehouse-1',
  expectedArrivalDate: new Date(),
  priority: 'normal',
  items: [
    {
      lineNumber: 1,
      sku: 'SKU-001',
      description: 'Item Description',
      quantity: 100,
      unitPrice: 50,
      unitOfMeasure: 'PCS',
    },
  ],
})
```

### Update ASN Status
```typescript
const { updateAsn } = useUpdateAsn()
await updateAsn(asnId, {
  status: 'receiving',
})
```

### Get Predictions
```typescript
const { data: prediction } = useAsnPrediction(asnId, 'arrival')
console.log('Predicted arrival:', prediction.predictedArrival)
```

### Filter ASNs
```typescript
const { data } = useAsnList({
  status: ['pending', 'in_transit'],
  supplierId: 'supplier-1',
  dateFrom: new Date('2025-01-01'),
  dateTo: new Date('2025-01-31'),
  search: 'ASN-2025',
})
```

---

## 🔍 Troubleshooting

### ASN not loading?
- Check database connection
- Verify tenant ID
- Check RBAC permissions
- Review API logs

### Predictions not working?
- Verify AI service connection
- Check historical data
- Review prediction service

### Real-time updates not working?
- Verify Event Bus is running
- Check WebSocket connection
- Review event subscriptions

---

## 📚 Next Steps

1. **Explore Dashboards**
   - Executive dashboard for high-level metrics
   - Operational dashboard for real-time queue
   - Analytical dashboard for deep insights

2. **Try Processing**
   - Create a test ASN
   - Process it through the workflow
   - View exceptions and tracking

3. **Customize**
   - Add custom fields
   - Create templates
   - Configure workflows

---

## 📞 Need Help?

- **Documentation:** `docs/HAZALYZE_ASN_*.md`
- **Code Examples:** Check component files
- **API Reference:** See API route files
- **Development Guide:** `docs/HAZALYZE_ASN_MASTER_PROMPT.md`

---

**Ready to go! 🚀**



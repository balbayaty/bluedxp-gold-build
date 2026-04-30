# 🏪 Marketplace Developer Guide

## Architecture Overview

The Marketplace module follows BlueDXP's deep architecture principles:

- **Presentation Layer**: React components in `components/marketplace/`
- **Business Logic**: Services in `lib/services/marketplace/`
- **Data Layer**: Types in `types/marketplace.ts`
- **API Layer**: Routes in `app/api/marketplace/`

---

## Setup

### Prerequisites

- Node.js 20+
- TypeScript 5.2+
- Next.js 14+

### Installation

The marketplace module is part of BlueDXP. No separate installation needed.

### Environment Variables

```env
# Marketplace Configuration
MARKETPLACE_ENABLED=true
MARKETPLACE_COMMISSION_RATE=0.05
MARKETPLACE_DEFAULT_CURRENCY=SAR

# AI Services (for matching, pricing, etc.)
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

# Payment Processing
STRIPE_SECRET_KEY=your-key
STRIPE_PUBLISHABLE_KEY=your-key

# Digital Signature (for contracts)
NAFATH_API_KEY=your-key
EMDHA_API_KEY=your-key
```

---

## Module Structure

```
marketplace/
├── components/
│   ├── ServiceRequirementForm.tsx      # Main form component
│   ├── ServiceListingCard.tsx          # Listing display
│   ├── EnhancedLocationPicker.tsx      # Map-based location
│   ├── EnhancedFileUpload.tsx          # File upload
│   ├── PriceCalculator.tsx            # Price calculation
│   ├── RealtimeMatchingPreview.tsx    # AI matching preview
│   └── contracts/                      # Contract components
│   └── messaging/                      # Messaging components
├── lib/services/marketplace/
│   ├── marketplaceService.ts           # Core service
│   ├── aiMatchingService.ts            # AI matching
│   ├── predictivePricingService.ts    # Price prediction
│   ├── demandForecastingService.ts     # Demand forecasting
│   ├── intelligentSearchService.ts    # AI search
│   ├── learningFeedbackService.ts     # ML learning
│   ├── contracts/                      # Contract services
│   └── messaging/                       # Messaging services
├── app/
│   ├── marketplace/                    # UI pages
│   └── api/marketplace/                # API routes
└── types/
    └── marketplace.ts                  # Type definitions
```

---

## Core Services

### MarketplaceService

Main service for listings, bookings, and reviews.

```typescript
import { marketplaceService } from '@/lib/services/marketplace'

// Get listings
const listings = await marketplaceService.searchListings({
  category: 'STORAGE',
  location: 'Riyadh'
})

// Create listing
const listing = await marketplaceService.createListing({
  category: 'STORAGE',
  title: 'Warehouse Space',
  pricing: { basePrice: 1000 }
})

// Create booking
const booking = await marketplaceService.createBooking({
  listingId: 'listing-123',
  schedule: { startDate: '2024-01-01' }
})
```

### AIMatchingService

AI-powered service matching.

```typescript
import { aiMatchingService } from '@/lib/services/marketplace/aiMatchingService'

const matches = await aiMatchingService.findMatches({
  requirement: {
    category: 'STORAGE',
    location: { city: 'Riyadh' }
  }
})
```

### PredictivePricingService

Price estimation and optimization.

```typescript
import { predictivePricingService } from '@/lib/services/marketplace/predictivePricingService'

const estimate = await predictivePricingService.estimatePrice({
  category: 'STORAGE',
  requirement: {
    capacity: { value: 1000, unit: 'CUBIC_METERS' }
  }
})
```

---

## Creating Custom Components

### Example: Custom Listing Card

```typescript
'use client'

import { MarketplaceServiceListing } from '@/types/marketplace'

interface CustomListingCardProps {
  listing: MarketplaceServiceListing
  onSelect: (id: string) => void
}

export default function CustomListingCard({
  listing,
  onSelect
}: CustomListingCardProps) {
  return (
    <div className="listing-card">
      <h3>{listing.title}</h3>
      <p>{listing.description}</p>
      <button onClick={() => onSelect(listing.id)}>
        View Details
      </button>
    </div>
  )
}
```

---

## Extending Services

### Adding Custom Matching Logic

```typescript
import { aiMatchingService } from '@/lib/services/marketplace/aiMatchingService'

// Extend matching service
class CustomMatchingService extends aiMatchingService {
  async findCustomMatches(requirement: ServiceRequirement) {
    // Your custom logic
    const baseMatches = await this.findMatches(requirement)
    
    // Apply custom filters
    return baseMatches.filter(match => {
      // Custom filtering logic
      return true
    })
  }
}
```

---

## Event Integration

The marketplace integrates with BlueDXP's Event Bus:

```typescript
import { eventBus } from '@/lib/services/event-store'

// Listen to marketplace events
eventBus.subscribe('marketplace.booking.created', (event) => {
  console.log('New booking:', event.data)
})

// Publish custom events
eventBus.publish('marketplace.custom.event', {
  type: 'CUSTOM',
  data: { ... }
})
```

### Available Events

- `marketplace.listing.created`
- `marketplace.listing.updated`
- `marketplace.booking.created`
- `marketplace.booking.completed`
- `marketplace.review.created`
- `marketplace.payment.completed`

---

## API Route Development

### Creating Custom API Route

```typescript
// app/api/marketplace/custom/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { apiAuthMiddleware } from '@/middleware/apiAuth'

export async function GET(request: NextRequest) {
  const auth = await apiAuthMiddleware(request)
  if (!auth.authorized) {
    return auth.response
  }

  // Your logic here
  return NextResponse.json({
    success: true,
    data: {}
  })
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/services/marketplace/marketplaceService.test.ts

import { marketplaceService } from '@/lib/services/marketplace'

describe('MarketplaceService', () => {
  it('should search listings', async () => {
    const listings = await marketplaceService.searchListings({
      category: 'STORAGE'
    })
    expect(Array.isArray(listings)).toBe(true)
  })
})
```

### Integration Tests

See `__tests__/api/marketplace/` for examples.

---

## Performance Optimization

### Code Splitting

Components already use lazy loading:

```typescript
const ServiceRequirementForm = lazy(() => 
  import('@/components/marketplace/ServiceRequirementForm')
)
```

### Caching

Services implement caching:

```typescript
// Automatic caching in services
const result = await predictivePricingService.estimatePrice(params)
// Subsequent calls with same params use cache
```

### Memoization

Use React.memo for expensive components:

```typescript
export default React.memo(ServiceListingCard)
```

---

## Integration with Other Modules

### WMS Integration

```typescript
import { wmsService } from '@/lib/services/wms'

// Link marketplace listing to warehouse
const warehouse = await wmsService.getWarehouse(warehouseId)
const listing = await marketplaceService.createListing({
  ...listingData,
  warehouseId: warehouse.id
})
```

### TMS Integration

```typescript
import { tmsService } from '@/lib/services/tms'

// Create transportation listing from TMS route
const route = await tmsService.getRoute(routeId)
const listing = await marketplaceService.createListing({
  category: 'TRANSPORTATION',
  routeId: route.id
})
```

### Digital Signature Integration

```typescript
import { digitalSignatureService } from '@/lib/services/digital-signature'

// Sign marketplace contract
const signature = await digitalSignatureService.sign({
  documentId: contract.id,
  signerId: userId
})
```

---

## Type Definitions

All types are in `types/marketplace.ts`:

```typescript
export interface MarketplaceServiceListing {
  id: string
  category: MarketplaceServiceCategory
  title: string
  description: string
  pricing: PricingStructure
  location: Location
  // ...
}

export interface MarketplaceBooking {
  id: string
  listingId: string
  status: BookingStatus
  schedule: Schedule
  // ...
}
```

---

## Error Handling

Services throw typed errors:

```typescript
import { MarketplaceError } from '@/lib/services/marketplace/errors'

try {
  await marketplaceService.createBooking(data)
} catch (error) {
  if (error instanceof MarketplaceError) {
    console.error(error.code, error.message)
  }
}
```

---

## Security

### Authentication

All API routes require authentication:

```typescript
const auth = await apiAuthMiddleware(request)
if (!auth.authorized) {
  return auth.response
}
```

### Authorization

Check permissions:

```typescript
if (!auth.context?.permissions.includes('marketplace:create')) {
  return NextResponse.json(
    { error: 'Forbidden' },
    { status: 403 }
  )
}
```

### Input Validation

Validate all inputs:

```typescript
import { z } from 'zod'

const schema = z.object({
  category: z.enum(['STORAGE', 'TRANSPORTATION']),
  title: z.string().min(1).max(200)
})

const validated = schema.parse(requestData)
```

---

## Deployment

### Build

```bash
npm run build
```

### Environment Setup

1. Set all required environment variables
2. Configure database connections
3. Set up external service APIs
4. Configure payment gateways

### Monitoring

- Check logs for errors
- Monitor API response times
- Track booking conversion rates
- Monitor AI service performance

---

## Troubleshooting

### Common Issues

**1. Listings not appearing**
- Check category filter
- Verify listing status (should be 'ACTIVE')
- Check location filters

**2. AI matching not working**
- Verify API keys are set
- Check service availability
- Review error logs

**3. Payment failures**
- Verify payment gateway configuration
- Check payment method support
- Review transaction logs

---

## Contributing

### Code Style

- Follow TypeScript best practices
- Use ESLint configuration
- Write JSDoc comments
- Follow existing patterns

### Pull Request Process

1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with description

---

## Resources

- **User Guide**: `docs/MARKETPLACE_USER_GUIDE.md`
- **API Documentation**: `docs/MARKETPLACE_API_DOCUMENTATION.md`
- **Type Definitions**: `types/marketplace.ts`
- **Module Registry**: `lib/modules/marketplace.ts`

---

**Last Updated**: 2025-01-19  
**Version**: 1.0.0

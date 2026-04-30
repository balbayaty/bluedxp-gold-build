# 🏪 Marketplace Integration Guide

## Overview

This guide explains how to integrate the Marketplace module with other BlueDXP modules and external systems.

---

## Module Integrations

### WMS Integration

Link marketplace listings to warehouse operations:

```typescript
import { marketplaceService } from '@/lib/services/marketplace'
import { wmsService } from '@/lib/services/wms'

// Create storage listing from warehouse
const warehouse = await wmsService.getWarehouse(warehouseId)
const listing = await marketplaceService.createListing({
  category: 'STORAGE',
  title: warehouse.name,
  warehouseId: warehouse.id,
  capacity: warehouse.capacity
})

// Sync availability
eventBus.subscribe('wms.storage.updated', async (event) => {
  await marketplaceService.updateListingAvailability(
    listing.id,
    event.data.availableCapacity
  )
})
```

### TMS Integration

Create transportation listings from routes:

```typescript
import { tmsService } from '@/lib/services/tms'

// Create transportation listing
const route = await tmsService.getRoute(routeId)
const listing = await marketplaceService.createListing({
  category: 'TRANSPORTATION',
  routeId: route.id,
  pricing: {
    basePrice: route.estimatedCost
  }
})
```

### Proposals/RFQ Integration

Convert RFQs to marketplace bookings:

```typescript
import { proposalsService } from '@/lib/services/proposals'

// When RFQ is approved, create marketplace booking
eventBus.subscribe('rfq.approved', async (event) => {
  const rfq = event.data
  const listing = await marketplaceService.findMatchingListing(rfq)
  
  if (listing) {
    await marketplaceService.createBooking({
      listingId: listing.id,
      rfqId: rfq.id,
      requirements: rfq.requirements
    })
  }
})
```

### Digital Signature Integration

Sign marketplace contracts:

```typescript
import { digitalSignatureService } from '@/lib/services/digital-signature'

// Sign contract
const contract = await marketplaceService.getContract(contractId)
const signature = await digitalSignatureService.sign({
  documentId: contract.id,
  signerId: userId,
  method: 'NAFATH' // or 'EMDHA'
})
```

---

## External System Integrations

### Payment Gateways

#### Stripe Integration

```typescript
import { paymentService } from '@/lib/services/marketplace/paymentService'

// Create payment intent
const intent = await paymentService.createIntent({
  bookingId: booking.id,
  amount: booking.totalAmount,
  currency: 'SAR',
  provider: 'STRIPE'
})
```

#### Custom Payment Provider

```typescript
// Implement custom payment adapter
class CustomPaymentAdapter implements PaymentAdapter {
  async processPayment(data: PaymentData): Promise<PaymentResult> {
    // Your payment processing logic
  }
}

// Register adapter
paymentService.registerAdapter('CUSTOM', new CustomPaymentAdapter())
```

### Messaging Services

#### WhatsApp Integration

```typescript
import { whatsappService } from '@/lib/services/communication/whatsapp'

// Send booking confirmation
await whatsappService.sendMessage({
  to: customer.phone,
  template: 'booking_confirmation',
  data: {
    bookingId: booking.id,
    provider: listing.provider.name
  }
})
```

---

## Event Bus Integration

### Subscribing to Marketplace Events

```typescript
import { eventBus } from '@/lib/services/event-store'

// Listen to booking events
eventBus.subscribe('marketplace.booking.created', async (event) => {
  const booking = event.data
  
  // Send notification
  await notificationService.send({
    userId: booking.customerId,
    type: 'BOOKING_CREATED',
    data: booking
  })
  
  // Update inventory
  if (booking.listing.category === 'STORAGE') {
    await wmsService.reserveCapacity(
      booking.listing.warehouseId,
      booking.requirements.capacity
    )
  }
})

// Listen to payment events
eventBus.subscribe('marketplace.payment.completed', async (event) => {
  const payment = event.data
  
  // Update financial records
  await financeService.recordTransaction({
    type: 'REVENUE',
    amount: payment.amount,
    source: 'MARKETPLACE',
    reference: payment.bookingId
  })
})
```

### Publishing Custom Events

```typescript
// Publish custom marketplace event
eventBus.publish('marketplace.custom.event', {
  type: 'LISTING_FEATURED',
  data: {
    listingId: listing.id,
    featuredUntil: new Date()
  },
  metadata: {
    source: 'admin',
    timestamp: new Date().toISOString()
  }
})
```

---

## Webhook Integration

### Setting Up Webhooks

```typescript
// Configure webhook endpoint
const webhookConfig = {
  url: 'https://your-system.com/webhooks/marketplace',
  events: [
    'marketplace.booking.created',
    'marketplace.booking.completed',
    'marketplace.payment.completed'
  ],
  secret: 'webhook-secret-key'
}

await marketplaceService.configureWebhook(webhookConfig)
```

### Webhook Payload Format

```json
{
  "event": "marketplace.booking.created",
  "timestamp": "2024-01-19T10:00:00Z",
  "data": {
    "bookingId": "booking-123",
    "listingId": "listing-123",
    "customerId": "customer-123",
    "status": "PENDING"
  },
  "signature": "hmac-signature"
}
```

---

## API Integration

### REST API

```typescript
// External system calling marketplace API
const response = await fetch('https://api.hazalyze.com/api/marketplace/listings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    category: 'STORAGE',
    title: 'Warehouse Space',
    pricing: { basePrice: 1000 }
  })
})
```

### GraphQL (if implemented)

```graphql
mutation CreateListing($input: ListingInput!) {
  createListing(input: $input) {
    id
    title
    category
    pricing {
      basePrice
      currency
    }
  }
}
```

---

## Database Integration

### Custom Queries

```typescript
import { prisma } from '@/lib/db'

// Custom marketplace query
const popularListings = await prisma.marketplaceListing.findMany({
  where: {
    status: 'ACTIVE',
    bookings: {
      some: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }
  },
  orderBy: {
    bookings: {
      _count: 'desc'
    }
  },
  take: 10
})
```

---

## Custom Service Extensions

### Adding Custom Matching Logic

```typescript
import { aiMatchingService } from '@/lib/services/marketplace/aiMatchingService'

// Extend matching service
class CustomMatchingService extends aiMatchingService {
  async findMatches(requirement: ServiceRequirement) {
    // Get base matches
    const baseMatches = await super.findMatches(requirement)
    
    // Apply custom business logic
    const customMatches = baseMatches.map(match => {
      // Add custom scoring
      match.score = this.calculateCustomScore(match, requirement)
      return match
    })
    
    // Sort by custom score
    return customMatches.sort((a, b) => b.score - a.score)
  }
  
  private calculateCustomScore(match: any, requirement: ServiceRequirement): number {
    // Your custom scoring logic
    return match.score
  }
}
```

### Custom Pricing Logic

```typescript
import { predictivePricingService } from '@/lib/services/marketplace/predictivePricingService'

// Override pricing calculation
class CustomPricingService extends predictivePricingService {
  async estimatePrice(params: EstimatePriceParams) {
    const baseEstimate = await super.estimatePrice(params)
    
    // Apply custom pricing rules
    if (params.requirement.urgency === 'URGENT') {
      baseEstimate.priceRange.min *= 1.2
      baseEstimate.priceRange.max *= 1.2
    }
    
    return baseEstimate
  }
}
```

---

## Testing Integration

### Mock Services for Testing

```typescript
// Mock marketplace service for testing
const mockMarketplaceService = {
  searchListings: jest.fn().mockResolvedValue([]),
  createBooking: jest.fn().mockResolvedValue({ id: 'booking-123' }),
  getContract: jest.fn().mockResolvedValue({ id: 'contract-123' })
}

// Use in tests
jest.mock('@/lib/services/marketplace', () => ({
  marketplaceService: mockMarketplaceService
}))
```

---

## Security Considerations

### API Key Management

```typescript
// Store API keys securely
const apiKey = process.env.MARKETPLACE_API_KEY

// Use in requests
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
})
```

### Rate Limiting

```typescript
// Implement rate limiting for external integrations
import { rateLimiter } from '@/lib/services/rate-limiter'

const limitedHandler = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
})(handler)
```

---

## Troubleshooting

### Common Integration Issues

**1. Events not firing**
- Check event bus configuration
- Verify event names match
- Check event subscription order

**2. API calls failing**
- Verify API keys
- Check network connectivity
- Review error logs

**3. Data sync issues**
- Check database connections
- Verify transaction handling
- Review event ordering

---

## Best Practices

1. **Use Event Bus**: Prefer events over direct service calls
2. **Handle Errors**: Always implement error handling
3. **Validate Data**: Validate all inputs
4. **Log Activities**: Log important operations
5. **Test Thoroughly**: Test all integration points

---

**Last Updated**: 2025-01-19  
**Version**: 1.0.0

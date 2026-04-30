# 🏪 Marketplace API Documentation

## Base URL

```
http://localhost:3002/api/marketplace
```

---

## Authentication

Most endpoints require authentication. Include JWT token in Authorization header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### Listings

#### GET `/listings`

Get all service listings with optional filters.

**Query Parameters:**
- `category` (string): Filter by category (STORAGE, TRANSPORTATION, etc.)
- `location` (string): Filter by city/region
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `minRating` (number): Minimum rating (1-5)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "listings": [
    {
      "id": "listing-123",
      "category": "STORAGE",
      "title": "Warehouse Storage",
      "description": "...",
      "pricing": {
        "basePrice": 1000,
        "currency": "SAR"
      },
      "location": {
        "city": "Riyadh"
      },
      "provider": {
        "id": "provider-123",
        "name": "ABC Logistics"
      },
      "rating": 4.5,
      "reviewCount": 25
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### POST `/listings`

Create a new service listing.

**Request Body:**
```json
{
  "category": "STORAGE",
  "title": "Warehouse Storage",
  "description": "Large warehouse space available",
  "pricing": {
    "basePrice": 1000,
    "currency": "SAR"
  },
  "location": {
    "city": "Riyadh",
    "address": "123 Main St"
  },
  "capacity": {
    "value": 5000,
    "unit": "CUBIC_METERS"
  }
}
```

**Response:**
```json
{
  "success": true,
  "listing": {
    "id": "listing-123",
    ...
  }
}
```

#### GET `/listings/[id]`

Get specific listing details.

**Response:**
```json
{
  "success": true,
  "listing": {
    "id": "listing-123",
    ...
  }
}
```

#### PATCH `/listings/[id]`

Update listing.

**Request Body:**
```json
{
  "title": "Updated Title",
  "pricing": {
    "basePrice": 1200
  }
}
```

#### DELETE `/listings/[id]`

Delete listing.

---

### Bookings

#### GET `/bookings`

Get all bookings with optional filters.

**Query Parameters:**
- `status` (string): Filter by status
- `providerId` (string): Filter by provider
- `customerId` (string): Filter by customer

#### POST `/bookings`

Create a new booking.

**Request Body:**
```json
{
  "listingId": "listing-123",
  "schedule": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "requirements": {
    "capacity": {
      "value": 100,
      "unit": "CUBIC_METERS"
    }
  }
}
```

#### GET `/bookings/[id]`

Get booking details.

#### PATCH `/bookings/[id]`

Update booking (e.g., change status).

---

### Reviews

#### GET `/reviews`

Get reviews with filters.

**Query Parameters:**
- `listingId` (string): Filter by listing
- `providerId` (string): Filter by provider
- `minRating` (number): Minimum rating

#### POST `/reviews`

Create a review.

**Request Body:**
```json
{
  "bookingId": "booking-123",
  "listingId": "listing-123",
  "rating": 5,
  "comment": "Excellent service!"
}
```

---

### AI Services

#### POST `/ai-matching`

Get AI-powered service matches.

**Request Body:**
```json
{
  "requirement": {
    "category": "STORAGE",
    "location": {
      "city": "Riyadh"
    },
    "timeline": {
      "startDate": "2024-01-01"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "matches": [
      {
        "listingId": "listing-123",
        "score": 0.95,
        "reasoning": "Perfect match for requirements"
      }
    ]
  }
}
```

#### POST `/predictive-pricing`

Get price estimate.

**Request Body:**
```json
{
  "category": "STORAGE",
  "requirement": {
    "capacity": {
      "value": 1000,
      "unit": "CUBIC_METERS"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "priceRange": {
      "min": 800,
      "max": 1200,
      "currency": "SAR"
    },
    "confidence": 85,
    "breakdown": {
      "basePrice": 1000,
      "location": 100,
      "capacity": 50
    }
  }
}
```

#### POST `/demand-forecasting`

Get demand forecast.

**Request Body:**
```json
{
  "category": "STORAGE",
  "period": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  }
}
```

#### POST `/intelligent-search`

Intelligent search with AI.

**Request Body:**
```json
{
  "query": "warehouse storage in Riyadh",
  "filters": {
    "category": "STORAGE",
    "location": "Riyadh"
  }
}
```

#### POST `/learning-feedback`

Submit feedback for AI learning.

**Request Body:**
```json
{
  "type": "MATCHING",
  "matchId": "match-123",
  "feedback": "POSITIVE",
  "details": "Great match!"
}
```

---

### Contracts

#### GET `/contracts`

Get contracts.

#### POST `/contracts`

Create contract.

#### GET `/contracts/[id]`

Get contract details.

#### POST `/contracts/[id]/signature`

Sign contract.

**Request Body:**
```json
{
  "signerId": "user-123",
  "signature": "base64-signature-data"
}
```

---

### Payments

#### GET `/payments`

Get payments.

#### POST `/payments`

Create payment.

#### POST `/payments/intent`

Create payment intent.

#### POST `/payments/[id]/refund`

Process refund.

---

### Analytics

#### GET `/analytics`

Get analytics data.

**Query Parameters:**
- `startDate` (string): Start date
- `endDate` (string): End date
- `category` (string): Filter by category

**Response:**
```json
{
  "success": true,
  "analytics": {
    "bookings": {
      "total": 1000,
      "trend": "+15%"
    },
    "revenue": {
      "total": 500000,
      "trend": "+20%"
    }
  }
}
```

---

### Stats

#### GET `/stats`

Get marketplace statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalListings": 500,
    "totalProviders": 100,
    "totalBookings": 1000,
    "averageRating": 4.5
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **Headers**: 
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Webhooks

Subscribe to marketplace events:

- `booking.created`
- `booking.updated`
- `booking.completed`
- `payment.completed`
- `review.created`

**Webhook URL**: Configure in provider settings

---

## SDK & Libraries

### JavaScript/TypeScript

```typescript
import { MarketplaceClient } from '@hazalyze/marketplace-sdk'

const client = new MarketplaceClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.hazalyze.com'
})

const listings = await client.listings.search({
  category: 'STORAGE',
  location: 'Riyadh'
})
```

---

**Last Updated**: 2025-01-19  
**API Version**: 1.0.0

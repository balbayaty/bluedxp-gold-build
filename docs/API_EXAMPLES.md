# BlueDXP Platform - API Examples

## Authentication

All API requests require authentication via JWT token:

```bash
export TOKEN="your-jwt-token"
```

## Health Check

```bash
curl http://localhost:3002/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:00:00Z",
  "services": {
    "redis": { "status": "healthy", "enabled": true },
    "kafka": { "status": "healthy", "enabled": true },
    "minio": { "status": "healthy", "enabled": true },
    "opensearch": { "status": "healthy", "enabled": true }
  }
}
```

## Prometheus Metrics

```bash
curl http://localhost:3002/api/metrics
```

Returns metrics in Prometheus format.

## Module Licensing

### Validate License

```bash
curl -X POST http://localhost:3002/api/v1/licensing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate",
    "tenantId": "tenant_123",
    "moduleId": "wms"
  }'
```

### Check Feature

```bash
curl -X POST http://localhost:3002/api/v1/licensing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "checkFeature",
    "tenantId": "tenant_123",
    "moduleId": "wms",
    "feature": "advanced_analytics"
  }'
```

### Create/Update License

```bash
curl -X POST http://localhost:3002/api/v1/licensing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "upsert",
    "tenantId": "tenant_123",
    "moduleId": "wms",
    "licenseKey": "LIC-12345",
    "status": "ACTIVE",
    "expiresAt": "2026-12-31T23:59:59Z",
    "features": ["basic", "advanced_analytics", "ai_features"]
  }'
```

## Pricing Engine

### Calculate Pricing

```bash
curl -X POST http://localhost:3002/api/v1/pricing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "calculate",
    "planId": "plan_123",
    "usage": {
      "api_calls": 10000,
      "storage_gb": 100
    }
  }'
```

### Create Subscription

```bash
curl -X POST http://localhost:3002/api/v1/pricing \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createSubscription",
    "tenantId": "tenant_123",
    "planId": "plan_123",
    "startDate": "2025-01-27T00:00:00Z",
    "autoRenew": true
  }'
```

### Get Active Subscription

```bash
curl "http://localhost:3002/api/v1/pricing?tenantId=tenant_123" \
  -H "Authorization: Bearer $TOKEN"
```

## Saudi Government APIs

### Verify Vehicle (TGA)

```bash
curl -X POST http://localhost:3002/api/saudi-government \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agency": "tga",
    "action": "verifyVehicle",
    "plateNumber": "ABC1234",
    "chassisNumber": "CHASSIS123"
  }'
```

### Verify Identity (Absher)

```bash
curl -X POST http://localhost:3002/api/saudi-government \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agency": "absher",
    "action": "verifyIdentity",
    "nationalId": "1234567890"
  }'
```

### Submit Invoice (ZATCA)

```bash
curl -X POST http://localhost:3002/api/saudi-government \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agency": "zatca",
    "action": "submitInvoice",
    "invoiceData": {
      "invoiceNumber": "INV-001",
      "amount": 1000.00,
      "vat": 150.00
    }
  }'
```

## Error Handling

All APIs return errors in a consistent format:

```json
{
  "success": false,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input",
      "field": "email",
      "details": {}
    }
  ],
  "meta": {
    "timestamp": "2025-01-27T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

## Rate Limiting

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1706356800
```

## Pagination

List endpoints support pagination:

```bash
curl "http://localhost:3002/api/v1/resource?page=1&limit=10"
```

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```


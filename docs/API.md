# BlueDXP Platform - API Documentation

## Base URL

- Development: `http://localhost:3002`
- Production: `https://api.bluedxp.com`

## Authentication

All API requests require authentication via JWT token:

```
Authorization: Bearer <token>
```

## API Versioning

API versioning via URL path:
- `/api/v1/...` (current)
- `/api/v2/...` (future)

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-27T10:00:00Z",
    "requestId": "req_abc123",
    "version": "v1"
  },
  "errors": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input",
      "field": "email",
      "details": { ... }
    }
  ],
  "meta": {
    "timestamp": "2025-01-27T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

## HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Success, no body
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service down

## Endpoints

### Health Check

```
GET /api/health
```

### Saudi Government APIs

```
POST /api/saudi-government
GET /api/saudi-government?agency=tga&action=verifyVehicle
```

Agencies: `tga`, `mot`, `absher`, `nafath`, `saber`, `sfda`, `zatca`, `sama`, `ncsc`, `sdaia`, `saso`, `modon`, `moc`, `moi`, `momra`, `misa`, `citc`

### Transportation

```
GET    /api/v1/transportation/shipments
GET    /api/v1/transportation/shipments/{id}
POST   /api/v1/transportation/shipments
PUT    /api/v1/transportation/shipments/{id}
DELETE /api/v1/transportation/shipments/{id}
GET    /api/v1/transportation/shipments/{id}/tracking
```

### Warehouse Management

```
GET    /api/v1/warehouse/inventory
GET    /api/v1/warehouse/inventory/{id}
POST   /api/v1/warehouse/inventory
PUT    /api/v1/warehouse/inventory/{id}
```

## Rate Limiting

- Default: 100 requests per minute per IP
- Authenticated: 1000 requests per minute per user
- Headers:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## OpenAPI Specification

Full OpenAPI 3.0 specification available at:
```
GET /api/docs/openapi.json
```

## Examples

### Create Shipment

```bash
curl -X POST http://localhost:3002/api/v1/transportation/shipments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Riyadh",
    "destination": "Jeddah",
    "weight": 1000
  }'
```

### Verify Vehicle (TGA)

```bash
curl -X POST http://localhost:3002/api/saudi-government \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "agency": "tga",
    "action": "verifyVehicle",
    "plateNumber": "ABC1234"
  }'
```


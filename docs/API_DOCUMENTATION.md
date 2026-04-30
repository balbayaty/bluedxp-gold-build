# 📚 API DOCUMENTATION - QHSE & ISO-IMS Modules

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API endpoints require `tenantId` as a query parameter or in the request body.

---

## QHSE APIs

### Incidents

#### List Incidents
```http
GET /api/qhse/incidents?tenantId={tenantId}&severity={severity}&status={status}
```

**Query Parameters:**
- `tenantId` (required) - Tenant identifier
- `severity` (optional) - Filter by severity (CRITICAL, HIGH, MEDIUM, LOW)
- `status` (optional) - Filter by status
- `customerId` (optional) - Filter by customer
- `warehouseId` (optional) - Filter by warehouse

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "incident-123",
      "incidentNumber": "INC-2024-001",
      "title": "Safety incident",
      "severity": "HIGH",
      "status": "OPEN",
      "location": "Warehouse A",
      "occurredAt": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### Create Incident
```http
POST /api/qhse/incidents
Content-Type: application/json
```

**Request Body:**
```json
{
  "tenantId": "tenant-1",
  "type": "NEAR_MISS",
  "severity": "MEDIUM",
  "title": "Near miss incident",
  "description": "Forklift operator narrowly avoided collision",
  "location": "Warehouse A",
  "occurredAt": "2024-01-15T10:30:00Z",
  "reportedBy": "user-123",
  "createdBy": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "incident-123",
    "incidentNumber": "INC-2024-001",
    ...
  }
}
```

#### Get Incident
```http
GET /api/qhse/incidents/{id}?tenantId={tenantId}
```

#### Update Incident
```http
PUT /api/qhse/incidents/{id}?tenantId={tenantId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated title",
  "status": "CLOSED",
  "updatedBy": "user-123"
}
```

#### Delete Incident
```http
DELETE /api/qhse/incidents/{id}?tenantId={tenantId}
```

---

## ISO-IMS APIs

### CAPA

#### List CAPAs
```http
GET /api/iso-ims/capa?tenantId={tenantId}&page={page}&pageSize={pageSize}&status={status}
```

**Query Parameters:**
- `tenantId` (required) - Tenant identifier
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 20, max: 100)
- `status` (optional) - Filter by status
- `priority` (optional) - Filter by priority
- `sortBy` (optional) - Sort field (default: createdAt)
- `sortOrder` (optional) - Sort direction (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "capa-123",
      "capaNumber": "CAPA-2024-001",
      "subject": "Improve safety",
      "status": "OPEN",
      "priority": "HIGH",
      "capaType": "CORRECTIVE_ACTION"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Create CAPA
```http
POST /api/iso-ims/capa
Content-Type: application/json
```

**Request Body:**
```json
{
  "tenantId": "tenant-1",
  "subject": "Improve forklift safety",
  "description": "Implement additional safety measures",
  "priority": "HIGH",
  "capaType": "CORRECTIVE_ACTION",
  "capaSource": "NCR",
  "assignedTo": "user-123",
  "department": "Safety",
  "owner": "user-123",
  "targetDate": "2024-02-15",
  "actionPlan": "Install proximity sensors",
  "createdBy": "user-123"
}
```

#### Get CAPA
```http
GET /api/iso-ims/capa/{id}?tenantId={tenantId}
```

#### Update CAPA
```http
PUT /api/iso-ims/capa/{id}?tenantId={tenantId}
Content-Type: application/json
```

**Request Body:**
```json
{
  "subject": "Updated subject",
  "status": "IN_PROGRESS",
  "updatedBy": "user-123"
}
```

#### Delete CAPA
```http
DELETE /api/iso-ims/capa/{id}?tenantId={tenantId}
```

### NCR

#### List NCRs
```http
GET /api/iso-ims/ncr?tenantId={tenantId}&page={page}&pageSize={pageSize}
```

#### Create NCR
```http
POST /api/iso-ims/ncr
Content-Type: application/json
```

**Request Body:**
```json
{
  "tenantId": "tenant-1",
  "subject": "Non-conforming material",
  "description": "Material does not meet specifications",
  "priority": "HIGH",
  "severity": "MAJOR",
  "ncType": "PRODUCT",
  "reportedBy": "user-123",
  "reportedDate": "2024-01-15T10:30:00Z",
  "createdBy": "user-123"
}
```

#### Get NCR
```http
GET /api/iso-ims/ncr/{id}?tenantId={tenantId}
```

#### Update NCR
```http
PUT /api/iso-ims/ncr/{id}?tenantId={tenantId}
Content-Type: application/json
```

#### Delete NCR
```http
DELETE /api/iso-ims/ncr/{id}?tenantId={tenantId}
```

### Audit

#### List Audits
```http
GET /api/iso-ims/audit?tenantId={tenantId}&page={page}&pageSize={pageSize}
```

#### Create Audit
```http
POST /api/iso-ims/audit
Content-Type: application/json
```

**Request Body:**
```json
{
  "tenantId": "tenant-1",
  "title": "Q1 2024 Internal Audit",
  "description": "Internal quality audit",
  "auditType": "INTERNAL",
  "scope": "Quality Management System",
  "isoStandards": ["ISO 9001:2015"],
  "plannedDate": "2024-03-15",
  "leadAuditor": "user-123",
  "createdBy": "user-123"
}
```

#### Get Audit
```http
GET /api/iso-ims/audit/{id}?tenantId={tenantId}
```

#### Update Audit
```http
PUT /api/iso-ims/audit/{id}?tenantId={tenantId}
Content-Type: application/json
```

#### Delete Audit
```http
DELETE /api/iso-ims/audit/{id}?tenantId={tenantId}
```

---

## Health Check

### System Health
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "qhse": "healthy",
    "isoIms": "healthy"
  },
  "uptime": 3600
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "tenantId": {
      "_errors": ["Required"]
    }
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "CAPA not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Failed to create CAPA"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute per IP
- 1000 requests per hour per tenant

---

## Pagination

All list endpoints support pagination:
- `page` - Page number (starts at 1)
- `pageSize` - Items per page (max 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Filtering

Most list endpoints support filtering:
- `status` - Filter by status
- `priority` - Filter by priority
- `severity` - Filter by severity
- `customerId` - Filter by customer
- `warehouseId` - Filter by warehouse

Multiple values can be provided as comma-separated:
```
?status=OPEN,IN_PROGRESS
```

---

## Sorting

List endpoints support sorting:
- `sortBy` - Field to sort by (default: createdAt)
- `sortOrder` - Sort direction (asc/desc, default: desc)---*Last Updated: $(date)*
*Version: 1.0.0*
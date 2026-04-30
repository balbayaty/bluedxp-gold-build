# TMS API Reference

## Complete API Documentation for TMS Module

### Base URL
```
http://localhost:3000/api/tms
```

---

## 📋 **Job Management APIs**

### List Jobs
```http
GET /api/tms/jobs
```

**Query Parameters:**
- `tenantId` (required) - Tenant ID (e.g., "flex-logistics")
- `jobType` (optional) - Filter by job type
- `jobStatus` (optional) - Filter by job status
- `customerId` (optional) - Filter by customer
- `transporterId` (optional) - Filter by transporter
- `laneId` (optional) - Filter by lane
- `dateFrom` (optional) - Filter by date from
- `dateTo` (optional) - Filter by date to
- `search` (optional) - Search in job name/number
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 20)

**Response:**
```json
{
  "jobs": [
    {
      "id": "job_123",
      "jobName": "Cross Border - Dammam to Muscat",
      "jobNumber": "FX-166",
      "jobType": "Cross Border",
      "jobStatus": "Job Completed",
      ...
    }
  ],
  "total": 100
}
```

### Get Job Details
```http
GET /api/tms/jobs/:id?tenantId=flex-logistics
```

**Response:**
```json
{
  "id": "job_123",
  "jobName": "Cross Border - Dammam to Muscat",
  "jobNumber": "FX-166",
  "jobType": "Cross Border",
  "jobStatus": "Job Completed",
  "podRecords": [...],
  "detentionDetails": [...],
  "transitTimeRecords": [...],
  ...
}
```

### Create Job
```http
POST /api/tms/jobs
Content-Type: application/json
```

**Request Body:**
```json
{
  "tenantId": "flex-logistics",
  "createdBy": "user-id",
  "jobName": "New Transport Job",
  "jobNumber": "FX-999",
  "jobType": "Cross Border",
  "origin": "Dammam",
  "destination": "Muscat",
  "requestDate": "2024-01-15T00:00:00Z",
  ...
}
```

**Response:**
```json
{
  "id": "job_999",
  "jobName": "New Transport Job",
  ...
}
```

### Update Job
```http
PUT /api/tms/jobs/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "tenantId": "flex-logistics",
  "updatedBy": "user-id",
  "jobStatus": "In Transit",
  "shipperArrival": "2024-01-16T10:00:00Z",
  ...
}
```

### Delete Job
```http
DELETE /api/tms/jobs/:id?tenantId=flex-logistics
```

---

## 📥 **CSV Import API**

### Import Jobs from CSV
```http
POST /api/tms/jobs/import
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (required) - CSV file
- `tenantId` (required) - Tenant ID
- `createdBy` (required) - User ID

**Response:**
```json
{
  "success": true,
  "imported": 150,
  "failed": 2,
  "errors": [
    {
      "row": 5,
      "error": "Job name is required"
    }
  ],
  "jobIds": ["job_1", "job_2", ...]
}
```

---

## ✅ **POD (Proof of Delivery) APIs**

### Get POD Records
```http
GET /api/tms/jobs/:id/pod?tenantId=flex-logistics
```

**Response:**
```json
{
  "pods": [
    {
      "id": "pod_123",
      "jobId": "job_123",
      "deliveryDate": "2024-01-20",
      "deliveryTime": "14:30",
      "deliveryTimestamp": "2024-01-20T14:30:00Z",
      "consigneeName": "John Doe",
      "deliveryStatus": "delivered",
      "gpsCoordinates": {
        "latitude": 24.7136,
        "longitude": 46.6753
      },
      "verified": true,
      ...
    }
  ]
}
```

### Create POD Record
```http
POST /api/tms/jobs/:id/pod
Content-Type: application/json
```

**Request Body:**
```json
{
  "tenantId": "flex-logistics",
  "createdBy": "driver-id",
  "deliveryDate": "2024-01-20",
  "deliveryTime": "14:30",
  "consigneeName": "John Doe",
  "consigneePhone": "+966501234567",
  "deliveryLocation": "123 Main St, Riyadh",
  "gpsCoordinates": {
    "latitude": 24.7136,
    "longitude": 46.6753,
    "accuracy": 10
  },
  "deliveryStatus": "delivered",
  "deliveryNotes": "Delivered successfully",
  "signature": "base64-signature-data",
  "photos": ["data:image/jpeg;base64,..."]
}
```

**Response:**
```json
{
  "id": "pod_123",
  "jobId": "job_123",
  "deliveryStatus": "delivered",
  "verified": false,
  ...
}
```

---

## ⏱️ **Detention APIs**

### Get Detention Records
```http
GET /api/tms/jobs/:id/detention?tenantId=flex-logistics
```

**Response:**
```json
{
  "detentions": [
    {
      "id": "detention_123",
      "jobId": "job_123",
      "detentionType": "loading",
      "startDate": "2024-01-16T10:00:00Z",
      "endDate": "2024-01-17T14:00:00Z",
      "freeTimeDays": 1,
      "detentionDays": 1,
      "detentionCost": 100.00,
      "status": "active",
      ...
    }
  ]
}
```

### Calculate Detention
```http
POST /api/tms/jobs/:id/detention/calculate?tenantId=flex-logistics
```

**Response:**
```json
{
  "detentions": [
    {
      "id": "detention_123",
      "detentionType": "loading",
      "detentionDays": 1,
      "detentionCost": 100.00,
      ...
    }
  ]
}
```

---

## 🚀 **Transit Time APIs**

### Get Transit Time Records
```http
GET /api/tms/jobs/:id/transit-time?tenantId=flex-logistics
```

**Response:**
```json
{
  "transitTimes": [
    {
      "id": "transit_123",
      "jobId": "job_123",
      "segment": "full",
      "segmentName": "Full Route (POL to POD)",
      "startDate": "2024-01-16T10:00:00Z",
      "endDate": "2024-01-18T14:00:00Z",
      "plannedTransitTime": 48,
      "actualTransitTime": 52,
      "delay": 4,
      "origin": "Dammam",
      "destination": "Muscat",
      "onTime": false,
      "delayReason": "Border crossing delay",
      ...
    }
  ]
}
```

---

## 🏛️ **Regulatory APIs**

### Get Bayan Status
```http
GET /api/tms/regulatory/bayan/:bayanNumber
```

**Response:**
```json
{
  "valid": true,
  "verified": true,
  "data": {
    "bayanNumber": "BAYAN123456",
    "status": "approved",
    "submissionDate": "2024-01-15T00:00:00Z",
    "approvalDate": "2024-01-16T00:00:00Z",
    ...
  }
}
```

---

## 🔐 **Authentication**

All APIs require:
- **Tenant ID** - Must be provided in query params or body
- **Authentication** - User must be logged in (session-based)
- **Authorization** - RBAC checks based on user role

---

## 📝 **Error Responses**

### Standard Error Format
```json
{
  "error": "Error message here"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 🧪 **Example Usage**

### Using cURL

```bash
# List jobs
curl "http://localhost:3000/api/tms/jobs?tenantId=flex-logistics"

# Get job details
curl "http://localhost:3000/api/tms/jobs/job_123?tenantId=flex-logistics"

# Create POD
curl -X POST "http://localhost:3000/api/tms/jobs/job_123/pod" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "flex-logistics",
    "createdBy": "driver-123",
    "deliveryDate": "2024-01-20",
    "deliveryTime": "14:30",
    "consigneeName": "John Doe",
    "deliveryStatus": "delivered"
  }'

# Import CSV
curl -X POST "http://localhost:3000/api/tms/jobs/import" \
  -F "file=@zoho_data.csv" \
  -F "tenantId=flex-logistics" \
  -F "createdBy=user-123"
```

### Using JavaScript/TypeScript

```typescript
// List jobs
const response = await fetch('/api/tms/jobs?tenantId=flex-logistics');
const { jobs, total } = await response.json();

// Create POD
const podResponse = await fetch(`/api/tms/jobs/${jobId}/pod`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenantId: 'flex-logistics',
    createdBy: 'driver-123',
    deliveryDate: '2024-01-20',
    deliveryTime: '14:30',
    consigneeName: 'John Doe',
    deliveryStatus: 'delivered',
  }),
});
const pod = await podResponse.json();

// Import CSV
const formData = new FormData();
formData.append('file', csvFile);
formData.append('tenantId', 'flex-logistics');
formData.append('createdBy', 'user-123');

const importResponse = await fetch('/api/tms/jobs/import', {
  method: 'POST',
  body: formData,
});
const result = await importResponse.json();
```

---

## 📚 **Additional Resources**

- **Service Layer:** See `lib/services/tms/` for service implementations
- **Types:** See `types/tms/transportJob.ts` for data models
- **Database:** See `lib/services/tms/database/tmsDatabaseAdapter.ts` for database operations

---

**Last Updated:** 2024-12-22  
**Version:** 1.0.0



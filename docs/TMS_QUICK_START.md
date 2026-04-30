# TMS Module Quick Start Guide

## Overview

The enhanced TMS (Transport Management System) module is now fully integrated into BlueDXP Platform. This guide will help you get started with importing Flex Logistics data and using the TMS features.

## Prerequisites

- BlueDXP Platform running
- Flex Logistics tenant configured
- Zoho CSV export file ready

## Quick Start: Import Flex Logistics Data

### Option 1: Using the Import Script

```bash
# Import CSV file
npx ts-node scripts/import-flex-logistics-csv.ts "C:\Users\balba\OneDrive\Desktop\zoho data.csv"
```

### Option 2: Using the API

```bash
# Using curl
curl -X POST http://localhost:3000/api/tms/jobs/import \
  -F "file=@zoho data.csv" \
  -F "tenantId=flex-logistics" \
  -F "createdBy=your-user-id"
```

### Option 3: Using the UI (when implemented)

1. Navigate to TMS module
2. Click "Import Jobs"
3. Select CSV file
4. Click "Import"

## API Usage Examples

### 1. List All Jobs

```typescript
const response = await fetch('/api/tms/jobs?tenantId=flex-logistics');
const { jobs, total } = await response.json();
```

### 2. Get Job Details

```typescript
const response = await fetch('/api/tms/jobs/job-123?tenantId=flex-logistics');
const job = await response.json();
```

### 3. Create POD

```typescript
const response = await fetch('/api/tms/jobs/job-123/pod', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deliveryDate: '2024-01-15',
    deliveryTime: '14:30',
    consigneeName: 'John Doe',
    deliveryStatus: 'delivered',
    gpsCoordinates: {
      latitude: 24.7136,
      longitude: 46.6753
    },
    signature: 'base64-signature-data',
    tenantId: 'flex-logistics',
    createdBy: 'driver-123'
  })
});
const pod = await response.json();
```

### 4. Calculate Detention

```typescript
const response = await fetch('/api/tms/jobs/job-123/detention/calculate?tenantId=flex-logistics', {
  method: 'POST'
});
const detentions = await response.json();
```

### 5. Get Transit Times

```typescript
const response = await fetch('/api/tms/jobs/job-123/transit-time?tenantId=flex-logistics');
const transitTimes = await response.json();
```

### 6. Check Bayan Status

```typescript
const response = await fetch('/api/tms/regulatory/bayan/BAYAN123456');
const bayanStatus = await response.json();
```

## Service Usage Examples

### Import CSV Programmatically

```typescript
import { tmsCoreService } from '@/lib/services/tms';

const csvContent = fs.readFileSync('zoho data.csv', 'utf-8');
const result = await tmsCoreService.importJobsFromCSV(
  csvContent,
  'flex-logistics',
  'user-id'
);

console.log(`Imported ${result.imported} jobs`);
```

### Create POD Programmatically

```typescript
import { podService } from '@/lib/services/tms';

const pod = await podService.createPOD({
  jobId: 'job-123',
  deliveryDate: new Date(),
  deliveryTime: '14:30',
  consigneeName: 'John Doe',
  deliveryStatus: 'delivered',
  gpsCoordinates: {
    latitude: 24.7136,
    longitude: 46.6753
  },
  tenantId: 'flex-logistics',
  createdBy: 'driver-123'
});
```

### Calculate Detention Programmatically

```typescript
import { detentionService } from '@/lib/services/tms';

const detentions = await detentionService.calculateJobDetention(job);
const totalDetentionDays = detentions.reduce((sum, d) => sum + d.detentionDays, 0);
const totalDetentionCost = detentions.reduce((sum, d) => sum + (d.detentionCost || 0), 0);
```

### Predict Transit Time

```typescript
import { transitTimeService } from '@/lib/services/tms';

const prediction = await transitTimeService.predictTransitTime(
  'Dammam',
  'Muscat',
  'Box Trailer Dry',
  'lane-123',
  historicalData
);

console.log(`Predicted transit time: ${prediction.predictedTransitTime} hours`);
console.log(`Confidence: ${prediction.confidence * 100}%`);
```

## Key Features

### 1. Intelligent POD
- Digital signature capture
- GPS location verification
- Photo/document evidence
- QR code scanning
- Real-time validation

### 2. Detention Management
- Automatic calculation
- Multiple detention types
- Cost tracking
- Alert system
- Analytics

### 3. Transit Time Analytics
- Multi-segment tracking
- Predictive analytics
- Delay analysis
- Performance metrics

### 4. Lane Management
- Automatic lane extraction
- Performance tracking
- Optimization recommendations
- Profitability analysis

### 5. Regulatory Integration
- TGA vehicle/driver verification
- Daleeli business verification
- Bayan customs status
- Real-time sync

## Data Captured

The system captures all fields from your Zoho CSV:

- ✅ Job information (name, number, type, status)
- ✅ Customer and transporter details
- ✅ Driver and vehicle information
- ✅ Shipment and container details
- ✅ Border crossing events
- ✅ POD and delivery information
- ✅ Financial data (rates, costs, expenses)
- ✅ Detention and transit times
- ✅ Lane and deal information
- ✅ Bayan and regulatory data

## Next Steps

1. **Import Your Data**: Use the import script or API to import your Zoho CSV
2. **Review Jobs**: Check imported jobs via API or UI
3. **Capture PODs**: Use POD service to capture delivery confirmations
4. **Monitor Detention**: Set up alerts for detention thresholds
5. **Analyze Performance**: Review transit time and lane analytics
6. **Integrate Regulatory**: Connect TGA, Daleeli, and Bayan APIs

## Support

For questions or issues:
- Check `docs/TMS_IMPLEMENTATION_SUMMARY.md` for detailed documentation
- Review `docs/ARCHITECTURE/TMS_ENHANCED_ARCHITECTURE.md` for architecture details
- Contact BlueDXP support team

## Configuration

### Environment Variables

```env
# TGA Integration
TGA_API_KEY=your-tga-api-key
TGA_BASE_URL=https://api.tga.gov.sa

# Daleeli Integration
DALEELI_API_KEY=your-daleeli-api-key
DALEELI_BASE_URL=https://api.daleeli.gov.sa

# Bayan Integration
BAYAN_API_KEY=your-bayan-api-key
BAYAN_BASE_URL=https://api.bayan.gov.sa
```

## Security

- All operations require tenant ID for multi-tenant isolation
- RBAC integration ready (11 roles)
- Audit logging for all operations
- Input validation on all endpoints
- Data encryption ready

## Performance

- Batch processing for CSV imports
- Pagination for large datasets
- Caching ready for frequently accessed data
- Event-driven architecture for scalability



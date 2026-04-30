# GCC Compliance Business Flow - Complete Guide

## Overview

This document describes the complete business flow from customer inquiry to delivery, showing how the GCC Compliance module integrates with the Transportation Management System (TMS).

---

## 🎯 Business Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE BUSINESS FLOW                                       │
│                    (Quote → Booking → Dispatch → Delivery)                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

 STEP 1: INQUIRY                    STEP 2: QUOTE                   STEP 3: BOOKING
 ─────────────────                  ─────────────                   ───────────────
    Customer                           Sales                           Customer
       │                                 │                                │
       ▼                                 ▼                                ▼
 ┌──────────┐                    ┌──────────────┐                 ┌──────────────┐
 │ Request  │                    │ Generate     │                 │ Accept       │
 │ Shipment │─────────────────▶  │ Quote        │────────────────▶│ Quote        │
 └──────────┘                    │ + Pre-check  │                 │ + Book       │
                                 │ GCC Rules    │                 └──────┬───────┘
                                 └──────────────┘                        │
                                                                         ▼
                                                    ┌────────────────────────────────────┐
                                                    │  EVENT: tms.shipment.created       │
                                                    │                                    │
                                                    │  GCC Compliance Auto-Validates:    │
                                                    │  ✓ Step 1: Carrier Credentials     │
                                                    │  ✓ Step 2: Equipment Compatibility │
                                                    │  ✓ Step 3: Truck Ban Check         │
                                                    │  ✓ Step 4: Backload Rules (TGA)    │
                                                    │  ✓ Step 5: Document Validity       │
                                                    │  ✓ Step 6: Customs Requirements    │
                                                    │  ✓ Step 7: Weight Limits           │
                                                    │  ✓ Step 8: Insurance/Permits       │
                                                    └─────────────────┬──────────────────┘
                                                                      │
                                             ┌────────────────────────┼───────────────────────┐
                                             │                        │                       │
                                             ▼                        ▼                       ▼
                                       VALIDATION                VALIDATION              VALIDATION
                                        PASSED ✅                 WARNING ⚠️               FAILED ❌
                                             │                        │                       │
                                             ▼                        ▼                       ▼
                                       Can dispatch             Can dispatch          CANNOT dispatch
                                       immediately            with conditions         until resolved


 STEP 4: DISPATCH                   STEP 5: IN-TRANSIT              STEP 6: DELIVERY
 ────────────────                   ──────────────────              ─────────────────
   Operations                         Real-Time                        Consignee
       │                                 │                                │
       ▼                                 ▼                                ▼
 ┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
 │ Assign       │                 │ Track via    │                 │ Receive      │
 │ Carrier +    │                 │ Daleeli +    │                 │ Goods +      │
 │ Driver       │                 │ WhatsApp     │                 │ Sign POD     │
 └──────┬───────┘                 └──────────────┘                 └──────┬───────┘
        │                                                                  │
        ▼                                                                  ▼
┌────────────────────┐      ┌────────────────────────┐      ┌─────────────────────────┐
│ EVENT:             │      │ CONTINUOUS MONITORING: │      │ EVENT:                  │
│ tms.shipment.      │      │                        │      │ tms.shipment.delivered  │
│    dispatched      │      │ • Daleeli GPS Updates  │      │                         │
│                    │      │ • WhatsApp Check-ins   │      │ GCC Compliance:         │
│ GCC Compliance:    │      │ • Truck Ban Zones      │      │ • Stop tracking         │
│ • Generate         │      │ • Route Deviations     │      │ • Generate report       │
│   touchpoints      │      │ • Touchpoint Arrivals  │      │ • Track Daleeli billing │
│ • Generate Bayan   │      │ • Anomaly Detection    │      │ • Archive evidence      │
│   QR code          │      │                        │      │ • Issue certificate     │
│ • Start Daleeli    │      └────────────────────────┘      └─────────────────────────┘
│   tracking         │
│ • Send WhatsApp    │
│   to driver        │
└────────────────────┘
```

---

## 📋 Detailed Step-by-Step Flow

### Step 1: Customer Inquiry

**Who**: Customer
**What**: Requests transportation service
**Where**: Via CRM, email, phone, or portal

```typescript
// Example customer request
{
  origin: "Jeddah, Saudi Arabia",
  destination: "Dubai, UAE",
  cargo: "General Goods",
  weight: 25000, // kg
  estimatedPickup: "2024-01-15"
}
```

### Step 2: Quote Generation

**Who**: Sales Team
**What**: Generate transportation quote with compliance pre-check

**System Actions**:
1. Calculate pricing using `pricingIntelligenceService`
2. Check route feasibility
3. Pre-check GCC regulations:
   - Truck ban schedules
   - Border crossing requirements
   - Weight limits
   - Equipment compatibility

**API Endpoint**: `POST /api/transportation/quotes`

### Step 3: Booking Confirmation

**Who**: Customer accepts quote
**What**: Create shipment in TMS

**System Actions**:
1. Create shipment via `comprehensiveShipmentService`
2. **AUTOMATIC**: Publish `tms.shipment.created` event
3. **AUTOMATIC**: GCC Compliance runs 8-step validation

**API Endpoint**: `POST /api/transportation/[mode]/book`

**GCC Compliance Validation (8 Steps)**:

| Step | Validation | What It Checks |
|------|------------|----------------|
| 1 | Carrier Credentials | WASL registration, CR number, insurance |
| 2 | Equipment Compatibility | Equipment can handle cargo at facilities |
| 3 | Truck Ban Check | Entry allowed at planned arrival time |
| 4 | Backload Rules | TGA Oct 2024 foreign plate restrictions |
| 5 | Document Validity | Bayan, permits, licenses not expired |
| 6 | Customs Requirements | All declarations prepared |
| 7 | Weight Limits | Within GCC country limits |
| 8 | Insurance/Permits | Required permits obtained |

**Validation Result**:
```typescript
{
  canProceed: true,
  overallRisk: "LOW",
  steps: [
    { name: "Carrier Credentials", status: "PASSED" },
    { name: "Equipment Compatibility", status: "PASSED" },
    // ... 6 more steps
  ],
  recommendations: []
}
```

### Step 4: Dispatch

**Who**: Operations Team
**What**: Assign carrier, driver, and vehicle

**System Actions**:
1. State machine transitions to `PICKED_UP`
2. **AUTOMATIC**: Publish `tms.shipment.dispatched` event
3. **AUTOMATIC**: GCC Compliance:
   - Generates touchpoints (pickup, border, delivery)
   - Generates Bayan QR code for E-Waybill
   - Starts Daleeli tracking
   - Sends WhatsApp message to driver

**Touchpoints Generated**:
```typescript
{
  touchpoints: [
    {
      id: "tp-1",
      code: "PICKUP",
      name: "Jeddah Warehouse",
      type: "PICKUP",
      coordinates: { lat: 21.5433, lng: 39.1728 },
      radius: 500,
      expectedArrival: "2024-01-15T08:00:00Z"
    },
    {
      id: "tp-2",
      code: "BORDER_KSA_UAE",
      name: "Al Batha Border",
      type: "BORDER",
      coordinates: { lat: 24.7136, lng: 46.6753 },
      radius: 1000
    },
    {
      id: "tp-3",
      code: "DELIVERY",
      name: "Dubai Warehouse",
      type: "DELIVERY",
      coordinates: { lat: 25.2048, lng: 55.2708 },
      radius: 500
    }
  ]
}
```

### Step 5: In-Transit Monitoring

**Who**: System (Automatic)
**What**: Continuous real-time tracking

**Data Sources**:
1. **Daleeli (Primary)**: Official Saudi telematics
   - GPS location every 5 minutes
   - Vehicle status (moving, stopped)
   - Weight data
   - Speed

2. **WhatsApp/Telegram (Secondary)**: Driver check-ins
   - Click-to-share location
   - Status updates
   - Photo evidence

**Monitoring Actions**:

| Event | Action |
|-------|--------|
| Location update | Fuse Daleeli + WhatsApp data |
| Approaching touchpoint | Send alert |
| Entering truck ban zone | Check if legal, alert if violation |
| Route deviation | Anomaly detection |
| No updates for 30 min | Request driver location |

**Anomaly Detection**:
```typescript
// If Daleeli shows truck at Location A, but WhatsApp shows Location B
{
  type: "LOCATION_DISCREPANCY",
  severity: "HIGH",
  daleeli: { lat: 24.7136, lng: 46.6753 },
  whatsapp: { lat: 24.8000, lng: 46.7000 },
  deviation: 10.2, // km
  recommendation: "Verify driver status"
}
```

### Step 6: Delivery & Completion

**Who**: Consignee
**What**: Receive goods and sign POD

**System Actions**:
1. Driver marks delivery complete
2. State machine transitions to `DELIVERED`
3. **AUTOMATIC**: Publish `tms.shipment.delivered` event
4. **AUTOMATIC**: GCC Compliance:
   - Stops tracking
   - Generates compliance report
   - Tracks Daleeli API calls for billing
   - Archives all evidence
   - Issues compliance certificate

---

## 💰 Commercial Integration

### Daleeli API Billing Tracking

Every API call to Daleeli is tracked:

```typescript
{
  tenantId: "company-123",
  period: "2024-01",
  totalCalls: 1247,
  breakdown: {
    locationBySequence: 892,
    locationByPlate: 245,
    vehicleStatus: 110
  },
  estimatedCost: 1247.00 // SAR (1 SAR per call)
}
```

**Monthly Reconciliation**:
- Compare tracked calls vs. provider invoice
- Dispute discrepancies
- Optimize API usage

### Competitive Advantage

| Feature | Benefit |
|---------|---------|
| Automated compliance | 50% faster booking confirmation |
| Pre-validated routes | No delays at checkpoints |
| Authority-ready QR codes | Instant verification |
| Real-time tracking | Better customer experience |
| Anomaly detection | Prevent losses |

---

## 🔗 API Endpoints

### Initialization
```
POST /api/gcc-compliance/initialize
```

### Pre-Dispatch Validation
```
POST /api/gcc-compliance/validate
```

### Truck Ban Check
```
POST /api/gcc-compliance/truck-ban
```

### Backload Validation
```
POST /api/gcc-compliance/backload
```

### Touchpoint Generation
```
POST /api/gcc-compliance/touchpoints
```

### Bayan QR Generation
```
POST /api/gcc-compliance/generate-qr
```

### Bayan QR Verification
```
GET /api/gcc-compliance/verify-bayan/[etwId]
```

### Dashboard Metrics
```
GET /api/gcc-compliance/dashboard
```

---

## 🚀 How to Initialize

### Option 1: API Call
```bash
curl -X POST https://your-app.com/api/gcc-compliance/initialize
```

### Option 2: On App Startup
```typescript
// In app initialization
import { initializeGCCCompliance } from '@/lib/services/gcc-compliance';

await initializeGCCCompliance();
```

### Option 3: Environment Variable
```env
GCC_COMPLIANCE_AUTO_INIT=true
```

---

## ✅ Success Criteria

| Criteria | Measurement |
|----------|-------------|
| Auto-validation triggers | 100% of GCC shipments validated |
| Validation blocking | 0 non-compliant shipments dispatched |
| Tracking active | 100% of dispatched shipments tracked |
| Touchpoint accuracy | 95% touchpoints triggered correctly |
| Anomaly detection | <5 min detection time |
| Billing accuracy | 99% match with provider invoice |
| Audit completeness | 100% decisions logged |

---

## 🔐 Security & Compliance

### Data Protection
- All location data encrypted at rest
- API keys stored in environment variables
- Tenant isolation enforced

### Regulatory Compliance
- TGA (Transport General Authority) regulations
- MOT (Ministry of Transport) requirements
- WASL (Electronic Transport Management) integration
- Bayan (Electronic Waybill) mandatory requirements

### Audit Trail
- All validation decisions logged
- All location updates stored
- All API calls tracked
- Evidence chain maintained

---

## 📊 Dashboard Features

The GCC Compliance Dashboard (`/gcc-compliance`) provides:

1. **Compliance Overview**
   - Validation success rate
   - Active shipments monitored
   - Anomalies detected today

2. **Truck Ban Status**
   - Cities with active bans
   - Upcoming ban windows
   - Violations detected

3. **Daleeli Tracking**
   - Active tracking sessions
   - API usage this month
   - Billing estimates

4. **Touchpoint Monitor**
   - Active touchpoints
   - Arrivals today
   - Dwell time analysis

5. **Regulatory Updates**
   - New regulations
   - Upcoming changes
   - Compliance alerts

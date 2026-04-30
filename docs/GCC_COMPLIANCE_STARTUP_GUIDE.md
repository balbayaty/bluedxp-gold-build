# GCC Compliance - Where To Start

## 🚀 AUTOMATIC INITIALIZATION (Now Enabled!)

The GCC Compliance module will **automatically initialize** when your Next.js server starts.

### What Happens On Server Start:

```
┌────────────────────────────────────────────────────────────────────┐
│ SERVER STARTS (npm run dev / npm start)                           │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│ instrumentation.ts → register() function called                   │
│                                                                    │
│ 1. ✅ assertProductionReady() - checks app is ready                │
│ 2. ✅ initializeOpenTelemetry() - starts tracing                   │
│ 3. ✅ initializeGCCCompliance() - STARTS GCC COMPLIANCE! ← NEW!    │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│ GCC Compliance Module Initializes:                                 │
│                                                                    │
│ • Subscribes to: tms.shipment.created                             │
│ • Subscribes to: tms.shipment.dispatched                          │
│ • Subscribes to: tms.shipment.delivered                           │
│ • Subscribes to: daleel.location.updated                          │
│ • Subscribes to: geofence.entered                                 │
│ • Subscribes to: bayan.created                                    │
│                                                                    │
│ Console output:                                                    │
│ ✅ GCC Compliance Module initialized successfully                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## 📋 COMPLETE PROCESS FLOW

### Step 1: START THE SERVER

```bash
npm run dev
# or
npm start
```

**Console Output You Should See:**
```
✅ GCC Compliance Module initialized (auto-validation enabled)
[GCC Compliance] 🚀 Initializing GCC Compliance Module...
[GCC Compliance] Version: 1.0.0
[GCC Compliance] Features:
  • Pre-dispatch validation (8 steps)
  • Backload validation (TGA Oct 2024)
  • Truck ban monitoring
  • Daleeli tracking & billing
  • Bayan QR embedding
  • TextLocate location requests
  • Multi-source location fusion
  • Industry standards compliance
[GCC Compliance] 📡 Event subscriptions configured
[GCC Compliance] ✅ GCC Compliance Module initialized successfully
```

---

### Step 2: CREATE A SHIPMENT

When you create a shipment via the TMS (through the UI or API), the GCC Compliance module **automatically** validates it.

**API Endpoint:**
```
POST /api/transportation/shipments
```

**What Happens Automatically:**

```
1. Shipment Created
   └─→ comprehensiveShipmentService.createComprehensiveShipment()
   └─→ Event Published: tms.shipment.created
   
2. GCC Compliance Receives Event
   └─→ Checks if shipment involves GCC (SA, AE, QA, KW, BH, OM)
   └─→ If YES → Runs 8-step validation:
       ✓ Carrier Credentials
       ✓ Equipment Compatibility  
       ✓ Truck Ban Check
       ✓ Backload Rules
       ✓ Document Validity
       ✓ Customs Requirements
       ✓ Weight Limits
       ✓ Insurance/Permits
   
3. Validation Result Stored
   └─→ shipment.gccCompliance.validationResult = { canProceed, steps, ... }
   
4. Event Published: gcc.shipment.validated
```

**Console Output:**
```
[GCC Compliance] 📋 Processing new shipment: SH-123456
[GCC Compliance] ✅ Shipment SH-123456 passed validation
```

---

### Step 3: DISPATCH THE SHIPMENT

When you dispatch (state changes to PICKED_UP), geofences and touchpoints are generated.

**What Happens Automatically:**

```
1. State Machine → PICKED_UP
   └─→ Event Published: tms.shipment.dispatched
   
2. GCC Compliance Receives Event
   └─→ Generates touchpoints:
       📍 Pickup location geofence
       📍 Border crossing geofences (if cross-border)
       📍 Truck ban hold areas (if needed)
       📍 Delivery location geofence
   
3. Bayan QR Generated (if Bayan number exists)
   └─→ QR code embedded with Bayan data
   └─→ Verification URL created
   
4. Driver Notification Sent (if phone available)
   └─→ WhatsApp location request sent
   
5. Monitoring Started
   └─→ Checks every 5 minutes for compliance
```

**Console Output:**
```
[GCC Compliance] 🚚 Processing dispatch for shipment: SH-123456
[GCC Compliance] 📍 Generated 4 touchpoints for SH-123456
[GCC Compliance] 🔲 Generated Bayan QR for SH-123456
[GCC Compliance] 📱 Sent location request to driver for SH-123456
[GCC Compliance] 👁️ Started monitoring for shipment SH-123456
```

---

### Step 4: TRACK IN-TRANSIT

During transit, the system monitors location and compliance.

**What Happens Automatically:**

```
1. Daleeli Pushes Location Update
   └─→ Event: daleel.location.updated
   
2. GCC Compliance Receives Event
   └─→ Tracks API call for billing
   └─→ Updates last known location
   └─→ Checks touchpoint proximity:
       - Within 500m → Event: gcc.touchpoint.approaching
   └─→ Checks truck ban zones
   └─→ Checks for anomalies

3. Geofence Entered
   └─→ Event: geofence.entered
   └─→ Touchpoint marked as ARRIVED
   └─→ Dwell time tracking starts
```

---

### Step 5: DELIVERY COMPLETION

When delivered, tracking stops and reports are generated.

**What Happens Automatically:**

```
1. State Machine → DELIVERED
   └─→ Event: tms.shipment.delivered
   
2. GCC Compliance Receives Event
   └─→ Stops monitoring
   └─→ Generates compliance report
   └─→ Tracks Daleeli API calls for billing
   └─→ Archives compliance evidence
   └─→ Issues compliance certificate
```

**Console Output:**
```
[GCC Compliance] ✅ Processing delivery for shipment: SH-123456
[GCC Compliance] 🛑 Stopped monitoring for shipment SH-123456
[GCC Compliance] 📦 Shipment SH-123456 compliance tracking completed
```

---

## 🔧 ENVIRONMENT VARIABLES

| Variable | Default | Description |
|----------|---------|-------------|
| `GCC_COMPLIANCE_ENABLED` | `true` | Enable/disable auto-initialization |
| `DALEELI_API_KEY` | - | Daleeli API authentication |
| `BAYAN_API_KEY` | - | Bayan/Logisti API authentication |
| `WHATSAPP_BUSINESS_API_TOKEN` | - | WhatsApp Business API token |

---

## 🎯 WHERE TO START IN THE UI

### Option 1: Transportation Dashboard
1. Go to `/transportation`
2. Click "Create Shipment"
3. Fill in origin (Saudi Arabia) and destination
4. The GCC Compliance validation runs automatically when you save

### Option 2: GCC Compliance Dashboard
1. Go to `/gcc-compliance`
2. View active shipments being monitored
3. See validation results
4. Check truck ban schedules

### Option 3: API Testing
```bash
# Create a shipment
curl -X POST http://localhost:3000/api/transportation/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "origin": { "city": "Jeddah", "country": "SA" },
    "destination": { "city": "Dubai", "country": "AE" },
    "mode": "LAND",
    "type": "FTL"
  }'

# Check GCC Compliance status
curl http://localhost:3000/api/gcc-compliance/initialize
```

---

## ✅ VERIFICATION CHECKLIST

After starting the server, verify GCC Compliance is active:

| Check | How to Verify |
|-------|---------------|
| Auto-initialized | Console shows "GCC Compliance Module initialized" |
| Event subscriptions active | Console shows "Event subscriptions configured" |
| Validation working | Create a test shipment → should show validation logs |
| Dashboard accessible | Navigate to `/gcc-compliance` |
| API working | GET `/api/gcc-compliance/initialize` returns `initialized: true` |

---

## ⚠️ IF NOT WORKING

1. **Check server logs** for initialization errors
2. **Verify env variable**: `GCC_COMPLIANCE_ENABLED` is not `false`
3. **Check event bus**: Events must be publishing correctly
4. **Manual init**: Call `POST /api/gcc-compliance/initialize`

# 🚀 QR Service Quick Start Guide

## Overview
Complete guide to using the enhanced QR code service with MSDS data, location tracking, and analytics.

---

## 📱 **GENERATING QR CODES**

### **1. Generate MSDS QR Code (with Full Data)**

```typescript
// From frontend component
const response = await fetch('/api/qr/msds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    msdsId: 'msds-123',
    options: {
      includeFullData: true,  // Include full MSDS data in QR
      analytics: true,         // Enable tracking
      dynamic: true            // Allow updates without reprinting
    }
  })
})

const result = await response.json()
// result.qrCode - QR code data (JSON string)
// result.qrImageUrl - QR code image URL
// result.qrId - Unique QR code ID
```

### **2. Generate QR for Any Document**

```typescript
const response = await fetch('/api/qr/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    documentId: 'doc-123',
    documentType: 'certificate', // or 'permit', 'label', 'report', 'other'
    documentUrl: '/certificates/doc-123',
    options: {
      dynamic: true,
      analytics: true,
      accessLevel: 'internal' // or 'public', 'restricted'
    }
  })
})
```

### **3. Generate QR for Module Integration**

```typescript
import { qrModuleIntegration } from '@/lib/services/qr/moduleIntegration'

// WMS Container
const wmsQR = await qrModuleIntegration.generateWMSQR({
  containerId: 'CT-001',
  type: 'container'
})

// TMS Shipment
const tmsQR = await qrModuleIntegration.generateTMSQR('SH-001')

// Compliance Certificate
const complianceQR = await qrModuleIntegration.generateComplianceQR('CERT-001', 'certificate')

// Batch Generation
const batchQRs = await qrModuleIntegration.generateBatchQR([
  { id: 'CT-001', module: 'wms', type: 'container' },
  { id: 'SH-001', module: 'tms', type: 'shipment' },
  { id: 'MSDS-001', module: 'msds', type: 'msds' }
])
```

---

## 🔍 **SCANNING QR CODES**

### **1. Using QR Scanner Component**

```tsx
import QRScanner from '@/components/qr/QRScanner'

function MyComponent() {
  const [showScanner, setShowScanner] = useState(false)

  const handleScan = (qrData: string) => {
    // Parse QR data
    const data = JSON.parse(qrData)
    console.log('Scanned QR:', data)
    
    // Redirect or process
    if (data.documentType === 'msds') {
      window.location.href = `/msds?id=${data.documentId}`
    }
  }

  return (
    <>
      <button onClick={() => setShowScanner(true)}>
        Scan QR Code
      </button>
      
      <QRScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
        title="Scan MSDS QR Code"
        description="Point camera at QR code"
      />
    </>
  )
}
```

### **2. Direct Scan URL (Automatic Tracking)**

When a QR code is scanned, it redirects to:
```
/api/qr/scan/[qrId]
```

This endpoint:
- ✅ Automatically tracks the scan
- ✅ Captures location (country, city, IP)
- ✅ Records device information
- ✅ Redirects to the document

### **3. Manual Scan Tracking**

```typescript
const response = await fetch('/api/qr/scan/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    qrId: 'qr-msds-123',
    userId: 'user-123' // Optional
  })
})
```

---

## 📊 **VIEWING ANALYTICS**

### **1. Admin Dashboard**

Navigate to: `/admin/qr-analytics`

Features:
- Real-time scan statistics
- Location tracking (country, city, IP)
- Device analytics
- Date range filtering
- Top countries visualization

### **2. Get QR Analytics via API**

```typescript
// Get analytics for specific QR code
const response = await fetch('/api/qr/analytics?qrId=qr-msds-123')
const data = await response.json()

// data.analytics contains:
// - totalScans
// - uniqueScans
// - scanHistory (array of scan events)
// - locations (object with location counts)
// - devices (object with device counts)
```

### **3. Get All Scans**

```typescript
// Get all scans with filters
const response = await fetch('/api/qr/scans?limit=100&startDate=2024-01-01&endDate=2024-12-31')
const data = await response.json()

// data.scans - Array of scan events
// data.statistics - Aggregated statistics
//   - byLocation
//   - byCountry
//   - byDevice
```

---

## 🧪 **TESTING & VERIFICATION**

### **1. Test QR Code Generation**

```typescript
const response = await fetch('/api/qr/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'test-msds',
    msdsId: 'msds-123'
  })
})

const result = await response.json()
// result.verification - Verification results
// result.qrCode - Generated QR code
// result.msdsIncluded - Whether MSDS data is included
```

### **2. Verify QR Code Structure**

```typescript
import { verifyQRCode } from '@/lib/utils/qrVerification'

const verification = verifyQRCode(qrCodeString)

if (verification.valid) {
  console.log('QR code is valid!')
  console.log('Checks:', verification.checks)
} else {
  console.error('Errors:', verification.errors)
  console.warn('Warnings:', verification.warnings)
}
```

---

## 🎯 **INTELLIGENT FEATURES**

### **1. Campaign Management**

```typescript
import { intelligentQRService } from '@/lib/services/qr/intelligentQRService'

// Create campaign
const campaign = await intelligentQRService.createCampaign({
  id: 'campaign-001',
  name: 'Summer Safety Campaign',
  status: 'active',
  qrCodes: ['qr-1', 'qr-2'],
  metrics: { totalScans: 0, uniqueScans: 0 }
})
```

### **2. A/B Testing**

```typescript
const result = await intelligentQRService.generateIntelligentQR({
  documentId: 'doc-123',
  documentType: 'msds',
  abTestId: 'ab-test-001',
  abTestVariants: [
    { url: '/msds?id=123&variant=a', weight: 50 },
    { url: '/msds?id=123&variant=b', weight: 50 }
  ]
})
```

### **3. Geo-Targeting**

```typescript
const result = await intelligentQRService.generateIntelligentQR({
  documentId: 'doc-123',
  documentType: 'msds',
  geoRouting: [
    { country: 'Saudi Arabia', url: '/msds?id=123&lang=ar' },
    { country: 'United States', url: '/msds?id=123&lang=en' },
    { city: 'Riyadh', url: '/msds?id=123&local' }
  ]
})
```

### **4. Device-Specific Routing**

```typescript
const result = await intelligentQRService.generateIntelligentQR({
  documentId: 'doc-123',
  documentType: 'msds',
  deviceRouting: {
    mobile: '/msds?id=123&mobile=true',
    desktop: '/msds?id=123',
    ios: '/msds?id=123&ios=true',
    android: '/msds?id=123&android=true',
    fallback: '/msds?id=123'
  }
})
```

### **5. Time-Based Routing**

```typescript
const result = await intelligentQRService.generateIntelligentQR({
  documentId: 'doc-123',
  documentType: 'msds',
  timeRouting: [
    {
      startTime: '09:00',
      endTime: '17:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
      url: '/msds?id=123&business-hours'
    },
    {
      startTime: '17:00',
      endTime: '09:00',
      url: '/msds?id=123&after-hours'
    }
  ]
})
```

---

## 🔐 **SECURITY & ACCESS CONTROL**

### **Access Levels**

```typescript
// Public access
accessLevel: 'public'

// Internal (authenticated users)
accessLevel: 'internal'

// Restricted (specific permissions)
accessLevel: 'restricted'
```

### **IP Tracking**

All scans automatically capture:
- IP address
- Location (country, city, region)
- Device information
- User agent
- Timestamp

---

## 📍 **LOCATION TRACKING**

### **IP Geolocation Service**

```typescript
import { geolocationService } from '@/lib/services/qr/geolocationService'

// Get location from IP
const location = await geolocationService.getLocationFromIP('192.168.1.1')

// Returns:
// {
//   country: 'Saudi Arabia',
//   countryCode: 'SA',
//   city: 'Riyadh',
//   region: 'Riyadh Province',
//   coordinates: { latitude: 24.7136, longitude: 46.6753 },
//   timezone: 'Asia/Riyadh',
//   isp: 'ISP Name',
//   accuracy: 'high'
// }

// Extract IP from request
const ip = geolocationService.extractIPFromRequest(request.headers)

// Parse user agent
const deviceInfo = geolocationService.parseUserAgent(userAgent)
// Returns: { device, browser, os, isMobile }
```

---

## 🎨 **USING IN COMPONENTS**

### **Example: MSDS Page with QR Generation**

```tsx
import DocumentQRGenerator from '@/components/qr/DocumentQRGenerator'

function MSDSPage() {
  return (
    <div>
      <h1>MSDS Document</h1>
      
      <DocumentQRGenerator
        documentId="msds-123"
        documentType="msds"
        documentName="Chemical Name"
        onQRGenerated={(qrCode, qrImageUrl) => {
          console.log('QR Generated:', qrCode)
          // Download or display QR code
        }}
      />
    </div>
  )
}
```

---

## 🚨 **TROUBLESHOOTING**

### **QR Code Not Including MSDS Data**

1. Check if MSDS exists:
```typescript
const msds = await msdsStorageService.getMSDS(msdsId)
if (!msds) {
  console.error('MSDS not found')
}
```

2. Verify QR generation:
```typescript
const response = await fetch('/api/qr/test', {
  method: 'POST',
  body: JSON.stringify({
    action: 'test-msds',
    msdsId: 'your-msds-id'
  })
})
```

### **Location Not Tracking**

1. Check IP geolocation service:
```typescript
const location = await geolocationService.getLocationFromIP('your-ip')
console.log('Location:', location)
```

2. Verify scan tracking:
```typescript
const response = await fetch('/api/qr/scan/track', {
  method: 'POST',
  body: JSON.stringify({ qrId: 'your-qr-id' })
})
```

### **Admin Dashboard Not Showing Data**

1. Check if scans exist:
```typescript
const response = await fetch('/api/qr/scans')
const data = await response.json()
console.log('Scans:', data.scans)
```

2. Verify database connection and QR code storage

---

## 📚 **API ENDPOINTS SUMMARY**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/qr/msds` | POST | Generate MSDS QR code |
| `/api/qr/generate` | POST | Generate QR code for any document |
| `/api/qr/update` | POST | Update dynamic QR code |
| `/api/qr/scan/[qrId]` | GET | Scan handler (tracks & redirects) |
| `/api/qr/scan/track` | POST | Explicit scan tracking |
| `/api/qr/scans` | GET | Get all scans with statistics |
| `/api/qr/analytics` | GET | Get QR code analytics |
| `/api/qr/test` | POST | Test QR code generation |
| `/admin/qr-analytics` | GET | Admin dashboard |

---

## ✅ **BEST PRACTICES**

1. **Always include MSDS data** for offline access:
   ```typescript
   options: { includeFullData: true }
   ```

2. **Enable analytics** for tracking:
   ```typescript
   options: { analytics: true }
   ```

3. **Use dynamic QR codes** for flexibility:
   ```typescript
   options: { dynamic: true }
   ```

4. **Store QR codes** in database for tracking:
   - Automatically done when generating via API

5. **Test QR codes** before printing:
   ```typescript
   await fetch('/api/qr/test', { ... })
   ```

---

**For more details, see:** `QR_SERVICE_ENHANCEMENT_COMPLETE.md`








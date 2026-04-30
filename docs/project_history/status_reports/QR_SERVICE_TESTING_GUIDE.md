# 🧪 QR Service Testing Guide

## Overview
Complete guide to testing the QR service implementation.

---

## ⚠️ **IMPORTANT: Before Testing**

The QR service requires:
1. ✅ Database connection (PostgreSQL, MongoDB, or SQLite)
2. ✅ MSDS data in the system (for MSDS QR testing)
3. ✅ Server running (`npm run dev`)

---

## 🚀 **Quick Test Steps**

### **1. Start the Server**
```bash
npm run dev
```

### **2. Test QR Generation (Browser)**
Open browser and go to:
```
http://localhost:3000/api/qr/test
```

Or use the test script:
```bash
node scripts/test-qr-service.js
```

### **3. Test via API (Postman/curl)**

#### **Generate MSDS QR Code:**
```bash
curl -X POST http://localhost:3000/api/qr/msds \
  -H "Content-Type: application/json" \
  -d '{
    "msdsId": "test-msds-001",
    "options": {
      "includeFullData": true,
      "analytics": true
    }
  }'
```

#### **Test Scan Tracking:**
```bash
curl -X POST http://localhost:3000/api/qr/scan/track \
  -H "Content-Type: application/json" \
  -d '{
    "qrId": "qr-msds-test-msds-001-1234567890-abc123"
  }'
```

#### **Get Analytics:**
```bash
curl http://localhost:3000/api/qr/analytics?qrId=qr-msds-test-msds-001-1234567890-abc123
```

---

## 📋 **Manual Testing Checklist**

### **✅ QR Code Generation**

- [ ] **Test 1: Generate MSDS QR with Full Data**
  1. Go to MSDS page
  2. Select an MSDS document
  3. Click "Generate QR Code"
  4. Verify QR code image appears
  5. Verify QR code can be downloaded

- [ ] **Test 2: Verify MSDS Data in QR**
  1. Generate QR code
  2. Scan QR code (or decode manually)
  3. Verify JSON contains `metadata.msdsData`
  4. Verify MSDS data includes: productName, CAS number, hazards

- [ ] **Test 3: QR Code Storage**
  1. Generate QR code
  2. Check database: `SELECT * FROM qr_codes WHERE document_id = 'your-msds-id'`
  3. Verify QR code is stored

### **✅ Scan Tracking**

- [ ] **Test 4: Automatic Scan Tracking**
  1. Generate QR code
  2. Access scan URL: `/api/qr/scan/[qrId]`
  3. Verify redirect to MSDS page
  4. Check database: `SELECT * FROM qr_scan_events WHERE qr_id = 'your-qr-id'`
  5. Verify scan event is recorded

- [ ] **Test 5: Location Tracking**
  1. Scan QR code from different locations (if possible)
  2. Check admin dashboard: `/admin/qr-analytics`
  3. Verify location data (country, city, IP) is captured

- [ ] **Test 6: Device Tracking**
  1. Scan QR code from mobile device
  2. Scan QR code from desktop
  3. Check admin dashboard
  4. Verify device information is captured

### **✅ Admin Dashboard**

- [ ] **Test 7: Dashboard Access**
  1. Navigate to `/admin/qr-analytics`
  2. Verify dashboard loads
  3. Verify statistics cards show data

- [ ] **Test 8: Filters**
  1. Set date range filter
  2. Set country filter
  3. Set device filter
  4. Verify filters work correctly

- [ ] **Test 9: Scan Events Table**
  1. View scan events table
  2. Verify all columns show data
  3. Click "View QR" button
  4. Verify QR analytics modal opens

### **✅ API Endpoints**

- [ ] **Test 10: All API Endpoints**
  - [ ] `POST /api/qr/msds` - Generate MSDS QR
  - [ ] `POST /api/qr/generate` - Generate generic QR
  - [ ] `GET /api/qr/scan/[qrId]` - Scan handler
  - [ ] `POST /api/qr/scan/track` - Track scan
  - [ ] `GET /api/qr/scans` - Get all scans
  - [ ] `GET /api/qr/analytics` - Get analytics
  - [ ] `POST /api/qr/test` - Test endpoint

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: QR Code Not Including MSDS Data**

**Symptoms:**
- QR code generated but `msdsIncluded: false`
- No MSDS data in QR payload

**Fix:**
1. Check if MSDS exists:
   ```typescript
   const msds = await msdsStorageService.getMSDS(msdsId)
   ```
2. Verify MSDS ID is correct
3. Check console for errors

### **Issue 2: Database Connection Errors**

**Symptoms:**
- `Error storing QR code in database`
- QR codes not persisting

**Fix:**
1. Check database configuration in `.env`:
   ```
   DATABASE_TYPE=postgresql
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_NAME=hazalyze
   ```
2. Verify database is running
3. Check database connection in `lib/database/client.ts`

### **Issue 3: Location Not Tracking**

**Symptoms:**
- Scans recorded but location is "Unknown"
- IP address not captured

**Fix:**
1. Check if IP geolocation service is working:
   ```typescript
   const location = await geolocationService.getLocationFromIP('8.8.8.8')
   ```
2. Verify geolocation API keys (if using paid service)
3. Check network/firewall settings

### **Issue 4: Admin Dashboard Not Loading**

**Symptoms:**
- Dashboard shows "Loading..." indefinitely
- No data displayed

**Fix:**
1. Check browser console for errors
2. Verify API endpoint: `GET /api/qr/scans`
3. Check database connection
4. Verify QR codes exist in database

### **Issue 5: QR Scanner Not Working**

**Symptoms:**
- Camera not starting
- QR code not detected

**Fix:**
1. Check browser permissions for camera
2. Verify HTTPS (required for camera access)
3. Try manual input as fallback
4. Check browser compatibility (Chrome, Firefox, Safari)

---

## 🔍 **Debugging Tips**

### **1. Enable Console Logging**

Add to your code:
```typescript
console.log('QR Generation:', { msdsId, options, result })
console.log('Scan Tracking:', { qrId, location, device })
```

### **2. Check Database Directly**

```sql
-- Check QR codes
SELECT * FROM qr_codes ORDER BY metadata->>'createdAt' DESC LIMIT 10;

-- Check scan events
SELECT * FROM qr_scan_events ORDER BY timestamp DESC LIMIT 10;

-- Check analytics
SELECT qr_id, analytics FROM qr_codes WHERE qr_id = 'your-qr-id';
```

### **3. Test Individual Services**

```typescript
// Test geolocation
import { geolocationService } from '@/lib/services/qr/geolocationService'
const location = await geolocationService.getLocationFromIP('8.8.8.8')
console.log('Location:', location)

// Test QR generation
import { documentQRService } from '@/lib/services/qr/documentQRService'
const qr = await documentQRService.generateMSDSQR('test-msds-001')
console.log('QR:', qr)
```

---

## ✅ **Expected Results**

### **Successful QR Generation:**
```json
{
  "success": true,
  "qrCode": "{\"type\":\"document\",\"id\":\"qr-msds-...\",...}",
  "qrImageUrl": "https://api.qrserver.com/v1/create-qr-code/...",
  "qrId": "qr-msds-test-msds-001-1234567890-abc123",
  "msdsIncluded": true,
  "message": "QR code generated with MSDS data included for offline access"
}
```

### **Successful Scan Tracking:**
```json
{
  "success": true,
  "tracked": true,
  "location": {
    "country": "Saudi Arabia",
    "countryCode": "SA",
    "city": "Riyadh",
    "ip": "192.168.1.1"
  },
  "device": {
    "device": "Desktop",
    "browser": "Chrome",
    "os": "Windows"
  }
}
```

---

## 📊 **Performance Testing**

### **Load Test:**
```bash
# Generate 100 QR codes
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/qr/msds \
    -H "Content-Type: application/json" \
    -d "{\"msdsId\":\"test-msds-$i\"}"
done
```

### **Concurrent Scans:**
```bash
# Simulate 50 concurrent scans
for i in {1..50}; do
  curl http://localhost:3000/api/qr/scan/qr-msds-test-001 &
done
```

---

## 🎯 **Next Steps After Testing**

1. ✅ Fix any issues found
2. ✅ Verify all features work
3. ✅ Test with real MSDS data
4. ✅ Test on mobile devices
5. ✅ Test location tracking from different IPs
6. ✅ Verify admin dashboard shows correct data

---

**For issues or questions, check:**
- `QR_SERVICE_QUICK_START.md` - Usage guide
- `QR_SERVICE_ENHANCEMENT_COMPLETE.md` - Implementation details








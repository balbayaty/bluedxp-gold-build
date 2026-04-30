# ETW Quick Start Guide

## 🚀 **Getting Started**

### **1. Database Migration**

Run the Prisma migration to create all ETW tables:

```bash
npx prisma migrate dev --name add_etw_module
npx prisma generate
```

### **2. Verify Module Registration**

The ETW module is automatically registered in `lib/modules/index.ts`. Verify it's loaded:

```typescript
import { getModule } from '@/lib/modules/registry'
const etwModule = getModule('etw')
console.log(etwModule) // Should show ETW module definition
```

### **3. Access ETW Pages**

- **List Page:** Navigate to `/etw`
- **Create Page:** Navigate to `/etw/create`
- **Detail Page:** Navigate to `/etw/[id]`
- **Verification:** Navigate to `/v/[token]` (public)

---

## 📝 **Creating Your First ETW**

### **Via API:**

```typescript
POST /api/etw
{
  "scope": "LOCAL",
  "mode": "LAND",
  "parties": [
    {
      "id": "party-1",
      "type": "SHIPPER",
      "name": "ABC Company",
      "contact": {
        "name": "John Doe",
        "phone": "+966501234567",
        "email": "john@abc.com",
        "address": "Riyadh, Saudi Arabia"
      }
    },
    {
      "id": "party-2",
      "type": "CONSIGNEE",
      "name": "XYZ Corporation",
      "contact": {
        "name": "Jane Smith",
        "phone": "+966507654321",
        "email": "jane@xyz.com",
        "address": "Jeddah, Saudi Arabia"
      }
    }
  ],
  "cargo": {
    "items": [
      {
        "id": "item-1",
        "description": "Electronics",
        "packaging": {
          "type": "Carton",
          "quantity": 10,
          "unit": "pcs"
        },
        "weight": {
          "gross": 100,
          "net": 95,
          "unit": "KG"
        },
        "value": {
          "amount": 50000,
          "currency": "SAR"
        }
      }
    ],
    "totalWeight": 100,
    "totalValue": 50000,
    "currency": "SAR",
    "totalPieces": 10
  },
  "compliance": {
    "hazardous": false
  },
  "route": {
    "origin": {
      "id": "loc-1",
      "name": "Riyadh Warehouse",
      "type": "WAREHOUSE",
      "address": {
        "street": "Industrial Area",
        "city": "Riyadh",
        "postalCode": "12345",
        "country": "Saudi Arabia",
        "countryCode": "SA"
      }
    },
    "destination": {
      "id": "loc-2",
      "name": "Jeddah Distribution Center",
      "type": "WAREHOUSE",
      "address": {
        "street": "Port Area",
        "city": "Jeddah",
        "postalCode": "21461",
        "country": "Saudi Arabia",
        "countryCode": "SA"
      }
    },
    "mode": "LAND"
  },
  "commercial": {
    "contractType": "CONTRACT",
    "rate": {
      "base": 5000,
      "currency": "SAR",
      "total": 5000
    }
  }
}
```

### **Response:**

```json
{
  "success": true,
  "data": {
    "id": "etw-xxx",
    "etwNumber": "ETW-TEN-1234567890-ABC123",
    "status": "DRAFT",
    "version": 1,
    ...
  }
}
```

---

## 🔗 **Adding Chain-of-Custody Events**

```typescript
POST /api/etw/[id]/events
{
  "type": "PICKED_UP",
  "actor": {
    "id": "user-123",
    "name": "Driver Name",
    "role": "DRIVER",
    "type": "DRIVER"
  },
  "location": {
    "name": "Riyadh Warehouse",
    "coordinates": {
      "lat": 24.7136,
      "lng": 46.6753
    }
  },
  "verificationMethod": "GPS"
}
```

---

## 📱 **Generating QR Code**

```typescript
POST /api/etw/[id]/qr
{
  "accessPolicy": "CUSTOMER",
  "expiresInDays": 365
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrToken": {
      "id": "token-xxx",
      "token": "short-token-here",
      "accessPolicy": "CUSTOMER",
      "expiresAt": "2026-01-XX",
      ...
    },
    "verificationUrl": "https://yourapp.com/v/short-token-here",
    "qrCode": "{\"t\":\"short-token-here\",\"v\":\"1\",\"u\":\"...\"}"
  }
}
```

---

## ✅ **Verifying ETW (Public)**

Navigate to or scan QR code:
```
https://yourapp.com/v/[token]
```

Returns verification status, ETW details (read-only), and tamper detection.

---

## 📊 **Getting Intelligence Data**

```typescript
GET /api/etw/[id]/intelligence?sources=historical,telematics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "riskSnapshot": {
      "delayRange": {
        "min": 24,
        "max": 36,
        "expected": 30,
        "confidence": 0.85
      },
      "commonCauses": [...]
    },
    "milestones": {
      "endToEndEstimate": {
        "avg": 30,
        "min": 24,
        "max": 36,
        "confidence": 0.85,
        "estimatedCompletion": "2025-01-XX"
      }
    },
    "confidence": 0.85,
    "sources": ["historical"]
  }
}
```

---

## 🎯 **Key Features to Try**

1. **Create ETW** - Start with a local shipment
2. **Add Events** - Build chain-of-custody timeline
3. **Generate QR** - Create verification QR code
4. **Verify** - Test public verification endpoint
5. **View Intelligence** - Check risk and ETA predictions
6. **Link to Shipment** - Connect to TMS module
7. **Link to MSDS** - Connect to Hazalyze module
8. **View Timeline** - See complete event history

---

## 🔧 **Configuration**

ETW settings are configured in `lib/modules/etw.ts`:

- `etw.autoGenerateQR` - Auto-generate QR on creation
- `etw.qrExpirationDays` - QR token expiration
- `etw.requireMSDSForHazardous` - Require MSDS for hazardous cargo
- `etw.enableIntelligence` - Enable intelligence service
- `etw.intelligenceSources` - Data sources to use

---

## 🐛 **Troubleshooting**

### **Prisma Generation Fails:**
- Close dev server
- Run `npx prisma generate` again
- Restart dev server

### **Module Not Found:**
- Verify `lib/modules/etw.ts` exists
- Check `lib/modules/index.ts` imports ETW module
- Restart dev server

### **API Errors:**
- Check authentication (must be logged in)
- Verify tenant context
- Check RBAC permissions
- Review API route logs

---

## 📚 **Next Steps**

1. Create seed data (4 ETW examples)
2. Add PDF export API route
3. Create ETW form component
4. Add intelligence panels to detail page
5. Add Arabic translations
6. Write tests

---

**Ready to use!** 🎉





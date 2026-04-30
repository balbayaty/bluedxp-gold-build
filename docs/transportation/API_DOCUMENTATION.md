# Transportation Module - API Documentation

## 📚 **Complete API Reference**

**Version**: 3.0.0  
**Base URL**: `/api/transportation`

---

## 🔵 **Core APIs**

### **1. Route Comparison**

**Endpoint**: `POST /api/transportation/route-comparison`

**Description**: Compare multiple route options for a shipment

**Request Body**:
```json
{
  "origin": {
    "address": {
      "street": "123 Main St",
      "city": "Riyadh",
      "country": "Saudi Arabia",
      "countryCode": "SA"
    },
    "coordinates": {
      "lat": 24.7136,
      "lng": 46.6753
    }
  },
  "destination": {
    "address": {
      "street": "456 King St",
      "city": "Jeddah",
      "country": "Saudi Arabia",
      "countryCode": "SA"
    },
    "coordinates": {
      "lat": 21.4858,
      "lng": 39.1925
    }
  },
  "mode": "LAND",
  "cargo": {
    "weight": 1000,
    "volume": 5,
    "type": "FTL"
  },
  "priorities": {
    "cost": 0.4,
    "time": 0.3,
    "emissions": 0.2,
    "reliability": 0.1
  }
}
```

**Response**:
```json
{
  "request": { ... },
  "options": [
    {
      "id": "route-1",
      "origin": { ... },
      "destination": { ... },
      "distance": 950,
      "estimatedDuration": 10,
      "cost": 5000,
      "emissions": 250,
      "reliability": 95,
      "score": 88
    }
  ],
  "recommended": { ... },
  "generatedAt": "2025-01-27T10:00:00Z"
}
```

---

### **2. Pricing Intelligence**

**Endpoint**: `POST /api/transportation/pricing-intelligence`

**Description**: Get market rates, trends, and pricing recommendations

**Request Body**:
```json
{
  "origin": { ... },
  "destination": { ... },
  "mode": "SEA",
  "cargo": {
    "weight": 20000,
    "volume": 50,
    "type": "FCL"
  },
  "pickupDate": "2025-02-01"
}
```

**Response**:
```json
{
  "marketRate": 15000,
  "marketRateIndex": 125.5,
  "rateTrend": "UP",
  "rateChange": 5.2,
  "benchmarkRate": 14500,
  "savings": 500,
  "savingsPercentage": 3.3,
  "rateValidity": "2025-02-15",
  "forecast": {
    "next7Days": 15200,
    "next30Days": 15800
  },
  "recommendations": [
    "Book now to lock in current rates",
    "Consider alternative routes for 5% savings"
  ]
}
```

---

### **3. CO2 Emissions**

**Endpoint**: `POST /api/transportation/emissions`

**Description**: Calculate CO2 emissions for a shipment

**Request Body**:
```json
{
  "route": {
    "origin": { ... },
    "destination": { ... },
    "distance": 1000,
    "mode": "LAND"
  },
  "cargo": {
    "weight": 5000,
    "volume": 20
  },
  "vehicle": {
    "type": "TRUCK",
    "fuelType": "DIESEL",
    "loadFactor": 0.85
  }
}
```

**Response**:
```json
{
  "totalCO2e": 1250.5,
  "co2ePerKg": 0.25,
  "co2ePerKm": 1.25,
  "calculationMethod": {
    "method": "DETAILED",
    "standard": "GHG Protocol"
  },
  "breakdown": [
    {
      "segment": "Main Route",
      "distance": 1000,
      "co2e": 1250.5,
      "percentage": 100,
      "emissionFactor": 1.25
    }
  ],
  "comparison": {
    "vsAverage": {
      "average": 1300,
      "percentage": -3.8
    }
  },
  "offsetOptions": [
    {
      "provider": "Carbon Offset Provider",
      "cost": 25.00,
      "currency": "USD",
      "certificate": true
    }
  ]
}
```

---

### **4. Transit Time Prediction**

**Endpoint**: `POST /api/transportation/transit-time`

**Description**: Predict transit time with AI-powered analysis

**Request Body**:
```json
{
  "route": {
    "origin": { ... },
    "destination": { ... },
    "distance": 950,
    "mode": "LAND"
  },
  "cargo": {
    "type": "FTL",
    "hazmat": false
  },
  "pickupDate": "2025-02-01",
  "carrierId": "carrier-123"
}
```

**Response**:
```json
{
  "estimated": 10,
  "confidence": 85,
  "estimates": {
    "optimistic": 8,
    "realistic": 10,
    "pessimistic": 12
  },
  "factors": [
    {
      "factor": "Traffic",
      "impact": "MEDIUM",
      "description": "Moderate traffic expected"
    }
  ],
  "riskFactors": [
    {
      "factor": "Weather",
      "probability": 20,
      "impact": "LOW"
    }
  ],
  "predictedDelay": 0,
  "predictedDelayProbability": 15
}
```

---

### **5. AI Insights**

**Endpoint**: `POST /api/transportation/ai-insights`

**Description**: Get AI-powered insights and recommendations

**Request Body**:
```json
{
  "shipment": {
    "id": "shipment-123",
    "mode": "SEA",
    "type": "FCL",
    "origin": { ... },
    "destination": { ... }
  },
  "includeCategories": ["COST", "ROUTE", "TIMING"]
}
```

**Response**:
```json
{
  "recommendations": [
    "Consider LCL for 15% cost savings",
    "Book 2 weeks in advance for better rates"
  ],
  "riskFactors": [
    "Port congestion expected at destination"
  ],
  "optimizationSuggestions": [
    "Consolidate with other shipments for better rates"
  ],
  "predictedDelay": 2,
  "predictedDelayProbability": 25,
  "costOptimization": {
    "potentialSavings": 1500,
    "recommendations": [
      "Negotiate with carrier for volume discount"
    ]
  }
}
```

---

### **6. Shipments**

**Endpoint**: `POST /api/transportation/shipments`

**Description**: Create a comprehensive shipment with all intelligence

**Request Body**:
```json
{
  "origin": { ... },
  "destination": { ... },
  "type": "FCL",
  "mode": "SEA",
  "cargo": {
    "items": [
      {
        "description": "Electronics",
        "quantity": 100,
        "weight": 5000,
        "volume": 20
      }
    ],
    "totalWeight": 5000,
    "totalVolume": 20,
    "totalValue": 100000,
    "currency": "USD"
  },
  "createdBy": "user-123",
  "options": {
    "generateRouteComparison": true,
    "generatePricingIntelligence": true,
    "calculateEmissions": true,
    "predictTransitTime": true,
    "generateAIInsights": true,
    "linkToJourney": true,
    "linkToLifecycle": true
  }
}
```

**Response**:
```json
{
  "shipment": {
    "id": "shipment-123",
    "shipmentNumber": "SH-2025-001",
    "status": "DRAFT",
    ...
  },
  "routeComparison": { ... },
  "pricingIntelligence": { ... },
  "emissions": { ... },
  "transitTime": { ... },
  "aiInsights": { ... },
  "journeyIntegration": {
    "journeyId": "journey-123"
  },
  "lifecycleIntegration": {
    "lifecycleId": "lifecycle-123"
  }
}
```

**Endpoint**: `GET /api/transportation/shipments?includeIntelligence=true`

**Description**: Get shipments with optional intelligence enrichment

**Query Parameters**:
- `status`: Filter by status (comma-separated)
- `carrierId`: Filter by carrier
- `trackingNumber`: Filter by tracking number
- `includeIntelligence`: Include all intelligence data (true/false)

---

## 🟢 **Enhancement APIs**

### **7. Load Matching**

**Endpoint**: `POST /api/transportation/load-matching`

**Description**: Match shippers with carriers

**Request Body**:
```json
{
  "origin": { ... },
  "destination": { ... },
  "cargo": {
    "weight": 5000,
    "volume": 20,
    "type": "FTL"
  },
  "mode": "LAND",
  "pickupDate": "2025-02-01",
  "preferences": {
    "maxPrice": 10000,
    "minReliability": 90
  }
}
```

---

### **8. IoT Sensor Data**

**Endpoint**: `GET /api/transportation/iot/sensor-data?shipmentId=xxx&from=xxx&to=xxx`

**Description**: Get real-time or historical sensor data

**Query Parameters**:
- `shipmentId`: Required
- `from`: Start date (for historical)
- `to`: End date (for historical)

**Endpoint**: `POST /api/transportation/iot/sensor-data`

**Description**: Initialize IoT monitoring

**Request Body**:
```json
{
  "shipmentId": "shipment-123",
  "config": {
    "integrationType": "BOTH",
    "directProviders": [
      {
        "provider": "SensorNet",
        "apiKey": "xxx",
        "apiUrl": "https://api.sensornet.com",
        "certified": true
      }
    ],
    "governmentIntegration": {
      "country": "Saudi Arabia",
      "provider": "ELM",
      "config": {
        "apiUrl": "https://api.elm.sa",
        "apiKey": "xxx",
        "organizationId": "xxx"
      }
    }
  }
}
```

---

### **9. Freight Audit**

**Endpoint**: `POST /api/transportation/freight-audit`

**Description**: Audit freight invoice

**Request Body**:
```json
{
  "id": "invoice-123",
  "invoiceNumber": "INV-001",
  "carrierId": "carrier-123",
  "carrierName": "ABC Logistics",
  "shipmentId": "shipment-123",
  "invoiceDate": "2025-01-27",
  "dueDate": "2025-02-10",
  "lineItems": [
    {
      "description": "Base Rate",
      "rate": 100,
      "amount": 5000,
      "type": "BASE_RATE"
    }
  ],
  "subtotal": 5000,
  "taxes": 750,
  "total": 5750,
  "currency": "USD"
}
```

**Endpoint**: `GET /api/transportation/freight-audit?carrierId=xxx&from=xxx&to=xxx`

**Description**: Get audit statistics

---

### **10. Payments**

**Endpoint**: `POST /api/transportation/payments`

**Description**: Process payment

**Request Body**:
```json
{
  "invoiceId": "invoice-123",
  "shipmentId": "shipment-123",
  "amount": 5750,
  "currency": "USD",
  "carrierId": "carrier-123",
  "paymentMethod": "ACH",
  "scheduledDate": "2025-02-10"
}
```

**Endpoint**: `GET /api/transportation/payments?from=xxx&to=xxx&carrierId=xxx`

**Description**: Get financial analytics

---

### **11. Carrier Network**

**Endpoint**: `POST /api/transportation/carrier-network?action=segment`

**Description**: Create carrier segment

**Request Body**:
```json
{
  "name": "Premium Carriers",
  "criteria": {
    "minRating": 4.5,
    "minOnTimeRate": 95,
    "region": ["Saudi Arabia"]
  }
}
```

**Endpoint**: `POST /api/transportation/carrier-network?action=rate`

**Description**: Rate carrier

**Request Body**:
```json
{
  "carrierId": "carrier-123"
}
```

**Endpoint**: `GET /api/transportation/carrier-network?action=coverage&region=Saudi Arabia`

**Description**: Analyze network coverage

---

### **12. Compliance**

**Endpoint**: `GET /api/transportation/compliance?action=hos&driverId=xxx&date=xxx`

**Description**: Get hours of service

**Endpoint**: `GET /api/transportation/compliance?action=compliance&shipmentId=xxx`

**Description**: Check compliance

**Endpoint**: `POST /api/transportation/compliance`

**Description**: Check shipment compliance

**Request Body**:
```json
{
  "shipmentId": "shipment-123"
}
```

---

### **13. Predictive Analytics**

**Endpoint**: `POST /api/transportation/predictive`

**Description**: Get predictions

**Request Body**:
```json
{
  "action": "forecast",
  "mode": "LAND",
  "region": "Saudi Arabia",
  "from": "2025-02-01",
  "to": "2025-02-28"
}
```

---

### **14. Blockchain**

**Endpoint**: `POST /api/transportation/blockchain`

**Description**: Record transaction

**Request Body**:
```json
{
  "action": "record",
  "shipmentId": "shipment-123",
  "transactionType": "SHIPMENT_CREATED",
  "data": { ... }
}
```

**Endpoint**: `GET /api/transportation/blockchain?shipmentId=xxx`

**Description**: Get traceability

---

### **15. Fleet Management**

**Endpoint**: `POST /api/transportation/fleet?action=optimize`

**Description**: Optimize fleet assignment

**Request Body**:
```json
{
  "action": "optimize",
  "shipments": [
    {
      "id": "shipment-123",
      ...
    }
  ]
}
```

**Endpoint**: `GET /api/transportation/fleet?action=predictive-maintenance`

**Description**: Get predictive maintenance recommendations

---

### **16. Government Integration (ELM/Rabet.sa)**

**Endpoint**: `GET /api/transportation/government/elm?action=truck&truckId=xxx`

**Description**: Get truck data from ELM/Rabet.sa

**Endpoint**: `GET /api/transportation/government/elm?action=tracking&shipmentId=xxx`

**Description**: Get shipment tracking from ELM

**Endpoint**: `POST /api/transportation/government/elm`

**Description**: Initialize ELM adapter

**Request Body**:
```json
{
  "action": "initialize",
  "config": {
    "apiUrl": "https://api.elm.sa",
    "apiKey": "xxx",
    "organizationId": "xxx",
    "region": "SAUDI_ARABIA"
  }
}
```

---

### **17. ERP/WMS Integration**

**Endpoint**: `POST /api/transportation/integrations`

**Description**: Configure ERP/WMS integration

**Request Body**:
```json
{
  "type": "erp",
  "config": {
    "provider": "SAP",
    "apiUrl": "https://api.sap.com",
    "apiKey": "xxx",
    "enabled": true
  }
}
```

---

### **18. Webhooks**

**Endpoint**: `POST /api/transportation/webhooks`

**Description**: Subscribe to webhook events

**Request Body**:
```json
{
  "action": "subscribe",
  "url": "https://example.com/webhook",
  "events": [
    "shipment.created",
    "shipment.status.changed",
    "iot.alert.triggered"
  ],
  "secret": "webhook-secret"
}
```

**Endpoint**: `GET /api/transportation/webhooks?subscriptionId=xxx`

**Description**: Get webhook subscription

---

### **19. Real-Time**

**Endpoint**: `GET /api/transportation/realtime`

**Description**: Real-time connection endpoint (WebSocket/SSE)

**Endpoint**: `POST /api/transportation/realtime`

**Description**: Subscribe to real-time updates

**Request Body**:
```json
{
  "action": "subscribe",
  "connectionId": "conn-123",
  "shipmentIds": ["shipment-123"],
  "eventTypes": ["SHIPMENT_STATUS", "LOCATION_UPDATE", "SENSOR_DATA"]
}
```

---

## 🔐 **Authentication**

All APIs require authentication. Include authentication token in headers:

```
Authorization: Bearer <token>
```

---

## 📝 **Error Responses**

All APIs return errors in the following format:

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

**Status Codes**:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `404`: Not Found
- `500`: Internal Server Error
- `503`: Service Unavailable

---

## 🚀 **Rate Limiting**

- **Standard**: 100 requests per minute
- **Premium**: 1000 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## 📚 **Additional Resources**

- [Type Definitions](./types.md)
- [Integration Guide](./integration-guide.md)
- [Examples](./examples.md)







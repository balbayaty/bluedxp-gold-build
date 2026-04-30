# 🚀 Transportation Module - Quick Reference Guide

**Last Updated**: 2025-01-27  
**Status**: ✅ **100% Operational**

---

## 📍 **Quick Access**

### **Main Pages**
- **Insurance**: `/transportation/insurance`
- **Ports**: `/transportation/ports`
- **Freight Audit**: `/transportation/audit`
- **Shipments**: `/transportation/shipments`
- **Tracking**: `/transportation/tracking`

---

## 🔧 **API Endpoints**

### **Insurance Management**
```
POST   /api/transportation/insurance          - Create policy/claim
GET    /api/transportation/insurance          - List policies
GET    /api/transportation/insurance?action=statistics - Get statistics
GET    /api/transportation/insurance?policyId=xxx - Get policy
PUT    /api/transportation/insurance          - Update policy/claim
```

### **Ports Management**
```
POST   /api/transportation/ports            - Create port
GET    /api/transportation/ports              - List ports
GET    /api/transportation/ports?action=statistics - Get statistics
GET    /api/transportation/ports?code=xxx    - Get port by code
PUT    /api/transportation/ports              - Update port
```

### **Freight Audit**
```
POST   /api/transportation/freight-audit     - Audit invoice
GET    /api/transportation/freight-audit     - Get statistics
```

---

## 💻 **Service Usage**

### **Insurance Service**
```typescript
import { insuranceService } from '@/lib/services/transportation'

// Create policy
const policy = await insuranceService.createPolicy({
  shipmentId: 'SH-001',
  shipmentNumber: 'SH-2024-001',
  provider: 'Insurance Company',
  coverageAmount: 100000,
  premium: 1000,
  currency: 'SAR',
  expiryDate: '2024-12-31',
  createdBy: userId,
  tenantId: tenantId,
})

// Create claim
const claim = await insuranceService.createClaim({
  policyId: policy.id,
  amount: 5000,
  currency: 'SAR',
  description: 'Damage claim',
  incidentDate: new Date().toISOString(),
  createdBy: userId,
  tenantId: tenantId,
})

// Get statistics
const stats = await insuranceService.getStatistics(tenantId)
```

### **Ports Service**
```typescript
import { portsService } from '@/lib/services/transportation'

// Create port
const port = await portsService.createPort({
  code: 'JED',
  name: 'Jeddah Port',
  country: 'Saudi Arabia',
  type: 'SEA',
  createdBy: userId,
  tenantId: tenantId,
})

// Update utilization (auto-updates status)
const updated = await portsService.updatePortUtilization(
  port.id,
  50,  // currentShipments
  200, // containers
  tenantId
)

// Get statistics
const stats = await portsService.getStatistics(tenantId)
```

---

## 🗄️ **Database Tables**

### **Insurance**
- `transportation_insurance_policies` - Insurance policies
- `transportation_insurance_claims` - Insurance claims

### **Ports**
- `transportation_ports` - Port information

---

## 📊 **Key Features**

### **Insurance Management**
- ✅ Create and manage policies
- ✅ File and track claims
- ✅ Policy expiration tracking
- ✅ Statistics dashboard
- ✅ Multi-tenant support

### **Ports Management**
- ✅ Create and manage ports
- ✅ Track utilization
- ✅ Auto-status updates (OPERATIONAL → CONGESTED)
- ✅ Statistics dashboard
- ✅ Multi-tenant support

### **Freight Audit**
- ✅ Automated invoice auditing
- ✅ Anomaly detection
- ✅ Statistics tracking

---

## 🔐 **Security**

All endpoints are protected with:
- ✅ Authentication required
- ✅ RBAC authorization
- ✅ Rate limiting
- ✅ Tenant isolation
- ✅ Input validation

---

## 📝 **Event Bus Events**

### **Insurance Events**
- `transportation.insurance.policy.created`
- `transportation.insurance.policy.updated`
- `transportation.insurance.policy.expired`
- `transportation.insurance.claim.created`
- `transportation.insurance.claim.updated`

### **Ports Events**
- `transportation.port.created`
- `transportation.port.updated`
- `transportation.port.utilization.updated`

---

## 🐛 **Troubleshooting**

### **No Data Showing**
- Check tenant context is set
- Verify API routes are accessible
- Check browser console for errors
- Verify database connection

### **API Errors**
- Check authentication headers
- Verify tenant ID is provided
- Check rate limiting
- Review server logs

### **Database Issues**
- Verify database connection
- Check table creation
- Review in-memory fallback

---

## 📚 **Documentation**

- **Complete Integration Audit**: `docs/TRANSPORTATION_MODULE_COMPLETE_INTEGRATION_AUDIT.md`
- **End-to-End Test Report**: `docs/TRANSPORTATION_MODULE_END_TO_END_TEST_REPORT.md`
- **Final Verification**: `docs/TRANSPORTATION_MODULE_FINAL_VERIFICATION.md`
- **Complete Status**: `docs/TRANSPORTATION_MODULE_COMPLETE_STATUS.md`

---

## ✅ **Status**

**All systems operational and ready for production use.**

---

**Quick Reference Version**: 1.0  
**Last Updated**: 2025-01-27

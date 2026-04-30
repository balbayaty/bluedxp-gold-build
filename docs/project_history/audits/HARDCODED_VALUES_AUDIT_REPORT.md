# 🔍 Hardcoded Values Audit Report
## BlueDXP Platform - Hazalyze Module
## Date: 2025-01-27

---

## 🚨 **CRITICAL SECURITY ISSUES** (Must Fix Immediately)

### 1. **Hardcoded Password in ERPNext API** ⚠️ **CRITICAL**

**Location**: `lib/adapters/erpnext/api.ts` Line 11

**Issue**:
```typescript
const ERP_PASSWORD = process.env.ERP_NEXT_API_SECRET || "Bashir@2025";
```

**Risk**: 
- 🔴 **CRITICAL**: Password exposed in source code
- If repository becomes public, password is immediately compromised
- Password remains in Git history even if removed
- Violates security best practices

**Fix Required**:
```typescript
// ❌ BAD (current)
const ERP_PASSWORD = process.env.ERP_NEXT_API_SECRET || "Bashir@2025";

// ✅ GOOD (fixed)
const ERP_PASSWORD = process.env.ERP_NEXT_API_SECRET;
if (!ERP_PASSWORD) {
  throw new Error('ERP_NEXT_API_SECRET environment variable is required');
}
```

**Action Items**:
1. 🔴 **URGENT**: Remove hardcoded password immediately
2. 🔴 **URGENT**: Change password `Bashir@2025` in ERPNext system
3. 🔴 **URGENT**: Use environment variable only (fail if not set)
4. 🟡 **MEDIUM**: Check Git history - if committed, rotate password
5. 🟡 **MEDIUM**: Audit repository access

---

### 2. **Hardcoded Email Address as Fallback** ⚠️ **MEDIUM**

**Location**: `lib/adapters/erpnext/api.ts` Line 10

**Issue**:
```typescript
const ERP_EMAIL = process.env.ERP_NEXT_API_KEY || "b.albayaty@scsflex.com";
```

**Risk**:
- 🟡 **MEDIUM**: Email address exposed in source code
- Could be used for social engineering
- Should be configurable per environment

**Fix Required**:
```typescript
// ❌ BAD (current)
const ERP_EMAIL = process.env.ERP_NEXT_API_KEY || "b.albayaty@scsflex.com";

// ✅ GOOD (fixed)
const ERP_EMAIL = process.env.ERP_NEXT_API_KEY;
if (!ERP_EMAIL) {
  throw new Error('ERP_NEXT_API_KEY environment variable is required');
}
```

---

### 3. **Hardcoded Camera Password Fallback** ⚠️ **MEDIUM**

**Location**: `app/api/camera-proxy/route.ts` Line 24

**Issue**:
```typescript
const password = process.env.DMSS_PASSWORD || '******'
```

**Risk**:
- 🟡 **MEDIUM**: Placeholder password (not real, but still bad practice)
- Should fail if environment variable not set

**Fix Required**:
```typescript
// ❌ BAD (current)
const password = process.env.DMSS_PASSWORD || '******'

// ✅ GOOD (fixed)
const password = process.env.DMSS_PASSWORD;
if (!password) {
  return NextResponse.json(
    { error: 'DMSS_PASSWORD environment variable is required' },
    { status: 500 }
  );
}
```

---

## ⚠️ **CONFIGURATION HARDCODING** (Should Be Environment Variables)

### 4. **Hardcoded ERP URL**

**Location**: `lib/adapters/erpnext/api.ts` Line 9

**Issue**:
```typescript
const ERP_URL = process.env.ERP_NEXT_API_URL || "https://erp.hazalyze.com";
```

**Recommendation**: 
- ✅ Has environment variable fallback (good)
- ⚠️ Should document default in `.env.example`
- ⚠️ Consider making it required in production

---

### 5. **Hardcoded WebSocket URL**

**Location**: `lib/services/realtime/websocketService.ts` Line 38

**Issue**:
```typescript
: 'ws://localhost:3002/api/realtime')
```

**Recommendation**:
- ⚠️ Should use environment variable: `process.env.NEXT_PUBLIC_WS_URL`
- ⚠️ Should support both `ws://` and `wss://` based on environment

**Fix**:
```typescript
: process.env.NEXT_PUBLIC_WS_URL || `ws://${process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'localhost:3002'}/api/realtime`)
```

---

### 6. **Hardcoded Event Bus Port**

**Location**: `lib/services/event-bus/index.ts` Line 27

**Issue**:
```typescript
const PORT = process.env.PORT || 3010;
```

**Status**: 
- ✅ Uses environment variable with fallback (acceptable)
- ⚠️ Should document in `.env.example`

---

### 7. **Hardcoded API Base URLs**

**Locations**:
- `lib/adapters/transportation/erp/ZohoAdapter.ts` Line 21: `'https://www.zohoapis.com'`
- `lib/adapters/rabet/index.ts` Lines 79, 87: `'https://api.rabet.sa'`

**Status**: 
- ✅ These are public API endpoints (acceptable)
- ⚠️ Should be configurable for testing/staging environments

---

## 📝 **BUSINESS LOGIC HARDCODING** (Acceptable but Should Be Configurable)

### 8. **Hardcoded Default System Parameters**

**Location**: `app/settings/parameters/page.tsx` Lines 35-41

**Examples**:
- `defaultValue: 100` (Reorder Point)
- `defaultValue: 80` (Capacity Threshold)
- `defaultValue: 3` (Retry Count)
- `defaultValue: 30` (Session Timeout)
- `defaultValue: 'Asia/Dubai'` (Timezone)

**Status**: 
- ✅ These are default values (acceptable)
- ⚠️ Should be configurable per tenant
- ⚠️ Should be stored in database, not hardcoded

---

### 9. **Hardcoded Truck/Container Specifications**

**Location**: `utils/loadSetupCalculator.ts` Lines 4-47

**Issue**: Hardcoded dimensions and capacities for:
- 20ft Container
- 40ft Container
- Flatbed Truck
- Box Truck
- Refrigerated Truck
- LTL Truck

**Status**: 
- ✅ These are industry standards (acceptable)
- ⚠️ Should be configurable per customer/tenant
- ⚠️ Should be stored in database for flexibility

---

### 10. **Hardcoded Maintenance Intervals**

**Location**: `lib/services/ml/predictive-maintenance.ts` Lines 101-142

**Issue**: Hardcoded maintenance intervals for equipment types:
- Pump: inspection 30 days, preventive 90 days
- Valve: inspection 45 days, preventive 180 days
- Compressor: inspection 14 days, preventive 60 days
- etc.

**Status**: 
- ✅ These are default values (acceptable)
- ⚠️ Should be configurable per equipment type/tenant
- ⚠️ Should be stored in database

---

### 11. **Hardcoded Knowledge Base Defaults**

**Location**: `lib/services/knowledge-base/index.ts` Lines 425-460

**Examples**:
- `dataRetentionDays: 365`
- `learningThreshold: 70`
- `maxEntries: 10000`
- `maxStorageBytes: 100 * 1024 * 1024` (100MB)

**Status**: 
- ✅ These are default values (acceptable)
- ⚠️ Should be configurable per tenant
- ⚠️ Should be stored in database

---

### 12. **Hardcoded AI Configuration Defaults**

**Location**: `utils/aiClient.ts` Lines 45-50

**Issue**:
```typescript
const DEFAULT_CONFIG: AIConfig = {
  provider: 'auto',
  temperature: 0.7,
  maxTokens: 2000,
  stream: false,
}
```

**Status**: 
- ✅ These are default values (acceptable)
- ⚠️ Should be configurable per tenant/user
- ⚠️ Should be stored in database

---

## 🧪 **TEST/MOCK DATA** (Acceptable for Development)

### 13. **Mock Email Addresses in Test Data**

**Locations**:
- `lib/utils/formHelpers.ts`: `'inspector@example.com'`, `'instructor@example.com'`
- `lib/services/compliance/mockDataService.ts`: Various `info@*.gov.sa` addresses
- `lib/services/firebase/config.ts`: `'test@example.com'`
- `lib/services/copilot/actionExecutor.ts`: `'user@example.com'`

**Status**: 
- ✅ These are test/mock data (acceptable)
- ⚠️ Should be clearly marked as test data
- ⚠️ Should not be used in production

---

## 📊 **SUMMARY**

### **Critical Issues** (Must Fix):
- 🔴 **1 Critical**: Hardcoded password (`Bashir@2025`)
- 🟡 **2 Medium**: Hardcoded email and camera password fallback

### **Configuration Issues** (Should Fix):
- ⚠️ **5 items**: URLs, ports, and API endpoints that should be more configurable

### **Business Logic Hardcoding** (Consider Fixing):
- 📝 **5 items**: Default values that should be configurable per tenant

### **Test Data** (Acceptable):
- ✅ **4 items**: Mock/test data (acceptable but should be clearly marked)

---

## ✅ **RECOMMENDED ACTIONS**

### **Immediate (Critical)**:
1. 🔴 **Remove hardcoded password** from `lib/adapters/erpnext/api.ts`
2. 🔴 **Change ERPNext password** `Bashir@2025` in ERPNext system
3. 🔴 **Remove hardcoded email fallback** from `lib/adapters/erpnext/api.ts`
4. 🔴 **Fix camera password fallback** in `app/api/camera-proxy/route.ts`

### **Short Term (High Priority)**:
5. ⚠️ **Make WebSocket URL configurable** via environment variable
6. ⚠️ **Document all environment variables** in `.env.example`
7. ⚠️ **Add validation** for required environment variables at startup

### **Medium Term (Nice to Have)**:
8. 📝 **Move default system parameters** to database
9. 📝 **Make truck/container specs configurable** per tenant
10. 📝 **Make maintenance intervals configurable** per equipment type

---

## 📋 **ENVIRONMENT VARIABLES CHECKLIST**

Ensure these are documented in `.env.example`:

```env
# ERPNext Integration
ERP_NEXT_API_URL=https://erp.hazalyze.com
ERP_NEXT_API_KEY=your-email@domain.com
ERP_NEXT_API_SECRET=your-password

# Camera Integration
DMSS_USERNAME=your-username
DMSS_PASSWORD=your-password

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3002/api/realtime

# Event Bus
PORT=3010

# External APIs
ZOHO_API_URL=https://www.zohoapis.com
RABET_API_URL=https://api.rabet.sa
```

---

## 🔒 **SECURITY BEST PRACTICES**

1. ✅ **Never hardcode passwords, API keys, or secrets**
2. ✅ **Use environment variables for all sensitive data**
3. ✅ **Fail fast if required environment variables are missing**
4. ✅ **Use `.env.example` to document required variables**
5. ✅ **Never commit `.env` files to Git**
6. ✅ **Rotate passwords/keys if they were ever in Git history**
7. ✅ **Use secret management services in production (AWS Secrets Manager, etc.)**

---

**Report Generated**: 2025-01-27
**Next Review**: After fixes are applied












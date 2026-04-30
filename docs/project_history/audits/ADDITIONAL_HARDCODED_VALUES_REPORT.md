# 🔍 Additional Hardcoded Values Report

## 📋 **Summary**

After fixing the navigation menu hardcoding, here are **other similar hardcoded values** found in the codebase:

---

## 🚨 **CRITICAL SECURITY ISSUES** (Must Fix Immediately)

### 1. **Hardcoded Password** ⚠️ **CRITICAL**
- **Location**: `lib/adapters/erpnext/api.ts` Line 11
- **Issue**: `const ERP_PASSWORD = process.env.ERP_NEXT_API_SECRET || "Bashir@2025";`
- **Fix**: Remove fallback, fail if env var not set

### 2. **Hardcoded Email** ⚠️ **MEDIUM**
- **Location**: `lib/adapters/erpnext/api.ts` Line 10
- **Issue**: `const ERP_EMAIL = process.env.ERP_NEXT_API_KEY || "b.albayaty@scsflex.com";`
- **Fix**: Remove fallback, fail if env var not set

### 3. **Hardcoded Camera Password** ⚠️ **MEDIUM**
- **Location**: `app/api/camera-proxy/route.ts` Line 24
- **Issue**: `const password = process.env.DMSS_PASSWORD || '******'`
- **Fix**: Remove fallback, fail if env var not set

---

## 📝 **HARDCODED DATA STRUCTURES** (Similar to Navigation)

### 4. **Module Route Definitions** ⚠️ **Should Be Database-Driven**

**Locations**:
- `lib/modules/wms.ts` - 78 hardcoded routes
- `lib/modules/iso-ims.ts` - 12 hardcoded routes
- `lib/modules/tms.ts` - Multiple routes
- `lib/modules/proposals-rfq.ts` - Multiple routes
- `lib/modules/qhse.ts` - Multiple routes
- `lib/modules/compliance.ts` - Multiple routes
- `lib/modules/trade-compliance.ts` - Multiple routes
- `lib/modules/process-lifecycle.ts` - Multiple routes
- `lib/modules/facility-management.ts` - Multiple routes
- `lib/modules/marketplace.ts` - Multiple routes
- `lib/modules/warehouse-network.ts` - Multiple routes
- `lib/modules/maas.ts` - Multiple routes

**Issue**: All module routes are hardcoded in module definition files
**Impact**: Cannot customize routes per tenant/customer
**Recommendation**: Move to database, similar to navigation

---

### 5. **Route-to-Module Mapping** ⚠️ **Should Be Database-Driven**

**Location**: `utils/navigationPermissions.ts` Lines 101-116

**Issue**:
```typescript
const routeMap: Record<string, { moduleId?: ModuleId; featureId?: FeatureId }> = {
  '/inbound': { moduleId: 'wms', featureId: 'wms.inbound' },
  '/outbound': { moduleId: 'wms', featureId: 'wms.outbound' },
  '/inventory': { moduleId: 'wms', featureId: 'wms.inventory' },
  // ... only 15 routes mapped (incomplete!)
}
```

**Problem**: 
- Only 15 routes mapped (out of 271+ routes!)
- Missing most routes
- Hardcoded in code
- Should be in database or auto-generated from module definitions

**Recommendation**: 
- Auto-generate from module definitions
- Or move to database
- Or merge with navigation service

---

### 6. **Export Templates** ⚠️ **Should Be Database-Driven**

**Location**: `lib/services/export/exportService.ts` Lines 528-572

**Issue**: Hardcoded export templates:
```typescript
const defaultTemplates: ExportTemplate[] = [
  {
    id: 'inventory-report',
    name: 'Inventory Report',
    // ... hardcoded template
  },
  {
    id: 'order-summary',
    name: 'Order Summary',
    // ... hardcoded template
  },
]
```

**Impact**: Cannot customize export templates per tenant
**Recommendation**: Move to database

---

### 7. **Brand Messaging Templates** ⚠️ **Should Be Database-Driven**

**Location**: `lib/services/brand-messaging/brandMessagingService.ts` Lines 63-200+

**Issue**: Hardcoded message templates:
```typescript
const MESSAGE_TEMPLATES: Record<MessagingType, MessagingTemplate[]> = {
  module_header: [...],
  empty_state: [...],
  loading_state: [...],
  // ... many more hardcoded templates
}
```

**Also**: Hardcoded brand voice definition (Lines 24-57)
```typescript
const BLUEDXP_BRAND_VOICE: BrandVoice = {
  principles: [...],
  philosophy: [...],
  // ... hardcoded brand voice
}
```

**Impact**: Cannot customize messaging per tenant/customer
**Recommendation**: Move to database

---

## ⚙️ **HARDCODED CONFIGURATION DEFAULTS**

### 8. **System Parameters Defaults** ⚠️ **Should Be Database-Driven**

**Location**: `app/settings/parameters/page.tsx` Lines 35-41

**Issue**: Hardcoded default values:
```typescript
{ key: 'INVENTORY_REORDER_POINT', defaultValue: 100 },
{ key: 'WAREHOUSE_CAPACITY_THRESHOLD', defaultValue: 80 },
{ key: 'INTEGRATION_RETRY_COUNT', defaultValue: 3 },
{ key: 'SECURITY_SESSION_TIMEOUT', defaultValue: 30 },
{ key: 'SYSTEM_TIMEZONE', defaultValue: 'Asia/Dubai' },
```

**Impact**: Cannot customize per tenant
**Recommendation**: Store in database

---

### 9. **Truck/Container Specifications** ⚠️ **Should Be Database-Driven**

**Location**: `utils/loadSetupCalculator.ts` Lines 4-47

**Issue**: Hardcoded truck/container specs:
```typescript
const TRUCK_SPECS = {
  '20ft Container': { capacity: 28000, volume: 33.2, ... },
  '40ft Container': { capacity: 28000, volume: 67.7, ... },
  'Flatbed Truck': { capacity: 25000, volume: 50, ... },
  // ... 6 more hardcoded specs
}
```

**Impact**: Cannot customize per customer/tenant
**Recommendation**: Move to database

---

### 10. **Maintenance Intervals** ⚠️ **Should Be Database-Driven**

**Location**: `lib/services/ml/predictive-maintenance.ts` Lines 101-142

**Issue**: Hardcoded maintenance intervals:
```typescript
private maintenanceIntervals: Record<string, Record<string, number>> = {
  'pump': { inspection: 30, preventive: 90, overhaul: 365 },
  'valve': { inspection: 45, preventive: 180, overhaul: 730 },
  'compressor': { inspection: 14, preventive: 60, overhaul: 365 },
  // ... 5 more equipment types
}
```

**Impact**: Cannot customize per equipment type/tenant
**Recommendation**: Move to database

---

### 11. **Knowledge Base Defaults** ⚠️ **Should Be Database-Driven**

**Location**: `lib/services/knowledge-base/index.ts` Lines 425-460

**Issue**: Hardcoded defaults:
```typescript
function getDefaultTenantConfig(tenantId: string): TenantKnowledgeConfig {
  return {
    dataRetentionDays: 365,
    learningThreshold: 70,
    maxEntries: 10000,
    maxStorageBytes: 100 * 1024 * 1024, // 100MB
    // ... more hardcoded defaults
  }
}
```

**Impact**: Cannot customize per tenant
**Recommendation**: Store in database

---

### 12. **AI Configuration Defaults** ⚠️ **Should Be Database-Driven**

**Location**: `utils/aiClient.ts` Lines 45-50

**Issue**: Hardcoded AI defaults:
```typescript
const DEFAULT_CONFIG: AIConfig = {
  provider: 'auto',
  temperature: 0.7,
  maxTokens: 2000,
  stream: false,
}
```

**Impact**: Cannot customize per tenant/user
**Recommendation**: Store in database

---

### 13. **Module Configuration Defaults** ⚠️ **Should Be Database-Driven**

**Locations**: Multiple module definition files

**Examples**:
- `lib/modules/tms.ts` Lines 68-110: Hardcoded integration settings, customs settings, tracking settings
- `lib/modules/proposals-rfq.ts`: Hardcoded proposal defaults
- `lib/modules/qhse.ts`: Hardcoded QHSE defaults

**Impact**: Cannot customize per tenant
**Recommendation**: Move config to database

---

## 🔧 **HARDCODED URLS & ENDPOINTS**

### 14. **WebSocket URL** ⚠️ **Should Use Environment Variable**

**Location**: `lib/services/realtime/websocketService.ts`
**Issue**: `'ws://localhost:3002/api/realtime'` hardcoded
**Fix**: Use `process.env.WEBSOCKET_URL` with no fallback

---

### 15. **API Base URLs** ⚠️ **Should Be Configurable**

**Locations**:
- `lib/adapters/transportation/erp/ZohoAdapter.ts`: `'https://www.zohoapis.com'`
- `lib/adapters/rabet/index.ts`: `'https://api.rabet.sa'`
- `lib/services/msds-sku-linking/customerApprovalService.ts`: `process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'`

**Status**: Public APIs (acceptable) but should be configurable for testing

---

### 16. **Database Type Fallbacks** ⚠️ **Should Fail Fast**

**Locations**: Multiple files
- `lib/services/load-design/database/loadPlanDatabaseAdapter.ts`: `process.env.DATABASE_TYPE || 'postgresql'` (6 instances)
- `lib/services/chemical/msdsDatabaseAdapter.ts`: `process.env.DATABASE_TYPE || 'postgresql'` (4 instances)

**Issue**: Should fail if env var not set, not default
**Fix**: Remove fallback, require env var

---

### 17. **RabbitMQ URL Fallback** ⚠️ **Should Fail Fast**

**Location**: `lib/services/event-bus/index.ts` Line 78
**Issue**: `process.env.RABBITMQ_URL || 'amqp://localhost'`
**Fix**: Remove fallback, require env var

---

## 📊 **PRIORITY SUMMARY**

### **🔴 CRITICAL** (Must Fix Immediately):
1. Hardcoded password (`Bashir@2025`)
2. Hardcoded email fallback

### **🟡 HIGH** (Should Fix Soon):
3. Route-to-module mapping (incomplete, only 15/271+ routes)
4. Module route definitions (hardcoded in 12+ module files)
5. Export templates
6. Brand messaging templates
7. System parameters defaults

### **🟢 MEDIUM** (Consider Fixing):
8. Truck/container specifications
9. Maintenance intervals
10. Knowledge base defaults
11. AI configuration defaults
12. Module configuration defaults
13. WebSocket URL
14. Database type fallbacks
15. RabbitMQ URL fallback

---

## ✅ **RECOMMENDED ACTIONS**

### **Immediate (Critical)**:
1. 🔴 Fix hardcoded password (remove fallback)
2. 🔴 Fix hardcoded email (remove fallback)
3. 🔴 Fix camera password (remove fallback)

### **High Priority**:
4. 🟡 **Route-to-Module Mapping**: Auto-generate from module definitions or move to database
5. 🟡 **Module Routes**: Consider database-driven approach (similar to navigation)
6. 🟡 **Export Templates**: Move to database
7. 🟡 **Brand Messaging Templates**: Move to database

### **Medium Priority**:
8. 🟢 **System Parameters**: Already in database, but defaults should be configurable
9. 🟢 **Business Logic Defaults**: Move to database for tenant customization
10. 🟢 **URL Fallbacks**: Remove fallbacks, require environment variables

---

## 📝 **Notes**

- **Navigation**: ✅ **FIXED** - Now database-driven with fallback
- **Similar Patterns**: Many other structures follow same pattern (hardcoded arrays/objects)
- **Recommendation**: Consider creating a **Configuration Service** to manage all defaults centrally
- **Database Schema**: Can extend navigation_items table or create similar tables for other configs

---

**Status**: ⚠️ **15+ additional hardcoded structures found**

**Date**: 2025-01-27









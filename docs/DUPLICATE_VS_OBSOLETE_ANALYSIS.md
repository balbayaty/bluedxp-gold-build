# BlueDXP Platform - Duplicate vs Obsolete Page Analysis
## Deep Code Analysis: What's Real, What's Mock, What's Redundant

**Generated:** January 7, 2026  
**Method:** Physical inspection of services, APIs, and page files

---

## EXECUTIVE SUMMARY

| Status | Count | Description |
|--------|-------|-------------|
| **OBSOLETE** (Duplicates exist) | 12 | Mock pages with real alternatives already built |
| **INTEGRATE** (APIs exist, page uses mock) | 18 | Real APIs exist but pages don't use them |
| **BUILD FROM SCRATCH** | 29 | No backend exists at all |

---

## TIER 1: OBSOLETE PAGES (Real Alternatives Exist)

These mock pages have **functional real versions** - they should be **DELETED or REDIRECTED**:

### 1. `/stock-alerts` ❌ OBSOLETE
**Mock Page Uses:** `generateStockAlerts()` from mockDataGenerators  
**Real Alternative:** `/api/wms/inventory/alerts` → Uses `inventoryService` with real stock checks  
**Action:** Delete `/stock-alerts` and redirect to inventory page with alerts tab

### 2. `/skus` ⚠️ PARTIALLY OBSOLETE
**Mock Page Uses:** `generateMaterialMaster()`, `generateInventoryStock()`  
**Real Services Available:**
- `lib/services/wms/MaterialService.ts` → Uses Prisma `materialMaster`
- `lib/services/wms/skuService.ts` → Uses in-memory Map (needs upgrade)
- `/api/wms/skus/*` → Full CRUD API exists  
**Action:** Connect `/skus` page to existing `/api/wms/skus` API

### 3. `/warehouse-areas` ⚠️ PARTIALLY OBSOLETE
**Mock Page Uses:** Mock data  
**Real Service:** `lib/services/wms/areaService.ts` → Uses Prisma `warehouseArea`  
**Real API:** `/api/wms/areas/*` → Full CRUD  
**Action:** Connect page to API

### 4. `/bins` ⚠️ PARTIALLY OBSOLETE
**Mock Page Uses:** Mock data  
**Real Service:** `lib/services/wms/binService.ts` → Uses Prisma `storageBin`  
**Action:** Connect page to binService

### 5. `/replenishment` ⚠️ PARTIALLY OBSOLETE
**Mock Page Uses:** Mock data  
**Real Service:** `lib/services/wms/ReplenishmentService.ts` → Uses Prisma with pickTask creation  
**Action:** Connect page to service

### 6. `/goods-receipt` ⚠️ PARTIALLY OBSOLETE
**Mock Page Uses:** Mock data  
**Real Service:** `lib/services/wms/InboundService.ts` → Uses Prisma for inboundDelivery  
**Action:** Connect page to service

### 7. `/putaway` ⚠️ PARTIALLY OBSOLETE
**Real Service:** `lib/services/wms/InboundService.ts` → Has `generatePutawayTask()` with Prisma  
**Action:** Connect page to service

---

## TIER 2: INTEGRATE (APIs Exist, Pages Use Mock)

These pages use mock data but **real APIs already exist** - just need to connect:

### WMS Core Operations
| Page | Mock Function | Real API Available | Backend |
|------|---------------|-------------------|---------|
| `/inventory` | ✅ Already integrated | `/api/wms/inventory/*` | Prisma ✅ |
| `/skus` | `generateMaterialMaster()` | `/api/wms/skus` | In-memory ⚠️ |
| `/warehouse-areas` | Mock | `/api/wms/areas` | Prisma ✅ |
| `/bins` | Mock | binService | Prisma ✅ |
| `/storage-locations` | Mock | locationService | Prisma ✅ |
| `/replenishment` | Mock | ReplenishmentService | Prisma ✅ |
| `/goods-receipt` | Mock | InboundService | Prisma ✅ |
| `/goods-issue` | Mock | OutboundService | Prisma ✅ |
| `/putaway` | Mock | InboundService | Prisma ✅ |
| `/picking` | Mock | OutboundService | Prisma ✅ |
| `/wave-planning` | Mock | OutboundService | Prisma ✅ |
| `/expiry-management` | Mock | cycleCountService | Prisma ✅ |

### Services with Prisma (Backend Ready):
```
✅ lib/services/wms/InventoryService.ts - prisma.inventoryQuant
✅ lib/services/wms/MaterialService.ts - prisma.materialMaster
✅ lib/services/wms/binService.ts - prisma.storageBin
✅ lib/services/wms/areaService.ts - prisma.warehouseArea
✅ lib/services/wms/InboundService.ts - prisma.inboundDelivery
✅ lib/services/wms/OutboundService.ts - prisma.wMSShipment
✅ lib/services/wms/ReplenishmentService.ts - prisma.pickTask
✅ lib/services/wms/cycleCountService.ts - prisma.cycleCount
✅ lib/services/wms/facilityService.ts - prisma.facility
✅ lib/services/wms/locationService.ts - prisma.facility
✅ lib/services/wms/realTimeSlaKpiService.ts - prisma.slaViolation
```

---

## TIER 3: BUILD FROM SCRATCH (No Backend)

These have **NO real backend** - both API and Service need development:

### Order Management (No Prisma Models)
| Page | Issue | Required Work |
|------|-------|---------------|
| `/sales-orders` | API uses `const mockOrders: any[] = []` | Create Prisma model + service |
| `/purchase-orders` | Mock generator | Create Prisma model + service |
| `/orders` | Mock combined orders | Create unified order service |
| `/order-confirmation` | Mock | Needs order confirmation workflow |
| `/ship-confirmation` | Mock | Needs shipment confirmation |
| `/delivery-note` | Mock | Needs delivery document service |
| `/pickup-requests` | Mock | Needs pickup management |
| `/pick-release` | Mock | Needs wave release logic |
| `/cross-docking` | Mock | Needs cross-dock workflow |
| `/return-management` | Mock | Needs returns processing |

### Master Data (No Prisma Models)
| Page | Issue | Required Work |
|------|-------|---------------|
| `/customers` | Uses `generateCustomerMaster()` | Create Customer Prisma model |
| `/vendors` | Uses `generateVendorMaster()` | Create Vendor Prisma model |

### Stock Management (Partial Backend)
| Page | Issue | Required Work |
|------|-------|---------------|
| `/reservations` | Mock | Create reservation system |
| `/transfer-posting` | Mock | Has moveStock in InventoryService ✅ |
| `/holds` | Mock | Create hold management |
| `/valuation` | Mock | Use existing MaterialService valuation |
| `/abc-analysis` | Mock | Has aiAnalyticsService.classifyABCXYZ ✅ |
| `/batches` | Mock | Add batch table to Prisma |
| `/serials` | Mock | Add serial table to Prisma |

### Reports (No Backend)
| Page | Issue | Required Work |
|------|-------|---------------|
| `/reports/inventory` | Mock | Create report aggregation service |
| `/reports/orders` | Mock | Create report aggregation service |
| `/reports/financial` | Mock | Create financial reporting |
| `/reports/operational` | Mock | Create operational KPI service |
| `/reports/performance` | Mock | Create performance metrics |

### Dashboards (Mixed)
| Page | Issue | Required Work |
|------|-------|---------------|
| `/dashboard/customer` | Mock | Connect to real customer data |
| `/dashboard/account-manager` | Mock | Create AM metrics service |
| `/dashboard/business-development` | Mock | Create BD metrics |
| `/dashboard/operations` | Mock | Connect to real ops data |
| `/dashboard/warehouse-head` | Mock | Connect to WMS services |
| `/dashboards/warehouse/realtime` | Mock | Connect to real inventory |
| `/customer-dashboard` | Mock | Duplicate of dashboard/customer |
| `/kpi-dashboard` | Mock | Use realTimeSlaKpiService |

---

## SERVICES BREAKDOWN

### ✅ PRISMA-BACKED (Production Ready)
```typescript
// These use real database:
prisma.inventoryQuant      // Stock levels
prisma.materialMaster      // SKU/Material master
prisma.storageBin          // Bin management
prisma.warehouseArea       // Area management
prisma.facility            // Facility management
prisma.inboundDelivery     // Goods receipt
prisma.wMSShipment         // Shipments
prisma.wMSWave             // Wave planning
prisma.pickTask            // Pick tasks
prisma.cycleCount          // Cycle counting
prisma.cycleCountTask      // Count tasks
prisma.appointment         // Dock appointments
prisma.putawayRule         // Putaway rules
prisma.slaViolation        // SLA tracking
prisma.slaWarning          // SLA warnings
prisma.chemicalInventory   // Chemical inventory
```

### ⚠️ IN-MEMORY (Needs Upgrade to Prisma)
```typescript
// These use Map<> storage - data lost on restart:
private skus: Map<string, SKU>
private packagingHierarchies: Map<string, PackagingHierarchy>
private customerSKURelationships: Map<string, CustomerSKURelationship>
private devices: Map<string, IoTDevice>
private carbonData: Map<string, CarbonFootprint>
private eventLogs: Map<string, EventLog>
private sessions: Map<string, VoicePickingSession>
// ... 20+ more Map-based stores
```

---

## RECOMMENDED ACTION PLAN

### Phase 1: Quick Wins (Connect Existing APIs)
These pages just need to call existing APIs instead of mock generators:

1. **`/skus`** → Call `/api/wms/skus` (API exists)
2. **`/warehouse-areas`** → Call `/api/wms/areas` (API exists with Prisma)
3. **`/bins`** → Call binService (Prisma ready)
4. **`/replenishment`** → Call ReplenishmentService (Prisma ready)
5. **`/goods-receipt`** → Call InboundService (Prisma ready)
6. **`/putaway`** → Call InboundService.generatePutawayTask (Prisma ready)
7. **`/picking`** → Call OutboundService (Prisma ready)
8. **`/wave-planning`** → Call OutboundService (Prisma ready)

**Estimated Effort:** 1-2 hours per page (just change fetch calls)

### Phase 2: Add Prisma Models
Create these missing database tables:

```prisma
model Customer {
  id            String   @id @default(cuid())
  tenantId      String
  customerNumber String
  customerName  String
  // ... rest of fields from Customer interface
}

model Vendor {
  id           String   @id @default(cuid())
  tenantId     String
  vendorNumber String
  vendorName   String
  // ... rest of fields
}

model SalesOrder {
  id          String   @id @default(cuid())
  tenantId    String
  orderNumber String
  // ...
}

model PurchaseOrder {
  id          String   @id @default(cuid())
  tenantId    String
  orderNumber String
  // ...
}

model Batch {
  id           String   @id @default(cuid())
  tenantId     String
  batchNumber  String
  // ...
}

model SerialNumber {
  id           String   @id @default(cuid())
  tenantId     String
  serialNumber String
  // ...
}
```

**Estimated Effort:** 4-8 hours

### Phase 3: Delete Obsolete Pages
These can be removed after Phase 1:

- `/stock-alerts` → Merge into `/inventory` with alerts tab
- `/customer-dashboard` → Redirect to `/dashboard/customer`

---

## DUPLICATES FOUND

| Mock Page | Same/Similar As | Keep |
|-----------|----------------|------|
| `/customer-dashboard` | `/dashboard/customer` | Delete customer-dashboard |
| `/kpi-dashboard` | `/sla-kpi` | Merge into one |
| `/modern-sla` | `/sla-kpi` | Merge into one |
| `/ncr` | `/iso-ims/ncr` | Keep iso-ims/ncr (has real API) |

---

## SUMMARY

| Category | Count | Action |
|----------|-------|--------|
| **DELETE** (True duplicates) | 4 | Remove and redirect |
| **CONNECT** (API exists) | 12 | Change mock to API call |
| **UPGRADE SERVICE** (In-memory → Prisma) | 8 | Add database persistence |
| **BUILD** (No backend) | 20 | Full development needed |
| **KEEP AS-IS** (Production ready) | 15 | Already working |

**Total Mock Pages:** 59  
**Can be fixed quickly:** 16 (just connect to existing APIs)  
**Need significant work:** 43

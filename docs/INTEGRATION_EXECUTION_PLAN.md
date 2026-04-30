# 🚀 Integration Execution Plan
## Step-by-Step Implementation Guide

**Generated:** 2026-01-08  
**Status:** Ready for Execution

---

## ✅ PHASE 1: Connect 12 Pages (Quick Wins)

### 1. Purchase Orders ✅ IN PROGRESS
- **File:** `app/purchase-orders/page.tsx`
- **Current:** Uses `generatePurchaseOrders(60)` mock data
- **API:** `/api/wms/purchase-orders` (Prisma-backed, exists)
- **Action:**
  1. Replace `useState(() => generatePurchaseOrders(60))` with API fetch
  2. Add `useEffect` to fetch from `/api/wms/purchase-orders`
  3. Add loading/error states
  4. Map API response to component's `PurchaseOrder` interface
  5. Update create/update/approve actions to call API

### 2. Goods Receipt
- **File:** `app/goods-receipt/page.tsx`
- **Current:** Uses `generatePurchaseOrders(50)` for mock data
- **API:** `/api/wms/goods-receipt` (exists, Prisma-backed)
- **Action:**
  1. Replace mock data with API fetch
  2. Connect to `InboundService` methods
  3. Add loading/error states

### 3. Goods Issue
- **File:** `app/goods-issue/page.tsx`
- **Current:** Uses mock data
- **Service:** `OutboundService.ts` (Prisma-backed)
- **Action:**
  1. Create API route `/api/wms/goods-issue` if missing
  2. Connect page to API
  3. Use `OutboundService` methods

### 4. Putaway
- **File:** `app/putaway/page.tsx`
- **Current:** Uses mock data generators
- **API:** `/api/wms/putaway` (exists)
- **Action:**
  1. Replace mock data with API fetch
  2. Connect to `InboundService.generatePutawayTask()`

### 5. Picking
- **File:** `app/picking/page.tsx`
- **Current:** Uses mock data
- **API:** `/api/wms/picking` (exists)
- **Action:**
  1. Replace mock data with API fetch
  2. Connect to `OutboundService`

### 6. Replenishment
- **File:** `app/replenishment/page.tsx`
- **Current:** Uses mock data
- **API:** `/api/wms/replenishment` (exists)
- **Action:**
  1. Replace mock data with API fetch
  2. Connect to `ReplenishmentService`

### 7. Wave Planning
- **File:** `app/wave-planning/page.tsx`
- **Current:** Uses mock data
- **Service:** `OutboundService.createWave()` (exists)
- **Action:**
  1. Create API route `/api/wms/waves`
  2. Connect page to API
  3. Use `OutboundService.createWave()`

### 8. Storage Locations
- **File:** `app/storage-locations/page.tsx`
- **Current:** Uses mock data
- **API:** `/api/wms/locations` (exists)
- **Action:**
  1. Replace mock data with API fetch

### 9. Expiry Management
- **File:** `app/expiry-management/page.tsx`
- **Current:** Uses mock data
- **API:** `/api/wms/inventory/cycle-count` (exists)
- **Action:**
  1. Replace mock data with API fetch
  2. Extend for expiry-specific features

### 10. Transfer Posting
- **File:** `app/transfer-posting/page.tsx`
- **Current:** Uses mock data
- **Service:** `InventoryService.moveStock()` (exists)
- **Action:**
  1. Create API route `/api/wms/inventory/transfer`
  2. Connect page to API

### 11. Valuation
- **File:** `app/valuation/page.tsx`
- **Current:** Uses mock data
- **Service:** `MaterialService` valuation methods (exists)
- **Action:**
  1. Create API route `/api/wms/materials/valuation`
  2. Connect page to API

### 12. ABC Analysis
- **File:** `app/abc-analysis/page.tsx`
- **Current:** Uses mock data
- **Service:** `aiAnalyticsService.classifyABCXYZ()` (exists)
- **Action:**
  1. Create API route `/api/wms/ai-analytics/abc-classification`
  2. Connect page to API

---

## 🔄 PHASE 2: Update Navigation Links (Proper Redirects)

### Pages to Update in Navigation:

1. **`/ncr`** → Change to `/ncr-management`
   - **File:** `lib/services/navigation/defaultNavigation.ts`
   - **Line:** ~4138
   - **Action:** Change `href: "/ncr"` to `href: "/ncr-management"`

2. **`/users`** → Change to `/settings/users`
   - **File:** `lib/services/navigation/defaultNavigation.ts`
   - **Line:** ~3618
   - **Action:** Change `href: "/users"` to `href: "/settings/users"`

3. **`/stock-alerts`** → Change to `/inventory?view=alerts`
   - **File:** `lib/services/navigation/defaultNavigation.ts`
   - **Line:** ~528
   - **Action:** Change `href: "/stock-alerts"` to `href: "/inventory?view=alerts"`

4. **`/customer-dashboard`** → Change to `/dashboard/customer`
   - **File:** `lib/services/navigation/defaultNavigation.ts`
   - **Line:** ~1681
   - **Action:** Change `href: "/customer-dashboard"` to `href: "/dashboard/customer"`

5. **`/kpi-dashboard`** → Change to `/sla-kpi`
   - **File:** `lib/services/navigation/defaultNavigation.ts`
   - **Line:** ~1939
   - **Action:** Change `href: "/kpi-dashboard"` to `href: "/sla-kpi"`

6. **`/modern-sla`** → Change to `/sla-kpi`
   - **File:** `lib/services/navigation/defaultNavigation.ts`
   - **Line:** ~1958
   - **Action:** Change `href: "/modern-sla"` to `href: "/sla-kpi"`

**Note:** These are proper link changes, not redirects. Navigation will point directly to upgraded versions.

---

## 🔧 PHASE 3: Create Services for Critical Pages

### Deep Check Results:

✅ **Sales Orders** - API EXISTS!
- **Finding:** `/api/wms/sales-orders/route.ts` already exists (Prisma-backed)
- **Action:** Just connect the page to API (same as purchase-orders)

❌ **Order Confirmation** - NO SERVICE
- **Action:** Create workflow service
- **Estimated:** 6 hours

❌ **Ship Confirmation** - PARTIAL
- **Finding:** `OutboundService` has shipment management
- **Action:** Extend `OutboundService` with confirmation methods
- **Estimated:** 4 hours

❌ **Return Management** - NO SERVICE
- **Action:** Create returns processing service
- **Estimated:** 8 hours

❌ **Reservations** - NO SERVICE
- **Action:** Create reservation service
- **Estimated:** 6 hours

❌ **Holds** - NO SERVICE
- **Action:** Create hold management service
- **Estimated:** 4 hours

❌ **Batches** - NO SERVICE
- **Action:** 
  1. Check if Prisma model exists (may need to add)
  2. Create batch service
  3. Create API
- **Estimated:** 6 hours

❌ **Serials** - NO SERVICE
- **Action:**
  1. Check if Prisma model exists (may need to add)
  2. Create serial service
  3. Create API
- **Estimated:** 6 hours

---

## 📋 EXECUTION CHECKLIST

### Phase 1: Connect Pages (12 pages)
- [ ] Purchase Orders - Connect to `/api/wms/purchase-orders`
- [ ] Goods Receipt - Connect to `/api/wms/goods-receipt`
- [ ] Goods Issue - Create API, connect
- [ ] Putaway - Connect to `/api/wms/putaway`
- [ ] Picking - Connect to `/api/wms/picking`
- [ ] Replenishment - Connect to `/api/wms/replenishment`
- [ ] Wave Planning - Create API, connect
- [ ] Storage Locations - Connect to `/api/wms/locations`
- [ ] Expiry Management - Connect to `/api/wms/inventory/cycle-count`
- [ ] Transfer Posting - Create API, connect
- [ ] Valuation - Create API, connect
- [ ] ABC Analysis - Create API, connect

### Phase 2: Update Navigation (6 links)
- [ ] `/ncr` → `/ncr-management`
- [ ] `/users` → `/settings/users`
- [ ] `/stock-alerts` → `/inventory?view=alerts`
- [ ] `/customer-dashboard` → `/dashboard/customer`
- [ ] `/kpi-dashboard` → `/sla-kpi`
- [ ] `/modern-sla` → `/sla-kpi`

### Phase 3: Create Services (8 pages)
- [ ] Sales Orders - Connect to existing API
- [ ] Order Confirmation - Create workflow service
- [ ] Ship Confirmation - Extend OutboundService
- [ ] Return Management - Create service
- [ ] Reservations - Create service
- [ ] Holds - Create service
- [ ] Batches - Create Prisma model + service
- [ ] Serials - Create Prisma model + service

---

## 🎯 NEXT STEPS

1. **Start Phase 1** - Connect 12 pages to APIs
2. **Complete Phase 2** - Update navigation links
3. **Complete Phase 3** - Create missing services
4. **Run Placeholder Cleanup** - Use prompt in separate session

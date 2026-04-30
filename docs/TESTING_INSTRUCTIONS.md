# 🧪 Testing Instructions
## For Connected Pages

**Date:** 2026-01-08

---

## ✅ PAGES READY FOR TESTING

### 1. Purchase Orders (`/purchase-orders`)
**Status:** ✅ Connected to `/api/wms/purchase-orders`

**Test Steps:**
1. Navigate to `/purchase-orders`
2. Verify page loads without errors
3. Check loading state appears briefly
4. Verify purchase orders display (may be empty if no data in DB)
5. Test approve action (if order selected)
6. Check error handling (if API fails)

**Expected Behavior:**
- Page shows loading spinner initially
- Data loads from API
- If no data: Shows empty state or "No purchase orders"
- If error: Shows error message
- Approve button calls API and updates order status

---

### 2. Goods Receipt (`/goods-receipt`)
**Status:** ✅ Connected to `/api/wms/goods-receipt`

**Test Steps:**
1. Navigate to `/goods-receipt`
2. Verify page loads without errors
3. Check loading state appears briefly
4. Verify goods receipt documents display
5. Check ASN matches section
6. Test view GR modal
7. Check error handling

**Expected Behavior:**
- Page shows loading spinner initially
- Data loads from API
- GR documents display correctly
- ASN matches derived from GR documents
- Modals work correctly

---

## 🔧 PAGES TO CONNECT (Remaining 10)

### 3. Putaway (`/putaway`)
- **API:** `/api/wms/putaway` (exists)
- **Status:** ⏳ Ready to connect

### 4. Picking (`/picking`)
- **API:** `/api/wms/picking` (exists)
- **Status:** ⏳ Ready to connect

### 5. Replenishment (`/replenishment`)
- **API:** `/api/wms/replenishment` (exists)
- **Status:** ⏳ Ready to connect

### 6. Storage Locations (`/storage-locations`)
- **API:** `/api/wms/locations` (exists)
- **Status:** ⏳ Ready to connect

### 7. Expiry Management (`/expiry-management`)
- **API:** `/api/wms/inventory/cycle-count` (exists)
- **Status:** ⏳ Ready to connect

### 8. Goods Issue (`/goods-issue`)
- **Service:** `OutboundService` (exists)
- **Status:** ⏳ Need to create API

### 9. Wave Planning (`/wave-planning`)
- **Service:** `OutboundService.createWave()` (exists)
- **Status:** ⏳ Need to create API

### 10. Transfer Posting (`/transfer-posting`)
- **Service:** `InventoryService.moveStock()` (exists)
- **Status:** ⏳ Need to create API

### 11. Valuation (`/valuation`)
- **Service:** `MaterialService` valuation (exists)
- **Status:** ⏳ Need to create API

### 12. ABC Analysis (`/abc-analysis`)
- **Service:** `aiAnalyticsService.classifyABCXYZ()` (exists)
- **Status:** ⏳ Need to create API

---

## 📋 TESTING CHECKLIST

### For Each Connected Page:
- [ ] Page loads without TypeScript errors
- [ ] Page loads without runtime errors
- [ ] Loading state shows during API fetch
- [ ] Data displays correctly (or empty state)
- [ ] Error handling works (if API fails)
- [ ] Actions (create/update/delete) work
- [ ] Navigation works
- [ ] Real-time updates work (if applicable)

---

## 🚀 QUICK TEST COMMAND

```bash
# Start dev server
npm run dev

# Test pages:
# 1. http://localhost:3000/purchase-orders
# 2. http://localhost:3000/goods-receipt
```

---

## ⚠️ COMMON ISSUES

1. **Empty Data:** If pages show empty, check:
   - Database has data
   - API returns data
   - Mapping is correct

2. **Type Errors:** Check:
   - API response matches component interface
   - Mapping handles all fields

3. **Loading Forever:** Check:
   - API endpoint exists
   - API returns success response
   - Error handling works

---

**Ready to test! Start with Purchase Orders and Goods Receipt.**

# 🎯 Mock Data Initialization Guide
## For MSDS Warehouse Assignment Recommendations

---

## 🚀 **QUICK START**

### **Option 1: Auto-Initialization (Recommended)**
The mock data will **automatically initialize** when you:
1. Navigate to MSDS module
2. View any MSDS document
3. The WarehouseRecommendations component will auto-initialize

### **Option 2: Manual Initialization**
```bash
POST /api/warehouse/initialize-mock-data
```

**Response:**
```json
{
  "success": true,
  "data": {
    "warehouses": 15,
    "areas": 75,
    "standaloneAreas": 10,
    "crossModuleAreas": 6,
    "total": 106
  }
}
```

---

## 📊 **WHAT GETS CREATED**

### **15 Warehouses**
- Locations across Saudi Arabia (Riyadh, Jeddah, Dammam, etc.)
- Different types (DEDICATED, SHARED, MULTI_TENANT)
- Full capacity and utilization data
- Certifications and compliance standards

### **75+ Warehouse Areas**
- 3-8 areas per warehouse
- Various zones (Zone A, Zone B, Cold Storage, etc.)
- Hazard class assignments (1-5 classes per area)
- Capacity: 500-5000 units
- Utilization: 30-70%

### **10 Standalone Areas**
- Not linked to warehouses
- Can be used independently
- Various types and zones

### **6 Cross-Module Areas**
- 2 linked to TMS
- 2 linked to QHSE
- 1 linked to ISO-IMS
- 1 linked to Facility Management

---

## 🔍 **HOW TO VERIFY**

### **1. Check Mock Data Status**
```bash
GET /api/warehouse/initialize-mock-data
```

### **2. Check Areas**
```bash
GET /api/wms/areas
```

### **3. Check Standalone Areas**
```bash
GET /api/wms/areas?standalone=true
```

### **4. Check Cross-Module Areas**
```bash
GET /api/wms/areas?linkedModuleId=tms
```

---

## ✅ **INTEGRATION WITH MSDS**

### **In MSDS Module:**
1. Open any MSDS document
2. Scroll to "Warehouse Assignment Recommendations"
3. You'll see:
   - ✅ Warehouse recommendations
   - ✅ Areas within each warehouse
   - ✅ Recommended area (best match)
   - ✅ Area match scores

### **What's Displayed:**
- Warehouse match scores
- Compliance scores
- Space availability
- **Available areas** (NEW)
- **Recommended area** (NEW)
- **Area match scores** (NEW)

---

## 🎯 **TESTING**

### **Test Scenario 1: Hazard Class Matching**
1. MSDS with "Class 3" hazard
2. System finds warehouses with areas allowing Class 3
3. Recommends best matching area

### **Test Scenario 2: Temperature Requirements**
1. MSDS requiring temperature control
2. System finds areas with temperature restrictions
3. Recommends temperature-controlled areas

### **Test Scenario 3: Capacity Requirements**
1. MSDS with quantity/volume
2. System checks area capacity
3. Recommends areas with available space

---

## ✅ **STATUS: READY**

**Everything is:**
- ✅ Created and integrated
- ✅ Auto-initializes on MSDS load
- ✅ Displays in MSDS module
- ✅ Fully functional
- ✅ Connected properly

**Just navigate to MSDS module and test!** 🎉












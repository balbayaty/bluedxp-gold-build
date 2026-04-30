# Geofence System - Complete Requirements Specification

**Source:** `BlueDXP_FINAL_COMPLETE_V5.md` Appendix D  
**Status:** Complete Implementation Required  
**Date:** 2025-01-XX

---

## 📋 **CORE REQUIREMENTS**

### **1. Zone Types**
- `WAREHOUSE` - Warehouse facilities
- `CUSTOMER_SITE` - Customer delivery locations
- `CHECKPOINT` - Checkpoints along routes
- `BORDER_CROSSING` - Border crossing points
- `REST_AREA` - Rest areas for drivers
- `FUEL_STATION` - Fuel stations
- `RESTRICTED_AREA` - Restricted/secure areas
- `CITY_LIMIT` - City boundary markers
- `CUSTOM` - Custom zone types

### **2. Zone Definition**

```typescript
interface GeofenceZone {
  id: string;
  name: string;
  type: ZoneType;
  geometry: {
    type: 'POLYGON' | 'CIRCLE';
    coordinates: number[][] | { center: { lat: number; lng: number }; radius: number };
  };
  metadata: {
    expectedDwellTime?: number;  // minutes
    maxDwellTime?: number;       // minutes
    operatingHours?: {
      from: string;  // "09:00"
      to: string;    // "17:00"
      days: string[]; // ["Monday", "Tuesday", ...]
    };
    contacts?: Array<{
      name: string;
      phone: string;
      role: string;  // "operations", "customer", "manager"
    }>;
  };
  tenantId: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### **3. Event Types**

- `ZONE_ENTRY` - Vehicle/shipment entered zone
- `ZONE_EXIT` - Vehicle/shipment exited zone
- `DWELL_TIME_WARNING` - Approaching max dwell time
- `DWELL_TIME_EXCEEDED` - Exceeded max dwell time
- `ROUTE_DEVIATION` - Vehicle deviated from expected route
- `SPEED_VIOLATION` - Speed violation detected
- `UNEXPECTED_STOP` - Unexpected stop detected

### **4. WhatsApp Integration**

#### **Automatic Notifications**

**ZONE_ENTRY:**
- Template: `driver_arrival`
- Recipients: `['operations', 'customer']`
- Arabic: `🚚 السائق {driver_name} وصل إلى {zone_name} في {time}`
- English: `🚚 Driver {driver_name} arrived at {zone_name} at {time}`

**ZONE_EXIT:**
- Template: `driver_departure`
- Recipients: `['operations']`
- Arabic: `🚚 السائق {driver_name} غادر {zone_name} في {time}`
- English: `🚚 Driver {driver_name} left {zone_name} at {time}`

**DWELL_TIME_EXCEEDED:**
- Template: `dwell_alert`
- Recipients: `['operations', 'manager']`
- Arabic: `🚨 تجاوز وقت الانتظار الأقصى في {zone_name}`
- English: `🚨 Maximum dwell time exceeded at {zone_name}`

#### **Driver Commands**
- `/status` - Report current status and location
- `/delay {reason}` - Report delay with reason
- `/arrived` - Confirm arrival at destination
- `/pod` - Upload proof of delivery photo
- `/help` - Get list of commands

### **5. Quantum State Triggers**

**ZONE_ENTRY:**
- Expected zone: `POSITIVE_SIGNAL` (increase on-time probability)
- Unexpected zone: `INVESTIGATE` (trigger alert)

**ZONE_EXIT:**
- Normal exit: No adjustment
- Dwell time exceeded: `-0.1` adjustment (reduce on-time probability by 10%)

**DWELL_TIME_EXCEEDED:**
- Adjustment: `-0.1` (reduce on-time probability by 10%)

---

## 🏗️ **ARCHITECTURE REQUIREMENTS**

### **1. Database Persistence**
- ✅ Prisma models for `GeofenceZone` and `GeofenceEvent`
- ✅ Tenant isolation (all queries filtered by `tenantId`)
- ✅ Indexes for performance (`tenantId`, `enabled`, `type`)
- ✅ Relationships to shipments, vehicles, drivers

### **2. RBAC Integration**
- ✅ Permission checks: `tms.geofence.read`, `tms.geofence.write`, `tms.geofence.delete`
- ✅ Role-based access (11 roles)
- ✅ Tenant isolation enforced at API level
- ✅ Audit logging for all operations

### **3. API Endpoints**

**Zone Management:**
- `GET /api/geofence/zones` - List zones (tenant-scoped)
- `POST /api/geofence/zones` - Create zone
- `GET /api/geofence/zones/[id]` - Get zone
- `PUT /api/geofence/zones/[id]` - Update zone
- `DELETE /api/geofence/zones/[id]` - Disable zone (soft delete)

**Detection:**
- `POST /api/geofence/detect` - Detect zone entry/exit
- `GET /api/geofence/events` - List events (with filters)
- `GET /api/geofence/events/[id]` - Get event details

**Analytics:**
- `GET /api/geofence/analytics` - Zone analytics
- `GET /api/geofence/dwell-tracking` - Active dwell tracking

### **4. Webhooks**
- ✅ Webhook triggers for all event types
- ✅ Configurable webhook endpoints per tenant
- ✅ Retry mechanism with exponential backoff
- ✅ Webhook event payload includes full event data

### **5. Real-Time Updates**
- ✅ WebSocket broadcasting for zone events
- ✅ Real-time zone status updates
- ✅ Live dwell time tracking
- ✅ Tenant-scoped WebSocket rooms

### **6. Event Bus Integration**
- ✅ Publish `GeofenceZoneCreated` events
- ✅ Publish `GeofenceZoneEntry` events
- ✅ Publish `GeofenceZoneExit` events
- ✅ Publish `GeofenceDwellTimeExceeded` events
- ✅ Subscribe to shipment/vehicle updates

### **7. Integration Points**
- ✅ **Schrödinger's Truck** - Quantum state updates
- ✅ **WhatsApp Service** - Automatic notifications
- ✅ **Notification Service** - In-app notifications
- ✅ **Event Store** - Event history tracking
- ✅ **Knowledge Base** - Learning from patterns

---

## 🎨 **UI REQUIREMENTS**

### **1. Zone Management Page** (`/transportation/geofences`)

**Features:**
- ✅ List all zones (table view with filters)
- ✅ Create new zone (form with map picker)
- ✅ Edit zone (update name, geometry, metadata)
- ✅ Enable/Disable zones
- ✅ Delete zones (soft delete)
- ✅ Zone type filter
- ✅ Search zones by name

**Zone Creation Form:**
- Zone name (required)
- Zone type (dropdown)
- Geometry type (Circle or Polygon)
- For Circle: Center (lat/lng picker) + Radius (meters)
- For Polygon: Coordinate list or map drawing tool
- Expected dwell time (minutes)
- Max dwell time (minutes)
- Operating hours (from/to, days)
- Contacts (name, phone, role)
- Enable/Disable toggle

**Zone List Table:**
- Zone name
- Type (badge)
- Geometry type (Circle/Polygon)
- Status (Enabled/Disabled)
- Created date
- Actions (Edit, Disable, Delete)

### **2. Zone Map View**
- ✅ Interactive map showing all zones
- ✅ Color-coded by zone type
- ✅ Click zone to view details
- ✅ Real-time vehicle positions (if available)
- ✅ Zone entry/exit markers

### **3. Event History**
- ✅ Event timeline view
- ✅ Filter by event type, zone, shipment
- ✅ Export events (CSV, Excel)
- ✅ Event details modal

### **4. Dwell Time Tracking**
- ✅ Active dwell tracking dashboard
- ✅ Warning indicators for approaching limits
- ✅ Alert notifications for exceeded limits

### **5. Test Detection Tool**
- ✅ Manual test detection
- ✅ Input: location (lat/lng), shipmentId, vehicleId
- ✅ Output: Detected event or "No zone event"
- ✅ Real-time result display

---

## 🔧 **TECHNICAL REQUIREMENTS**

### **1. Polygon Detection**
- ✅ Ray-casting algorithm for point-in-polygon
- ✅ Support for complex polygons
- ✅ Handle edge cases (point on boundary)

### **2. Circle Detection**
- ✅ Haversine formula for distance calculation
- ✅ Accurate radius checking

### **3. Dwell Time Tracking**
- ✅ Track entry time per shipment
- ✅ Calculate current dwell time
- ✅ Check against expected/max dwell times
- ✅ Generate warnings and alerts

### **4. Performance**
- ✅ Efficient zone lookup (spatial indexing if needed)
- ✅ Batch detection for multiple locations
- ✅ Caching of zone data

### **5. Error Handling**
- ✅ Validation of zone geometry
- ✅ Error messages for invalid inputs
- ✅ Graceful degradation if services unavailable

---

## 📊 **ANALYTICS REQUIREMENTS**

### **1. Zone Analytics**
- Entry/exit counts per zone
- Average dwell time per zone
- Dwell time violations
- Most active zones
- Time-based patterns

### **2. Event Analytics**
- Event frequency by type
- Event trends over time
- Zone performance metrics
- Alert frequency

---

## 🔐 **SECURITY REQUIREMENTS**

### **1. Authentication**
- ✅ All API endpoints require authentication
- ✅ JWT token validation

### **2. Authorization**
- ✅ RBAC checks on all operations
- ✅ Tenant isolation enforced
- ✅ Permission-based UI rendering

### **3. Data Validation**
- ✅ Input sanitization
- ✅ Geometry validation
- ✅ Coordinate range validation
- ✅ SQL injection prevention

### **4. Audit Logging**
- ✅ Log all zone operations
- ✅ Log all detection events
- ✅ Track user actions
- ✅ Compliance-ready audit trail

---

## 🚀 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Core Functionality** ✅
- [x] Zone service (create, list, update, delete)
- [x] Entry/exit detection
- [x] Dwell time tracking
- [x] Polygon detection algorithm
- [x] Circle detection algorithm
- [x] Event Bus integration
- [x] WhatsApp integration
- [x] Quantum state triggers

### **Phase 2: Database & Persistence** ❌
- [ ] Prisma schema models
- [ ] Database migration
- [ ] Service layer database integration
- [ ] In-memory fallback for development

### **Phase 3: API & RBAC** ❌
- [ ] Complete API endpoints
- [ ] RBAC middleware integration
- [ ] Tenant isolation enforcement
- [ ] Input validation
- [ ] Error handling

### **Phase 4: UI Implementation** ⚠️
- [x] Basic UI page created
- [ ] Complete zone management UI
- [ ] Map integration
- [ ] Event history view
- [ ] Dwell time dashboard
- [ ] Test detection tool

### **Phase 5: Real-Time & Webhooks** ❌
- [ ] WebSocket integration
- [ ] Real-time event broadcasting
- [ ] Webhook service integration
- [ ] Webhook configuration UI

### **Phase 6: Analytics** ❌
- [ ] Analytics service
- [ ] Analytics dashboard
- [ ] Export functionality

---

## 📝 **NOTES**

- All features must integrate with existing BlueDXP architecture
- Follow deep layer architecture pattern (service → API → UI)
- Ensure 4IR/5IR alignment (IoT, AI, real-time)
- Support multi-tenant architecture
- Follow security best practices
- Include comprehensive error handling
- Document all APIs and services

---

**Last Updated:** 2025-01-XX  
**Status:** Requirements Complete - Ready for Implementation

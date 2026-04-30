# 🗺️ ROUTE MAPPING - QHSE & ISO-IMS Modules

## Complete Route Reference

### QHSE Module Routes

#### Dashboard & Overview
- `/qhse/dashboard` - QHSE Dashboard (Real-time metrics)
- `/qhse/comprehensive` - Comprehensive QHSE View
- `/qhse/analytics` - QHSE Analytics
- `/qhse/statistics` - Smart QHSE Statistics Board

#### Core Features
- `/qhse/incidents` - Incident Management
- `/qhse/inspections` - Inspections & Audits
- `/qhse/training` - Training & Compliance
- `/qhse/environmental` - Environmental Metrics
- `/qhse/safety-metrics` - Safety Performance
- `/qhse/regulatory` - Regulatory Compliance
- `/qhse/esg` - ESG Reporting

#### Additional
- `/qhse/calendar` - QHSE Calendar
- `/qhse/reports` - QHSE Reports

### ISO-IMS Module Routes

#### Dashboard
- `/iso-ims` - ISO-IMS Dashboard (Main)
- `/iso-ims/intelligence` - AI Intelligence Dashboard

#### Core Management Pages
- `/iso-ims/capa` - CAPA Management (NEW)
- `/iso-ims/ncr` - NCR Management (NEW)
- `/iso-ims/audit` - Audit Management (NEW)
- `/iso-ims/document` - Document Management (NEW)
- `/iso-ims/risk` - Risk Management (NEW)
- `/iso-ims/training` - Training Management (NEW)

#### Legacy Routes (Backward Compatibility)
- `/capa-management` → `/iso-ims/capa`
- `/ncr-management` → `/iso-ims/ncr`
- `/audit-management` → `/iso-ims/audit`
- `/document-center` → `/iso-ims/document`
- `/risk-management` → `/iso-ims/risk`
- `/training-management` → `/iso-ims/training`

### API Routes

#### QHSE APIs
- `GET /api/qhse/incidents` - List incidents
- `POST /api/qhse/incidents` - Create incident
- `GET /api/qhse/incidents/[id]` - Get incident
- `PUT /api/qhse/incidents/[id]` - Update incident
- `DELETE /api/qhse/incidents/[id]` - Delete incident

#### ISO-IMS APIs

**CAPA:**
- `GET /api/iso-ims/capa` - List CAPAs
- `POST /api/iso-ims/capa` - Create CAPA
- `GET /api/iso-ims/capa/[id]` - Get CAPA
- `PUT /api/iso-ims/capa/[id]` - Update CAPA
- `DELETE /api/iso-ims/capa/[id]` - Delete CAPA

**NCR:**
- `GET /api/iso-ims/ncr` - List NCRs
- `POST /api/iso-ims/ncr` - Create NCR
- `GET /api/iso-ims/ncr/[id]` - Get NCR
- `PUT /api/iso-ims/ncr/[id]` - Update NCR
- `DELETE /api/iso-ims/ncr/[id]` - Delete NCR

**Audit:**
- `GET /api/iso-ims/audit` - List Audits
- `POST /api/iso-ims/audit` - Create Audit
- `GET /api/iso-ims/audit/[id]` - Get Audit
- `PUT /api/iso-ims/audit/[id]` - Update Audit
- `DELETE /api/iso-ims/audit/[id]` - Delete Audit

**Other:**
- `GET /api/iso-ims/stats` - Dashboard statistics
- `GET /api/iso-ims/compliance` - Compliance metrics
- `POST /api/iso-ims/intelligence` - AI insights

---

## Navigation Flow

### From ISO-IMS Dashboard
1. Click module card → Navigate to specific page
2. Click "New NCR" button → Navigate to `/iso-ims/ncr`
3. Click "New Document" button → Navigate to `/iso-ims/document`

### Module Cards Navigation
- **Document Center** → `/iso-ims/document`
- **NCR Management** → `/iso-ims/ncr`
- **CAPA System** → `/iso-ims/capa`
- **Audit Management** → `/iso-ims/audit`
- **Risk Management** → `/iso-ims/risk`
- **Training & Competence** → `/iso-ims/training`

---

## Route Registration

All routes are registered in:
- `lib/modules/qhse.ts` - QHSE module routes
- `lib/modules/iso-ims.ts` - ISO-IMS module routes

---

## URL Parameters

### Query Parameters (API Routes)
- `tenantId` - Required for all API calls
- `page` - Page number (pagination)
- `pageSize` - Items per page
- `status` - Filter by status
- `priority` - Filter by priority
- `severity` - Filter by severity
- `sortBy` - Sort field
- `sortOrder` - Sort direction (asc/desc)

### Example API Calls
```
GET /api/iso-ims/capa?tenantId=tenant-1&page=1&pageSize=20&status=OPEN
GET /api/qhse/incidents?tenantId=tenant-1&severity=HIGH&status=OPEN
```

---

*Last Updated: $(date)*
*Status: Complete ✅*
















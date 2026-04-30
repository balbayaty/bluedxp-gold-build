# 🗄️ WMS Module - Database Organization
## Complete Database Schema & Organization Guide

**Version:** 1.0.0  
**Last Updated:** December 2024

---

## 📊 DATABASE OVERVIEW

### Core WMS Tables

#### Operations Tables
- **PickTask** - Picking operations
- **WMSShipment** - Shipment tracking
- **WMSWave** - Wave planning
- **WMSShipmentLine** - Shipment line items
- **WMSParcel** - Parcel tracking

#### Evidence & Audit Tables
- **evidence_items** - Evidence records (photos, documents)
- **evidence_chains** - Evidence chain of custody
- **evidence_validation_rules** - Validation rules

#### File Management
- **file_metadata** - File storage metadata

#### SLA/KPI Tracking (New)
- **SlaViolation** - SLA violation records
- **SlaWarning** - SLA warning records (80% threshold)

---

## 📋 TABLE DETAILS

### PickTask
**Purpose:** Tracks picking operations for KPI calculations

**Key Fields:**
- `id` - Primary key
- `tenantId` - Multi-tenant isolation
- `status` - Task status (PENDING, IN_PROGRESS, COMPLETED)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

**Indexes:**
- `PickTask_status_updatedAt_idx` - Optimizes KPI calculations
- `PickTask_tenantId_status_idx` - Tenant-scoped queries
- `PickTask_createdAt_idx` - Time-based queries

**Usage:**
- KPI calculations (picking efficiency)
- Performance tracking
- Task management

---

### evidence_items
**Purpose:** Stores evidence records (photos, documents)

**Key Fields:**
- `id` - Primary key
- `tenantId` - Multi-tenant isolation
- `type` - Evidence type (photo, document, etc.)
- `category` - Evidence category
- `data` - JSON data (includes file URL, hash, metadata)

**Indexes:**
- `evidence_items_tenantId_type_idx` - Tenant and type queries
- `evidence_items_createdAt_idx` - Time-based queries

**Usage:**
- Photo evidence storage
- Document evidence storage
- Audit trail

---

### SlaViolation
**Purpose:** Tracks SLA violations for lifecycle stages

**Key Fields:**
- `id` - Primary key
- `tenantId` - Multi-tenant isolation
- `entityId` - Entity ID (ASN, Task, etc.)
- `entityType` - Entity type
- `stageId` - Lifecycle stage ID
- `targetDuration` - Target duration (seconds)
- `actualDuration` - Actual duration (seconds)
- `delaySeconds` - Delay in seconds
- `status` - Violation status (OPEN, RESOLVED)

**Indexes:**
- `SlaViolation_tenantId_idx` - Tenant isolation
- `SlaViolation_entityId_idx` - Entity queries
- `SlaViolation_status_idx` - Status filtering
- `SlaViolation_createdAt_idx` - Time-based queries

**Usage:**
- SLA violation tracking
- Compliance reporting
- Performance monitoring

---

### SlaWarning
**Purpose:** Tracks SLA warnings (80% threshold)

**Key Fields:**
- `id` - Primary key
- `tenantId` - Multi-tenant isolation
- `entityId` - Entity ID
- `entityType` - Entity type
- `stageId` - Lifecycle stage ID
- `targetDuration` - Target duration (seconds)
- `currentDuration` - Current duration (seconds)
- `warningThreshold` - Warning threshold (default 0.8)
- `status` - Warning status (ACTIVE, ACKNOWLEDGED)

**Indexes:**
- `SlaWarning_tenantId_idx` - Tenant isolation
- `SlaWarning_entityId_idx` - Entity queries
- `SlaWarning_status_idx` - Status filtering

**Usage:**
- Proactive SLA monitoring
- Early warning system
- Performance alerts

---

## 🔍 QUERY PATTERNS

### KPI Calculations

#### Picking Efficiency
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'COMPLETED') * 100.0 / COUNT(*) as efficiency
FROM "PickTask"
WHERE "tenantId" = $1
  AND "createdAt" >= $2
  AND "createdAt" <= $3;
```

#### SLA Compliance
```sql
SELECT 
  COUNT(*) FILTER (WHERE "actualDuration" <= "targetDuration") * 100.0 / COUNT(*) as compliance_rate
FROM "SlaViolation"
WHERE "tenantId" = $1
  AND "entityType" = $2
  AND "createdAt" >= $3;
```

### Evidence Queries

#### Get Evidence for Entity
```sql
SELECT *
FROM "evidence_items"
WHERE "tenantId" = $1
  AND "data"->>'entityId' = $2
  AND "data"->>'entityType' = $3
ORDER BY "createdAt" DESC;
```

---

## 📈 PERFORMANCE OPTIMIZATION

### Indexes Created
1. **PickTask_status_updatedAt_idx** - KPI calculations
2. **PickTask_tenantId_status_idx** - Tenant-scoped queries
3. **evidence_items_tenantId_type_idx** - Evidence queries
4. **SlaViolation_tenantId_idx** - SLA tracking
5. **SlaWarning_tenantId_idx** - Warning tracking

### Query Optimization Tips
1. Always filter by `tenantId` first
2. Use indexes for common query patterns
3. Use composite indexes for multi-column queries
4. Consider partitioning for large tables

---

## 🔐 SECURITY

### Multi-Tenant Isolation
- All tables include `tenantId` field
- All queries must filter by `tenantId`
- Indexes include `tenantId` for performance

### Data Integrity
- Foreign key constraints
- Unique constraints where needed
- Check constraints for data validation

---

## 📝 MIGRATION

### Apply Migration
```bash
# Using Prisma
npx prisma migrate deploy

# Or manually
psql $DATABASE_URL -f prisma/migrations/007_wms_enhancements.sql
```

### Verify Migration
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('SlaViolation', 'SlaWarning');

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('SlaViolation', 'SlaWarning');
```

---

## ✅ VERIFICATION

### Database Health Checks
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%Sla%' OR tablename LIKE '%PickTask%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('PickTask', 'SlaViolation', 'SlaWarning')
ORDER BY idx_scan DESC;
```

---

## 📚 RELATED DOCUMENTATION

- **Migration Guide:** `WMS_MIGRATION_GUIDE.md`
- **Testing Guide:** `WMS_TESTING_GUIDE.md`
- **Deployment Guide:** `WMS_PRODUCTION_DEPLOYMENT_GUIDE.md`

---

**Version:** 1.0.0  
**Last Updated:** December 2024



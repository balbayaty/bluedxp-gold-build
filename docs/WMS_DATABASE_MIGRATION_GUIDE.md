# 🗄️ WMS Module - Database Migration Guide
## Step-by-Step Migration Instructions

**Version:** 1.0.0  
**Last Updated:** December 2024

---

## 🎯 MIGRATION OVERVIEW

This migration adds:
- **SlaViolation** table - Tracks SLA violations
- **SlaWarning** table - Tracks SLA warnings
- **Performance indexes** - Optimizes queries
- **Enhanced indexes** - Improves KPI calculations

---

## 📋 PRE-MIGRATION CHECKLIST

### Prerequisites
- [ ] Database connection configured
- [ ] DATABASE_URL set in environment
- [ ] Database backup created
- [ ] Prisma client generated
- [ ] Development environment ready

### Verification
```bash
# Check database connection
npx prisma db pull

# Verify Prisma client
npx prisma generate
```

---

## 🚀 MIGRATION STEPS

### Step 1: Backup Database
```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Step 2: Apply Migration

**Option A: Using Prisma Migrate (Recommended)**
```bash
npx prisma migrate dev --name wms_enhancements
```

**Option B: Apply SQL Directly**
```bash
psql $DATABASE_URL -f prisma/migrations/007_wms_enhancements.sql
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Verify Migration
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('SlaViolation', 'SlaWarning');

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('SlaViolation', 'SlaWarning', 'PickTask');
```

---

## ✅ POST-MIGRATION VERIFICATION

### Verify Tables
```sql
-- Check SlaViolation table
SELECT COUNT(*) FROM "SlaViolation";

-- Check SlaWarning table
SELECT COUNT(*) FROM "SlaWarning";

-- Check indexes
\d "SlaViolation"
\d "SlaWarning"
```

### Test Queries
```sql
-- Test KPI query
SELECT 
  COUNT(*) FILTER (WHERE status = 'COMPLETED') * 100.0 / COUNT(*) as efficiency
FROM "PickTask"
WHERE "tenantId" = 'test-tenant'
LIMIT 1;

-- Test SLA query
SELECT COUNT(*) 
FROM "SlaViolation"
WHERE "tenantId" = 'test-tenant'
  AND "status" = 'OPEN';
```

---

## 🔙 ROLLBACK PROCEDURE

### If Migration Fails

**Option 1: Restore Backup**
```bash
psql $DATABASE_URL < backup_YYYYMMDD.sql
```

**Option 2: Manual Rollback**
```sql
-- Drop tables if needed
DROP TABLE IF EXISTS "SlaWarning";
DROP TABLE IF EXISTS "SlaViolation";
```

---

## 📊 MIGRATION DETAILS

### Tables Created
1. **SlaViolation** - 15 columns, 6 indexes
2. **SlaWarning** - 13 columns, 5 indexes

### Indexes Created
1. **PickTask** - 3 new indexes
2. **evidence_items** - 2 new indexes
3. **file_metadata** - 2 new indexes

### Total Impact
- **2 new tables**
- **13 new indexes**
- **No data migration required**
- **Backward compatible**

---

## 🐛 TROUBLESHOOTING

### Error: Table already exists
- Migration uses `CREATE TABLE IF NOT EXISTS`
- Safe to run multiple times

### Error: Permission denied
- Check database user permissions
- Ensure CREATE TABLE permission

### Error: Index already exists
- Migration uses `CREATE INDEX IF NOT EXISTS`
- Safe to run multiple times

---

## 📚 RELATED DOCUMENTATION

- **Database Organization:** `WMS_DATABASE_ORGANIZATION.md`
- **Testing Guide:** `WMS_TESTING_GUIDE.md`
- **Deployment Guide:** `WMS_PRODUCTION_DEPLOYMENT_GUIDE.md`

---

**Version:** 1.0.0  
**Last Updated:** December 2024



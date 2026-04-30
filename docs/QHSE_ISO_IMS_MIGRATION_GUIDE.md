# 🚀 QHSE & ISO-IMS Database Migration Guide

## Quick Start

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

### Step 2: Run Migration

**Option A: Using Prisma Migrate (Recommended)**
```bash
npx prisma migrate dev --name add_qhse_iso_ims_models
```

**Option B: Apply SQL Migration Directly**
```bash
# Windows PowerShell
$env:DATABASE_URL="your-connection-string"
psql $env:DATABASE_URL -f prisma/migrations/006_add_qhse_iso_ims_models.sql

# Linux/Mac
psql $DATABASE_URL -f prisma/migrations/006_add_qhse_iso_ims_models.sql
```

### Step 3: Verify Migration
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'qhse_%' OR table_name LIKE 'iso_ims_%')
ORDER BY table_name;
```

**Expected Tables:**
- `qhse_incidents`
- `qhse_inspections`
- `qhse_training_programs`
- `qhse_training_records`
- `qhse_environmental_metrics`
- `qhse_safety_metrics`
- `qhse_regulatory_audits`
- `iso_ims_capas`
- `iso_ims_ncrs`
- `iso_ims_audits`
- `iso_ims_documents`
- `iso_ims_risks`
- `iso_ims_trainings`

### Step 4: Verify Indexes
```sql
-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (tablename LIKE 'qhse_%' OR tablename LIKE 'iso_ims_%')
ORDER BY tablename, indexname;
```

---

## Migration Details

### Tables Created

#### QHSE Module (7 tables)
1. **qhse_incidents** - Incident reporting and management
2. **qhse_inspections** - Inspection scheduling and tracking
3. **qhse_training_programs** - Training program definitions
4. **qhse_training_records** - Individual training records
5. **qhse_environmental_metrics** - Environmental data tracking
6. **qhse_safety_metrics** - Safety performance metrics (TRIR, LTIFR, etc.)
7. **qhse_regulatory_audits** - Regulatory audit management

#### ISO-IMS Module (6 tables)
1. **iso_ims_capas** - Corrective & Preventive Actions
2. **iso_ims_ncrs** - Non-Conformance Reports
3. **iso_ims_audits** - Audit management
4. **iso_ims_documents** - Document control
5. **iso_ims_risks** - Risk management
6. **iso_ims_trainings** - Training management

### Key Features

- ✅ **Multi-tenant Support:** All tables include `tenantId` for isolation
- ✅ **Comprehensive Indexes:** Optimized for common query patterns
- ✅ **JSON Support:** Flexible data storage with JSONB fields
- ✅ **Audit Trail:** Created/updated timestamps and user tracking
- ✅ **Relationships:** Foreign key support for cross-module linking

---

## Troubleshooting

### Error: Table already exists
The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times. If you need to drop and recreate:
```sql
-- WARNING: This will delete all data!
DROP TABLE IF EXISTS qhse_incidents CASCADE;
-- Repeat for all tables...
```

### Error: Permission denied
Ensure your database user has CREATE TABLE permissions:
```sql
GRANT CREATE ON DATABASE your_database TO your_user;
```

### Error: Connection failed
Check your `DATABASE_URL` environment variable:
```bash
# Verify connection string format
echo $DATABASE_URL
# Should be: postgresql://user:password@host:port/database
```

### Error: Prisma Client not generated
Run Prisma generate first:
```bash
npx prisma generate
```

---

## Post-Migration

### 1. Update Services
Services need to be updated to use Prisma. See `docs/QHSE_ISO_IMS_PRODUCTION_READY_STATUS.md` for details.

### 2. Test Database Operations
```typescript
// Example: Test creating an incident
import { prisma } from '@/lib/services/database/prismaClient'

const incident = await prisma.qHSEIncident.create({
  data: {
    tenantId: 'test-tenant',
    incidentNumber: 'INC-2025-001',
    type: 'NEAR_MISS',
    severity: 'LOW',
    status: 'REPORTED',
    title: 'Test Incident',
    description: 'Test description',
    location: 'Test Location',
    occurredAt: new Date(),
    reportedAt: new Date(),
    reportedBy: 'test-user',
    createdBy: 'test-user',
    updatedBy: 'test-user',
    oshaRecordable: false,
    riddorReportable: false,
  }
})
```

### 3. Verify Multi-Tenant Isolation
```sql
-- Test tenant isolation
SELECT COUNT(*) FROM qhse_incidents WHERE "tenantId" = 'tenant-1';
SELECT COUNT(*) FROM qhse_incidents WHERE "tenantId" = 'tenant-2';
```

---

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop all QHSE tables
DROP TABLE IF EXISTS qhse_regulatory_audits CASCADE;
DROP TABLE IF EXISTS qhse_safety_metrics CASCADE;
DROP TABLE IF EXISTS qhse_environmental_metrics CASCADE;
DROP TABLE IF EXISTS qhse_training_records CASCADE;
DROP TABLE IF EXISTS qhse_training_programs CASCADE;
DROP TABLE IF EXISTS qhse_inspections CASCADE;
DROP TABLE IF EXISTS qhse_incidents CASCADE;

-- Drop all ISO-IMS tables
DROP TABLE IF EXISTS iso_ims_trainings CASCADE;
DROP TABLE IF EXISTS iso_ims_risks CASCADE;
DROP TABLE IF EXISTS iso_ims_documents CASCADE;
DROP TABLE IF EXISTS iso_ims_audits CASCADE;
DROP TABLE IF EXISTS iso_ims_ncrs CASCADE;
DROP TABLE IF EXISTS iso_ims_capas CASCADE;
```

**⚠️ WARNING:** This will delete all data in these tables!

---

## Support

For issues or questions:
1. Check `docs/QHSE_ISO_IMS_PRODUCTION_READY_STATUS.md` for status
2. Review Prisma documentation: https://www.prisma.io/docs
3. Check database logs for detailed error messages
















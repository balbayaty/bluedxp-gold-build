# 🗄️ Phase 1: Database Migration Guide

**Status:** Ready to Apply  
**Migration Name:** `add_phase1_security_observability`

---

## 📋 WHAT THIS MIGRATION ADDS

### **6 New Tables:**

1. **`secrets`** - Secret management
2. **`secret_versions`** - Secret versioning
3. **`secret_audit_logs`** - Secret audit trail
4. **`alerts`** - Alert storage
5. **`slow_queries`** - Slow query tracking
6. **`performance_metrics`** - Performance metrics storage

### **Indexes:**
- 20+ indexes for optimal query performance
- Foreign key constraints for data integrity

---

## 🚀 HOW TO APPLY

### **Option 1: Using Prisma Migrate (Recommended)**

```bash
# Apply the migration
npx prisma migrate deploy

# Or in development
npx prisma migrate dev --name add_phase1_security_observability

# Generate Prisma client
npx prisma generate
```

### **Option 2: Manual SQL (If Prisma Migrate Fails)**

```bash
# Connect to your database
psql -U your_user -d bluedxp

# Run the migration SQL
\i prisma/migrations/20250101000000_add_phase1_security_observability/migration.sql
```

### **Option 3: Using Docker**

```bash
# If using Docker Compose
docker-compose exec postgres psql -U postgres -d bluedxp -f /path/to/migration.sql
```

---

## ✅ VERIFICATION

After applying the migration, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('secrets', 'secret_versions', 'secret_audit_logs', 'alerts', 'slow_queries', 'performance_metrics');

-- Should return 6 rows

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('secrets', 'secret_versions', 'secret_audit_logs', 'alerts', 'slow_queries', 'performance_metrics');

-- Should return 20+ indexes
```

---

## 🔄 ROLLBACK (If Needed)

If you need to rollback:

```sql
-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS "performance_metrics" CASCADE;
DROP TABLE IF EXISTS "slow_queries" CASCADE;
DROP TABLE IF EXISTS "alerts" CASCADE;
DROP TABLE IF EXISTS "secret_audit_logs" CASCADE;
DROP TABLE IF EXISTS "secret_versions" CASCADE;
DROP TABLE IF EXISTS "secrets" CASCADE;
```

---

## 📊 TABLE SCHEMAS

### **secrets**
- `id` (PK)
- `secretId` (unique)
- `name`, `type`, `description`
- `tenantId` (optional)
- `status` (ACTIVE, DEPRECATED, REVOKED)
- `createdAt`, `updatedAt`

### **secret_versions**
- `id` (PK)
- `secretId` (FK → secrets.id)
- `version` (integer)
- `secret` (encrypted value)
- `createdAt`, `expiresAt`
- `deprecated`, `deprecatedAt`
- `rotatedBy`
- `metadata` (JSONB)

### **secret_audit_logs**
- `id` (PK)
- `secretId` (FK → secrets.id)
- `action` (ROTATE, ACCESS, REVOKE, etc.)
- `userId`
- `timestamp`
- `metadata` (JSONB)

### **alerts**
- `id` (PK)
- `severity` (low, medium, high, critical)
- `title`, `message`
- `source` (apm, security, system, etc.)
- `metric`, `value`, `threshold`
- `timestamp`
- `resolved`, `resolvedAt`, `resolvedBy`
- `tenantId` (optional)
- `metadata` (JSONB)

### **slow_queries**
- `id` (PK)
- `query` (TEXT)
- `duration` (milliseconds)
- `timestamp`
- `slow` (boolean)
- `endpoint`, `userId`, `tenantId` (optional)
- `metadata` (JSONB)

### **performance_metrics**
- `id` (PK)
- `endpoint`
- `responseTime` (milliseconds)
- `queries` (integer)
- `timestamp`
- `userId`, `tenantId` (optional)
- `metadata` (JSONB)

---

## ⚠️ NOTES

1. **Multi-tenant Support:** All tables support `tenantId` for multi-tenant isolation
2. **JSONB Metadata:** Flexible metadata storage for future extensions
3. **Indexes:** Optimized for common query patterns
4. **Foreign Keys:** Ensure referential integrity
5. **Cascade Delete:** Secret versions and audit logs are deleted when secret is deleted

---

## 🎯 NEXT STEPS

After migration:

1. ✅ Verify tables exist
2. ✅ Test secret rotation service
3. ✅ Test alerting service
4. ✅ Test APM service
5. ✅ Check indexes are created

---

**Status:** ✅ **READY TO APPLY**



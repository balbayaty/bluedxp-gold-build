# 🚀 User Management System - Migration Guide

## Overview

This guide will help you migrate your database to support the new User Management System.

## Prerequisites

- PostgreSQL database
- Prisma CLI installed
- Node.js 18+ installed

## Step 1: Backup Your Database

**IMPORTANT**: Always backup your database before running migrations!

```bash
# PostgreSQL backup
pg_dump -U your_user -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Step 2: Review Migration File

Review the migration file:
- `prisma/migrations/007_add_user_management_models.sql`

This migration adds:
- ✅ Tenant model
- ✅ Customer hierarchy support (parentCustomerId)
- ✅ CustomerUser junction table
- ✅ Role model (dynamic roles)
- ✅ RoleAssignment model
- ✅ PermissionTemplate model
- ✅ UsageMetric model
- ✅ AgentUsage model
- ✅ APIKey enhancements
- ✅ User model enhancements

## Step 3: Run Migration

### Option A: Using Prisma Migrate (Recommended)

```bash
# Generate Prisma client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_user_management_models

# Or apply existing migration
npx prisma migrate deploy
```

### Option B: Using Migration Script

```bash
# Run the migration script
npx tsx scripts/run-user-management-migration.ts
```

### Option C: Manual SQL Execution

```bash
# Connect to your database
psql -U your_user -d your_database

# Run the migration file
\i prisma/migrations/007_add_user_management_models.sql
```

## Step 4: Verify Migration

```bash
# Check Prisma schema
npx prisma validate

# Open Prisma Studio to verify tables
npx prisma studio

# Verify models exist
npx prisma db pull
```

## Step 5: Seed Initial Data (Optional)

```bash
# Seed sample data
npx tsx scripts/seed-user-management-data.ts
```

This creates:
- Sample tenant
- System permission templates
- System roles

## Step 6: Environment Variables

Ensure these environment variables are set:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Redis (for caching)
REDIS_URL="redis://localhost:6379"
REDIS_NAMESPACE="bluedxp"

# Application
NODE_ENV="production"
```

## Step 7: Test the System

1. **Test User Creation**:
   ```bash
   curl -X POST http://localhost:3000/api/users \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "name": "Test User",
       "role": "CUSTOMER_USER",
       "tenantId": "tenant-demo-001"
     }'
   ```

2. **Test Permission Check**:
   ```bash
   curl -X POST http://localhost:3000/api/permissions/check \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "user-id",
       "permission": {
         "module": "wms",
         "action": "read"
       }
     }'
   ```

3. **Test AI Recommendations**:
   ```bash
   curl http://localhost:3000/api/users/{userId}/ai/recommendations
   ```

## Troubleshooting

### Migration Fails with "Already Exists"

The migration uses `CREATE TABLE IF NOT EXISTS` and `DO $$` blocks to handle existing tables. If you see "already exists" errors, they're safe to ignore.

### Foreign Key Constraints Fail

If foreign key constraints fail:
1. Check that Tenant table exists
2. Check that User table exists
3. Verify tenantId values match existing tenants

### Prisma Client Out of Sync

If Prisma client is out of sync:
```bash
npx prisma generate
npx prisma db pull
```

## Rollback (If Needed)

If you need to rollback:

```sql
-- Drop new tables (in reverse order)
DROP TABLE IF EXISTS "AgentUsage";
DROP TABLE IF EXISTS "UsageMetric";
DROP TABLE IF EXISTS "PermissionTemplate";
DROP TABLE IF EXISTS "RoleAssignment";
DROP TABLE IF EXISTS "Role";
DROP TABLE IF EXISTS "CustomerUser";

-- Remove new columns from existing tables
ALTER TABLE "APIKey" DROP COLUMN IF EXISTS "scopedPermissions";
ALTER TABLE "APIKey" DROP COLUMN IF EXISTS "allowedIPs";
-- ... (drop all new columns)

ALTER TABLE "users" DROP COLUMN IF EXISTS "hierarchicalPermissions";
-- ... (drop all new columns)

ALTER TABLE "Customer" DROP COLUMN IF EXISTS "parentCustomerId";
```

## Post-Migration Checklist

- [ ] Migration completed successfully
- [ ] All tables created
- [ ] All indexes created
- [ ] Foreign keys established
- [ ] Prisma client generated
- [ ] Seed data loaded (optional)
- [ ] API endpoints tested
- [ ] UI components working
- [ ] No errors in logs

## Support

If you encounter issues:
1. Check the migration logs
2. Verify database permissions
3. Check Prisma schema matches migration
4. Review error messages carefully

---

**Migration Version**: 007
**Date**: 2025-01-XX
**Status**: ✅ Ready for Production














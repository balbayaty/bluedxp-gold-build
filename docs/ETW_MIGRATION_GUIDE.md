# ETW Module - Database Migration Guide

## Quick Migration

### Option 1: Using Prisma (Recommended)

```bash
# Generate Prisma client
npx prisma generate

# Apply migration (if using Prisma migrations)
npx prisma migrate deploy
```

### Option 2: Using SQL Migration File

```bash
# PowerShell (Windows)
powershell -ExecutionPolicy Bypass -File scripts/apply-etw-migration.ps1

# Or manually with psql
psql $DATABASE_URL -f prisma/migrations/004_add_etw_module.sql
```

## Migration Details

The migration creates the following tables:

1. **etw** - Main ETW table
2. **etw_versions** - Version history
3. **etw_events** - Chain of custody events
4. **etw_legs** - Multimodal legs
5. **etw_permits** - Regulatory permits
6. **etw_risk_snapshots** - Risk intelligence snapshots
7. **etw_milestones** - Estimated milestones
8. **etw_attachments** - Document attachments
9. **qr_tokens** - QR verification tokens
10. **verification_logs** - Verification audit logs

## Verification

After migration, verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'etw%' OR table_name LIKE 'qr_%' OR table_name LIKE 'verification_%';
```

## Troubleshooting

### Error: Table already exists
- The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times
- If you need to drop and recreate, use `DROP TABLE IF EXISTS` first

### Error: Foreign key constraint fails
- Ensure the `etw` table is created first
- Check that referenced tables exist

### Error: Permission denied
- Ensure your database user has CREATE TABLE permissions
- Check database connection string in `.env`

## Post-Migration

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Verify Schema**:
   ```bash
   npx prisma validate
   ```

3. **Test Connection**:
   ```bash
   npx prisma db pull
   ```

4. **Create Seed Data**:
   ```bash
   # Via API
   POST /api/etw/seed
   ```

## Rollback

If you need to rollback the migration:

```sql
-- Drop tables in reverse order (due to foreign keys)
DROP TABLE IF EXISTS "verification_logs" CASCADE;
DROP TABLE IF EXISTS "qr_tokens" CASCADE;
DROP TABLE IF EXISTS "etw_attachments" CASCADE;
DROP TABLE IF EXISTS "etw_milestones" CASCADE;
DROP TABLE IF EXISTS "etw_risk_snapshots" CASCADE;
DROP TABLE IF EXISTS "etw_permits" CASCADE;
DROP TABLE IF EXISTS "etw_legs" CASCADE;
DROP TABLE IF EXISTS "etw_events" CASCADE;
DROP TABLE IF EXISTS "etw_versions" CASCADE;
DROP TABLE IF EXISTS "etw" CASCADE;
```

**Warning**: This will delete all ETW data!





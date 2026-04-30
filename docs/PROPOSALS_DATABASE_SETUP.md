# Proposals & RFQ Module - Database Setup Guide

## Overview

This guide covers the complete database setup and migration process for the Proposals & RFQ module.

## Database Schema

### Tables Created

1. **Proposal** - Main proposals table
2. **RFQ** - Request for Quotation table
3. **ProposalCollaboration** - Collaboration and permissions
4. **ProposalTracking** - Engagement and tracking data
5. **ProposalSignature** - E-signature workflows
6. **ProposalTranslation** - Multi-language translations
7. **ProposalABTest** - A/B testing data
8. **ProposalFollowUp** - Automated follow-up sequences
9. **ProposalRichMedia** - Rich media assets
10. **ProposalInteractive** - Interactive features
11. **ProposalContentBlock** - Content block usage tracking
12. **ProposalVersion** - Version history
13. **ProposalComment** - Comments and discussions
14. **ContentBlockLibrary** - Reusable content blocks
15. **ProposalBenchmark** - Benchmarking data
16. **ProposalLearning** - Self-learning outcomes

## Migration Steps

### 1. Run Database Migration

```bash
# Option 1: Using Prisma (Recommended)
npx prisma migrate dev --name proposals_rfq_module

# Option 2: Using SQL migration directly
psql $DATABASE_URL -f lib/database/migrations/004_proposals_rfq_module.sql

# Option 3: Using setup script
npm run setup:proposals
# or
ts-node scripts/setup-proposals-module.ts
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Verify Migration

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'Proposal%' OR table_name LIKE 'RFQ%' OR table_name LIKE 'ContentBlock%';

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename LIKE 'Proposal%' OR tablename LIKE 'RFQ%';
```

## Prisma Schema Updates

The Prisma schema has been updated with all proposal models. Run:

```bash
npx prisma db push
# or
npx prisma migrate dev
```

## Service Integration

### Database Service

A new `ProposalDatabaseService` has been created at:
- `lib/services/proposals/proposalDatabaseService.ts`

This service provides:
- ✅ Prisma-based CRUD operations
- ✅ Type-safe database access
- ✅ Automatic relationship loading
- ✅ Transaction support

### Service Updates

The `EnhancedProposalService` has been updated to:
- ✅ Support database persistence (optional)
- ✅ Maintain in-memory cache for performance
- ✅ Fallback to in-memory if database unavailable
- ✅ Event-driven updates to both cache and database

## Configuration

### Environment Variables

Ensure these are set:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### Enable Database Persistence

In `enhancedProposalService.ts`:

```typescript
private useDatabase: boolean = true // Set to true to enable database
```

## Data Migration (If Needed)

If you have existing in-memory data, create a migration script:

```typescript
// scripts/migrate-proposals-to-db.ts
import { enhancedProposalService } from '@/lib/services/proposals/enhancedProposalService'
import { proposalDatabaseService } from '@/lib/services/proposals/proposalDatabaseService'

async function migrate() {
  const proposals = await enhancedProposalService.listProposals()
  
  for (const proposal of proposals) {
    await proposalDatabaseService.createProposal({
      // Map proposal data to database format
    })
  }
}
```

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] Prisma client generated
- [ ] All tables created
- [ ] Indexes created
- [ ] Foreign keys established
- [ ] Default content blocks created
- [ ] Module initialization successful
- [ ] API endpoints working
- [ ] UI components loading data

## Troubleshooting

### Migration Errors

**Error: "relation already exists"**
- Tables already exist, safe to ignore
- Or drop and recreate if needed

**Error: "foreign key constraint"**
- Ensure RFQ table exists before Proposal table
- Check data integrity

**Error: "permission denied"**
- Check database user permissions
- Ensure user can CREATE TABLE and CREATE INDEX

### Connection Issues

**Error: "Can't reach database server"**
- Check DATABASE_URL
- Verify PostgreSQL is running
- Check network/firewall settings

### Prisma Issues

**Error: "Prisma Client not generated"**
```bash
npx prisma generate
```

**Error: "Schema out of sync"**
```bash
npx prisma db push
```

## Production Deployment

### 1. Run Migration

```bash
# Production migration
npx prisma migrate deploy
```

### 2. Verify

```bash
# Check migration status
npx prisma migrate status
```

### 3. Seed Data (Optional)

```bash
# Run seed script
npm run seed:proposals
```

## Performance Optimization

### Indexes

All critical fields are indexed:
- ✅ tenantId (multi-tenant isolation)
- ✅ status (filtering)
- ✅ customerId (lookups)
- ✅ proposalNumber (unique lookups)
- ✅ createdAt (sorting)

### Query Optimization

- Use `include` to load relationships efficiently
- Use `select` to limit fields when possible
- Use pagination for large result sets

## Backup & Recovery

### Backup

```bash
# Backup proposals data
pg_dump $DATABASE_URL -t "Proposal*" -t "RFQ" -t "ContentBlock*" > proposals_backup.sql
```

### Restore

```bash
# Restore from backup
psql $DATABASE_URL < proposals_backup.sql
```

## Monitoring

### Key Metrics to Monitor

- Table sizes
- Index usage
- Query performance
- Connection pool usage

### Queries

```sql
-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename LIKE 'Proposal%' OR tablename LIKE 'RFQ%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE tablename LIKE 'Proposal%'
ORDER BY idx_scan DESC;
```

## Support

For issues or questions:
1. Check migration logs
2. Verify database connectivity
3. Review Prisma schema
4. Check service initialization logs

## Next Steps

After setup:
1. ✅ Test creating a proposal
2. ✅ Test collaboration features
3. ✅ Test tracking functionality
4. ✅ Test export features
5. ✅ Verify all API endpoints
6. ✅ Test UI components

**Status**: Database setup complete and ready for use! 🎉




# 🚀 User Management System - Deployment Checklist

## Pre-Deployment

### 1. Database Migration ⚠️ **REQUIRED**

```bash
# Backup database first!
pg_dump -U user -d database > backup_$(date +%Y%m%d).sql

# Run migration
npx prisma migrate dev --name add_user_management_models

# Or use migration script
npx tsx scripts/run-user-management-migration.ts

# Generate Prisma client
npx prisma generate
```

**Verify**:
- [ ] All tables created
- [ ] All indexes created
- [ ] Foreign keys established
- [ ] Prisma client generated

### 2. Environment Variables ⚠️ **REQUIRED**

Add to `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Redis (for caching)
REDIS_URL="redis://localhost:6379"
REDIS_NAMESPACE="bluedxp"

# Application
NODE_ENV="production"
```

**Verify**:
- [ ] DATABASE_URL set
- [ ] REDIS_URL set
- [ ] All variables loaded

### 3. Dependencies ⚠️ **REQUIRED**

```bash
npm install redis @types/redis
npm install bcrypt @types/bcrypt
npm install recharts framer-motion react-icons
```

**Verify**:
- [ ] All packages installed
- [ ] No dependency conflicts
- [ ] TypeScript types available

### 4. Redis Setup ⚠️ **REQUIRED**

```bash
# Install Redis (if not installed)
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
# Windows: Download from redis.io

# Start Redis
redis-server

# Verify connection
redis-cli ping
# Should return: PONG
```

**Verify**:
- [ ] Redis running
- [ ] Connection successful
- [ ] Can write/read data

## Deployment Steps

### Step 1: Run Migration

```bash
npx prisma migrate deploy
# or
npx tsx scripts/run-user-management-migration.ts
```

### Step 2: Seed Initial Data (Optional)

```bash
npx tsx scripts/seed-user-management-data.ts
```

### Step 3: Build Application

```bash
npm run build
```

### Step 4: Start Application

```bash
npm start
# or
npm run dev
```

### Step 5: Verify Deployment

1. **Check API Health**:
   ```bash
   curl http://localhost:3000/api/users
   ```

2. **Check UI**:
   - Visit: `http://localhost:3000/settings/users`
   - Should see user management interface

3. **Check Redis**:
   - Permission checks should be fast (<100ms)
   - Check Redis stats: `redis-cli INFO stats`

## Post-Deployment

### Verification Tests

1. **Create User**:
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

2. **Check Permission**:
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

3. **Get AI Recommendations**:
   ```bash
   curl http://localhost:3000/api/users/{userId}/ai/recommendations
   ```

### Monitoring

- [ ] Check application logs
- [ ] Monitor Redis performance
- [ ] Monitor database queries
- [ ] Check error rates
- [ ] Verify permission check latency

## Rollback Plan

If issues occur:

1. **Stop Application**
2. **Restore Database Backup**:
   ```bash
   psql -U user -d database < backup_YYYYMMDD.sql
   ```
3. **Revert Code** (if needed)
4. **Restart Application**

## Support

If you encounter issues:
1. Check migration logs
2. Verify environment variables
3. Check Redis connection
4. Review application logs
5. Check Prisma client is generated

---

**Status**: ✅ Ready for Deployment
**Migration**: ✅ File Created
**Next Step**: Run migration!

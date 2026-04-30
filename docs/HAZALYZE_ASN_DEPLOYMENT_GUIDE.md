# 🚀 ASN Module - Deployment Guide
## Step-by-Step Production Deployment

**Date:** 2025-01-27  
**Version:** 2.0.0

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Database
- [ ] Database backup created
- [ ] Migration script reviewed
- [ ] Rollback plan prepared
- [ ] Indexes verified

### Code
- [ ] All tests passing
- [ ] Linter errors fixed
- [ ] TypeScript errors fixed
- [ ] Build successful

### Environment
- [ ] Environment variables configured
- [ ] API keys secured
- [ ] Database connection verified
- [ ] Event Bus running

### Services
- [ ] Vision service available (if using)
- [ ] OCR service available (if using)
- [ ] EDI parser available (if using)

---

## 🗄️ DATABASE DEPLOYMENT

### Step 1: Backup Database
```bash
# PostgreSQL backup
pg_dump -h localhost -U postgres -d bluedxp > backup_$(date +%Y%m%d).sql

# Or using Prisma
npx prisma db pull
```

### Step 2: Run Migration
```bash
# Development
npx prisma migrate dev --name add_asn_models

# Production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Step 3: Verify Migration
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ASN%';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename LIKE 'ASN%';
```

### Step 4: Seed Initial Data (Optional)
```bash
npm run seed:asn
```

---

## 🔧 CONFIGURATION

### Environment Variables

Add to `.env` or `.env.production`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bluedxp

# Event Bus (if using)
EVENT_BUS_URL=redis://localhost:6379

# AI Services (if using)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Vision Service (if using)
VISION_SERVICE_URL=http://localhost:3003

# OCR Service (if using)
OCR_SERVICE_URL=http://localhost:3004
```

### Module Configuration

Verify in `lib/modules/hazalyze.ts`:
- Routes are registered
- Components are listed
- Services are exported
- Permissions are configured

---

## 🧪 TESTING

### Unit Tests
```bash
npm run test -- __tests__/asn
```

### Integration Tests
```bash
npm run test:integration -- __tests__/integration/asn
```

### E2E Tests
```bash
npm run test:e2e -- __tests__/e2e/asn
```

### Manual Testing Checklist
- [ ] Create ASN
- [ ] List ASNs
- [ ] Update ASN status
- [ ] View dashboards
- [ ] Process ASN
- [ ] Handle exceptions
- [ ] View analytics

---

## 🚀 DEPLOYMENT STEPS

### Development Environment

1. **Pull latest code**
   ```bash
   git pull origin main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run migrations**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Build application**
   ```bash
   npm run build
   ```

5. **Start server**
   ```bash
   npm run start
   ```

### Production Environment

1. **Deploy code**
   ```bash
   # Using your deployment method
   git pull origin main
   npm install --production
   ```

2. **Run production migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Restart services**
   ```bash
   # Using PM2, Docker, or your process manager
   pm2 restart bluedxp
   # or
   docker-compose restart
   ```

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### 1. Health Checks
```bash
# Check API endpoints
curl http://localhost:3002/api/asn

# Check database connection
npx prisma db execute --stdin <<< "SELECT 1"
```

### 2. Module Registration
- Navigate to `/asn`
- Verify page loads
- Check navigation menu

### 3. Functionality Tests
- Create test ASN
- View in list
- Process ASN
- Check dashboards
- Verify analytics

### 4. Performance Checks
- Page load times
- API response times
- Database query performance
- Memory usage

---

## 🐛 TROUBLESHOOTING

### Migration Fails
```bash
# Check migration status
npx prisma migrate status

# Reset if needed (CAUTION: Data loss)
npx prisma migrate reset

# Manual rollback
npx prisma migrate resolve --rolled-back add_asn_models
```

### Module Not Loading
- Check module registry: `lib/modules/hazalyze.ts`
- Verify routes are registered
- Check browser console for errors
- Review server logs

### Database Errors
- Verify connection string
- Check database permissions
- Review Prisma logs
- Check table existence

### API Errors
- Verify authentication
- Check tenant isolation
- Review error logs
- Test with Postman/curl

---

## 📊 MONITORING

### Key Metrics to Monitor
- ASN creation rate
- Processing time
- Exception rate
- API response times
- Database query performance
- Error rates

### Logging
- Enable structured logging
- Log all ASN operations
- Track exceptions
- Monitor predictions

### Alerts
- High exception rate
- Slow processing times
- API errors
- Database connection issues

---

## 🔄 ROLLBACK PLAN

### If Issues Occur

1. **Stop new ASN creation**
   - Disable module in registry
   - Or disable routes

2. **Rollback migration** (if needed)
   ```bash
   # Manual rollback SQL
   DROP TABLE IF EXISTS "ASNTrackingEvent";
   DROP TABLE IF EXISTS "ASNTemplate";
   DROP TABLE IF EXISTS "ASNDocument";
   DROP TABLE IF EXISTS "ASNException";
   DROP TABLE IF EXISTS "ASNItem";
   DROP TABLE IF EXISTS "ASN";
   ```

3. **Revert code**
   ```bash
   git revert <commit-hash>
   npm run build
   pm2 restart bluedxp
   ```

---

## ✅ SUCCESS CRITERIA

### Deployment Successful If:
- [ ] All migrations applied
- [ ] Module accessible at `/asn`
- [ ] Can create ASN
- [ ] Can list ASNs
- [ ] Dashboards load
- [ ] No console errors
- [ ] API endpoints respond
- [ ] Database queries work

---

## 📞 SUPPORT

### Issues?
- Check logs: `logs/` directory
- Review documentation: `docs/HAZALYZE_ASN_*.md`
- Check GitHub issues
- Contact development team

---

**Last Updated:** 2025-01-27  
**Version:** 2.0.0  
**Status:** ✅ Ready for Deployment



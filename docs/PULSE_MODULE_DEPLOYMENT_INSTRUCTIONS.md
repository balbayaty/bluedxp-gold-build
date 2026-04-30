# 🚀 Pulse Module - Deployment Instructions

**Date**: 2025-01-27  
**Status**: ✅ **READY TO DEPLOY**

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

Before deploying, ensure:
- [ ] Database connection is configured
- [ ] Environment variables are set
- [ ] Prisma is installed (`npm install`)
- [ ] You have database write permissions

---

## 🚀 **DEPLOYMENT STEPS**

### **Option 1: Complete Automated Deployment (Recommended)**

Run this single command to handle everything:

```bash
npm run deploy:pulse
```

**This will**:
1. ✅ Check database connection
2. ✅ Check if Pulse tables exist
3. ✅ Run database migrations (if needed)
4. ✅ Generate Prisma client
5. ✅ Load seed data
6. ✅ Verify all integrations
7. ✅ Verify event handlers
8. ✅ Test services
9. ✅ Generate deployment report

---

### **Option 2: Manual Step-by-Step Deployment**

If you prefer manual control:

#### **Step 1: Check Database Connection**

```bash
npx prisma db pull
```

#### **Step 2: Run Migrations**

```bash
# Check migration status
npx prisma migrate status

# Run migrations (production)
npx prisma migrate deploy

# OR run migrations (development)
npx prisma migrate dev --name pulse_module_setup
```

#### **Step 3: Generate Prisma Client**

```bash
npx prisma generate
```

#### **Step 4: Load Seed Data**

```bash
npm run setup:pulse:complete
```

#### **Step 5: Verify Everything**

```bash
npm run verify:pulse:complete
```

---

## 📊 **VERIFYING DEPLOYMENT**

### **Check Database Tables**

The following tables should exist:
- `PulseBalance`
- `PulseEvent`
- `PulseMission`
- `PulseMissionProgress`
- `PulseRuleset`
- `PulseRewardsCatalog`
- `PulseRedemption`
- `PulseRecognition`
- `PulseScoreSnapshot`
- `PulseBenchmarkIndex`
- `PulseTenantBenchmarkSubmission`
- `PulseConsent`
- `PulseDailyWellness`
- `PulseBadge`
- `PulseUserBadge`

**To verify**:
```bash
npx prisma studio
```

Or check in your database directly.

---

## 🔧 **TROUBLESHOOTING**

### **Issue: Migrations Fail**

**Solution**:
1. Check database connection: `npx prisma db pull`
2. Check if tables already exist
3. Try: `npx prisma migrate reset` (⚠️ WARNING: This will delete all data)
4. Then: `npx prisma migrate dev`

### **Issue: Tables Don't Exist After Migration**

**Solution**:
1. Check `prisma/schema.prisma` - ensure Pulse models are defined
2. Run: `npx prisma generate`
3. Run: `npx prisma migrate dev --name pulse_module_setup`
4. Verify: `npx prisma studio`

### **Issue: Seed Data Fails**

**Solution**:
1. Ensure migrations completed successfully
2. Check `prisma/seed/pulse.ts` exists
3. Run: `npm run setup:pulse:complete`
4. Check console for specific errors

### **Issue: Integration Verification Fails**

**Solution**:
1. Check these files exist and have correct code:
   - `lib/services/wms/OutboundService.ts` - Should have `wms.task.completed` event
   - `lib/services/iso-ims/capaService.ts` - Should have `iso-ims.capa.closed` event
   - `lib/services/iso-ims/ncrService.ts` - Should have `iso-ims.ncr.closed` event
2. Run: `npm run verify:pulse:complete`

---

## ✅ **POST-DEPLOYMENT VERIFICATION**

After deployment, verify:

1. **Database**: All 15 Pulse tables exist
2. **Seed Data**: Rulesets, badges, rewards loaded
3. **Integrations**: WMS, CAPA, NCR events working
4. **Event Handlers**: All 5 handlers registered
5. **Services**: All 7 services available
6. **API Routes**: All 11 routes accessible
7. **UI Pages**: All 11 pages load

**Run verification**:
```bash
npm run verify:pulse:complete
```

---

## 📝 **DEPLOYMENT REPORT**

After deployment, check:
- `docs/PULSE_MODULE_DEPLOYMENT_REPORT.md` - Detailed deployment report

---

## 🎉 **SUCCESS INDICATORS**

Deployment is successful when:
- ✅ All database tables exist
- ✅ Seed data loaded
- ✅ All integrations verified
- ✅ All event handlers registered
- ✅ All services available
- ✅ No errors in deployment report

---

## 🚀 **NEXT STEPS AFTER DEPLOYMENT**

1. **Configure Background Jobs**:
   - Set up cron jobs for daily missions, snapshots, benchmarks
   - See `docs/PULSE_MODULE_SETUP_GUIDE.md`

2. **Test User Flows**:
   - Complete a task in WMS → Verify Pulse points awarded
   - Close a CAPA → Verify Pulse points awarded
   - Close an NCR → Verify Pulse points awarded

3. **Monitor**:
   - Check logs for any errors
   - Monitor event publishing
   - Verify point calculations

---

**Ready to deploy? Run**: `npm run deploy:pulse` 🚀

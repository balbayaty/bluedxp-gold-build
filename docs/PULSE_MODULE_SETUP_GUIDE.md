# 💓 Pulse Module - Complete Setup Guide

**Quick Setup Time**: ~20 minutes  
**Status**: Ready for automated setup

---

## 🚀 **Quick Start (Automated)**

Run the complete setup script:

```bash
npm run setup:pulse:complete
```

**What it does**:
1. ✅ Checks if database tables exist
2. ✅ Runs migrations if needed
3. ✅ Loads seed data (rulesets, badges, rewards)
4. ✅ Verifies event handlers
5. ✅ Verifies module registration
6. ✅ Configures background jobs (if using Vercel)

---

## 📋 **Manual Setup Steps**

If you prefer to do it manually or the automated script fails:

### **Step 1: Database Migrations** (2 minutes)

```bash
# Run migrations
npx prisma migrate dev --name add_pulse_module

# Generate Prisma client
npx prisma generate
```

**Verify**: Check Prisma Studio
```bash
npx prisma studio
# Look for Pulse tables (15 tables total)
```

### **Step 2: Load Seed Data** (1 minute)

```bash
# For default tenant
node -e "require('./prisma/seed/pulse.ts').seedPulseModule('default')"

# For specific tenant
node -e "require('./prisma/seed/pulse.ts').seedPulseModule('your-tenant-id')"
```

**What gets created**:
- 3 default rulesets (warehouse, office, driver)
- 5 sample badges
- 10 sample rewards

### **Step 3: Configure Background Jobs** (10 minutes)

#### **Option A: Vercel Cron** (Recommended for Vercel deployments)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/pulse/daily-missions",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/pulse/daily-snapshots",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/pulse/weekly-snapshots",
      "schedule": "0 2 * * 0"
    },
    {
      "path": "/api/cron/pulse/monthly-benchmarks",
      "schedule": "0 3 1 * *"
    }
  ]
}
```

#### **Option B: External Cron Service**

Set up 4 scheduled HTTP requests:

1. **Daily Missions** (Midnight UTC)
   - URL: `https://your-domain.com/api/cron/pulse/daily-missions`
   - Schedule: `0 0 * * *`

2. **Daily Snapshots** (1 AM UTC)
   - URL: `https://your-domain.com/api/cron/pulse/daily-snapshots`
   - Schedule: `0 1 * * *`

3. **Weekly Snapshots** (Sunday 2 AM UTC)
   - URL: `https://your-domain.com/api/cron/pulse/weekly-snapshots`
   - Schedule: `0 2 * * 0`

4. **Monthly Benchmarks** (1st of month 3 AM UTC)
   - URL: `https://your-domain.com/api/cron/pulse/monthly-benchmarks`
   - Schedule: `0 3 1 * *`

**Services you can use**:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [Cronitor](https://cronitor.io)
- Your own server cron

#### **Option C: Manual Testing** (Development only)

Visit these URLs in your browser to test:
- `http://localhost:3002/api/cron/pulse/daily-missions`
- `http://localhost:3002/api/cron/pulse/daily-snapshots`
- `http://localhost:3002/api/cron/pulse/weekly-snapshots`
- `http://localhost:3002/api/cron/pulse/monthly-benchmarks`

### **Step 4: Verify Setup** (5 minutes)

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Pulse**:
   - Go to: `http://localhost:3002/pulse`
   - Should see overview dashboard

3. **Test API**:
   ```bash
   # Get overview (requires authentication)
   curl http://localhost:3002/api/pulse/overview
   ```

4. **Check event handlers**:
   - Look for console log: "Pulse: Event handlers initialized"
   - Should appear when server starts

5. **Test integration**:
   - Complete a task in WMS → Check Pulse points
   - Complete training in QHSE → Check Pulse points
   - Close CAPA in ISO-IMS → Check Pulse points

---

## ✅ **Verification Checklist**

After setup, verify:

- [ ] Database tables exist (15 tables)
- [ ] Seed data loaded (rulesets, badges, rewards)
- [ ] Event handlers initialized (console log)
- [ ] Module registered (check `/pulse` page loads)
- [ ] Background jobs configured (or manual testing works)
- [ ] API endpoints respond (test `/api/pulse/overview`)
- [ ] UI pages load (test `/pulse`, `/pulse/missions`, etc.)
- [ ] Event integration works (complete task → get points)

---

## 🔧 **Troubleshooting**

### **Problem: "Tables don't exist"**
**Solution**: 
```bash
npx prisma migrate dev --name add_pulse_module
npx prisma generate
```

### **Problem: "Module not found"**
**Solution**: 
```bash
npx prisma generate
```

### **Problem: "Seed data failed"**
**Solution**: 
- Check tenant ID is correct
- Verify database connection
- Check Prisma client is generated

### **Problem: "No missions showing"**
**Solution**: 
- Manually trigger: Visit `/api/cron/pulse/daily-missions`
- Check if job ran successfully
- Verify user has active role

### **Problem: "No points awarded"**
**Solution**: 
- Check event handlers initialized
- Verify other modules publish events
- Check rulesets exist for user's role
- Verify user completed action in source module

### **Problem: "Background jobs not running"**
**Solution**: 
- Check cron configuration
- Verify URLs are accessible
- Check server logs for errors
- Test manually first

---

## 📚 **Additional Resources**

- **End User Readiness Report**: `docs/PULSE_MODULE_END_USER_READINESS_REPORT.md`
- **Purpose & Logic**: See previous conversation for explanation
- **API Documentation**: Check API routes in `app/api/pulse/`
- **Service Documentation**: Check services in `lib/services/pulse/`

---

## 🎯 **After Setup**

Once setup is complete:

1. ✅ **Configure Rulesets**: Adjust scoring weights/caps in `/pulse/admin/rulesets`
2. ✅ **Add Rewards**: Create more rewards in `/pulse/admin/rewards`
3. ✅ **Create Missions**: Set up custom missions in `/pulse/admin/missions`
4. ✅ **Monitor Usage**: Check leaderboards and analytics
5. ✅ **Gather Feedback**: Get user input and iterate

---

**Setup Complete!** 🎉

The Pulse module is now ready for end users!

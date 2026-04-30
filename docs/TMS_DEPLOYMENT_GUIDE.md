# TMS Module - Deployment Guide

## 🚀 Production Deployment Guide

This guide walks you through deploying the Enhanced TMS module to production.

---

## 📋 **Pre-Deployment Checklist**

### **Environment Setup**
- [ ] Database configured (PostgreSQL)
- [ ] Environment variables set
- [ ] API keys configured (TGA, Daleeli, Bayan)
- [ ] Module registry updated
- [ ] Navigation configured

### **Code Verification**
- [ ] All code committed
- [ ] No linter errors
- [ ] Type checking passes
- [ ] Tests pass (if applicable)

### **Documentation**
- [ ] Documentation reviewed
- [ ] User guides ready
- [ ] API documentation published

---

## 🔧 **Step 1: Environment Configuration**

### **Required Environment Variables**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bluedxp

# TGA Integration (Optional)
TGA_API_KEY=your-tga-api-key
TGA_BASE_URL=https://api.tga.gov.sa

# Daleeli Integration (Optional)
DALEELI_API_KEY=your-daleeli-api-key
DALEELI_BASE_URL=https://api.daleeli.gov.sa

# Bayan Integration (Optional)
BAYAN_API_KEY=your-bayan-api-key
BAYAN_BASE_URL=https://api.bayan.gov.sa
```

### **Database Setup**

The TMS module will **auto-create tables** on first use. However, you can also run manual setup:

```sql
-- Tables will be created automatically by tmsDatabaseAdapter
-- Or run the SQL from lib/services/tms/database/tmsDatabaseAdapter.ts
```

---

## 📦 **Step 2: Code Deployment**

### **Option 1: Git Deployment**

```bash
# Pull latest code
git pull origin main

# Install dependencies (if needed)
npm install

# Build (if needed)
npm run build
```

### **Option 2: Manual Deployment**

1. Copy all TMS files to server
2. Ensure all dependencies installed
3. Restart application

---

## 🗄️ **Step 3: Database Migration**

### **Automatic (Recommended)**

Tables will auto-create on first API call. No manual migration needed.

### **Manual (Optional)**

If you prefer manual control:

```bash
# Connect to database
psql -U bluedxp -d bluedxp

# Run table creation SQL
# (See lib/services/tms/database/tmsDatabaseAdapter.ts)
```

---

## ✅ **Step 4: Verification**

### **Verify Module Registration**

1. Check module registry:
   ```bash
   # Access: http://localhost:3000/api/modules/list
   # Should see "tms" in the list
   ```

2. Check navigation:
   - TMS should appear in sidebar
   - All routes should be accessible

### **Verify Database**

1. Check tables created:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name LIKE 'tms_%';
   ```

2. Should see:
   - `tms_transport_jobs`
   - `tms_pod_records`
   - `tms_detention_records`
   - `tms_transit_time_records`
   - `tms_lanes`

### **Verify API Endpoints**

Test each endpoint:

```bash
# List jobs
curl http://localhost:3000/api/tms/jobs?tenantId=flex-logistics

# Should return: { "jobs": [], "total": 0 }
```

### **Verify UI**

1. Access dashboard: `http://localhost:3000/tms`
2. Should see TMS dashboard
3. Navigate to all pages
4. Verify no errors

---

## 📥 **Step 5: Initial Data Import**

### **Import Flex Logistics Data**

```bash
# Using script
npx ts-node scripts/import-flex-logistics-csv.ts "path/to/zoho data.csv"

# Or using UI
# 1. Go to /tms/jobs/import
# 2. Upload CSV file
# 3. Click "Import CSV"
```

### **Verify Import**

1. Check jobs list: `/tms/jobs`
2. Should see imported jobs
3. Check job details
4. Verify data completeness

---

## 🔔 **Step 6: Event Bus Configuration**

### **Verify Events Publishing**

Events should publish automatically. Verify:

1. Create a test job
2. Check event bus logs
3. Should see `tms.job.created` event

### **Configure Subscriptions** (If Needed)

Other modules can subscribe to TMS events:

```typescript
// Example subscription
eventBus.subscribe('tms.job.created', (event) => {
  // Handle job creation
});
```

---

## 🏛️ **Step 7: Regulatory Integration**

### **Configure TGA**

1. Get TGA API credentials
2. Set environment variables:
   ```env
   TGA_API_KEY=your-key
   TGA_BASE_URL=https://api.tga.gov.sa
   ```

3. Test connection:
   ```bash
   # Use /tms/regulatory page
   # Or test via API
   ```

### **Configure Daleeli**

1. Get Daleeli API credentials
2. Set environment variables
3. Test connection

### **Configure Bayan**

1. Get Bayan API credentials
2. Set environment variables
3. Test connection

---

## 📊 **Step 8: Monitoring Setup**

### **Application Monitoring**

Monitor:
- API response times
- Database query performance
- Error rates
- Event publishing

### **Database Monitoring**

Monitor:
- Table sizes
- Query performance
- Index usage
- Connection pool

### **Error Logging**

Ensure:
- Errors logged to central system
- Alerts configured for critical errors
- Log retention policy set

---

## 🔐 **Step 9: Security Verification**

### **Authentication**
- [ ] All routes require authentication
- [ ] Session management works
- [ ] Logout works correctly

### **Authorization**
- [ ] RBAC checks enforced
- [ ] Tenant isolation works
- [ ] Role-based access correct

### **Data Security**
- [ ] Input validation active
- [ ] SQL injection prevented
- [ ] XSS prevention active
- [ ] Data encryption configured

---

## 🧪 **Step 10: Testing**

### **Functional Testing**

Test all features:
- [ ] CSV import works
- [ ] Job CRUD works
- [ ] POD capture works
- [ ] Detention calculation works
- [ ] Transit time tracking works
- [ ] Lane management works
- [ ] Regulatory checks work

### **Performance Testing**

Verify:
- [ ] Page loads < 2 seconds
- [ ] API responses < 500ms
- [ ] Large CSV imports work
- [ ] No memory leaks

### **Integration Testing**

Verify:
- [ ] Database operations work
- [ ] Event publishing works
- [ ] Cross-module communication works
- [ ] Regulatory APIs work (if configured)

---

## 📈 **Step 11: Go Live**

### **Final Checks**

- [ ] All tests passed
- [ ] Monitoring configured
- [ ] Error logging active
- [ ] Backup strategy in place
- [ ] Support team notified
- [ ] Documentation published

### **Deployment**

1. **Deploy code** to production
2. **Verify** all endpoints work
3. **Import** initial data
4. **Monitor** for issues
5. **Notify** users

### **Post-Deployment**

1. Monitor logs for errors
2. Check performance metrics
3. Gather user feedback
4. Address any issues

---

## 🔄 **Rollback Plan**

If issues occur:

1. **Revert code** to previous version
2. **Restore database** from backup (if needed)
3. **Verify** system works
4. **Investigate** issues
5. **Fix** and redeploy

---

## 📝 **Maintenance**

### **Regular Tasks**

- Monitor performance
- Review error logs
- Update documentation
- Backup database
- Review security

### **Updates**

When updating:
1. Review changelog
2. Test in staging
3. Backup production
4. Deploy updates
5. Verify functionality

---

## ✅ **Deployment Complete**

Once all steps are complete:

- ✅ TMS module is live
- ✅ Data imported
- ✅ Features operational
- ✅ Monitoring active
- ✅ Users can access

**The TMS module is now in production!** 🎉

---

**Last Updated:** 2024-12-22  
**Status:** ✅ Ready for Deployment



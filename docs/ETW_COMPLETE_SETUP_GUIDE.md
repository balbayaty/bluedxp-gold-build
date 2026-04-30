# ETW Module - Complete Setup & Testing Guide

## 🚀 **COMPLETE SETUP INSTRUCTIONS**

### **Step 1: Database Migration**

#### Option A: Using Prisma (Recommended)

```bash
# 1. Stop any running dev server (to avoid file locks)
# Press Ctrl+C in the terminal running npm run dev

# 2. Generate Prisma client
npx prisma generate

# 3. Apply migration
npx prisma migrate deploy
# OR if in development:
npx prisma migrate dev --name add_etw_module
```

#### Option B: Using SQL Migration File

```bash
# PowerShell (Windows)
powershell -ExecutionPolicy Bypass -File scripts/apply-etw-migration.ps1

# Or manually with psql
psql $DATABASE_URL -f prisma/migrations/004_add_etw_module.sql
```

### **Step 2: Verify Database Schema**

```bash
# Validate Prisma schema
npx prisma validate

# Check database connection
npx prisma db pull
```

### **Step 3: Start Development Server**

```bash
npm run dev
```

The server should start on `http://localhost:3002`

### **Step 4: Test the Module**

#### Option A: Using Test Script

```bash
# PowerShell
powershell -ExecutionPolicy Bypass -File scripts/test-etw-module.ps1
```

#### Option B: Manual Testing

1. **Access ETW Module**:
   - Navigate to: `http://localhost:3002/etw`
   - You should see the ETW listing page

2. **Create Seed Data**:
   ```bash
   # Using curl (PowerShell)
   Invoke-WebRequest -Uri "http://localhost:3002/api/etw/seed" -Method POST -ContentType "application/json"
   
   # Or use Postman/Thunder Client
   POST http://localhost:3002/api/etw/seed
   ```

3. **Test API Endpoints**:
   - `GET /api/etw` - List ETWs
   - `GET /api/etw/[id]` - Get ETW details
   - `POST /api/etw` - Create ETW
   - `GET /api/etw/[id]/events` - Get events
   - `GET /api/etw/[id]/intelligence` - Get intelligence

4. **Test UI Pages**:
   - `/etw` - Main listing page
   - `/etw/create` - Create page
   - `/etw/[id]` - Detail page
   - `/etw/[id]/print` - Print page

## ✅ **VERIFICATION CHECKLIST**

After setup, verify:

- [ ] Database tables created (10 tables)
- [ ] Prisma client generated
- [ ] Server starts without errors
- [ ] ETW module visible in navigation
- [ ] API endpoints respond correctly
- [ ] UI pages load correctly
- [ ] Seed data creates successfully
- [ ] QR generation works
- [ ] PDF export works

## 🔧 **TROUBLESHOOTING**

### **Issue: Prisma Generate Fails with File Lock**

**Solution**:
1. Stop the dev server (Ctrl+C)
2. Close any IDEs/editors that might have Prisma files open
3. Run `npx prisma generate` again
4. If still failing, restart your computer

### **Issue: Migration Fails**

**Solution**:
1. Check database connection in `.env`
2. Ensure database user has CREATE TABLE permissions
3. Check if tables already exist (migration uses IF NOT EXISTS)
4. Review error messages for specific issues

### **Issue: Module Not Visible in Navigation**

**Solution**:
1. Verify module is registered: Check `lib/modules/index.ts`
2. Check module is enabled: `etwModule.enabled === true`
3. Verify user has required role permissions
4. Check browser console for errors

### **Issue: API Returns 401/403**

**Solution**:
1. Ensure you're authenticated
2. Check user role has required permissions
3. Verify tenant ID is set correctly
4. Check API Gateway middleware configuration

## 📊 **EXPECTED RESULTS**

After successful setup:

- ✅ **10 Database Tables**: All ETW tables created
- ✅ **13 API Endpoints**: All endpoints functional
- ✅ **6 UI Pages**: All pages accessible
- ✅ **4 Seed ETWs**: Local, Inter-city, Cross-border, Multimodal
- ✅ **Module Visible**: In navigation and module management

## 🎯 **NEXT STEPS**

Once setup is complete:

1. **Create Your First ETW**:
   - Navigate to `/etw/create`
   - Fill in the form
   - Submit

2. **Add Events**:
   - Open an ETW
   - Add chain-of-custody events
   - Verify timeline updates

3. **Generate QR Code**:
   - Open an ETW
   - Click "Generate QR"
   - Test verification

4. **Export PDF**:
   - Open an ETW
   - Click "Download PDF"
   - Verify PDF generation

## 📝 **SUPPORT**

If you encounter issues:

1. Check the error messages
2. Review the troubleshooting section
3. Check the logs in the terminal
4. Verify database connection
5. Ensure all dependencies are installed

---

**Status**: Ready for setup and testing! 🚀





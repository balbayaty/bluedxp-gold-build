# Database Migration Instructions

**Date:** 2025-12-19  
**Purpose:** Apply new database models for Export House, DMARC, and OPC UA features

---

## 🎯 What Needs to Be Done

New database tables need to be created for:
- Export House License Module (4 models)
- DMARC Monitoring System (4 models)
- OPC UA Machine Monitoring (ready for future models)

---

## 📋 Step-by-Step Instructions

### Step 1: Open Terminal
1. Open PowerShell or Command Prompt
2. Navigate to your project folder:
   ```
   cd "C:\Users\balba\hazalyze-asn-module"
   ```

### Step 2: Run Migration
Run this command:
```
npx prisma migrate dev --name add_export_house_dmarc_opcua_models
```

**What this does:**
- Creates new database tables
- Generates Prisma client
- Updates your database schema

**Expected output:**
```
✔ Generated Prisma Client
✔ Applied migration
```

### Step 3: Verify (Optional)
Check that tables were created:
```
npx prisma studio
```

This opens a visual database browser where you can see the new tables.

---

## 📊 New Database Tables

### Export House Module:
- `ExportHouseLicense` - License applications
- `ExportHouseComplianceRequirement` - Compliance tracking
- `ExportHouseBusinessPlan` - 3-year business plans

### DMARC Monitoring:
- `DMARCReport` - DMARC aggregate reports
- `DMARCRecord` - Individual DMARC records
- `DomainReputation` - Reputation scores
- `DMARCAlert` - Alerts and notifications

---

## ⚠️ Important Notes

1. **Backup First:** If you have production data, backup your database first
2. **Development Only:** These migrations are for development. Production migrations should be reviewed first
3. **No Data Loss:** These are new tables, so existing data won't be affected

---

## ✅ After Migration

Once migrations are complete:
1. Restart your development server (`npm run dev`)
2. All new features will work with the database
3. You can start using the new pages and APIs

---

**That's it! Your database is now ready for all new features.** 🎉














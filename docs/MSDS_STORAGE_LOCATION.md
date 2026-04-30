# MSDS Data Storage Location

## 📍 **Where Your MSDS Data is Stored**

MSDS data is stored in **multiple locations** with a fallback system:

---

## 🗄️ **PRIMARY STORAGE: Database**

### **Location:**
- **Table Name**: `msds`
- **Database**: Depends on your configuration (see below)

### **Supported Databases:**
1. **PostgreSQL** (default)
   - Table: `msds`
   - Database: From `DATABASE_URL` or `DATABASE_NAME` env variable
   - Default: `bluedxp` or `hazalyze`

2. **MongoDB**
   - Collection: `msds`
   - Database: From `DATABASE_NAME` env variable

3. **SQLite** (development/testing)
   - File: `./database.sqlite` (or path from `DATABASE_NAME`)
   - Table: `msds`

### **What Gets Stored:**
```sql
-- PostgreSQL Table Structure
CREATE TABLE msds (
  id VARCHAR PRIMARY KEY,
  product_name VARCHAR NOT NULL,
  cas_number VARCHAR,
  version VARCHAR,
  revision_date TIMESTAMP,
  supplier VARCHAR,
  file_url VARCHAR,
  file_type VARCHAR,
  file_size INTEGER,
  extracted_data JSONB,  -- All AI-extracted data
  status VARCHAR,         -- 'pending', 'approved', 'rejected'
  qr_code VARCHAR,
  qr_code_url VARCHAR,
  metadata JSONB,        -- Upload info, timestamps, etc.
  tenant_id VARCHAR,      -- Multi-tenant isolation
  created_by VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 💾 **FALLBACK STORAGE: In-Memory**

**If database is NOT configured:**
- Data is stored in **RAM** (in-memory)
- **⚠️ WARNING**: Data is **LOST** when server restarts
- Location: `lib/services/chemical/msdsStorage.ts` → `Map<string, MSDSStorageEntry>`

---

## 🔍 **SEARCH HISTORY STORAGE**

### **Primary:**
- **Database** (if configured)
- Table/Collection: `msds_search_history` (future implementation)

### **Fallback:**
- **Browser localStorage**
- Key: `msds_search_history_{tenantId}`
- Location: User's browser storage

---

## 🏢 **ERPNext Integration**

When MSDS is **approved**, it's also saved to:
- **ERPNext** (if configured)
- As an **Item** with custom fields
- Via API: `/api/erpnext/save-msds`

---

## ✅ **HOW TO CHECK WHERE YOUR DATA IS STORED**

### **Step 1: Check Your Environment Variables**

Look in your `.env.local` or `.env` file:

```bash
# Check if database is configured
DATABASE_URL=postgresql://user:password@localhost:5432/database
# OR
DATABASE_TYPE=postgresql
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=bluedxp
DATABASE_USER=bluedxp
DATABASE_PASSWORD=your_password
```

### **Step 2: Check Console Logs**

When the app starts, look for these messages:

**✅ Database Connected:**
```
✅ MSDS Database adapter: Using database storage
✅ PostgreSQL connected
```

**⚠️ No Database (Using In-Memory):**
```
⚠️ MSDS Database adapter: Database not configured, using in-memory fallback
```

### **Step 3: Check Database Directly**

**For PostgreSQL:**
```sql
-- Connect to your database
psql -h localhost -U bluedxp -d bluedxp

-- Check if msds table exists
\dt msds

-- Count MSDS records
SELECT COUNT(*) FROM msds;

-- View recent MSDS
SELECT id, product_name, cas_number, status, created_at 
FROM msds 
ORDER BY created_at DESC 
LIMIT 10;
```

**For SQLite:**
```bash
sqlite3 database.sqlite

-- Check table
.tables msds

-- Count records
SELECT COUNT(*) FROM msds;
```

**For MongoDB:**
```javascript
use bluedxp
db.msds.countDocuments()
db.msds.find().limit(10)
```

---

## 🔧 **HOW TO CONFIGURE DATABASE STORAGE**

### **Option 1: PostgreSQL (Recommended)**

1. **Set environment variable:**
```env
DATABASE_URL=postgresql://bluedxp:your_password@localhost:5432/bluedxp
```

2. **Or use individual variables:**
```env
DATABASE_TYPE=postgresql
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=bluedxp
DATABASE_USER=bluedxp
DATABASE_PASSWORD=your_password
```

3. **Create the table** (if it doesn't exist):
```sql
CREATE TABLE IF NOT EXISTS msds (
  id VARCHAR(255) PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  cas_number VARCHAR(50),
  version VARCHAR(50),
  revision_date TIMESTAMP,
  supplier VARCHAR(255),
  file_url TEXT,
  file_type VARCHAR(50),
  file_size INTEGER,
  extracted_data JSONB,
  status VARCHAR(50),
  qr_code VARCHAR(255),
  qr_code_url TEXT,
  metadata JSONB,
  tenant_id VARCHAR(255),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_msds_tenant_id ON msds(tenant_id);
CREATE INDEX idx_msds_status ON msds(status);
CREATE INDEX idx_msds_cas_number ON msds(cas_number);
CREATE INDEX idx_msds_created_at ON msds(created_at);
```

### **Option 2: SQLite (Development)**

```env
DATABASE_TYPE=sqlite
DATABASE_NAME=./database.sqlite
```

### **Option 3: MongoDB**

```env
DATABASE_TYPE=mongodb
DATABASE_HOST=localhost
DATABASE_PORT=27017
DATABASE_NAME=bluedxp
```

---

## 📊 **CURRENT STORAGE STATUS**

To check where your data is **currently** being stored, the system:

1. **First**: Tries to connect to database (from `DATABASE_URL` or `DATABASE_TYPE`)
2. **If successful**: Stores in database ✅
3. **If fails**: Falls back to in-memory storage ⚠️

**You can verify by:**
- Checking console logs on app startup
- Running a database query (if database is configured)
- Restarting the server (in-memory data will be lost)

---

## 🚨 **IMPORTANT NOTES**

1. **In-Memory Storage is TEMPORARY**
   - Data is lost when server restarts
   - Only use for development/testing
   - **Always configure a database for production**

2. **Multi-Tenant Isolation**
   - All data is filtered by `tenant_id`
   - Each tenant only sees their own data

3. **Data Persistence**
   - Database storage = ✅ Persistent
   - In-memory storage = ⚠️ Temporary
   - ERPNext = ✅ Persistent (only for approved MSDS)

---

## 🔍 **QUICK CHECK COMMAND**

Run this in your terminal to check database connection:

```bash
# For PostgreSQL
psql $DATABASE_URL -c "SELECT COUNT(*) FROM msds;"

# For SQLite
sqlite3 database.sqlite "SELECT COUNT(*) FROM msds;"
```

If the command works, your data is in the database! ✅

If it fails, data is in-memory (temporary). ⚠️


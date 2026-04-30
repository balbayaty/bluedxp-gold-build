# 🚀 DEPLOYMENT CHECKLIST
## Complete Production Deployment Guide

---

## ✅ **PRE-DEPLOYMENT CHECKLIST**

### **1. Environment Variables** (10 minutes)
Create `.env.local` with:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hazalyze
# OR for MongoDB
MONGODB_URI=mongodb://localhost:27017/hazalyze
# OR for SQLite (development only)
DATABASE_URL=file:./data.db

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Firebase (if using)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# WebSocket
NEXT_PUBLIC_APP_URL=http://localhost:3002

# PWA Push Notifications (optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...

# External APIs (optional)
CHEMWATCH_API_KEY=...
EPA_COMPTOX_API_KEY=...
OSHA_API_KEY=...

# MSDS-SKU Linking (NEW)
# WhatsApp Integration (optional)
WHATSAPP_ENABLED=false
WHATSAPP_PROVIDER=META_CLOUD_API
WHATSAPP_API_KEY=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...
```

---

### **2. Database Setup** (30 minutes)

#### **Option A: PostgreSQL** (Recommended)
```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql
# Windows: Download from postgresql.org

# Create database
createdb hazalyze

# Run migrations
npm run migrate
# OR manually:
psql hazalyze < lib/database/migrations/001_initial_schema.sql
```

#### **Option B: MongoDB**
```bash
# Install MongoDB
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb
# Windows: Download from mongodb.com

# Start MongoDB
mongod

# Database will be created automatically on first connection
```

#### **Option C: SQLite** (Development Only)
```bash
# SQLite is file-based, no installation needed
# Just ensure DATABASE_URL points to a file path
```

---

### **3. Install Dependencies** (5 minutes)

```bash
# Core dependencies (already in package.json)
npm install

# Optional but recommended:
npm install quagga          # For barcode scanning
npm install jspdf           # For PDF generation
npm install jspdf-autotable # For PDF tables
npm install xlsx            # For Excel generation
npm install pg              # For PostgreSQL
# OR
npm install mongodb         # For MongoDB
npm install redis           # For Redis caching (optional)
npm install socket.io       # For WebSocket (if not already installed)

# Event Bus (optional - only if using RabbitMQ)
npm install amqplib dotenv winston  # Optional dependencies
```

---

### **4. Build Application** (5 minutes)

```bash
# Production build
npm run build

# Test production build locally
npm start
```

---

### **5. Database Migrations** (2 minutes)

```bash
# Run migrations
npm run migrate

# OR manually run MSDS-SKU linking migration:
psql hazalyze -f lib/database/migrations/001_msds_sku_linking.sql

# Verify schema
# PostgreSQL:
psql hazalyze -c "\dt"
psql hazalyze -c "\d msds_sku_links"  # Verify MSDS-SKU linking tables

# MongoDB:
mongosh hazalyze --eval "db.getCollectionNames()"
```

---

## 🚀 **DEPLOYMENT OPTIONS**

### **Option 1: Vercel** (Recommended for Next.js)

1. **Connect Repository**
   - Go to vercel.com
   - Import your Git repository

2. **Configure Environment Variables**
   - Add all variables from `.env.local`
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel URL

3. **Database Setup**
   - Use Vercel Postgres (recommended)
   - OR connect external database
   - Update `DATABASE_URL` in environment variables

4. **Deploy**
   - Push to main branch
   - Vercel auto-deploys

5. **WebSocket Support**
   - Vercel supports WebSocket on Pro plan
   - OR use custom server (see Option 2)

---

### **Option 2: Custom Server (Docker/VM)**

1. **Build Docker Image** (if using Docker)
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["node", "server.js"]
```

2. **Run with Docker**
```bash
docker build -t hazalyze .
docker run -p 3002:3002 \
  -e DATABASE_URL=... \
  -e OPENAI_API_KEY=... \
  hazalyze
```

3. **Or Run Directly**
```bash
# Install dependencies
npm install

# Build
npm run build

# Run custom server (for WebSocket support)
node server.js
```

---

### **Option 3: Traditional Hosting (cPanel/Shared)**

1. **Upload Files**
   - Upload all files via FTP/SFTP
   - Ensure Node.js 18+ is available

2. **Install Dependencies**
   ```bash
   npm install --production
   ```

3. **Build**
   ```bash
   npm run build
   ```

4. **Configure**
   - Set environment variables in hosting panel
   - Point domain to `public` folder (if static)
   - OR use PM2 for Node.js process

5. **Start**
   ```bash
   pm2 start server.js --name hazalyze
   ```

---

## ⚙️ **POST-DEPLOYMENT CONFIGURATION**

### **1. Verify Services**

```bash
# Check database connection
curl http://localhost:3002/api/health

# Check AI services
# Go to /settings/ai and test API keys

# Check WebSocket
# Open browser console, should see WebSocket connection
```

### **2. Initialize Services**

- Go to `/settings/ai` and configure AI keys
- Go to `/settings/warehouse` and configure warehouse
- Go to `/settings/users` and create admin user

### **3. Test Features**

- ✅ Chemical Database: `/chemical-database`
- ✅ MSDS Management: `/msds`
- ✅ AI Vision: `/ai-vision`
- ✅ Inventory: `/chemical-inventory`
- ✅ Compliance: `/chemical-compliance`
- ✅ Reporting: `/reporting`
- ✅ Audit Trail: `/audit-trail`
- ✅ Facility Mapping: `/facility-mapping`
- ✅ **MSDS-SKU Linking: `/msds-sku-linking`** (NEW)
- ✅ **Customer Portal: `/customer-portal/approve`** (NEW)
- ✅ **Bulk Linking: `/msds-sku-linking/bulk`** (NEW)
- ✅ **Linking Analytics: `/msds-sku-linking/analytics`** (NEW)

---

## 🔒 **SECURITY CHECKLIST**

- [ ] All API keys in environment variables (not in code)
- [ ] Database credentials secured
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS configured properly
- [ ] Rate limiting enabled (if applicable)
- [ ] Authentication enabled
- [ ] RBAC configured
- [ ] Audit logging enabled
- [ ] Backup strategy in place

---

## 📊 **MONITORING SETUP**

### **1. Error Tracking**
- Set up Sentry or similar
- Add error tracking to API routes

### **2. Performance Monitoring**
- Use Vercel Analytics (if on Vercel)
- OR set up custom analytics

### **3. Database Monitoring**
- Monitor connection pool
- Set up slow query alerts
- Monitor disk space

---

## 🔄 **BACKUP STRATEGY**

### **Database Backups**
```bash
# PostgreSQL
pg_dump hazalyze > backup_$(date +%Y%m%d).sql

# MongoDB
mongodump --db hazalyze --out backup_$(date +%Y%m%d)

# SQLite
cp data.db backup_$(date +%Y%m%d).db
```

### **Automated Backups**
- Set up cron job for daily backups
- Store backups in cloud storage (S3, etc.)
- Test restore process

---

## 🚨 **TROUBLESHOOTING**

### **Database Connection Issues**
```bash
# Test connection
psql $DATABASE_URL
# OR
mongosh $MONGODB_URI
```

### **WebSocket Not Working**
- Ensure using `node server.js` (not `npm start`)
- Check firewall/port 3002
- Verify `NEXT_PUBLIC_APP_URL` is correct

### **Build Errors**
```bash
# Clear cache
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### **Missing Dependencies**
```bash
# Check package.json
npm install --save <missing-package>
```

---

## ✅ **FINAL VERIFICATION**

- [ ] All environment variables set
- [ ] Database connected and migrated
- [ ] Application builds successfully
- [ ] All services initialize
- [ ] WebSocket connects
- [ ] AI services work
- [ ] Database queries work
- [ ] File uploads work
- [ ] Reports generate
- [ ] PWA installs (if applicable)
- [ ] Mobile responsive
- [ ] All navigation links work
- [ ] Authentication works
- [ ] RBAC works

---

## 🎉 **YOU'RE READY!**

Your system is now production-ready! 🚀

**Total Setup Time:** ~40-60 minutes

**Need Help?**
- Check `SETUP_GUIDE.md` for detailed setup
- Check `COMPLETE_FINAL_STATUS.md` for feature list
- Review error logs for issues

---

**🎊 Congratulations! You have the world's most advanced Chemical Management platform!** 🎊


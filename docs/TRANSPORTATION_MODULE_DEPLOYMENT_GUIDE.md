# 🚀 Transportation Module - Deployment Guide

**Date**: 2025-01-27  
**Status**: Production Ready  
**Version**: 1.0.0

---

## 📋 **OVERVIEW**

This guide provides step-by-step instructions for deploying the Transportation Module to production. The module is 100% complete and ready for end-user migration.

---

## ✅ **PREREQUISITES**

### **System Requirements**
- Node.js 18+ 
- PostgreSQL 15+ (or MongoDB, SQLite for development)
- Redis (optional, for caching)
- Next.js 14+ runtime

### **Platform Requirements**
- BlueDXP Platform installed and running
- WMS Module enabled (dependency)
- Database connection configured

---

## 🔧 **STEP 1: ENVIRONMENT CONFIGURATION**

### **Required Environment Variables**

Create or update your `.env` file with the following variables:

```env
# ==========================================
# DATABASE CONFIGURATION (Required)
# ==========================================
DATABASE_URL=postgresql://user:password@localhost:5432/bluedxp
# OR for MongoDB:
# DATABASE_URL=mongodb://localhost:27017/bluedxp
# OR for SQLite (development):
# DATABASE_URL=file:./dev.db

# ==========================================
# AUTHENTICATION (Required)
# ==========================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# ==========================================
# TENANT CONFIGURATION (Required)
# ==========================================
BOOTSTRAP_TENANT_ID=your-primary-tenant-id

# ==========================================
# TRANSPORTATION MODULE (Optional)
# ==========================================
# Database persistence (optional - falls back to in-memory if not set)
# If DATABASE_URL is set, transportation will use it automatically

# ==========================================
# ZOHO INTEGRATION (Optional)
# ==========================================
ZOHO_API_URL=https://www.zohoapis.com
ZOHO_CLIENT_ID=your-zoho-client-id
ZOHO_CLIENT_SECRET=your-zoho-client-secret
ZOHO_REFRESH_TOKEN=your-zoho-refresh-token
ZOHO_ORGANIZATION_ID=your-zoho-organization-id

# ==========================================
# SAUDI GOVERNMENT INTEGRATIONS (Optional)
# ==========================================
# ELM/Rabet.sa Integration
ELM_API_URL=https://api.elm.sa
ELM_API_KEY=your-elm-api-key
ELM_ORGANIZATION_ID=your-elm-organization-id

# ==========================================
# IOT INTEGRATION (Optional)
# ==========================================
TRANSPORTATION_IOT_TYPE=BOTH  # DIRECT, GOVERNMENT, BOTH, or NONE
TRANSPORTATION_IOT_PROVIDERS=["provider1","provider2"]  # JSON array
TRANSPORTATION_GOV_IOT_ENABLED=true
TRANSPORTATION_GOV_COUNTRY=Saudi Arabia
TRANSPORTATION_GOV_PROVIDER=ELM  # ELM, RABET, or OTHER

# ==========================================
# ENTERPRISE DOCUMENT INTEGRATION (Optional)
# ==========================================
DOCUMENT_API_URL=https://your-document-system.com/api
DOCUMENT_API_KEY=your-document-api-key

# ==========================================
# OTHER OPTIONAL CONFIGURATIONS
# ==========================================
NODE_ENV=production
PORT=3000
```

### **Environment Variable Priority**

1. **Required**: `DATABASE_URL`, `JWT_SECRET`, `BOOTSTRAP_TENANT_ID`
2. **Recommended**: All other variables for full functionality
3. **Optional**: Integration variables (module works without them)

---

## 🗄️ **STEP 2: DATABASE SETUP**

### **Option A: PostgreSQL (Recommended for Production)**

```bash
# 1. Create database
createdb bluedxp

# 2. Run Prisma migrations
npm run prisma:migrate

# 3. Generate Prisma client
npm run prisma:generate
```

### **Option B: MongoDB**

```bash
# 1. Start MongoDB
mongod

# 2. Create database (automatic on first connection)
# The module will create collections automatically
```

### **Option C: SQLite (Development Only)**

```bash
# 1. Database file created automatically
# 2. Run migrations
npm run prisma:migrate
```

### **Database Models Created**

The following transportation models will be created:

- `transportation_route_plans`
- `transportation_touchpoints`
- `transportation_journey_analysis`
- `transportation_shipments`
- `transportation_quotes`
- `transportation_proposals`
- `transportation_customs_brokers`
- `transportation_customs_declarations`
- `transportation_payments`
- `transportation_incidents`
- `transportation_export_records`
- `transportation_carriers`
- `transportation_customs_authorities`
- `transportation_documents`
- `transportation_last_mile_routes`
- `transportation_load_plans`
- `transportation_network_models`
- `transportation_network_optimizations`

---

## 🚀 **STEP 3: MODULE ACTIVATION**

### **Automatic Activation**

The Transportation Module is **automatically enabled** by default. It initializes on platform startup.

### **Manual Verification**

Check that the module is enabled:

```typescript
// In lib/modules/index.ts
// Verify tmsModule.enabled === true
```

### **Module Initialization**

The module auto-initializes when:
1. Platform starts
2. `BOOTSTRAP_TENANT_ID` is set
3. Module is enabled in registry

Initialization includes:
- ✅ Database adapter initialization
- ✅ Ecosystem integrations
- ✅ Platform event subscriptions
- ✅ IoT integration (if configured)
- ✅ Government integrations (if configured)

---

## 🔐 **STEP 4: SECURITY CONFIGURATION**

### **Authentication**

All APIs require authentication. Ensure:
- ✅ JWT_SECRET is set and secure
- ✅ Authentication middleware is active
- ✅ User roles are configured

### **Authorization**

The module uses RBAC (Role-Based Access Control):
- ✅ 11 user roles supported
- ✅ Tenant isolation enforced
- ✅ API rate limiting active

### **Data Security**

- ✅ Input validation on all endpoints
- ✅ SQL injection prevention
- ✅ XSS prevention
- ✅ CSRF protection
- ✅ Tenant data isolation

---

## 📦 **STEP 5: DEPLOYMENT**

### **Development Deployment**

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables
cp .env.example .env
# Edit .env with your values

# 3. Run database migrations
npm run prisma:migrate

# 4. Start development server
npm run dev
```

### **Production Deployment**

```bash
# 1. Build the application
npm run build

# 2. Start production server
npm start

# OR using PM2
pm2 start npm --name "bluedxp-transportation" -- start

# OR using Docker
docker-compose up -d
```

### **Docker Deployment**

```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## ✅ **STEP 6: VERIFICATION**

### **Health Checks**

1. **Module Status**
   - Navigate to `/transportation`
   - Should show dashboard without errors

2. **API Endpoints**
   ```bash
   # Test shipments API
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/transportation/shipments
   ```

3. **Database Connection**
   - Check logs for "Transportation Module initialized"
   - No database connection errors

4. **Navigation**
   - Check sidebar navigation
   - All transportation menu items visible
   - All links work

### **Feature Verification Checklist**

- [ ] Main dashboard loads
- [ ] Shipments page works
- [ ] Carriers page works
- [ ] Customs pages work
- [ ] Analytics pages work
- [ ] API endpoints respond
- [ ] Database persistence works
- [ ] Navigation links work
- [ ] Authentication works
- [ ] Tenant isolation works

---

## 🔄 **STEP 7: INTEGRATION SETUP**

### **WMS Integration**

The Transportation Module depends on WMS:
- ✅ WMS Module must be enabled
- ✅ Event Bus integration automatic
- ✅ Cross-module events working

### **Zoho Integration (Optional)**

1. Get Zoho credentials
2. Set environment variables
3. Enable in module config:
   ```typescript
   // lib/modules/tms.ts
   config.integrations.zoho.enabled = true
   ```

### **Government Integrations (Optional)**

1. Get ELM/Rabet API credentials
2. Set environment variables
3. Integration auto-initializes if configured

### **IoT Integration (Optional)**

1. Configure IoT providers
2. Set environment variables
3. Integration auto-initializes if configured

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues**

#### **1. Module Not Initializing**

**Symptoms**: No transportation pages accessible

**Solutions**:
- Check `BOOTSTRAP_TENANT_ID` is set
- Verify module is enabled in `lib/modules/index.ts`
- Check console logs for errors

#### **2. Database Connection Errors**

**Symptoms**: "Database adapter initialization skipped"

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check database is running
- Verify database permissions
- Module will work with in-memory fallback

#### **3. Authentication Errors**

**Symptoms**: 401 Unauthorized on API calls

**Solutions**:
- Verify `JWT_SECRET` is set
- Check token is valid
- Verify user has proper role

#### **4. Navigation Not Showing**

**Symptoms**: Transportation menu not visible

**Solutions**:
- Check user role has access
- Verify navigation structure in `defaultNavigation.ts`
- Check module is enabled

#### **5. API Rate Limiting**

**Symptoms**: 429 Too Many Requests

**Solutions**:
- This is expected behavior
- Wait for rate limit window
- Adjust rate limits in middleware if needed

---

## 📊 **MONITORING**

### **Key Metrics to Monitor**

1. **Module Health**
   - Initialization status
   - Database connection status
   - Service availability

2. **Performance**
   - API response times
   - Database query performance
   - Page load times

3. **Errors**
   - API error rates
   - Database errors
   - Integration failures

4. **Usage**
   - Active shipments
   - API call volume
   - User activity

### **Logging**

The module logs:
- ✅ Initialization events
- ✅ Database operations
- ✅ Integration status
- ✅ Error messages

Check logs for:
- `🚀 Initializing Transportation Module...`
- `✅ Transportation Module initialized.`
- `⚠️ Transportation database adapter initialization skipped` (if database not configured)

---

## 🔄 **UPDATES & MAINTENANCE**

### **Updating the Module**

1. Pull latest code
2. Run migrations: `npm run prisma:migrate`
3. Restart application
4. Module auto-updates

### **Database Migrations**

```bash
# Create new migration
npm run prisma:migrate dev --name your_migration_name

# Apply migrations
npm run prisma:migrate deploy

# Reset database (development only)
npm run prisma:migrate reset
```

### **Backup & Recovery**

1. **Database Backup**
   ```bash
   # PostgreSQL
   pg_dump bluedxp > backup.sql
   
   # MongoDB
   mongodump --db bluedxp
   ```

2. **Restore**
   ```bash
   # PostgreSQL
   psql bluedxp < backup.sql
   
   # MongoDB
   mongorestore --db bluedxp
   ```

---

## 📚 **ADDITIONAL RESOURCES**

### **Documentation**
- `docs/TRANSPORTATION_MODULE_PRODUCTION_READINESS_REPORT.md` - Production readiness
- `docs/TRANSPORTATION_MODULE_COMPLETE_VERIFICATION.md` - Verification report
- `lib/modules/tms.ts` - Module configuration
- `lib/services/transportation/initialize.ts` - Initialization code

### **Support**
- Check logs for error messages
- Review module configuration
- Verify environment variables
- Check database connectivity

---

## ✅ **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**
- [ ] Environment variables configured
- [ ] Database created and accessible
- [ ] Database migrations run
- [ ] JWT_SECRET set and secure
- [ ] BOOTSTRAP_TENANT_ID set
- [ ] WMS Module enabled

### **Deployment**
- [ ] Application built successfully
- [ ] Application starts without errors
- [ ] Module initializes successfully
- [ ] Database connection works
- [ ] All services available

### **Post-Deployment**
- [ ] Main dashboard accessible
- [ ] Navigation menu visible
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] Database persistence working
- [ ] No errors in logs

---

## 🎯 **SUCCESS CRITERIA**

Your deployment is successful when:

✅ Module initializes without errors  
✅ All pages are accessible  
✅ API endpoints respond correctly  
✅ Database operations work  
✅ Navigation menu shows all items  
✅ Authentication and authorization work  
✅ Tenant isolation enforced  
✅ No critical errors in logs  

---

## 📞 **SUPPORT**

If you encounter issues:

1. Check the troubleshooting section
2. Review logs for error messages
3. Verify environment configuration
4. Check database connectivity
5. Verify module is enabled

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: 2025-01-27  
**Status**: ✅ Production Ready
















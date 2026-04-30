# 🚀 User Management System - End User Setup Guide

## Quick Start (5 Minutes)

### Option 1: Automated Setup (Recommended)

**Windows (PowerShell):**
```powershell
npm run setup:user-management:ps1
```

**Linux/macOS (Bash):**
```bash
chmod +x scripts/setup-user-management.sh
npm run setup:user-management:sh
```

**TypeScript (All Platforms):**
```bash
npm run setup:user-management
```

### Option 2: Manual Setup

#### Step 1: Environment Variables (1 minute)

Add to your `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bluedxp"
REDIS_URL="redis://localhost:6379"
REDIS_NAMESPACE="bluedxp"
```

#### Step 2: Database Migration (3 minutes)

```bash
# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

#### Step 3: Start Redis (1 minute)

**Windows:**
- Download from https://redis.io/download
- Or use WSL: `wsl redis-server`

**Linux:**
```bash
sudo apt-get install redis-server
redis-server
```

**macOS:**
```bash
brew install redis
redis-server
```

#### Step 4: Start Application

```bash
npm run dev
```

## Verification

### 1. Check Database Tables

```bash
npx prisma studio
```

You should see these tables:
- ✅ `User`
- ✅ `Role`
- ✅ `Permission`
- ✅ `APIKey`
- ✅ `UserSession`
- ✅ `CustomerUser`
- ✅ `UserDataVisibility`
- ✅ `PermissionTemplate`
- ✅ `WorkflowRule`

### 2. Test API Endpoints

```bash
# Test users endpoint
curl http://localhost:3002/api/users

# Test roles endpoint
curl http://localhost:3002/api/roles

# Test permission check
curl http://localhost:3002/api/permissions/check
```

### 3. Access UI

Visit: **http://localhost:3002/settings/users**

You should see:
- ✅ User management interface
- ✅ Customer hierarchy selector
- ✅ Permission matrix
- ✅ Role editor
- ✅ API key manager

## Troubleshooting

### Database Connection Failed

**Error:** `Cannot connect to database`

**Solution:**
1. Check PostgreSQL is running:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # Linux
   sudo systemctl status postgresql
   
   # macOS
   brew services list
   ```

2. Verify DATABASE_URL in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/bluedxp"
   ```

3. Test connection:
   ```bash
   npx prisma db pull
   ```

### Redis Connection Failed

**Error:** `Cannot connect to Redis`

**Solution:**
1. Check Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. Start Redis:
   ```bash
   redis-server
   ```

3. **Note:** System works without Redis, but permission checks will be slower (<100ms with Redis, ~200-500ms without)

### Migration Failed

**Error:** `Migration failed`

**Solution:**
1. Check database permissions
2. Verify DATABASE_URL is correct
3. Try manual migration:
   ```bash
   npx prisma migrate dev --name add_user_management_models
   ```

### Tables Not Found

**Error:** `Table does not exist`

**Solution:**
1. Run migration again:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. Verify in Prisma Studio:
   ```bash
   npx prisma studio
   ```

## Next Steps

### 1. Create Your First User

Visit: **http://localhost:3002/settings/users**

Click "Create User" and fill in:
- Email
- Name
- Role
- Tenant ID
- Customer assignments (optional)

### 2. Assign Permissions

1. Select a user
2. Click "Permissions"
3. Use the Permission Matrix to assign permissions
4. Or use AI Assistant for recommendations

### 3. Create Custom Roles

1. Go to Roles section
2. Click "Create Role"
3. Define permissions
4. Assign to users

### 4. Manage API Keys

1. Go to API Keys section
2. Click "Generate API Key"
3. Set scopes and permissions
4. Copy the key (shown only once!)

## Features Available

### ✅ User Management
- Create, edit, delete users
- Hierarchical customer assignments
- User-specific data visibility
- Bulk operations

### ✅ Role Management
- Dynamic role creation
- Role templates
- Role inheritance
- Role versioning

### ✅ Permission System
- 5-level hierarchical permissions
- Permission scopes (ALL, TENANT, ASSIGNED, etc.)
- Permission conditions (time, location, device)
- Permission templates

### ✅ API Key Management
- Generate API keys
- Key rotation
- Scoping and rate limiting
- Usage tracking

### ✅ AI Features
- Permission recommendations
- Risk assessment
- Compliance checking
- Best practice suggestions

### ✅ Analytics
- User activity tracking
- Permission usage analytics
- Security analytics
- Performance metrics

## Support

### Documentation
- `docs/USER_MANAGEMENT_SYSTEM.md` - System overview
- `docs/INTEGRATION_GUIDE.md` - Integration guide
- `docs/MIGRATION_GUIDE_USER_MANAGEMENT.md` - Migration details

### API Documentation
- Visit: **http://localhost:3002/api-docs** (if available)
- Or check: `app/api/users/route.ts` for examples

### Common Issues
- See `docs/COMPLETE_INTEGRATION_CHECKLIST.md` for troubleshooting

---

**🎉 You're all set! Start managing users now! 🎉**














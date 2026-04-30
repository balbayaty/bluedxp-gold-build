# Workspace Module - Quick Start Guide

Get your Workspace module up and running in 5 minutes!

## 🚀 Quick Setup (5 Steps)

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```
*Note: If you get a file lock error, close any running dev servers and try again.*

### Step 2: Run Database Migration & Seed Data

**Option A: Automated Script (Recommended)**
```bash
# Windows
npm run migrate:workspace

# Linux/Mac
npm run migrate:workspace:unix
```

**Option B: Manual Steps**
```bash
# Create migration
npx prisma migrate dev --name add_workspace_module

# Seed categories and widgets
npm run seed:workspace
```

**Option C: Use Setup Script**
```bash
npx ts-node scripts/setup-workspace.ts
```

### Step 4: Configure Environment (Optional)
Add to `.env` for Google Workspace integration:
```env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/workspace/integrations/google/callback"
```

### Step 5: Start Your Server
```bash
npm run dev
```

## 🎯 Access Your Workspace

Navigate to: **http://localhost:3000/workspace**

## ✅ Verify It's Working

1. **Check Database Tables**
   ```sql
   SELECT COUNT(*) FROM widget_categories; -- Should be 14
   SELECT COUNT(*) FROM widget_definitions; -- Should be 10+
   ```

2. **Test API Endpoints**
   ```bash
   # Get workspace config
   curl http://localhost:3000/api/v1/workspace/config
   
   # Get widgets
   curl http://localhost:3000/api/v1/workspace/widgets
   
   # Get categories
   curl http://localhost:3000/api/v1/workspace/categories
   ```

3. **Check UI**
   - Navigate to `/workspace`
   - You should see the workspace interface
   - Try adding a widget from the library

## 🆘 Troubleshooting

### Migration Already Exists?
If you see "migration already exists", you can:
- Mark as applied: `npx prisma migrate resolve --applied add_workspace_module`
- Or drop and recreate (⚠️ deletes data)

### Prisma Client Error?
```bash
# Regenerate client
npx prisma generate

# If still failing, try:
rm -rf node_modules/.prisma
npx prisma generate
```

### Tables Already Exist?
If tables exist but migration record is missing:
```bash
npx prisma migrate resolve --applied add_workspace_module
```

## 📚 Next Steps

1. **Customize Widgets**: Add your own widgets or modify existing ones
2. **Set Up Integrations**: Connect Google Workspace or email
3. **Create Layouts**: Build custom workspace layouts
4. **Read Documentation**: 
   - [User Guide](./USER_GUIDE.md) - How to use
   - [Developer Guide](./DEVELOPER_GUIDE.md) - How to extend
   - [Setup Guide](./SETUP_GUIDE.md) - Detailed setup

## 🎉 You're Done!

Your Workspace module is now ready to use. Start customizing your workspace!

---

**Need Help?** Check the [Completion Summary](./COMPLETION_SUMMARY.md) for full implementation details.


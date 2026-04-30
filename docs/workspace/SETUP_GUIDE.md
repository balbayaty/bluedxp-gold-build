# Workspace Module - Setup Guide

Complete setup guide for the Workspace module in BlueDXP Platform.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ database running
- Prisma CLI installed (`npm install -g prisma` or use `npx`)
- Database connection configured in `.env`

## Quick Setup

### Option 1: Automated Setup Script

```bash
npx ts-node scripts/setup-workspace.ts
```

This script will:
- ✅ Verify Prisma schema
- ✅ Generate Prisma client
- ✅ Check database status
- ✅ Seed default categories
- ✅ Verify setup

### Option 2: Manual Setup

#### Step 1: Generate Prisma Client

```bash
npx prisma generate
```

#### Step 2: Apply Database Migration

**Option A: Using Prisma Migrate (Interactive)**

```bash
npx prisma migrate dev --name add_workspace_module
```

**Option B: Using SQL Migration File**

If you prefer to apply the migration manually:

```bash
# Connect to your PostgreSQL database
psql -U your_user -d your_database

# Then run the SQL from:
# prisma/migrations/add_workspace_module/migration.sql
```

#### Step 3: Seed Default Categories

```bash
npx ts-node prisma/seed/workspaceCategories.ts
```

## Environment Variables

### Required

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"
```

### Optional (for Google Workspace Integration)

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/workspace/integrations/google/callback"

# For production:
# GOOGLE_REDIRECT_URI="https://yourdomain.com/workspace/integrations/google/callback"
```

### Required for Production (Security)

```env
# Workspace Token Encryption Key
# Generate with: openssl rand -base64 32
WORKSPACE_ENCRYPTION_KEY="your-32-byte-base64-encryption-key"
```

**⚠️ IMPORTANT**: 
- In **development**, the system will use a default key (with a warning)
- In **production**, `WORKSPACE_ENCRYPTION_KEY` **MUST** be set or the system will fail
- This key encrypts all OAuth tokens and passwords stored in the database
- **Never commit this key to version control**
- Generate a unique key for each environment (dev, staging, production)

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API, Drive API, Gmail API, Tasks API, Contacts API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Set authorized redirect URIs:
   - Development: `http://localhost:3000/workspace/integrations/google/callback`
   - Production: `https://yourdomain.com/workspace/integrations/google/callback`
7. Copy Client ID and Client Secret to `.env`

## Verification

After setup, verify everything is working:

### 1. Check Database Tables

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'widget_categories',
  'widget_definitions',
  'workspace_layouts',
  'user_widgets',
  'google_workspace_integrations',
  'email_integrations',
  'workspace_analytics'
);

-- Check default categories
SELECT name, slug, "isSystem" 
FROM widget_categories 
WHERE "isSystem" = true 
ORDER BY "order";
```

### 2. Test API Endpoints

```bash
# Get workspace configuration
curl http://localhost:3000/api/v1/workspace/config

# Get available widgets
curl http://localhost:3000/api/v1/workspace/widgets

# Get categories
curl http://localhost:3000/api/v1/workspace/categories
```

### 3. Test UI

1. Start development server: `npm run dev`
2. Navigate to: `http://localhost:3000/workspace`
3. You should see the workspace interface

## Troubleshooting

### Migration Errors

**Error: "Migration already applied"**
- The migration has already been run. This is fine, you can proceed.

**Error: "Table already exists"**
- Tables exist but migration record is missing. You can:
  - Mark migration as applied: `npx prisma migrate resolve --applied add_workspace_module`
  - Or drop tables and re-run migration (⚠️ **WARNING**: This will delete data)

### Prisma Client Errors

**Error: "Cannot find module '@prisma/client'"**
- Run: `npx prisma generate`

### Database Connection Errors

**Error: "Can't reach database server"**
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL is running
- Check firewall/network settings

### Google OAuth Errors

**Error: "GOOGLE_CLIENT_ID not configured"**
- Google Workspace integration is optional
- If you want to use it, set the environment variables
- The workspace will work without it, just without Google integration

## Next Steps

After successful setup:

1. **Explore the Workspace**: Navigate to `/workspace` and start customizing
2. **Read Documentation**:
   - [User Guide](./USER_GUIDE.md) - How to use the workspace
   - [Developer Guide](./DEVELOPER_GUIDE.md) - How to extend the workspace
3. **Configure Integrations**: Set up Google Workspace or email integrations
4. **Customize Widgets**: Add your own widgets or customize existing ones

## Support

For issues or questions:
- Check [Developer Guide](./DEVELOPER_GUIDE.md)
- Review [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- Check existing issues in the repository




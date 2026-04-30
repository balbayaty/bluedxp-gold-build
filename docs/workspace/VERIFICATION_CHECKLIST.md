# Workspace Module - Verification Checklist

Use this checklist to verify your Workspace module is properly set up and working.

## ✅ Pre-Migration Checklist

- [ ] Database is running and accessible
- [ ] `DATABASE_URL` is set in `.env` or `.env.local`
- [ ] Prisma CLI is installed (`npx prisma --version`)
- [ ] Node.js 18+ is installed
- [ ] All dependencies are installed (`npm install`)

## ✅ Migration Checklist

- [ ] Prisma schema is valid (`npx prisma format` succeeds)
- [ ] Migration script runs without errors
- [ ] All 7 workspace tables are created:
  - [ ] `widget_categories`
  - [ ] `widget_definitions`
  - [ ] `workspace_layouts`
  - [ ] `user_widgets`
  - [ ] `google_workspace_integrations`
  - [ ] `email_integrations`
  - [ ] `workspace_analytics`
- [ ] Prisma client is generated (`npx prisma generate` succeeds)
- [ ] Default categories are seeded (14 categories)
- [ ] Default widgets are seeded (10+ widgets)

## ✅ Database Verification

Run these SQL queries to verify:

```sql
-- Check tables exist
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
-- Should return 7 rows

-- Check categories
SELECT COUNT(*) FROM widget_categories WHERE "isSystem" = true;
-- Should return 14

-- Check widgets
SELECT COUNT(*) FROM widget_definitions WHERE "isActive" = true;
-- Should return 10+

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN (
  'widget_categories',
  'widget_definitions',
  'workspace_layouts',
  'user_widgets'
);
-- Should return multiple indexes
```

## ✅ Code Verification

- [ ] No TypeScript errors (`npm run build` or `tsc --noEmit`)
- [ ] No linting errors (`npm run lint`)
- [ ] All imports resolve correctly
- [ ] Module is registered in `lib/modules/index.ts`
- [ ] All API routes exist in `app/api/v1/workspace/`

## ✅ API Verification

Test these endpoints (replace with your auth token):

```bash
# Get workspace config
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/api/v1/workspace/config

# Get widgets
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/api/v1/workspace/widgets

# Get categories
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/api/v1/workspace/categories

# Get layouts (requires authenticated user)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/api/v1/workspace/layouts
```

Expected responses:
- Status code: 200 or 401 (if not authenticated)
- JSON response with data

## ✅ UI Verification

- [ ] Development server starts without errors (`npm run dev`)
- [ ] Can navigate to `/workspace` page
- [ ] Workspace interface loads
- [ ] Widget library is accessible
- [ ] Can add widgets to workspace
- [ ] Can save/load layouts
- [ ] Settings page is accessible (`/workspace/settings`)

## ✅ Integration Verification (Optional)

### Google Workspace Integration
- [ ] `GOOGLE_CLIENT_ID` is set in `.env`
- [ ] `GOOGLE_CLIENT_SECRET` is set in `.env`
- [ ] `GOOGLE_REDIRECT_URI` is set in `.env`
- [ ] OAuth callback page loads (`/workspace/integrations/google/callback`)
- [ ] Can initiate Google OAuth flow

### Email Integration
- [ ] Email integration UI loads
- [ ] Can add email account
- [ ] Email sync works (if configured)

## ✅ Performance Verification

- [ ] Page load time < 3 seconds
- [ ] Widget data loads within 5 seconds
- [ ] No console errors in browser
- [ ] No memory leaks (check browser DevTools)

## ✅ Security Verification

- [ ] All API routes require authentication
- [ ] Tenant isolation is enforced
- [ ] RBAC permissions are checked
- [ ] Input validation is in place
- [ ] No sensitive data in client-side code

## 🐛 Common Issues & Solutions

### Issue: Migration fails with "relation already exists"
**Solution**: Tables already exist. Mark migration as applied:
```bash
npx prisma migrate resolve --applied add_workspace_module
```

### Issue: Prisma client generation fails with file lock
**Solution**: Close dev server and try again:
```bash
# Stop dev server (Ctrl+C)
npx prisma generate
```

### Issue: Seed scripts fail
**Solution**: Run migration first, then seed:
```bash
npx prisma migrate dev --name add_workspace_module
npm run seed:workspace
```

### Issue: API returns 401 Unauthorized
**Solution**: Ensure you're authenticated. Check:
- User session is valid
- Auth token is included in requests
- User has workspace module access

### Issue: Widgets don't load
**Solution**: Check:
- Widget data endpoints exist
- API routes are properly configured
- Network requests in browser DevTools

## 📊 Verification Report Template

```
Workspace Module Verification Report
Date: ___________
Verified by: ___________

Pre-Migration: [ ] Pass [ ] Fail
Migration: [ ] Pass [ ] Fail
Database: [ ] Pass [ ] Fail
Code: [ ] Pass [ ] Fail
API: [ ] Pass [ ] Fail
UI: [ ] Pass [ ] Fail
Integration: [ ] Pass [ ] Fail [ ] N/A
Performance: [ ] Pass [ ] Fail
Security: [ ] Pass [ ] Fail

Issues Found:
1. 
2. 
3. 

Overall Status: [ ] Ready for Production [ ] Needs Fixes
```

## ✅ Final Sign-Off

Once all items are checked:
- [ ] All critical checks pass
- [ ] Documentation is reviewed
- [ ] Team is notified
- [ ] Module is ready for use

---

**Status**: Ready for verification ✅













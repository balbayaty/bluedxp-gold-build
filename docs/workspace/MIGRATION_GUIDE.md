# Workspace Module - Migration Guide

## Prerequisites

1. Database connection configured in `.env`
2. Prisma CLI installed
3. All dependencies installed (`npm install`)

## Migration Steps

### 1. Generate Prisma Client

```bash
npx prisma generate
```

### 2. Create and Apply Migration

```bash
npx prisma migrate dev --name add_workspace_module
```

Or use the migration script:

```bash
npm run migrate:workspace
```

### 3. Seed Default Categories

```bash
npx ts-node prisma/seed/workspaceCategories.ts
```

Or it will run automatically if you use the migration script.

## Verification

After migration, verify:

1. Check database tables:
   - `widget_categories`
   - `widget_definitions`
   - `workspace_layouts`
   - `user_widgets`
   - `google_workspace_integrations`
   - `email_integrations`
   - `workspace_analytics`

2. Check default categories are seeded:
   ```sql
   SELECT * FROM widget_categories WHERE "isSystem" = true;
   ```

3. Test API endpoints:
   - `GET /api/v1/workspace/config`
   - `GET /api/v1/workspace/widgets`
   - `GET /api/v1/workspace/categories`

## Rollback

If needed, rollback the migration:

```bash
npx prisma migrate resolve --rolled-back add_workspace_module
```














# Workspace Operation Guide

## Overview

The Workspace module is a **fully functional, real feature** integrated into the BlueDXP Platform. It allows users to create custom dashboard layouts with widgets that display real-time data from various modules.

## ✅ What Was Fixed

### 1. **Layout Creation** - NOW WORKING ✅
- **Before**: "Create Layout" button did nothing
- **After**: Opens a modal where you can:
  - Enter layout name (required)
  - Add description (optional)
  - Set category (optional)
  - Mark as default layout
  - Creates layout via API and saves to database

### 2. **Widget Adding** - NOW WORKING ✅
- **Before**: "Add Widget" button opened library but widgets couldn't be added
- **After**: 
  - Opens widget library
  - Click any widget to add it to current layout
  - Widgets are automatically positioned on the grid
  - Widgets are saved to database and appear immediately

### 3. **API Endpoints** - COMPLETE ✅
- `POST /api/v1/workspace/layouts` - Create new layout
- `POST /api/v1/workspace/widgets` - Add widget to layout
- `GET /api/v1/workspace/layouts` - Get user layouts
- `GET /api/v1/workspace/layouts/[id]` - Get specific layout
- `PUT /api/v1/workspace/layouts/[id]` - Update layout

## How to Use the Workspace

### Step 1: Create Your First Layout

1. Navigate to `/workspace` in the app
2. You'll see "No Layout Selected" message
3. Click **"Create Layout"** button
4. Fill in the form:
   - **Name**: e.g., "My Dashboard", "Operations View"
   - **Description**: Optional description
   - **Category**: Optional (e.g., "executive", "operations")
   - **Set as default**: Check if you want this as your default layout
5. Click **"Create Layout"**
6. Your new layout will appear immediately

### Step 2: Add Widgets to Your Layout

1. Once you have a layout, click **"Add Widget"** in the toolbar
2. Browse the widget library:
   - Widgets are organized by category
   - Use search to find specific widgets
   - Switch between grid and list view
3. Click on any widget to add it to your layout
4. Widgets are automatically positioned on the grid
5. Widgets appear immediately in your workspace

### Step 3: Customize Your Layout

1. Click **"Edit"** button in the layout header
2. In edit mode, you can:
   - **Drag widgets** to reposition them
   - **Resize widgets** using corner handles
   - **Remove widgets** using the remove button
3. Changes are automatically saved
4. Click **"Done"** to exit edit mode

### Step 4: Switch Between Layouts

1. Use the **"Select Layout"** dropdown in the toolbar
2. Choose any of your saved layouts
3. The layout loads immediately with all its widgets

## Available Widgets

Widgets are organized into categories:

- **Metrics**: Total Orders, Active Shipments, Compliance Score, etc.
- **Charts**: Revenue Trends, Order Status Distribution, etc.
- **Feeds**: Activity Feeds, Recent Updates, etc.
- **Integrations**: Google Calendar, Gmail, Google Drive, etc.

## Database Setup

### Widgets and Categories

Widgets need to be seeded into the database. Run:

```bash
# Seed widget categories first
npx ts-node prisma/seed/workspaceCategories.ts

# Then seed widgets
npx ts-node prisma/seed/workspaceWidgets.ts

# Or run both at once
npx ts-node scripts/seed-workspace.ts
```

### Verify Setup

Check if widgets are seeded:

```bash
npx ts-node scripts/verify-workspace.ts
```

## Architecture

### Components

- **`WorkspaceContainer`**: Main container that displays layouts and widgets
- **`WorkspaceToolbar`**: Top toolbar with layout selector and actions
- **`LayoutCreationModal`**: Modal for creating new layouts
- **`WidgetLibrary`**: Browse and select widgets to add
- **`WorkspaceGrid`**: Grid system for widget positioning
- **`WorkspaceWidget`**: Individual widget component

### Services

- **`workspaceService`**: Manages layouts, configurations
- **`widgetService`**: Manages widget definitions and user widgets
- **`categoryService`**: Manages widget categories

### Database Models

- **`WorkspaceLayout`**: User's saved layouts
- **`UserWidget`**: Widget instances in layouts
- **`WidgetDefinition`**: Available widget types
- **`WidgetCategory`**: Widget categories

## Integration with Platform

The Workspace module is **fully integrated** with:

- ✅ **Multi-tenant architecture**: Each user's layouts are tenant-isolated
- ✅ **RBAC**: Widget visibility based on user roles
- ✅ **Event Bus**: Publishes events when layouts/widgets are created/updated
- ✅ **Module Registry**: Aware of other modules for widget data
- ✅ **API Gateway**: All endpoints go through authentication

## Troubleshooting

### "No widgets available"

**Solution**: Run the seeding scripts:
```bash
npx ts-node scripts/seed-workspace.ts
```

### "Create Layout button does nothing"

**Solution**: Check browser console for errors. Ensure:
- Database is connected
- User is authenticated
- API endpoints are accessible

### "Widgets don't appear after adding"

**Solution**: 
1. Check browser console for API errors
2. Verify layout was created successfully
3. Refresh the page
4. Check database: `SELECT * FROM user_widgets WHERE layout_id = 'your-layout-id'`

### "Layout not saving"

**Solution**:
1. Check network tab for API errors
2. Verify user has permissions
3. Check database connection
4. Look for validation errors in API response

## Next Steps

1. **Seed widgets**: Run the seeding scripts if you haven't already
2. **Create a layout**: Use the "Create Layout" button
3. **Add widgets**: Browse the widget library and add widgets
4. **Customize**: Edit your layout to arrange widgets
5. **Set default**: Mark your favorite layout as default

## Summary

✅ **The Workspace is REAL and FULLY FUNCTIONAL**
- Not a mock page
- Fully integrated with the platform
- Connected to database
- Has complete API endpoints
- Widgets can be added and arranged
- Layouts are saved and persist

The only thing that was missing was the UI flow to create layouts and add widgets - which is now fixed!





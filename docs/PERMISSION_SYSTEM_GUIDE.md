# 🔐 Advanced Hierarchical Permission System Guide

## Overview

The Hazalyze platform features the most advanced and flexible permission system, allowing granular control at multiple levels:

- **Module Level** - Control access to entire modules (WMS, TMS, ISO-IMS, etc.)
- **Feature Level** - Control access to specific features within modules (Inbound, Outbound, Customs, etc.)
- **Tab Level** - Control access to specific tabs within features (ASN, Receiving, Declarations, etc.)
- **Action Level** - Control specific actions (read, write, delete, approve, export, etc.)
- **Field Level** - Control access to specific fields (partial edit permissions)
- **Time-Based** - Restrict access based on time of day or day of week

---

## 🏗️ Architecture

### Permission Hierarchy

```
Module (e.g., 'wms')
  └── Feature (e.g., 'wms.inbound')
      └── Tab (e.g., 'wms.inbound.asn')
          └── Actions (read, write, delete, etc.)
              └── Fields (allowed/restricted)
```

### Access Levels

- **`full`** - Complete access (all actions allowed)
- **`partial`** - Limited access (specific actions/fields only)
- **`read_only`** - View-only access (no modifications)
- **`none`** - No access

### Scopes

- **`ALL`** - Access to all resources
- **`ASSIGNED_CUSTOMERS`** - Only assigned customers
- **`ASSIGNED_WAREHOUSES`** - Only assigned warehouses
- **`OWN`** - Only own resources
- **`TENANT`** - All resources within tenant

---

## 📖 Usage Examples

### 1. Using Permission Guards in Components

#### Module-Level Protection

```tsx
import ModuleGuard from '@/components/role-based/ModuleGuard'

<ModuleGuard moduleId="wms" requiredAccess="read_only">
  <WMSDashboard />
</ModuleGuard>
```

#### Feature-Level Protection

```tsx
import FeatureGuard from '@/components/role-based/FeatureGuard'

<FeatureGuard featureId="wms.inbound" requiredAccess="read_write">
  <InboundOperations />
</FeatureGuard>
```

#### Tab-Level Protection

```tsx
import TabGuard from '@/components/role-based/TabGuard'

<TabGuard tabId="wms.inbound.asn" requiredAccess="full">
  <ASNManagement />
</TabGuard>
```

#### Action-Level Protection

```tsx
import ActionGuard from '@/components/role-based/ActionGuard'

<ActionGuard 
  moduleId="wms" 
  featureId="wms.inbound" 
  action="write"
>
  <CreateButton />
</ActionGuard>
```

### 2. Using Permission Hooks

```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { 
    hasModuleAccess, 
    hasFeatureAccess, 
    hasTabAccess,
    canPerformAction 
  } = useAuth()

  // Check module access
  if (!hasModuleAccess('wms', 'read_only')) {
    return <div>No access to WMS</div>
  }

  // Check feature access
  if (!hasFeatureAccess('wms.inbound', 'read_write')) {
    return <div>Cannot edit inbound operations</div>
  }

  // Check tab access
  if (!hasTabAccess('wms.inbound.asn', 'full')) {
    return <div>Limited access to ASN tab</div>
  }

  // Check action permission
  if (!canPerformAction('wms', 'wms.inbound', undefined, 'delete')) {
    return <button disabled>Delete (No Permission)</button>
  }

  return <YourContent />
}
```

### 3. Programmatic Permission Checks

```tsx
import { 
  hasModuleAccess, 
  hasFeatureAccess, 
  canPerformAction 
} from '@/utils/permissions'
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user } = useAuth()

  const canEdit = hasFeatureAccess(user, 'wms.inventory', 'read_write')
  const canDelete = canPerformAction(user, 'wms', 'wms.inventory', undefined, 'delete')

  return (
    <div>
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
    </div>
  )
}
```

---

## 🎛️ Managing Permissions

### Via User Management UI

1. Navigate to **Settings → Users**
2. Click the **Permissions** button (shield icon) for any user
3. Use the **Permission Manager** to:
   - Expand modules to see features
   - Expand features to see tabs
   - Click "Add Permission" to grant access
   - Configure access level (full, partial, read_only, none)
   - Select allowed actions (read, write, delete, approve, etc.)
   - Set scope (ALL, ASSIGNED_CUSTOMERS, etc.)
   - Save changes

### Programmatically

```typescript
import { HierarchicalPermission } from '@/types/user'

const newPermission: HierarchicalPermission = {
  moduleId: 'wms',
  featureId: 'wms.inbound',
  tabId: 'wms.inbound.asn',
  moduleAccess: 'full',
  featureAccess: 'full',
  tabAccess: 'read_only', // Tab is read-only even though feature is full
  actions: ['read', 'export'],
  scope: 'ASSIGNED_WAREHOUSES',
  allowedFields: ['asnNumber', 'status'], // For partial edit
  restrictedFields: ['customerId'], // Cannot change customer
}

// Update user permissions
updateUser({
  hierarchicalPermissions: [
    ...user.hierarchicalPermissions || [],
    newPermission
  ]
})
```

---

## 🔍 Permission Resolution Logic

Permissions cascade from most specific to least specific:

1. **Tab-level permissions** are checked first
2. If no tab permission, **feature-level permissions** are checked
3. If no feature permission, **module-level permissions** are checked
4. If no module permission, **legacy permissions** are checked
5. If none match, access is **denied**

### Example Resolution

```typescript
// User has:
// - Module 'wms': full access
// - Feature 'wms.inbound': read_only
// - Tab 'wms.inbound.asn': full access

// Checking 'wms.inbound.asn' → Returns: full (tab-level)
// Checking 'wms.inbound.receiving' → Returns: read_only (feature-level)
// Checking 'wms.outbound' → Returns: full (module-level)
```

---

## 📋 Available Modules

- `wms` - Warehouse Management System
- `tms` - Transportation Management System
- `iso-ims` - ISO Integrated Management System
- `msds` - Material Safety Data Sheets
- `qhse` - Quality, Health, Safety, Environment
- `ai` - AI & Intelligent Orchestration
- `integration` - Integrations
- `maas` - Manufacturing as a Service
- `proposals-rfq` - Proposals & RFQ
- `settings` - System Settings
- `reports` - Reports
- `analytics` - Analytics
- `business_intelligence` - Business Intelligence

---

## 🎯 Best Practices

1. **Start Broad, Narrow Down**
   - Grant module-level access first
   - Then refine with feature/tab-level permissions

2. **Use Read-Only by Default**
   - Grant read-only access initially
   - Upgrade to write access only when needed

3. **Leverage Scopes**
   - Use `ASSIGNED_WAREHOUSES` for warehouse operators
   - Use `ASSIGNED_CUSTOMERS` for account managers
   - Use `OWN` for customer users

4. **Document Custom Permissions**
   - Document why custom permissions were granted
   - Review permissions periodically

5. **Test Permission Changes**
   - Test with different user roles
   - Verify cascading permissions work correctly

---

## 🚀 Advanced Features

### Field-Level Restrictions

```typescript
const permission: HierarchicalPermission = {
  moduleId: 'wms',
  featureId: 'wms.inventory',
  actions: ['partial_edit'],
  allowedFields: ['quantity', 'location'], // Can only edit these
  restrictedFields: ['sku', 'customerId'], // Cannot edit these
}
```

### Time-Based Restrictions

```typescript
const permission: HierarchicalPermission = {
  moduleId: 'wms',
  featureId: 'wms.picking',
  actions: ['write'],
  timeRestrictions: {
    daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday only
    hours: { start: 8, end: 18 }, // 8 AM - 6 PM only
    timezone: 'Asia/Riyadh',
  },
}
```

---

## 🔧 Troubleshooting

### Permission Not Working?

1. Check if permission exists at the correct level
2. Verify scope matches context (customerId, warehouseId)
3. Check time restrictions if applicable
4. Verify user status is ACTIVE
5. Check for conflicting permissions

### Need Help?

- Review permission hierarchy
- Check permission resolution logic
- Use browser console to debug permission checks
- Contact system administrator

---

## 📚 Related Files

- `types/user.ts` - Permission type definitions
- `utils/permissions.ts` - Permission checking utilities
- `components/role-based/` - Permission guard components
- `components/permissions/PermissionManager.tsx` - Permission management UI
- `contexts/AuthContext.tsx` - Authentication and permission context

---

**Last Updated:** $(Get-Date -Format 'yyyy-MM-dd')
**Version:** 1.0.0


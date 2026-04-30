# 🔗 User Management System - Integration Guide

## Overview

This guide shows how to integrate the new User Management System with existing BlueDXP modules and pages.

## Quick Integration Steps

### 1. Update Existing User Management Page

Replace the existing user management page with new components:

```typescript
// app/settings/users/page.tsx
import CustomerHierarchySelector from '@/components/user-management/CustomerHierarchySelector'
import UserDataVisibilitySettings from '@/components/user-management/UserDataVisibilitySettings'
import PermissionMatrix from '@/components/user-management/PermissionMatrix'
import AIPermissionAssistant from '@/components/user-management/AIPermissionAssistant'
import { userService } from '@/lib/services/user'

// Use new components in your form
<CustomerHierarchySelector
  value={customerAssignments}
  onChange={setCustomerAssignments}
  tenantId={tenantId}
/>

<UserDataVisibilitySettings
  customerId={selectedCustomerId}
  value={dataVisibility}
  onChange={setDataVisibility}
/>

<PermissionMatrix
  userId={userId}
  permissions={permissions}
  onChange={setPermissions}
/>
```

### 2. Update ViewContext Usage

The ViewContext now supports hierarchical customers:

```typescript
import { viewContextService } from '@/lib/services/user'

// Build context with hierarchical support
const context = await viewContextService.buildViewContext(userId)

// Apply to queries
const query = viewContextService.applyViewContextToQuery(baseQuery, context)
```

### 3. Update Permission Checks

Use the new permission service:

```typescript
import { permissionService } from '@/lib/services/user'

// Check permission with 5-level hierarchy
const hasPermission = await permissionService.hasPermission(userId, {
  module: 'wms',
  feature: 'inbound',
  tab: 'asn',
  action: 'read',
  field: 'quantity',
}, {
  customerId: 'customer-123',
  subCustomerId: 'sub-customer-456',
})
```

### 4. Integrate with Existing Auth

The system integrates with existing auth:

```typescript
// contexts/AuthContext.tsx
import { userService } from '@/lib/services/user'

// Get user with hierarchical assignments
const user = await userService.getUserById(userId)

// User now includes:
// - customerAssignments (hierarchical)
// - hierarchicalPermissions (5-level)
// - userDataVisibility (per customer)
```

## Module Integration Examples

### WMS Module

```typescript
// Filter ASNs by user's customer assignments
import { viewContextService } from '@/lib/services/user'

const context = await viewContextService.buildViewContext(userId)
const asns = await prisma.asn.findMany(
  viewContextService.applyViewContextToQuery({
    where: {},
  }, context)
)
```

### TMS Module

```typescript
// Check if user can view shipment
import { permissionService } from '@/lib/services/user'

const canView = await permissionService.hasPermission(userId, {
  module: 'tms',
  feature: 'shipments',
  action: 'read',
}, {
  customerId: shipment.customerId,
})
```

### ISO-IMS Module

```typescript
// Filter incidents by user's data visibility
import { viewContextService } from '@/lib/services/user'

const context = await viewContextService.buildViewContext(userId)
// Context includes userDataVisibility rules
```

## API Integration

### Using the REST API

```typescript
// Create user with hierarchical customer assignment
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
    role: 'CUSTOMER_USER',
    tenantId: 'tenant-123',
    customerAssignments: [
      {
        customerId: 'customer-123',
        subCustomerId: 'sub-customer-456',
        dataVisibility: {
          showOnlyAssignedData: true,
          customFields: ['orders', 'inventory'],
        },
      },
    ],
  }),
})
```

### Using the Services Directly

```typescript
import { userService, permissionService } from '@/lib/services/user'

// Create user
const user = await userService.createUser({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'CUSTOMER_USER',
  tenantId: 'tenant-123',
  customerAssignments: [/* ... */],
})

// Check permission
const canRead = await permissionService.hasPermission(user.id, {
  module: 'wms',
  action: 'read',
})
```

## Component Integration

### In Existing Forms

```typescript
import {
  CustomerHierarchySelector,
  UserDataVisibilitySettings,
  PermissionMatrix,
} from '@/components/user-management'

// Use in your form
<form>
  <CustomerHierarchySelector
    value={assignments}
    onChange={setAssignments}
    tenantId={tenantId}
  />
  
  {selectedCustomer && (
    <UserDataVisibilitySettings
      customerId={selectedCustomer.id}
      value={visibility}
      onChange={setVisibility}
    />
  )}
  
  <PermissionMatrix
    userId={userId}
    permissions={permissions}
    onChange={setPermissions}
  />
</form>
```

## Migration from Old System

### Step 1: Update User Queries

**Before**:
```typescript
const users = await prisma.user.findMany({
  where: { tenantId, assignedCustomers: { has: customerId } },
})
```

**After**:
```typescript
const users = await userService.getUsers({
  tenantId,
  assignedCustomerId: customerId,
})
```

### Step 2: Update Permission Checks

**Before**:
```typescript
if (user.permissions.includes('wms.read')) { /* ... */ }
```

**After**:
```typescript
const hasPermission = await permissionService.hasPermission(userId, {
  module: 'wms',
  action: 'read',
})
```

### Step 3: Update ViewContext

**Before**:
```typescript
const context = createViewContext(userId, userRole, tenantId, {
  customerFilter: { type: 'ASSIGNED', customerIds: user.assignedCustomers },
})
```

**After**:
```typescript
const context = await viewContextService.buildViewContext(userId)
// Automatically includes hierarchical customers and data visibility
```

## Testing Integration

### Test Permission Checks

```typescript
// Test permission with different scopes
const tests = [
  { module: 'wms', action: 'read', scope: 'ALL' },
  { module: 'wms', action: 'read', scope: 'ASSIGNED_CUSTOMERS' },
  { module: 'wms', action: 'read', scope: 'OWN' },
]

for (const test of tests) {
  const result = await permissionService.hasPermission(userId, test)
  console.log(`${test.scope}: ${result}`)
}
```

### Test ViewContext

```typescript
// Test view context filtering
const context = await viewContextService.buildViewContext(userId)
const query = viewContextService.applyViewContextToQuery({ where: {} }, context)
const results = await prisma.asn.findMany(query)
console.log(`Filtered ${results.length} ASNs`)
```

## Troubleshooting

### Permission Checks Failing

1. Check user has permissions assigned
2. Verify scope matches user's assignments
3. Check permission cache (Redis)

### ViewContext Not Filtering

1. Verify customer assignments exist
2. Check userDataVisibility rules
3. Ensure query includes customerId field

### Components Not Rendering

1. Check dependencies installed
2. Verify component imports
3. Check for TypeScript errors

---

**Integration Status**: ✅ Ready
**Next Step**: Update your existing pages to use new components!














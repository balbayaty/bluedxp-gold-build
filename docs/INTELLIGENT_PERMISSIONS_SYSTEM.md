# 🛡️ INTELLIGENT PERMISSIONS SYSTEM

## Overview

The world's most flexible permission system with intelligent compliance logic. This system ensures users **NEVER** see tabs or features that won't work, while maintaining maximum flexibility down to the tab level.

## Key Features

### 🧠 Intelligent Compliance Engine
- **Feature Health Checking**: Automatically checks if features are functional before showing them
- **Dependency Resolution**: Ensures all module dependencies are met
- **Real-time Health Monitoring**: Tracks feature health with caching
- **Smart Filtering**: Prevents showing broken/non-functional features

### 🎯 Tab-Level Permissions
- **Granular Control**: Permissions down to individual tabs
- **Hierarchical Inheritance**: Module → Feature → Tab inheritance
- **Context-Aware**: Customer/warehouse-specific permissions
- **Flexible Actions**: Read, write, manage, approve, export, etc.

### 🔄 Safe Fallbacks
- **Database Integration**: Full database support when enabled
- **Mock Data Fallback**: Automatically falls back to mock data if database unavailable
- **Feature Flags**: Control what's enabled via environment variables
- **Zero Breaking Changes**: App continues working even if new features fail

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              PERMISSION VALIDATION SERVICE              │
│  (Main entry point for components)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         INTELLIGENT COMPLIANCE ENGINE                   │
│  - Feature Health Registry                              │
│  - Permission Checking                                  │
│  - Tab Filtering                                        │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Module Registry │    │  Permission     │
│  (Health Check)  │    │  Engine         │
└─────────────────┘    └─────────────────┘
```

## Usage

### In React Components

```typescript
import { useTabAccess, useModuleAccess } from '@/hooks/usePermissionValidation'

function MyComponent() {
  const { canShow, canInteract, health } = useTabAccess('wms.inventory.real-time')
  const { hasAccess } = useModuleAccess('wms')
  
  if (!canShow) {
    return <div>Access denied or feature not functional</div>
  }
  
  return (
    <div>
      {canInteract ? (
        <button>Edit</button>
      ) : (
        <div>Read-only view</div>
      )}
    </div>
  )
}
```

### In API Routes

```typescript
import { permissionValidationService } from '@/lib/services/permissions'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  const canAccess = await permissionValidationService.canAccessTab(
    user,
    'wms.inventory.real-time'
  )
  
  if (!canAccess.allowed) {
    return NextResponse.json({ error: canAccess.reason }, { status: 403 })
  }
  
  // Proceed with data fetching
}
```

### Filtering Tabs

```typescript
import { filterAccessibleTabs } from '@/lib/services/permissions'

const allTabs = ['wms.inventory.list', 'wms.inventory.real-time', 'wms.orders.list']
const accessibleTabs = await filterAccessibleTabs(user, allTabs)

// Only shows tabs user can access AND that are functional
```

## Services

### 1. Intelligent Compliance Engine
**Location**: `lib/services/permissions/intelligentComplianceEngine.ts`

**Key Functions**:
- `canShowTab()` - Main function to check if tab should be visible
- `checkMultipleTabs()` - Batch checking
- `filterTabs()` - Filter accessible tabs
- `registerHealthChecker()` - Register custom health checkers

### 2. Permission Validation Service
**Location**: `lib/services/permissions/permissionValidationService.ts`

**Key Functions**:
- `canAccessTab()` - Check tab access
- `hasModuleAccess()` - Check module access
- `hasFeatureAccess()` - Check feature access
- `filterAccessibleTabs()` - Filter tabs by permission

### 3. User Service
**Location**: `lib/services/user/userService.ts`

**Features**:
- Database integration with mock fallback
- CRUD operations
- Permission management
- Multi-tenant support

### 4. Settings Service
**Location**: `lib/services/settings/settingsService.ts`

**Features**:
- Database integration with mock fallback
- Category-based organization
- Type-safe settings
- Validation and constraints

## API Endpoints

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

### Settings
- `GET /api/settings` - List settings
- `POST /api/settings` - Create setting
- `GET /api/settings/[key]` - Get setting
- `PUT /api/settings/[key]` - Update setting
- `DELETE /api/settings/[key]` - Delete setting

## Feature Flags

Control behavior via environment variables:

```bash
# Enable database for users
USE_DATABASE_USERS=true

# Enable database for settings
USE_DATABASE_SETTINGS=true

# Enable mock fallback (default: true)
ENABLE_MOCK_USER_FALLBACK=true
ENABLE_MOCK_SETTINGS_FALLBACK=true

# Enable APIs
ENABLE_USER_API=true
ENABLE_SETTINGS_API=true
```

## Health Checkers

Register custom health checkers for features:

```typescript
import { intelligentComplianceEngine } from '@/lib/services/permissions'

intelligentComplianceEngine.registerHealthChecker(
  'wms',
  'wms.inventory',
  'wms.inventory.real-time',
  async () => {
    // Check if real-time features are enabled
    return process.env.ENABLE_REALTIME_FEATURES === 'true'
  }
)
```

## Permission Structure

### Hierarchical Permissions

```typescript
{
  moduleId: 'wms',
  moduleAccess: 'full' | 'partial' | 'read_only' | 'none',
  featureId: 'wms.inventory',
  featureAccess: 'full' | 'partial' | 'read_only' | 'none',
  tabId: 'wms.inventory.real-time',
  tabAccess: 'full' | 'partial' | 'read_only' | 'none',
  actions: ['read', 'write', 'manage'],
  scope: 'ALL' | 'ASSIGNED_CUSTOMERS' | 'ASSIGNED_WAREHOUSES' | 'OWN' | 'TENANT'
}
```

## Safety Features

1. **Mock Data Fallback**: Always falls back to mock data if database fails
2. **Feature Flags**: Control what's enabled
3. **Health Checking**: Prevents showing broken features
4. **Zero Breaking Changes**: Existing code continues to work
5. **Graceful Degradation**: App works even if new features fail

## Best Practices

1. **Always use hooks in components**: `useTabAccess()`, `useModuleAccess()`
2. **Check health before showing tabs**: Use `canAccessTab()` in API routes
3. **Filter tabs intelligently**: Use `filterAccessibleTabs()` for navigation
4. **Register health checkers**: For features with dependencies
5. **Use feature flags**: Control rollout gradually

## Examples

### Example 1: Conditional Tab Rendering

```typescript
function InventoryPage() {
  const tabs = ['wms.inventory.list', 'wms.inventory.real-time', 'wms.inventory.analytics']
  const { accessibleTabs } = useAccessibleTabs(tabs)
  
  return (
    <Tabs>
      {accessibleTabs.map(tabId => (
        <Tab key={tabId} id={tabId} />
      ))}
    </Tabs>
  )
}
```

### Example 2: API Route Protection

```typescript
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)
  
  const canAccess = await permissionValidationService.canAccessTab(
    user,
    'wms.inventory.real-time'
  )
  
  if (!canAccess.allowed) {
    return NextResponse.json(
      { error: canAccess.reason },
      { status: 403 }
    )
  }
  
  // Fetch data
  const data = await fetchInventoryData()
  return NextResponse.json({ data })
}
```

### Example 3: Health Checker Registration

```typescript
// In app initialization
intelligentComplianceEngine.registerHealthChecker(
  'ai',
  'ai.agent-orchestration',
  undefined,
  async () => {
    // Check if AI service is configured
    return !!process.env.OPENAI_API_KEY
  }
)
```

## Migration Guide

### From Old Permission System

1. Replace `hasPermission()` calls with `useTabAccess()`
2. Use `filterAccessibleTabs()` instead of manual filtering
3. Register health checkers for features with dependencies
4. Enable feature flags gradually

### Enabling Database

1. Set `USE_DATABASE_USERS=true`
2. Set `USE_DATABASE_SETTINGS=true`
3. Ensure Prisma schema is up to date
4. Run migrations
5. Test with mock fallback still enabled

## Troubleshooting

### Tabs Not Showing

1. Check user permissions: `useTabAccess()`
2. Check feature health: `isFeatureFunctional()`
3. Check module dependencies
4. Review health checker registration

### Database Errors

1. Check feature flags
2. Verify mock fallback is enabled
3. Check Prisma connection
4. Review error logs

## Future Enhancements

- [ ] Real-time permission updates via WebSocket
- [ ] Permission caching layer
- [ ] Advanced health scoring
- [ ] Permission analytics
- [ ] Automated health checker discovery

---

**Created**: 2025-01-XX  
**Status**: ✅ Production Ready  
**Safety**: 🛡️ Zero Breaking Changes







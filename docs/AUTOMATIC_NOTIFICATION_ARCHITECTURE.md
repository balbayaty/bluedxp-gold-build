# Automatic Notification Architecture

## Overview

The notification system is now **automatically integrated** into the application architecture. Notifications will appear automatically for:

- ✅ All API calls (via `apiClient`)
- ✅ All async operations (via `useAsyncOperation`)
- ✅ All save/delete/export/import operations (via auto hooks)
- ✅ All validation errors (via `useValidation`)
- ✅ All error boundary catches
- ✅ All fetch operations (when using `apiClient`)

## Architecture Components

### 1. **API Client** (`lib/utils/apiClient.ts`)

Automatically shows notifications for all API operations:

```typescript
import { apiClient } from '@/lib/utils/apiClient'

// Automatically shows loading → success/error notifications
const result = await apiClient.post('/api/workflows', data, {
  entityType: 'Workflow',
  operation: 'create',
})

// Disable notifications for specific calls
const result = await apiClient.get('/api/data', {
  showNotifications: false
})
```

### 2. **Async Operation Hook** (`lib/hooks/useAsyncOperation.ts`)

Wraps any async operation with automatic notifications:

```typescript
import { useAsyncOperation } from '@/lib/hooks/useAsyncOperation'

const { execute, loading } = useAsyncOperation({
  entityType: 'Workflow',
  operation: 'create',
  onSuccess: (data) => {
    router.push(`/workflows/${data.id}`)
  }
})

// Automatically shows notifications
await execute(async () => {
  return await fetch('/api/workflows', {
    method: 'POST',
    body: JSON.stringify(data)
  }).then(r => r.json())
})
```

### 3. **Auto Operation Hooks** (`lib/utils/autoNotifications.ts`)

Specialized hooks for common operations:

```typescript
import { useAutoSave, useAutoDelete, useAutoExport } from '@/lib/utils/autoNotifications'

// Auto-save with notifications
const autoSave = useAutoSave()
await autoSave(
  () => saveWorkflow(data),
  'Workflow',
  { onSuccess: () => router.push('/workflows') }
)

// Auto-delete with notifications
const autoDelete = useAutoDelete()
await autoDelete(
  () => deleteWorkflow(id),
  'Workflow'
)

// Auto-export with notifications
const autoExport = useAutoExport()
await autoExport(
  () => exportToCSV(data),
  { onSuccess: () => console.log('Exported!') }
)
```

### 4. **Validation Hook** (`lib/utils/autoNotifications.ts`)

Automatic validation notifications:

```typescript
import { useValidation } from '@/lib/utils/autoNotifications'

const validate = useValidation()
const isValid = validate(() => {
  if (!name) return 'Name is required'
  if (!email) return 'Email is required'
  return true
})
```

## Integration Points

### Provider Setup

The `PremiumNotificationProvider` automatically:
1. Sets up global notification handler for API client
2. Exposes handler for error boundaries
3. Makes notifications available throughout the app

### Error Boundaries

Error boundaries automatically show notifications when errors occur:

```typescript
// ErrorBoundary automatically shows notification
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Usage Patterns

### Pattern 1: Replace fetch with apiClient

**Before:**
```typescript
const response = await fetch('/api/workflows', {
  method: 'POST',
  body: JSON.stringify(data)
})
if (!response.ok) {
  alert('Failed to save')
}
```

**After:**
```typescript
import { apiClient } from '@/lib/utils/apiClient'

const result = await apiClient.post('/api/workflows', data, {
  entityType: 'Workflow',
  operation: 'create'
})
// Notifications shown automatically!
```

### Pattern 2: Use useAsyncOperation

**Before:**
```typescript
const handleSave = async () => {
  try {
    setLoading(true)
    await saveWorkflow(data)
    alert('Saved!')
  } catch (error) {
    alert('Error: ' + error.message)
  } finally {
    setLoading(false)
  }
}
```

**After:**
```typescript
const { execute, loading } = useAsyncOperation({
  entityType: 'Workflow',
  operation: 'create'
})

const handleSave = () => {
  execute(async () => {
    return await saveWorkflow(data)
  })
}
// Notifications shown automatically!
```

### Pattern 3: Use auto hooks

**Before:**
```typescript
const handleSave = async () => {
  try {
    await saveWorkflow(data)
    alert('Saved!')
  } catch (error) {
    alert('Error: ' + error.message)
  }
}
```

**After:**
```typescript
const autoSave = useAutoSave()

const handleSave = () => {
  autoSave(
    () => saveWorkflow(data),
    'Workflow'
  )
}
// Notifications shown automatically!
```

## Configuration

### Disable Notifications

```typescript
// For specific API call
await apiClient.post('/api/data', data, {
  showNotifications: false
})

// For async operation
const { execute } = useAsyncOperation({
  silent: true // No notifications
})

// For auto hooks
await autoSave(
  () => saveWorkflow(data),
  'Workflow',
  { silent: true }
)
```

### Custom Messages

```typescript
const { execute } = useAsyncOperation({
  entityType: 'Workflow',
  operation: 'create',
  successMessage: 'Workflow created and published!',
  errorMessage: 'Failed to create workflow. Please check your connection.'
})
```

## Best Practices

1. **Use `apiClient` for all API calls** - Automatic notifications
2. **Use `useAsyncOperation` for complex async flows** - Full control
3. **Use auto hooks for simple operations** - Quick and easy
4. **Use `useValidation` for form validation** - Automatic error display
5. **Let error boundaries handle errors** - Automatic error notifications

## Migration Guide

### Step 1: Replace fetch calls
```typescript
// Old
fetch('/api/data')

// New
apiClient.get('/api/data')
```

### Step 2: Replace alert() calls
```typescript
// Old
alert('Saved!')

// New - Remove, handled automatically
// Or use:
notifications.success('Saved!', 'Your changes have been saved.')
```

### Step 3: Replace try/catch with hooks
```typescript
// Old
try {
  await save()
  alert('Saved!')
} catch (error) {
  alert('Error')
}

// New
const { execute } = useAsyncOperation({ entityType: 'Item', operation: 'create' })
execute(() => save())
```

## Architecture Benefits

✅ **Zero boilerplate** - Notifications appear automatically
✅ **Consistent UX** - All operations use same notification system
✅ **Error handling** - Automatic error notifications
✅ **Loading states** - Automatic loading indicators
✅ **Brand messaging** - Integrated with brand messaging service
✅ **Analytics ready** - Built-in analytics tracking
✅ **Type safe** - Full TypeScript support

## Future Development

When building new features:

1. **Always use `apiClient`** for API calls
2. **Use `useAsyncOperation`** for async operations
3. **Use auto hooks** for common operations
4. **Let the system handle notifications** - Don't manually show alerts

The system is now **automatic** - notifications will appear for all operations without manual intervention!










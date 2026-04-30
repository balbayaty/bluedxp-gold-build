# Workspace Module - Developer Guide

## Architecture Overview

The Workspace module follows the BlueDXP platform's deep layer architecture:

```
┌─────────────────────────────────────────┐
│  Presentation Layer (UI Components)    │
│  - WorkspaceContainer                   │
│  - WorkspaceGrid                        │
│  - WidgetRenderer                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Business Logic Layer (Services)        │
│  - workspaceService                     │
│  - widgetService                        │
│  - categoryService                      │
│  - layoutService                        │
│  - personalizationService               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Data Layer (Database)                  │
│  - WidgetCategory                        │
│  - WidgetDefinition                      │
│  - WorkspaceLayout                       │
│  - UserWidget                            │
└─────────────────────────────────────────┘
```

## Service Layer

### WorkspaceService

Core workspace orchestration service.

**Key Methods:**
- `getWorkspaceConfig()` - Get complete workspace configuration
- `getUserLayouts()` - Get all user layouts
- `saveLayout()` - Save layout
- `setDefaultLayout()` - Set default layout

### WidgetService

Widget management and data fetching.

**Key Methods:**
- `getWidgetDefinitions()` - Get available widgets
- `getWidgetData()` - Fetch widget data
- `createUserWidget()` - Add widget to layout
- `validateWidgetAccess()` - Check permissions

### CategoryService

Dynamic category management.

**Key Methods:**
- `getCategories()` - Get all categories
- `createCategory()` - Create custom category
- `deleteCategory()` - Delete category (non-system)

### PersonalizationService

AI-powered personalization.

**Key Methods:**
- `trackUserBehavior()` - Track user actions
- `getPersonalizedRecommendations()` - Get AI recommendations
- `learnUserPatterns()` - Analyze usage patterns

## Creating Custom Widgets

### 1. Define Widget in Database

```typescript
await widgetService.createWidgetDefinition({
  name: 'My Custom Widget',
  description: 'Custom widget description',
  type: 'CUSTOM',
  categoryId: 'custom-category-id',
  icon: 'ri-custom-icon',
  defaultSize: { width: 4, height: 3 },
  dataSource: {
    type: 'API',
    endpoint: '/api/v1/my-data',
    refreshInterval: 60000,
  },
  configurable: true,
  tags: ['custom', 'example'],
})
```

### 2. Create Widget Component

```typescript
// components/workspace/widgets/custom/MyCustomWidget.tsx
export function MyCustomWidget({ data, config }: any) {
  return (
    <div className="p-4">
      <h3>{config.title || 'My Widget'}</h3>
      <p>{data?.content}</p>
    </div>
  )
}
```

### 3. Register in WidgetRenderer

Add your widget type to `WidgetRenderer.tsx`:

```typescript
case 'MY_CUSTOM_TYPE':
  return <MyCustomWidget data={data} config={widget.config} />
```

## API Integration

### Widget Data Sources

Widgets can fetch data from:

1. **API**: REST API endpoint
2. **QUERY**: Database query
3. **CALCULATION**: Calculated values
4. **REAL_TIME**: WebSocket/SSE stream
5. **AI_GENERATED**: AI service

### Example: API Data Source

```typescript
{
  type: 'API',
  endpoint: '/api/v1/inventory/overview',
  refreshInterval: 300000, // 5 minutes
}
```

The widget service will:
1. Fetch data from endpoint
2. Apply widget config (filters, date range, etc.)
3. Cache results
4. Auto-refresh at interval

## Event Integration

Workspace publishes events via Event Bus:

- `WorkspaceLayoutCreated`
- `WorkspaceLayoutUpdated`
- `WorkspaceLayoutDeleted`
- `WidgetDefinitionCreated`
- `GoogleWorkspaceConnected`
- `EmailAccountConnected`
- `WorkspaceBehaviorTracked`

Subscribe to events:

```typescript
import { eventBus } from '@/lib/services/event-bus'

eventBus.subscribe('WorkspaceLayoutCreated', (event) => {
  // Handle layout creation
})
```

## Permission Integration

Widgets respect the platform's permission system:

```typescript
{
  requiredPermissions: ['wms.inventory.read'],
  moduleId: 'wms',
}
```

The widget service automatically filters widgets based on user permissions.

## Testing

### Unit Tests

```typescript
// __tests__/services/workspace/workspaceService.test.ts
import { workspaceService } from '@/lib/services/workspace/workspaceService'

describe('WorkspaceService', () => {
  it('should get workspace config', async () => {
    const config = await workspaceService.getWorkspaceConfig('user-id')
    expect(config).toBeDefined()
  })
})
```

### Integration Tests

Test API endpoints:

```typescript
// __tests__/integration/workspace/api.test.ts
describe('Workspace API', () => {
  it('GET /api/v1/workspace/config', async () => {
    const response = await fetch('/api/v1/workspace/config')
    expect(response.status).toBe(200)
  })
})
```

## Extension Points

### Custom Data Sources

Extend `WidgetService` to add custom data source types:

```typescript
case 'CUSTOM_SOURCE':
  data = await this.fetchFromCustomSource(widget.id, config)
  break
```

### Custom Personalization

Extend `PersonalizationService` to add custom insights:

```typescript
async getCustomInsights(userId: string): Promise<PersonalizationInsight[]> {
  // Your custom logic
}
```

## Performance Optimization

1. **Widget Lazy Loading**: Widgets load on demand
2. **Data Caching**: Widget data is cached
3. **Batch Updates**: Multiple widget updates are batched
4. **Virtual Scrolling**: Long widget lists use virtual scrolling

## Security Considerations

1. **Token Encryption**: Google/Email tokens are encrypted
2. **Permission Validation**: All widget access is validated
3. **Tenant Isolation**: Data is isolated by tenant
4. **Input Validation**: All inputs are validated
5. **Rate Limiting**: API endpoints have rate limits

## Best Practices

1. **Widget Size**: Keep widgets focused and lightweight
2. **Data Refresh**: Set appropriate refresh intervals
3. **Error Handling**: Always handle errors gracefully
4. **Loading States**: Show loading indicators
5. **Accessibility**: Follow WCAG guidelines














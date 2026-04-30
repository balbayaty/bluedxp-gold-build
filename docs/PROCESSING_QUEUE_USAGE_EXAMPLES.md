# Processing Queue Component - Usage Examples

## Overview

The `ProcessingQueue` component is a reusable, enterprise-grade component for displaying processing queues with live progress, expandable details, and integrated error handling. It's fully integrated with the BlueDXP platform architecture.

## Basic Usage

### MSDS Module (Default)

```tsx
import ProcessingQueue from '@/components/msds/ProcessingQueue'

<ProcessingQueue
  jobId={activeJobId}
  tenantId={user.tenantId || 'default'}
  userId={user.id}
  moduleId="msds"
  onJobComplete={(job) => {
    console.log('Job completed:', job)
    // Handle completion
  }}
  onJobFailed={(job) => {
    console.error('Job failed:', job)
    // Handle failure
  }}
/>
```

## Advanced Usage

### Custom Processing Stages (WMS Example)

```tsx
<ProcessingQueue
  jobId={wmsJobId}
  tenantId={tenantId}
  userId={userId}
  moduleId="wms"
  jobApiEndpoint={`/api/wms/jobs/${wmsJobId}`}
  stages={[
    { key: 'queued', label: 'Queued', icon: 'ri-time-line', threshold: 0 },
    { key: 'receiving', label: 'Receiving', icon: 'ri-truck-line', threshold: 25 },
    { key: 'processing', label: 'Processing', icon: 'ri-settings-line', threshold: 50 },
    { key: 'validating', label: 'Validating', icon: 'ri-checkbox-line', threshold: 75 },
    { key: 'completed', label: 'Completed', icon: 'ri-check-double-line', threshold: 100 },
  ]}
  pollInterval={3000}
  enableEventBus={true}
/>
```

### Custom Extraction Preview (TMS Example)

```tsx
<ProcessingQueue
  jobId={tmsJobId}
  tenantId={tenantId}
  userId={userId}
  moduleId="tms"
  jobApiEndpoint={`/api/transportation/jobs/${tmsJobId}`}
  renderExtractionPreview={(item) => (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div>
        <span className="text-gray-400">Shipment ID:</span>
        <p className="text-gray-200 font-medium mt-0.5">
          {item.result?.extractedData?.shipmentId || 'N/A'}
        </p>
      </div>
      <div>
        <span className="text-gray-400">Carrier:</span>
        <p className="text-gray-200 font-medium mt-0.5">
          {item.result?.extractedData?.carrier || 'N/A'}
        </p>
      </div>
      <div>
        <span className="text-gray-400">Status:</span>
        <p className="text-gray-200 font-medium mt-0.5">
          {item.result?.extractedData?.status || 'N/A'}
        </p>
      </div>
      <div>
        <span className="text-gray-400">Progress:</span>
        <p className="text-gray-200 font-medium mt-0.5">
          {item.progress}%
        </p>
      </div>
    </div>
  )}
/>
```

## Integration with Job Service

### Publishing Events from Job Service

Your job service should publish events to the event bus:

```typescript
import { eventBus, createEvent } from '@/lib/services/event-store'

// In your job service
async function processJob(job: Job) {
  // Publish job started event
  await eventBus.publish(
    createEvent(
      'wms.job.started', // or 'tms.job.started', etc.
      job.id,
      'JOB',
      { jobId: job.id, totalItems: job.items.length },
      1,
      { tenantId, userId, source: 'wms' }
    )
  )

  // Process items...
  for (const item of job.items) {
    // Publish progress
    await eventBus.publish(
      createEvent(
        'wms.job.progress',
        job.id,
        'JOB',
        { jobId: job.id, progress: job.progress },
        1,
        { tenantId, userId, source: 'wms' }
      )
    )
  }

  // Publish completion
  await eventBus.publish(
    createEvent(
      'wms.job.completed',
      job.id,
      'JOB',
      { jobId: job.id, successful: completed, failed: failed },
      1,
      { tenantId, userId, source: 'wms' }
    )
  )
}
```

## API Endpoint Requirements

Your job API endpoint should return:

```typescript
{
  success: true,
  job: {
    id: string
    status: 'queued' | 'running' | 'completed' | 'failed'
    progress: number // 0-100
    items: Array<{
      id: string
      filename: string
      status: 'queued' | 'running' | 'completed' | 'failed'
      progress: number // 0-100
      error?: string
      result?: {
        extractedData?: any
        confidence?: number
        issues?: Array<{
          code: string
          message: string
          severity: 'info' | 'warning' | 'error'
          field?: string
        }>
      }
    }>
  }
}
```

## Real-Time Updates

### WebSocket Support (MSDS Only)

The component automatically uses WebSocket for MSDS module when available:

```typescript
// WebSocket is automatically initialized via msdsRealtimeService
// No additional configuration needed
```

### Event Bus (All Modules)

For other modules, the component subscribes to event bus:

```typescript
// Component automatically subscribes to: {moduleId}.job.*
// Example: 'wms.job.*', 'tms.job.*', etc.
```

## Styling Customization

The component uses Tailwind CSS classes. You can customize via:

1. **CSS Variables**: Override theme colors
2. **Wrapper Classes**: Wrap component in custom container
3. **Custom Render Functions**: Use `renderExtractionPreview` prop

## Error Handling

Errors are automatically:
- Displayed in collapsed state (preview)
- Shown in expanded state (full details)
- Tracked via error tracking service (if configured)
- Sent as notifications (if configured)

## Performance Considerations

- **Polling**: Default 2s interval (configurable via `pollInterval`)
- **WebSocket**: Real-time updates (no polling needed)
- **Event Bus**: Efficient subscription-based updates
- **Lazy Rendering**: Only renders visible items

## Accessibility

- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ ARIA labels and roles
- ✅ Focus management
- ✅ Reduced motion support

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

## Troubleshooting

### Queue Not Showing

1. Check `jobId` is valid
2. Verify API endpoint returns correct format
3. Check browser console for errors
4. Verify tenantId and userId are provided

### Updates Not Real-Time

1. For MSDS: Check WebSocket connection
2. For other modules: Verify event bus events are published
3. Check `enableEventBus` prop is `true`
4. Verify polling interval is appropriate

### Errors Not Displaying

1. Check error format in job items
2. Verify `item.error` field exists
3. Check error tracking service configuration

## Related Documentation

- [MSDS Processing Queue Full Integration](./MSDS_PROCESSING_QUEUE_FULL_INTEGRATION.md)
- [Event Bus Documentation](../lib/services/event-store/README.md)
- [Job Service Patterns](../docs/JOB_PROCESSING.md)


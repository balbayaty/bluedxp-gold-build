# Systematic Console.log/error Fix Script

This document tracks the systematic fixing of all console.log/error/warn calls across the entire codebase.

## Strategy

1. **Pages First** (app/) - Most user-facing
2. **API Routes** (app/api/) - Backend logic
3. **Components** (components/) - Reusable UI
4. **Services** (lib/) - Business logic

## Patterns to Apply

### For Pages (Client-side):
- Remove console.log/error/warn
- Use proper error handling with notifications
- Use logger service for debugging (if needed)

### For API Routes:
```typescript
import { logger } from '@/lib/services/observability/logger'
import { errorTrackingService } from '@/lib/services/observability/errorTracking'

} catch (error: unknown) {
  const err = error instanceof Error ? error : new Error(String(error))
  logger.error('Error message', err, { module: 'module', service: 'service' })
  errorTrackingService.captureException(err, { module: 'module', service: 'service' })
  return NextResponse.json({ error: err.message }, { status: 500 })
}
```

### For Components:
- Remove console.log/error/warn
- Use proper error boundaries
- Use notifications for user feedback

### For Services (lib/):
- Replace console.log with logger.debug/info
- Replace console.error with logger.error
- Replace console.warn with logger.warn

## Progress Tracking

### Pages (app/)
- [ ] app/warehouses/ (13 instances)
- [ ] app/msds/ (10 instances)
- [ ] app/ai-vision/ (11 instances)
- [ ] app/damage/ (6 instances)
- [ ] app/pod/ (2 instances)
- [ ] app/sales-orders/ (1 instance)
- [ ] app/goods-receipt/ (2 instances)
- [ ] app/integration/ (14 instances)
- [ ] app/reports/ (5 instances)
- [ ] app/transportation/ (38 instances)
- [ ] app/proposals/ (1 instance)
- [ ] All other pages

### API Routes (app/api/)
- [ ] All 440 API route files

### Components (components/)
- [ ] All 177 component files

### Services (lib/)
- [ ] All 341 service files

## Total Files to Fix: ~1,168 files














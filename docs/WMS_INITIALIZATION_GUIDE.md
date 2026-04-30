# 🚀 WMS Module - Initialization Guide
## How to Initialize WMS Module Services

**Version:** 1.0.0  
**Last Updated:** December 2024

---

## 🎯 INITIALIZATION OVERVIEW

The WMS module requires initialization to:
- Set up event handlers
- Start real-time SLA monitoring
- Connect to all integrated services

---

## 📋 INITIALIZATION STEPS

### Step 1: Add to Module Initialization

**File:** `lib/modules/index.ts`

Add WMS module initialization:

```typescript
// Initialize WMS module if enabled
if (wmsModule.enabled) {
  try {
    if (!bootstrapTenantId) {
      console.warn('WMS module initialization skipped: BOOTSTRAP_TENANT_ID is required in production')
    } else {
      const { initializeWmsModule } = await import('@/lib/services/wms/wmsModuleInitializer')
      await initializeWmsModule().catch(console.error)
    }
  } catch (error) {
    console.error('WMS module initialization error:', error)
  }
}
```

### Step 2: Verify Event Bus

**Ensure event bus is available:**
- Event bus should be initialized before WMS module
- Check `lib/services/event-bus` for event bus implementation

### Step 3: Verify Services

**Ensure these services are available:**
- AI Vision Service
- Evidence Service
- Lifecycle Service
- Liability Engine
- Database connection

---

## ✅ VERIFICATION

### Check Initialization
```typescript
// Check logs for:
// ✅ WMS event handlers initialized
// ✅ Real-time SLA monitoring started
// ✅ WMS module initialized successfully
```

### Test Event Handlers
```typescript
// Upload a photo and check for events:
// - photo.uploaded
// - photo.analyzed
// - evidence.created
// - liability.assessed (if damage)
```

### Test SLA Monitoring
```typescript
// Check logs for:
// - Real-time SLA monitoring cycle running
// - SLA warnings detected
// - SLA violations detected
```

---

## 🔧 MANUAL INITIALIZATION

If auto-initialization doesn't work:

```typescript
import { initializeWmsModule } from '@/lib/services/wms/wmsModuleInitializer'

// Initialize manually
await initializeWmsModule()
```

---

## 🐛 TROUBLESHOOTING

### Event Handlers Not Working
- Check event bus is initialized
- Verify event handlers are registered
- Check event names match

### SLA Monitoring Not Starting
- Check NODE_ENV is 'production'
- Verify real-time service is accessible
- Check for initialization errors

---

## 📚 RELATED DOCUMENTATION

- **Deployment Guide:** `WMS_PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Troubleshooting:** `WMS_TROUBLESHOOTING_GUIDE.md`

---

**Version:** 1.0.0  
**Last Updated:** December 2024



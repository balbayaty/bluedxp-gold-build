# Premium Notification System - Complete Guide

## 🎯 Overview

A mind-blowing, intelligent notification system with brand messaging integration, smart auto-dismiss, and comprehensive UX features.

## ✨ Key Features

### 1. **Smart Auto-Dismiss**
- ✅ Progress bar with visual countdown
- ✅ Pause on hover (resumes when mouse leaves)
- ✅ Countdown badge appears in last 3 seconds
- ✅ Smooth exit animations
- ✅ Configurable duration (0 = no auto-dismiss)

### 2. **Brand Messaging Integration**
- ✅ AI-powered, on-brand messaging
- ✅ Bilingual support (English/Arabic)
- ✅ Context-aware (module, user role, customer)
- ✅ Falls back gracefully if service unavailable
- ✅ Uses BlueDXP brand voice principles

### 3. **Mock Data System**
- ✅ Predefined notification templates
- ✅ Visible mock data in demo
- ✅ Easy to use: `MOCK_NOTIFICATIONS.workflowSaved`
- ✅ Consistent messaging across system

### 4. **Priority System**
- ✅ Critical, High, Medium, Low priorities
- ✅ Visual indicators (pulse, glow intensity)
- ✅ Sound frequency adjustment
- ✅ Auto-sorting by priority

### 5. **Smart Grouping**
- ✅ Group similar notifications with `groupId`
- ✅ Replaces previous notifications in same group
- ✅ Prevents notification spam

### 6. **Rich Interactions**
- ✅ Multiple action buttons with icons
- ✅ Clickable notifications
- ✅ Hover effects
- ✅ Smooth animations

### 7. **Positioning**
- ✅ 6 positions: top/bottom × left/center/right
- ✅ Smart stacking
- ✅ Responsive animations

### 8. **Analytics Ready**
- ✅ Built-in tracking support
- ✅ Category, action, label support
- ✅ Ready for analytics integration

## 📦 Usage

### Basic Usage

```typescript
import { useNotificationHelpers } from '@/components/PremiumNotificationEnhanced'

const notifications = useNotificationHelpers()

// Simple success
notifications.success('Workflow Saved', 'Your workflow has been saved successfully.')

// With actions
notifications.error('Save Failed', 'Please try again.', {
  actions: [
    { label: 'Retry', action: () => retry(), variant: 'primary', icon: 'ri-refresh-line' },
    { label: 'Report', action: () => report(), variant: 'danger', icon: 'ri-flag-line' }
  ]
})

// Using mock data
import { MOCK_NOTIFICATIONS } from '@/components/PremiumNotificationEnhanced'
notifications.success(
  MOCK_NOTIFICATIONS.workflowSaved.title,
  MOCK_NOTIFICATIONS.workflowSaved.message,
  MOCK_NOTIFICATIONS.workflowSaved
)
```

### Brand Messaging Integration

```typescript
// Automatic brand messaging
notifications.brandSuccess('success_message', {
  moduleId: 'wms',
  action: 'save_workflow',
  language: 'en',
  userRole: user?.role,
})

// Or enable in any notification
notifications.success('Title', 'Message', {
  useBrandMessaging: true,
  messagingType: 'success_message',
  messagingContext: {
    moduleId: 'wms',
    language: 'en',
    action: 'save_workflow',
  }
})
```

### Advanced Features

```typescript
// Critical priority with longer duration
notifications.error('Critical Alert', 'System resources low.', {
  priority: 'critical',
  duration: 10000,
})

// Grouped notifications (replaces previous in group)
notifications.success('Item 1 Saved', 'First item', { groupId: 'batch-save' })
notifications.success('Item 2 Saved', 'Second item', { groupId: 'batch-save' })

// No auto-dismiss
notifications.info('Important Notice', 'Stays until closed.', {
  duration: 0,
  dismissible: true,
})

// Custom position
notifications.success('Custom Position', 'Appears top-left.', {
  position: 'top-left'
})

// Loading → Success flow
const id = notifications.loading('Processing...', 'Please wait.')
setTimeout(() => {
  notifications.removeNotification(id)
  notifications.success('Complete!', 'Processing finished.')
}, 3000)
```

## 🎨 Visual Features

- **Glassmorphism**: Beautiful backdrop blur effects
- **Gradient Backgrounds**: Type-specific gradients
- **Glow Effects**: Dynamic shadows based on type/priority
- **Shimmer Animation**: Subtle shimmer effect
- **Spring Animations**: Smooth, natural motion
- **Progress Indicators**: Visual countdown bars
- **Icon Animations**: Rotating loaders, pulsing effects

## 🔧 Configuration

### Notification Options

```typescript
interface PremiumNotification {
  type: 'success' | 'error' | 'warning' | 'info' | 'loading'
  title: string
  message?: string
  duration?: number // Default: 5000ms, 0 = no auto-dismiss
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'
  icon?: string // Custom icon
  image?: string // Custom image
  actions?: NotificationAction[]
  sound?: boolean // Default: true
  progress?: boolean // Default: true
  dismissible?: boolean // Default: true
  priority?: 'low' | 'medium' | 'high' | 'critical'
  groupId?: string // Group similar notifications
  useBrandMessaging?: boolean
  messagingType?: MessagingType
  messagingContext?: MessagingContext
  analytics?: { category?: string; action?: string; label?: string }
  onClose?: () => void
  onClick?: () => void
}
```

## 🚀 Implementation Steps

1. **Wrap your app** with `PremiumNotificationProvider`
2. **Use the hook** `useNotificationHelpers()` anywhere
3. **Replace alerts** with notifications
4. **Use mock data** for consistency
5. **Enable brand messaging** for on-brand experience

## 📊 Mock Data Available

- `MOCK_NOTIFICATIONS.workflowSaved` - Success notification
- `MOCK_NOTIFICATIONS.workflowError` - Error with retry
- `MOCK_NOTIFICATIONS.lowStorage` - Warning with action
- `MOCK_NOTIFICATIONS.newFeature` - Info with click
- `MOCK_NOTIFICATIONS.processing` - Loading state

## 🎯 Best Practices

1. **Use appropriate types**: success, error, warning, info, loading
2. **Set reasonable durations**: 4-7 seconds for most, longer for errors
3. **Provide actions**: Give users ways to respond
4. **Use grouping**: Prevent notification spam
5. **Enable brand messaging**: For consistent, on-brand experience
6. **Track analytics**: Use analytics option for insights
7. **Consider priority**: Use critical for urgent issues

## 🔄 Migration from alert()

Replace:
```typescript
alert('Workflow saved successfully!')
```

With:
```typescript
notifications.success(
  MOCK_NOTIFICATIONS.workflowSaved.title,
  MOCK_NOTIFICATIONS.workflowSaved.message,
  MOCK_NOTIFICATIONS.workflowSaved
)
```

## 🎉 Demo

Visit `/demo/notifications` to see all features in action with visible mock data!










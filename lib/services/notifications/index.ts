/**
 * Notifications Service - Main Export
 *
 * Provides unified access to notification service
 */

export {
  notificationService,
  NotificationService,
  type Notification,
  type NotificationChannel,
  type NotificationPriority,
  type NotificationType,
  type AlertRule,
  type AlertCondition,
} from "./notificationService";

export { useNotification } from "./useNotification";

// Export event bus integration (auto-initializes)
export { notificationEventBusIntegration } from "./eventBusIntegration";

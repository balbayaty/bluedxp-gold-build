/**
 * Notification Utility Helper
 * Centralized notification system for the entire application
 * Integrates with PremiumNotification system and brand messaging
 */

import { useNotificationHelpers, MOCK_NOTIFICATIONS } from '@/components/PremiumNotificationEnhanced'
import type { MessagingType, MessagingContext } from '@/types/brand-messaging'

/**
 * Get notification helpers (to be used in components)
 * This is a hook, so it must be called within a component
 */
export function useNotifications() {
  return useNotificationHelpers()
}

/**
 * Common notification patterns for the application
 */
export const NotificationPatterns = {
  // Workflow notifications
  workflowSaved: (workflowName?: string) => ({
    ...MOCK_NOTIFICATIONS.workflowSaved,
    title: workflowName 
      ? `Workflow "${workflowName}" Saved Successfully!`
      : MOCK_NOTIFICATIONS.workflowSaved.title,
    message: workflowName
      ? `Your workflow "${workflowName}" has been saved and is ready to use.`
      : MOCK_NOTIFICATIONS.workflowSaved.message,
  }),

  workflowError: (error?: string) => ({
    ...MOCK_NOTIFICATIONS.workflowError,
    message: error || MOCK_NOTIFICATIONS.workflowError.message,
    actions: [
      { label: 'Retry', action: () => window.location.reload(), variant: 'primary' as const, icon: 'ri-refresh-line' },
      { label: 'Report Issue', action: () => console.log('Report issue'), variant: 'danger' as const, icon: 'ri-flag-line' },
    ],
  }),

  // CAPA notifications
  capaCreated: (capaId?: string) => ({
    type: 'success' as const,
    title: capaId ? `CAPA ${capaId} Created Successfully!` : 'CAPA Created Successfully!',
    message: capaId 
      ? `Corrective Action ${capaId} has been created and is ready for review.`
      : 'Your corrective action has been created successfully.',
    duration: 4000,
    analytics: { category: 'capa', action: 'create', label: 'success' },
  }),

  capaError: (error?: string) => ({
    type: 'error' as const,
    title: 'Failed to Create CAPA',
    message: error || 'An error occurred while creating the CAPA. Please try again.',
    duration: 6000,
    priority: 'high' as const,
    actions: [
      { label: 'Retry', action: () => {}, variant: 'primary' as const },
    ],
  }),

  // NCR notifications
  ncrCreated: (ncrId?: string) => ({
    type: 'success' as const,
    title: ncrId ? `NCR ${ncrId} Raised Successfully!` : 'NCR Raised Successfully!',
    message: ncrId
      ? `Non-Conformance Report ${ncrId} has been raised and assigned for review.`
      : 'Your non-conformance report has been raised successfully.',
    duration: 4000,
    analytics: { category: 'ncr', action: 'create', label: 'success' },
  }),

  // Export notifications
  exportSuccess: (format: string, count?: number) => ({
    type: 'success' as const,
    title: 'Export Successful',
    message: count 
      ? `Successfully exported ${count} record(s) as ${format.toUpperCase()}.`
      : `Data exported successfully as ${format.toUpperCase()}.`,
    duration: 4000,
  }),

  exportError: (error?: string) => ({
    type: 'error' as const,
    title: 'Export Failed',
    message: error || 'Failed to export data. Please try again.',
    duration: 5000,
    actions: [
      { label: 'Retry', action: () => {}, variant: 'primary' as const },
    ],
  }),

  // Save notifications
  saveSuccess: (entityType?: string) => ({
    type: 'success' as const,
    title: entityType ? `${entityType} Saved Successfully!` : 'Saved Successfully!',
    message: entityType
      ? `Your ${entityType.toLowerCase()} has been saved and is ready to use.`
      : 'Your changes have been saved successfully.',
    duration: 3000,
  }),

  saveError: (error?: string) => ({
    type: 'error' as const,
    title: 'Save Failed',
    message: error || 'Failed to save. Please check your connection and try again.',
    duration: 6000,
    priority: 'high' as const,
    actions: [
      { label: 'Retry', action: () => {}, variant: 'primary' as const },
    ],
  }),

  // Delete notifications
  deleteSuccess: (entityType?: string) => ({
    type: 'success' as const,
    title: entityType ? `${entityType} Deleted` : 'Deleted Successfully',
    message: entityType
      ? `The ${entityType.toLowerCase()} has been deleted successfully.`
      : 'Item deleted successfully.',
    duration: 3000,
  }),

  deleteError: (error?: string) => ({
    type: 'error' as const,
    title: 'Delete Failed',
    message: error || 'Failed to delete. Please try again.',
    duration: 5000,
  }),

  // Validation notifications
  validationError: (message: string) => ({
    type: 'warning' as const,
    title: 'Validation Error',
    message,
    duration: 5000,
  }),

  // Processing notifications
  processing: (message?: string) => ({
    type: 'loading' as const,
    title: 'Processing...',
    message: message || 'Please wait while we process your request.',
    duration: 0,
    dismissible: false,
  }),

  // Generic success
  success: (title: string, message?: string) => ({
    type: 'success' as const,
    title,
    message,
    duration: 4000,
  }),

  // Generic error
  error: (title: string, message?: string) => ({
    type: 'error' as const,
    title,
    message,
    duration: 6000,
    priority: 'high' as const,
  }),

  // Generic info
  info: (title: string, message?: string) => ({
    type: 'info' as const,
    title,
    message,
    duration: 5000,
  }),

  // Generic warning
  warning: (title: string, message?: string) => ({
    type: 'warning' as const,
    title,
    message,
    duration: 6000,
  }),
}

/**
 * Helper to show notifications with brand messaging context
 */
export function createBrandNotification(
  messagingType: MessagingType,
  context: MessagingContext,
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info'
) {
  return {
    type: notificationType,
    useBrandMessaging: true,
    messagingType,
    messagingContext: context,
    duration: notificationType === 'error' ? 7000 : 5000,
  }
}










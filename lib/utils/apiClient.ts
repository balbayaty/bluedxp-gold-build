/**
 * Automatic API Client with Built-in Notifications
 * Automatically shows notifications for all API operations
 * Integrated into the application architecture
 */

import { NotificationPatterns } from './notifications'

// Global notification handler (set by provider)
let globalNotificationHandler: {
  success: (title: string, message?: string, options?: any) => string
  error: (title: string, message?: string, options?: any) => string
  warning: (title: string, message?: string, options?: any) => string
  info: (title: string, message?: string, options?: any) => string
  loading: (title: string, message?: string) => string
  removeNotification: (id: string) => void
} | null = null

/**
 * Set the global notification handler (called by PremiumNotificationProvider)
 */
export function setGlobalNotificationHandler(handler: typeof globalNotificationHandler) {
  globalNotificationHandler = handler
}

/**
 * API Response wrapper
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  errors?: Record<string, string[]>
}

/**
 * API Client Configuration
 */
export interface APIClientConfig {
  baseURL?: string
  timeout?: number
  showNotifications?: boolean
  showLoading?: boolean
  showSuccess?: boolean
  showErrors?: boolean
  entityType?: string
  operation?: 'create' | 'update' | 'delete' | 'fetch' | 'export' | 'import' | 'custom'
}

/**
 * Enhanced Fetch with Automatic Notifications
 */
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit & { config?: APIClientConfig } = {}
): Promise<APIResponse<T>> {
  const { config = {}, ...fetchOptions } = options
  const {
    showNotifications = true,
    showLoading = true,
    showSuccess = true,
    showErrors = true,
    entityType,
    operation = 'fetch',
  } = config

  let loadingId: string | null = null

  try {
    // Show loading notification if enabled
    if (showLoading && showNotifications && globalNotificationHandler) {
      const loadingMessage = getLoadingMessage(operation, entityType)
      loadingId = globalNotificationHandler.loading(
        'Processing...',
        loadingMessage
      )
    }

    // Make the request
    const response = await fetch(url, fetchOptions)
    const data = await response.json()

    // Remove loading notification
    if (loadingId && globalNotificationHandler) {
      globalNotificationHandler.removeNotification(loadingId)
    }

    // Handle response
    if (!response.ok) {
      const errorMessage = data.error || data.message || `Request failed with status ${response.status}`
      
      // Show error notification
      if (showErrors && showNotifications && globalNotificationHandler) {
        const errorPattern = getErrorPattern(operation, entityType, errorMessage)
        globalNotificationHandler.error(
          errorPattern.title,
          errorPattern.message,
          errorPattern
        )
      }

      return {
        success: false,
        error: errorMessage,
        errors: data.errors,
      }
    }

    // Show success notification
    if (showSuccess && showNotifications && globalNotificationHandler) {
      const successPattern = getSuccessPattern(operation, entityType, data)
      globalNotificationHandler.success(
        successPattern.title,
        successPattern.message,
        successPattern
      )
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    }
  } catch (error) {
    // Remove loading notification
    if (loadingId && globalNotificationHandler) {
      globalNotificationHandler.removeNotification(loadingId)
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'

    // Show error notification
    if (showErrors && showNotifications && globalNotificationHandler) {
      const errorPattern = getErrorPattern(operation, entityType, errorMessage)
      globalNotificationHandler.error(
        errorPattern.title,
        errorPattern.message,
        errorPattern
      )
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Convenience methods
 */
export const apiClient = {
  get: <T = any>(url: string, config?: APIClientConfig) =>
    apiFetch<T>(url, { method: 'GET', config }),

  post: <T = any>(url: string, data?: any, config?: APIClientConfig) =>
    apiFetch<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      config: { ...config, operation: config?.operation || 'create' },
    }),

  put: <T = any>(url: string, data?: any, config?: APIClientConfig) =>
    apiFetch<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      config: { ...config, operation: config?.operation || 'update' },
    }),

  patch: <T = any>(url: string, data?: any, config?: APIClientConfig) =>
    apiFetch<T>(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      config: { ...config, operation: config?.operation || 'update' },
    }),

  delete: <T = any>(url: string, config?: APIClientConfig) =>
    apiFetch<T>(url, {
      method: 'DELETE',
      config: { ...config, operation: config?.operation || 'delete' },
    }),
}

/**
 * Helper functions
 */
function getLoadingMessage(operation: string, entityType?: string): string {
  const messages: Record<string, string> = {
    create: entityType ? `Creating ${entityType}...` : 'Creating...',
    update: entityType ? `Updating ${entityType}...` : 'Updating...',
    delete: entityType ? `Deleting ${entityType}...` : 'Deleting...',
    export: 'Exporting data...',
    import: 'Importing data...',
    fetch: 'Loading...',
    custom: 'Processing...',
  }
  return messages[operation] || 'Processing...'
}

function getSuccessPattern(operation: string, entityType?: string, data?: any) {
  switch (operation) {
    case 'create':
      return NotificationPatterns.saveSuccess(entityType)
    case 'update':
      return NotificationPatterns.saveSuccess(entityType)
    case 'delete':
      return NotificationPatterns.deleteSuccess(entityType)
    case 'export':
      return NotificationPatterns.exportSuccess(data?.format || 'CSV', data?.count)
    case 'import':
      return {
        type: 'success' as const,
        title: 'Import Successful',
        message: data?.count 
          ? `Successfully imported ${data.count} record(s).`
          : 'Data imported successfully.',
        duration: 4000,
      }
    default:
      return NotificationPatterns.success('Operation Successful', 'Your request has been processed successfully.')
  }
}

function getErrorPattern(operation: string, entityType?: string, errorMessage?: string) {
  switch (operation) {
    case 'create':
      return NotificationPatterns.saveError(errorMessage)
    case 'update':
      return NotificationPatterns.saveError(errorMessage)
    case 'delete':
      return NotificationPatterns.deleteError(errorMessage)
    case 'export':
      return NotificationPatterns.exportError(errorMessage)
    case 'import':
      return {
        type: 'error' as const,
        title: 'Import Failed',
        message: errorMessage || 'Failed to import data. Please try again.',
        duration: 6000,
        actions: [
          { label: 'Retry', action: () => {}, variant: 'primary' as const },
        ],
      }
    default:
      return NotificationPatterns.error('Operation Failed', errorMessage)
  }
}










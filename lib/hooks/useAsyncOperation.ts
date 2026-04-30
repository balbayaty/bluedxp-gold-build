/**
 * Automatic Async Operation Hook with Built-in Notifications
 * Wraps async operations and automatically shows notifications
 * Use this for all async operations in the app
 */

import { useState, useCallback } from 'react'
import { useNotifications } from '@/lib/utils/notifications'
import { NotificationPatterns } from '@/lib/utils/notifications'

export interface AsyncOperationOptions {
  entityType?: string
  operation?: 'create' | 'update' | 'delete' | 'fetch' | 'export' | 'import' | 'custom'
  showLoading?: boolean
  showSuccess?: boolean
  showError?: boolean
  successMessage?: string
  errorMessage?: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  silent?: boolean // Don't show any notifications
}

/**
 * Hook for async operations with automatic notifications
 * 
 * @example
 * const { execute, loading, error } = useAsyncOperation({
 *   entityType: 'Workflow',
 *   operation: 'create',
 *   onSuccess: (data) => {
 *     router.push(`/workflows/${data.id}`)
 *   }
 * })
 * 
 * const handleSave = () => {
 *   execute(async () => {
 *     return await fetch('/api/workflows', {
 *       method: 'POST',
 *       body: JSON.stringify(workflowData)
 *     }).then(r => r.json())
 *   })
 * }
 */
export function useAsyncOperation<T = any>(options: AsyncOperationOptions = {}) {
  const notifications = useNotifications()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const {
    entityType,
    operation = 'custom',
    showLoading = true,
    showSuccess = true,
    showError = true,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    silent = false,
  } = options

  const execute = useCallback(async (operationFn: () => Promise<T>) => {
    setLoading(true)
    setError(null)
    let loadingId: string | null = null

    try {
      // Show loading notification
      if (showLoading && !silent && operation !== 'fetch') {
        const loadingTitle = getLoadingTitle(operation, entityType)
        const loadingMsg = getLoadingMessage(operation, entityType)
        loadingId = notifications.loading(loadingTitle, loadingMsg)
      }

      // Execute the operation
      const result = await operationFn()
      setData(result)

      // Remove loading notification
      if (loadingId) {
        notifications.removeNotification(loadingId)
      }

      // Show success notification
      if (showSuccess && !silent) {
        const successPattern = getSuccessPattern(operation, entityType, successMessage)
        notifications.success(
          successPattern.title,
          successPattern.message,
          successPattern
        )
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred')
      setError(error)

      // Remove loading notification
      if (loadingId) {
        notifications.removeNotification(loadingId)
      }

      // Show error notification
      if (showError && !silent) {
        const errorPattern = getErrorPattern(operation, entityType, errorMessage || error.message)
        notifications.error(
          errorPattern.title,
          errorPattern.message,
          errorPattern
        )
      }

      // Call error callback
      if (onError) {
        onError(error)
      }

      throw error
    } finally {
      setLoading(false)
    }
  }, [
    notifications,
    entityType,
    operation,
    showLoading,
    showSuccess,
    showError,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    silent,
  ])

  return {
    execute,
    loading,
    error,
    data,
    reset: useCallback(() => {
      setError(null)
      setData(null)
    }, []),
  }
}

/**
 * Helper functions
 */
function getLoadingTitle(operation: string, entityType?: string): string {
  return 'Processing...'
}

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

function getSuccessPattern(operation: string, entityType?: string, customMessage?: string) {
  if (customMessage) {
    return NotificationPatterns.success('Success', customMessage)
  }

  switch (operation) {
    case 'create':
      return NotificationPatterns.saveSuccess(entityType)
    case 'update':
      return NotificationPatterns.saveSuccess(entityType)
    case 'delete':
      return NotificationPatterns.deleteSuccess(entityType)
    case 'export':
      return NotificationPatterns.exportSuccess('CSV')
    case 'import':
      return {
        type: 'success' as const,
        title: 'Import Successful',
        message: 'Data imported successfully.',
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










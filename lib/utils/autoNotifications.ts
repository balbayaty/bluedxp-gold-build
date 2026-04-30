/**
 * Automatic Notification Integration
 * Wraps common operations to automatically show notifications
 * Use these utilities throughout the app for automatic notifications
 */

import { useNotifications } from './notifications'
import { NotificationPatterns } from './notifications'

/**
 * Auto-save with notifications
 */
export function useAutoSave<T = any>() {
  const notifications = useNotifications()

  return async (
    saveFn: () => Promise<T>,
    entityType?: string,
    options?: { silent?: boolean; onSuccess?: (data: T) => void }
  ) => {
    try {
      if (!options?.silent) {
        const loadingId = notifications.loading('Saving...', `Saving ${entityType || 'changes'}...`)
        try {
          const result = await saveFn()
          notifications.removeNotification(loadingId)
          notifications.success(
            NotificationPatterns.saveSuccess(entityType).title,
            NotificationPatterns.saveSuccess(entityType).message,
            NotificationPatterns.saveSuccess(entityType)
          )
          if (options?.onSuccess) options.onSuccess(result)
          return result
        } catch (error) {
          notifications.removeNotification(loadingId)
          throw error
        }
      } else {
        return await saveFn()
      }
    } catch (error) {
      if (!options?.silent) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        notifications.error(
          NotificationPatterns.saveError(errorMsg).title,
          NotificationPatterns.saveError(errorMsg).message,
          NotificationPatterns.saveError(errorMsg)
        )
      }
      throw error
    }
  }
}

/**
 * Auto-delete with notifications
 */
export function useAutoDelete() {
  const notifications = useNotifications()

  return async (
    deleteFn: () => Promise<void>,
    entityType?: string,
    options?: { silent?: boolean; onSuccess?: () => void }
  ) => {
    try {
      if (!options?.silent) {
        const loadingId = notifications.loading('Deleting...', `Deleting ${entityType || 'item'}...`)
        try {
          await deleteFn()
          notifications.removeNotification(loadingId)
          notifications.success(
            NotificationPatterns.deleteSuccess(entityType).title,
            NotificationPatterns.deleteSuccess(entityType).message,
            NotificationPatterns.deleteSuccess(entityType)
          )
          if (options?.onSuccess) options.onSuccess()
        } catch (error) {
          notifications.removeNotification(loadingId)
          throw error
        }
      } else {
        await deleteFn()
      }
    } catch (error) {
      if (!options?.silent) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        notifications.error(
          NotificationPatterns.deleteError(errorMsg).title,
          NotificationPatterns.deleteError(errorMsg).message,
          NotificationPatterns.deleteError(errorMsg)
        )
      }
      throw error
    }
  }
}

/**
 * Auto-export with notifications
 */
export function useAutoExport() {
  const notifications = useNotifications()

  return async (
    exportFn: () => Promise<{ format: string; count?: number }>,
    options?: { silent?: boolean; onSuccess?: () => void }
  ) => {
    try {
      if (!options?.silent) {
        const loadingId = notifications.loading('Exporting...', 'Preparing your export...')
        try {
          const result = await exportFn()
          notifications.removeNotification(loadingId)
          notifications.success(
            NotificationPatterns.exportSuccess(result.format, result.count).title,
            NotificationPatterns.exportSuccess(result.format, result.count).message,
            NotificationPatterns.exportSuccess(result.format, result.count)
          )
          if (options?.onSuccess) options.onSuccess()
          return result
        } catch (error) {
          notifications.removeNotification(loadingId)
          throw error
        }
      } else {
        return await exportFn()
      }
    } catch (error) {
      if (!options?.silent) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        notifications.error(
          NotificationPatterns.exportError(errorMsg).title,
          NotificationPatterns.exportError(errorMsg).message,
          NotificationPatterns.exportError(errorMsg)
        )
      }
      throw error
    }
  }
}

/**
 * Auto-import with notifications
 */
export function useAutoImport() {
  const notifications = useNotifications()

  return async (
    importFn: () => Promise<{ count?: number }>,
    options?: { silent?: boolean; onSuccess?: () => void }
  ) => {
    try {
      if (!options?.silent) {
        const loadingId = notifications.loading('Importing...', 'Processing your import...')
        try {
          const result = await importFn()
          notifications.removeNotification(loadingId)
          notifications.success(
            'Import Successful',
            result.count 
              ? `Successfully imported ${result.count} record(s).`
              : 'Data imported successfully.',
            { duration: 4000 }
          )
          if (options?.onSuccess) options.onSuccess()
          return result
        } catch (error) {
          notifications.removeNotification(loadingId)
          throw error
        }
      } else {
        return await importFn()
      }
    } catch (error) {
      if (!options?.silent) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        notifications.error(
          'Import Failed',
          errorMsg,
          {
            duration: 6000,
            actions: [
              { label: 'Retry', action: () => {}, variant: 'primary' as const },
            ],
          }
        )
      }
      throw error
    }
  }
}

/**
 * Validation helper with automatic notifications
 */
export function useValidation() {
  const notifications = useNotifications()

  return (validateFn: () => boolean | string, options?: { silent?: boolean }) => {
    const result = validateFn()
    if (result === true) return true
    
    const errorMessage = typeof result === 'string' ? result : 'Validation failed'
    
    if (!options?.silent) {
      notifications.warning(
        NotificationPatterns.validationError(errorMessage).title,
        NotificationPatterns.validationError(errorMessage).message,
        NotificationPatterns.validationError(errorMessage)
      )
    }
    
    return false
  }
}










/**
 * Comprehensive Error Handling Hook
 * Provides consistent error handling, logging, and user feedback
 * Integrates with observability services
 */

import { useState, useCallback } from 'react'
import { errorTrackingService } from '@/lib/services/observability/errorTracking'
import { logger } from '@/lib/services/observability/logger'
import type { LogContext } from '@/lib/services/observability/logger'

export interface ErrorState {
  error: Error | null
  message: string | null
  code?: string
  retryable: boolean
}

export interface UseErrorHandlerOptions {
  module?: string
  service?: string
  onError?: (error: Error) => void
  showUserMessage?: boolean
  logToSentry?: boolean
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    message: null,
    retryable: false,
  })

  const handleError = useCallback(
    (error: unknown, context?: LogContext & { retryable?: boolean; code?: string }) => {
      const err = error instanceof Error ? error : new Error(String(error))
      
      const errorState: ErrorState = {
        error: err,
        message: err.message || 'An unexpected error occurred',
        code: context?.code,
        retryable: context?.retryable ?? false,
      }

      setErrorState(errorState)

      // Build log context
      const logContext: LogContext = {
        module: options.module,
        service: options.service,
        ...context,
      }

      // Log error
      logger.error(err.message, err, logContext)

      // Track error if enabled
      if (options.logToSentry !== false) {
        errorTrackingService.captureException(err, logContext, {
          module: options.module || 'unknown',
          service: options.service || 'unknown',
          ...(context?.code && { errorCode: context.code }),
        })
      }

      // Call custom error handler
      options.onError?.(err)

      // Show user-friendly message if enabled
      if (options.showUserMessage !== false) {
        // In production, use toast notification system
        // For now, we'll rely on error state for UI display
      }

      return errorState
    },
    [options]
  )

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      message: null,
      retryable: false,
    })
  }, [])

  const handleAsyncError = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      context?: LogContext & { retryable?: boolean; code?: string }
    ): Promise<T | null> => {
      try {
        return await asyncFn()
      } catch (error) {
        handleError(error, context)
        return null
      }
    },
    [handleError]
  )

  return {
    errorState,
    handleError,
    clearError,
    handleAsyncError,
    hasError: errorState.error !== null,
  }
}














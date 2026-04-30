/**
 * Enhanced API Fetch Hook
 * Provides consistent API calls with error handling, loading states, and retry logic
 */

import { useState, useCallback } from 'react'
import { useErrorHandler } from './useErrorHandler'
import { logger } from '@/lib/services/observability/logger'
import { apiFetch } from '@/utils/apiFetch'

export interface UseApiFetchOptions {
  module?: string
  service?: string
  retries?: number
  retryDelay?: number
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export interface ApiFetchState<T> {
  data: T | null
  loading: boolean
  error: Error | null
  errorMessage: string | null
}

export function useApiFetch<T = any>(options: UseApiFetchOptions = {}) {
  const [state, setState] = useState<ApiFetchState<T>>({
    data: null,
    loading: false,
    error: null,
    errorMessage: null,
  })

  const { handleError, clearError } = useErrorHandler({
    module: options.module,
    service: options.service,
    onError: options.onError,
  })

  const fetchData = useCallback(
    async (
      url: string,
      fetchOptions: RequestInit = {},
      context?: { retryable?: boolean; code?: string }
    ): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null, errorMessage: null }))
      clearError()

      let lastError: Error | null = null
      const maxRetries = options.retries ?? 0
      const retryDelay = options.retryDelay ?? 1000

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Use apiFetch to ensure tenant/user headers are included
          const response = await apiFetch(url, {
            ...fetchOptions,
            headers: {
              'Content-Type': 'application/json',
              ...fetchOptions.headers,
            },
            credentials: 'include',
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(
              errorData.error || errorData.message || `Request failed with status ${response.status}`
            )
          }

          const data = await response.json()
          const result = data.data !== undefined ? data.data : data

          setState({
            data: result as T,
            loading: false,
            error: null,
            errorMessage: null,
          })

          options.onSuccess?.(result)
          logger.info('API fetch successful', undefined, {
            module: options.module,
            service: options.service,
            url,
            status: response.status,
          })

          return result as T
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))

          // Don't retry on last attempt
          if (attempt < maxRetries) {
            logger.warn(`API fetch failed, retrying (${attempt + 1}/${maxRetries})`, {
              module: options.module,
              service: options.service,
              url,
              error: lastError.message,
            })

            await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
            continue
          }

          // Last attempt failed
          handleError(lastError, {
            ...context,
            retryable: maxRetries > 0,
            code: context?.code || 'API_FETCH_ERROR',
          })

          setState({
            data: null,
            loading: false,
            error: lastError,
            errorMessage: lastError.message,
          })

          return null
        }
      }

      return null
    },
    [options, handleError, clearError]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      errorMessage: null,
    })
    clearError()
  }, [clearError])

  return {
    ...state,
    fetchData,
    reset,
    refetch: (url: string, fetchOptions?: RequestInit, context?: { retryable?: boolean; code?: string }) =>
      fetchData(url, fetchOptions, context),
  }
}















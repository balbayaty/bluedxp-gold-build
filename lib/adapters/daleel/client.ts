/**
 * Daleel API Client
 * 
 * Handles all HTTP communication with Daleel API
 * Includes retry logic, error handling, and circuit breaker pattern
 */

import { DaleelAuth } from './auth'
import type { DaleelResponse, DaleelError } from '@/types/daleel'

export interface DaleelClientConfig {
  apiBaseUrl: string
  timeout: number
  retryAttempts: number
  auth: DaleelAuth
  enableLogging?: boolean
}

export class DaleelClient {
  private config: DaleelClientConfig
  private circuitBreakerState: 'closed' | 'open' | 'half-open' = 'closed'
  private failureCount: number = 0
  private lastFailureTime: Date | null = null

  constructor(config: DaleelClientConfig) {
    this.config = config
  }

  /**
   * Make authenticated request to Daleel API
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<DaleelResponse<T>> {
    // Ensure authenticated
    if (!this.config.auth.isAuthenticated()) {
      await this.config.auth.authenticate()
    }

    // Check circuit breaker
    if (this.circuitBreakerState === 'open') {
      if (this.shouldAttemptReset()) {
        this.circuitBreakerState = 'half-open'
      } else {
        throw new Error('Daleel API circuit breaker is open - too many failures')
      }
    }

    const url = `${this.config.apiBaseUrl}${endpoint}`
    const authHeaders = this.config.auth.getAuthHeaders()
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    }

    // Retry logic with exponential backoff
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        if (this.config.enableLogging) {
          console.log(`[Daleel Client] ${options.method || 'GET'} ${endpoint} (attempt ${attempt + 1})`)
        }

        const response = await fetch(url, requestOptions)
        
        // Parse response
        const data = await response.json().catch(() => ({}))
        
        if (!response.ok) {
          // Handle specific error codes
          const error: DaleelError = {
            code: `HTTP_${response.status}`,
            message: data.message || response.statusText || 'Request failed',
            details: data,
          }
          
          // Don't retry on client errors (4xx) except 429 (rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            this.recordFailure()
            throw new Error(`Daleel API error: ${error.message}`, { cause: error })
          }
          
          // Retry on server errors (5xx) and rate limits (429)
          if (response.status >= 500 || response.status === 429) {
            lastError = new Error(`Daleel API error: ${error.message}`, { cause: error })
            if (attempt < this.config.retryAttempts) {
              // Wait before retry (exponential backoff)
              const delay = response.status === 429 
                ? 5000 // Wait 5 seconds for rate limits
                : Math.pow(2, attempt) * 1000 // Exponential backoff for server errors
              await this.delay(delay)
              continue
            }
          }
          
          throw new Error(`Daleel API error: ${error.message}`, { cause: error })
        }

        // Success - reset circuit breaker
        this.resetCircuitBreaker()
        
        // Return standardized response
        return {
          success: true,
          data: data.data || data,
          message: data.message,
          timestamp: new Date().toISOString(),
        } as DaleelResponse<T>
      } catch (error: any) {
        lastError = error
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || error.name === 'TypeError') {
          this.recordFailure()
          throw error
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 1000)
        }
      }
    }

    // All retries failed - update circuit breaker
    this.recordFailure()
    throw lastError || new Error('Daleel API request failed after retries')
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<DaleelResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<DaleelResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<DaleelResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * Circuit breaker management
   */
  private recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = new Date()
    
    if (this.failureCount >= 5) {
      this.circuitBreakerState = 'open'
      if (this.config.enableLogging) {
        console.warn('[Daleel Client] Circuit breaker opened due to multiple failures')
      }
    }
  }

  private resetCircuitBreaker(): void {
    this.failureCount = 0
    this.lastFailureTime = null
    this.circuitBreakerState = 'closed'
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true
    
    // Try to reset after 60 seconds
    const timeSinceFailure = Date.now() - this.lastFailureTime.getTime()
    return timeSinceFailure > 60000
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Test connection to Daleel API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try a simple request (you might need to adjust this endpoint)
      await this.config.auth.authenticate()
      return {
        success: true,
        message: 'Daleel API connection successful',
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Daleel API connection failed: ${error.message}`,
      }
    }
  }
}




/**
 * Rabet.sa HTTP Client
 * 
 * Handles all HTTP communication with Rabet.sa APIs
 * Includes retry logic, circuit breaker, and caching
 */

import { RabetAuth } from '../auth'

export interface RabetClientConfig {
  apiBaseUrl: string
  timeout: number
  retryAttempts: number
  auth: RabetAuth
}

export class RabetClient {
  private config: RabetClientConfig
  private circuitBreakerState: 'closed' | 'open' | 'half-open' = 'closed'
  private failureCount: number = 0
  private lastFailureTime: Date | null = null

  constructor(config: RabetClientConfig) {
    this.config = config
  }

  /**
   * Make authenticated request to Rabet.sa API
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure authenticated
    if (!this.config.auth.isAuthenticated()) {
      await this.config.auth.authenticate()
    }

    const token = this.config.auth.getToken()
    if (!token) {
      throw new Error('Not authenticated')
    }

    // Check circuit breaker
    if (this.circuitBreakerState === 'open') {
      if (this.shouldAttemptReset()) {
        this.circuitBreakerState = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    const url = `${this.config.apiBaseUrl}${endpoint}`
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout),
    }

    // Retry logic
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions)
        
        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 401) {
            // Token expired, try to refresh
            await this.config.auth.refreshToken()
            const newToken = this.config.auth.getToken()
            if (newToken) {
              requestOptions.headers = {
                ...requestOptions.headers,
                'Authorization': `Bearer ${newToken}`,
              }
              continue
            }
          }
          
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`API request failed: ${response.status} ${response.statusText}`, {
            cause: errorData,
          })
        }

        // Success - reset circuit breaker
        this.resetCircuitBreaker()
        
        return await response.json()
      } catch (error: any) {
        lastError = error
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || error.name === 'TypeError') {
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
    throw lastError || new Error('Request failed after retries')
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  /**
   * Circuit breaker management
   */
  private recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = new Date()
    
    if (this.failureCount >= 5) {
      this.circuitBreakerState = 'open'
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
}




/**
 * Marketplace Resilience Service
 * Error handling, fallbacks, circuit breakers, retry logic
 * Ensures system reliability and availability
 */

export interface ResilienceConfig {
  maxRetries: number;
  retryDelay: number; // ms
  timeout: number; // ms
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number; // ms
}

export interface CircuitBreakerState {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  lastFailureTime?: number;
  successCount: number;
}

// Circuit breakers for external services
const circuitBreakers: Map<string, CircuitBreakerState> = new Map();

export class ResilienceService {
  private defaultConfig: ResilienceConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 60000,
  };

  /**
   * Execute with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config?: Partial<ResilienceConfig>,
  ): Promise<T> {
    const cfg = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
      try {
        return await this.executeWithTimeout(fn, cfg.timeout);
      } catch (error) {
        lastError = error as Error;
        if (attempt < cfg.maxRetries) {
          await this.delay(cfg.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error("Execution failed after retries");
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number,
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Operation timeout")), timeout),
      ),
    ]);
  }

  /**
   * Execute with circuit breaker
   */
  async executeWithCircuitBreaker<T>(
    serviceName: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(serviceName);

    // Check circuit breaker state
    if (breaker.state === "OPEN") {
      if (Date.now() - (breaker.lastFailureTime || 0) > 60000) {
        breaker.state = "HALF_OPEN";
        breaker.successCount = 0;
      } else {
        // Circuit is open, use fallback
        if (fallback) {
          return fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${serviceName}`);
      }
    }

    try {
      const result = await fn();

      // Success - reset circuit breaker
      if (breaker.state === "HALF_OPEN") {
        breaker.successCount++;
        if (breaker.successCount >= 2) {
          breaker.state = "CLOSED";
          breaker.failures = 0;
        }
      } else {
        breaker.failures = 0;
      }

      return result;
    } catch (error) {
      breaker.failures++;
      breaker.lastFailureTime = Date.now();

      if (breaker.failures >= 5) {
        breaker.state = "OPEN";
      }

      // Try fallback
      if (fallback) {
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Get or create circuit breaker
   */
  private getCircuitBreaker(serviceName: string): CircuitBreakerState {
    if (!circuitBreakers.has(serviceName)) {
      circuitBreakers.set(serviceName, {
        state: "CLOSED",
        failures: 0,
        successCount: 0,
      });
    }
    return circuitBreakers.get(serviceName)!;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health check
   */
  async healthCheck(serviceName: string): Promise<{
    healthy: boolean;
    state: CircuitBreakerState["state"];
    failures: number;
    lastFailureTime?: number;
  }> {
    const breaker = this.getCircuitBreaker(serviceName);

    return {
      healthy: breaker.state === "CLOSED" || breaker.state === "HALF_OPEN",
      state: breaker.state,
      failures: breaker.failures,
      lastFailureTime: breaker.lastFailureTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(serviceName: string): void {
    circuitBreakers.delete(serviceName);
  }
}

// Singleton instance
export const resilienceService = new ResilienceService();

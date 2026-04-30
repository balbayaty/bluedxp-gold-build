/**
 * Vision Resilience Service
 * Error handling, fallbacks, circuit breakers, retry logic for vision services
 * Ensures reliability and availability
 */

import { ResilienceService } from "@/lib/services/marketplace/resilienceService";
import { visionCacheService } from "../visionCacheService";

// ============================================================================
// TYPES
// ============================================================================

export interface VisionResilienceConfig {
  maxRetries: number;
  retryDelay: number; // ms
  timeout: number; // ms
  enableCircuitBreaker: boolean;
  enableCache: boolean;
  enableFallback: boolean;
}

// ============================================================================
// VISION RESILIENCE SERVICE
// ============================================================================

class VisionResilienceService {
  private resilienceService: ResilienceService;
  private defaultConfig: VisionResilienceConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    enableCircuitBreaker: true,
    enableCache: true,
    enableFallback: true,
  };

  constructor() {
    this.resilienceService = new ResilienceService();
  }

  /**
   * Execute vision analysis with resilience
   */
  async executeWithResilience<T>(
    serviceName: string,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
    config?: Partial<VisionResilienceConfig>,
  ): Promise<T> {
    const mergedConfig = { ...this.defaultConfig, ...config };

    // Check cache first if enabled
    // Note: visionCacheService uses imageHash-based caching, so we skip cache check here
    // Cache will be handled by individual vision services

    // Execute with circuit breaker and retry
    if (mergedConfig.enableCircuitBreaker) {
      return this.resilienceService.executeWithCircuitBreaker(
        serviceName,
        () =>
          this.resilienceService.executeWithRetry(fn, {
            maxRetries: mergedConfig.maxRetries,
            retryDelay: mergedConfig.retryDelay,
            timeout: mergedConfig.timeout,
          }),
        fallback,
      );
    } else {
      return this.resilienceService.executeWithRetry(fn, {
        maxRetries: mergedConfig.maxRetries,
        retryDelay: mergedConfig.retryDelay,
        timeout: mergedConfig.timeout,
      });
    }
  }

  /**
   * Execute with fallback to cached result
   * Note: This is a simplified version - actual caching is handled by vision services
   */
  async executeWithCachedFallback<T>(
    serviceName: string,
    fn: () => Promise<T>,
    cacheKey: string,
    ttl?: number,
  ): Promise<T> {
    try {
      const result = await this.executeWithResilience(serviceName, fn);
      // Note: Actual caching is handled by individual vision services using imageHash
      return result;
    } catch (error) {
      // Individual vision services handle their own cache fallback
      throw error;
    }
  }

  /**
   * Execute with provider fallback (OpenAI -> Anthropic -> Cached)
   */
  async executeWithProviderFallback<T>(
    openaiFn: () => Promise<T>,
    anthropicFn: () => Promise<T>,
    cacheKey: string,
  ): Promise<T> {
    // Try OpenAI first
    try {
      return await this.executeWithResilience("openai-vision", openaiFn);
    } catch (openaiError) {
      console.warn("OpenAI vision failed, trying Anthropic:", openaiError);

      // Try Anthropic
      try {
        return await this.executeWithResilience(
          "anthropic-vision",
          anthropicFn,
        );
      } catch (anthropicError) {
        console.warn("Anthropic vision failed, trying cache:", anthropicError);

        // Try cache as last resort
        const cached = await visionCacheService.get(cacheKey);
        if (cached) {
          console.warn("Using cached result as fallback");
          return cached as T;
        }

        throw new Error(
          `All vision providers failed. OpenAI: ${openaiError}, Anthropic: ${anthropicError}`,
        );
      }
    }
  }

  /**
   * Handle vision service errors gracefully
   */
  handleVisionError(
    error: any,
    context: string,
  ): {
    error: string;
    fallback: boolean;
    retryable: boolean;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let retryable = false;
    let fallback = false;

    if (error instanceof Error) {
      // Rate limit errors
      if (
        error.message.includes("rate limit") ||
        error.message.includes("429")
      ) {
        retryable = true;
        recommendations.push(
          "Rate limit exceeded. Please wait before retrying.",
        );
        recommendations.push(
          "Consider upgrading your API plan or reducing request frequency.",
        );
      }

      // Timeout errors
      else if (
        error.message.includes("timeout") ||
        error.message.includes("ETIMEDOUT")
      ) {
        retryable = true;
        recommendations.push(
          "Request timed out. The image may be too large or the service is slow.",
        );
        recommendations.push("Try reducing image size or increasing timeout.");
      }

      // Authentication errors
      else if (
        error.message.includes("401") ||
        error.message.includes("unauthorized")
      ) {
        retryable = false;
        recommendations.push("Authentication failed. Check your API keys.");
      }

      // Service unavailable
      else if (
        error.message.includes("503") ||
        error.message.includes("service unavailable")
      ) {
        retryable = true;
        fallback = true;
        recommendations.push(
          "Service temporarily unavailable. Try again later.",
        );
        recommendations.push(
          "Consider using cached results or alternative provider.",
        );
      }

      // Generic errors
      else {
        retryable = true;
        recommendations.push("An error occurred during vision analysis.");
        recommendations.push("Check the error message for details.");
      }
    }

    return {
      error: error instanceof Error ? error.message : "Unknown error",
      fallback,
      retryable,
      recommendations,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const visionResilienceService = new VisionResilienceService();

/**
 * Bulkhead Circuit Breaker
 *
 * Advanced circuit breaker with:
 * - Resource isolation (bulkhead pattern)
 * - Thread pool management
 * - Separate circuit breakers per resource
 * - Isolation boundaries
 */

import {
  ResilienceService,
  CircuitBreakerState,
} from "../marketplace/resilienceService";

export interface BulkheadConfig {
  maxConcurrent: number;
  maxQueueSize: number;
  timeout: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface BulkheadMetrics {
  active: number;
  queued: number;
  completed: number;
  failed: number;
  rejected: number;
  circuitBreakerState: CircuitBreakerState;
}

class BulkheadCircuitBreaker {
  private bulkheads: Map<string, BulkheadInstance> = new Map();

  /**
   * Execute with bulkhead isolation
   */
  async execute<T>(
    bulkheadId: string,
    operation: () => Promise<T>,
    config?: Partial<BulkheadConfig>,
  ): Promise<T> {
    const bulkhead = this.getOrCreateBulkhead(bulkheadId, config);

    // Check circuit breaker
    if (bulkhead.circuitBreakerState === "OPEN") {
      throw new Error(`Circuit breaker OPEN for bulkhead ${bulkheadId}`);
    }

    // Check capacity
    if (bulkhead.active >= bulkhead.config.maxConcurrent) {
      if (bulkhead.queue.length >= bulkhead.config.maxQueueSize) {
        bulkhead.metrics.rejected++;
        throw new Error(`Bulkhead ${bulkheadId} is full (queue overflow)`);
      }

      // Queue operation
      return new Promise((resolve, reject) => {
        bulkhead.queue.push({ operation, resolve, reject });
        bulkhead.metrics.queued++;
      });
    }

    // Execute operation
    return this.executeOperation(bulkhead, operation);
  }

  /**
   * Get bulkhead metrics
   */
  getMetrics(bulkheadId: string): BulkheadMetrics | null {
    const bulkhead = this.bulkheads.get(bulkheadId);
    if (!bulkhead) {
      return null;
    }

    return {
      active: bulkhead.active,
      queued: bulkhead.queue.length,
      completed: bulkhead.metrics.completed,
      failed: bulkhead.metrics.failed,
      rejected: bulkhead.metrics.rejected,
      circuitBreakerState: bulkhead.circuitBreakerState,
    };
  }

  /**
   * Get all bulkhead metrics
   */
  getAllMetrics(): Record<string, BulkheadMetrics> {
    const metrics: Record<string, BulkheadMetrics> = {};

    for (const [id, bulkhead] of this.bulkheads.entries()) {
      metrics[id] = {
        active: bulkhead.active,
        queued: bulkhead.queue.length,
        completed: bulkhead.metrics.completed,
        failed: bulkhead.metrics.failed,
        rejected: bulkhead.metrics.rejected,
        circuitBreakerState: bulkhead.circuitBreakerState,
      };
    }

    return metrics;
  }

  /**
   * Reset bulkhead
   */
  reset(bulkheadId: string): void {
    const bulkhead = this.bulkheads.get(bulkheadId);
    if (bulkhead) {
      bulkhead.circuitBreakerState = "CLOSED";
      bulkhead.failureCount = 0;
      bulkhead.lastFailureTime = null;
    }
  }

  // Private methods

  private getOrCreateBulkhead(
    bulkheadId: string,
    config?: Partial<BulkheadConfig>,
  ): BulkheadInstance {
    if (!this.bulkheads.has(bulkheadId)) {
      const defaultConfig: BulkheadConfig = {
        maxConcurrent: 10,
        maxQueueSize: 100,
        timeout: 30000,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 60000,
      };

      this.bulkheads.set(bulkheadId, {
        id: bulkheadId,
        config: { ...defaultConfig, ...config },
        active: 0,
        queue: [],
        circuitBreakerState: "CLOSED",
        failureCount: 0,
        lastFailureTime: null,
        metrics: {
          completed: 0,
          failed: 0,
          rejected: 0,
        },
      });
    }

    return this.bulkheads.get(bulkheadId)!;
  }

  private async executeOperation<T>(
    bulkhead: BulkheadInstance,
    operation: () => Promise<T>,
  ): Promise<T> {
    bulkhead.active++;

    const timeoutId = setTimeout(() => {
      bulkhead.active--;
      this.processQueue(bulkhead);
    }, bulkhead.config.timeout);

    try {
      const result = await operation();
      clearTimeout(timeoutId);

      bulkhead.active--;
      bulkhead.metrics.completed++;
      bulkhead.failureCount = 0; // Reset on success

      // Process queued operations
      this.processQueue(bulkhead);

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      bulkhead.active--;
      bulkhead.metrics.failed++;
      bulkhead.failureCount++;
      bulkhead.lastFailureTime = new Date();

      // Check circuit breaker threshold
      if (bulkhead.failureCount >= bulkhead.config.circuitBreakerThreshold) {
        bulkhead.circuitBreakerState = "OPEN";

        // Schedule half-open transition
        setTimeout(() => {
          bulkhead.circuitBreakerState = "HALF_OPEN";
        }, bulkhead.config.circuitBreakerTimeout);
      }

      // Process queue (may fail, but we try)
      this.processQueue(bulkhead);

      throw error;
    }
  }

  private processQueue(bulkhead: BulkheadInstance): void {
    while (
      bulkhead.queue.length > 0 &&
      bulkhead.active < bulkhead.config.maxConcurrent
    ) {
      const queued = bulkhead.queue.shift()!;
      bulkhead.metrics.queued--;

      // Execute queued operation
      this.executeOperation(bulkhead, queued.operation)
        .then(queued.resolve)
        .catch(queued.reject);
    }
  }
}

interface BulkheadInstance {
  id: string;
  config: BulkheadConfig;
  active: number;
  queue: Array<{
    operation: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>;
  circuitBreakerState: CircuitBreakerState;
  failureCount: number;
  lastFailureTime: Date | null;
  metrics: {
    completed: number;
    failed: number;
    rejected: number;
  };
}

export const bulkheadCircuitBreaker = new BulkheadCircuitBreaker();

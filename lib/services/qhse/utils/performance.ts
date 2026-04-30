/**
 * QHSE Performance Monitoring
 * Track and optimize performance metrics
 */

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  metadata?: Record<string, any>;
}

class QHSEPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 10000;

  /**
   * Record performance metric
   */
  record(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>,
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get performance statistics
   */
  getStats(operation?: string): {
    operation: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p50: number;
    p95: number;
    p99: number;
  }[] {
    let filtered = operation
      ? this.metrics.filter((m) => m.operation === operation)
      : this.metrics;

    const byOperation = filtered.reduce(
      (acc, metric) => {
        if (!acc[metric.operation]) {
          acc[metric.operation] = [];
        }
        acc[metric.operation].push(metric);
        return acc;
      },
      {} as Record<string, PerformanceMetric[]>,
    );

    return Object.entries(byOperation).map(([op, metrics]) => {
      const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
      const successful = metrics.filter((m) => m.success).length;
      const failed = metrics.filter((m) => !m.success).length;

      return {
        operation: op,
        totalCalls: metrics.length,
        successfulCalls: successful,
        failedCalls: failed,
        averageDuration:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: durations[0] || 0,
        maxDuration: durations[durations.length - 1] || 0,
        p50: durations[Math.floor(durations.length * 0.5)] || 0,
        p95: durations[Math.floor(durations.length * 0.95)] || 0,
        p99: durations[Math.floor(durations.length * 0.99)] || 0,
      };
    });
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

export const qhsePerformanceMonitor = new QHSEPerformanceMonitor();

/**
 * Performance decorator
 */
export function measurePerformance(operation: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      let success = true;
      try {
        const result = await method.apply(this, args);
        return result;
      } catch (error) {
        success = false;
        throw error;
      } finally {
        const duration = Date.now() - start;
        qhsePerformanceMonitor.record(operation, duration, success);
      }
    };
  };
}

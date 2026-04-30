/**
 * ⚡ PERMISSION PERFORMANCE METRICS
 *
 * Mind-blowing performance analytics:
 * - Permission check performance
 * - Cache hit rates
 * - Query optimization
 * - Response time tracking
 * - Bottleneck detection
 * - Performance recommendations
 */

import type { User, TabId } from "@/types/user";
import { permissionValidationService } from "./permissionValidationService";

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetric {
  timestamp: Date;
  operation:
    | "CHECK_TAB"
    | "CHECK_MODULE"
    | "CHECK_FEATURE"
    | "FILTER_TABS"
    | "VALIDATE";
  duration: number; // milliseconds
  success: boolean;
  cacheHit: boolean;
  userId?: string;
  tabId?: TabId;
}

export interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  p50: number; // median
  p95: number; // 95th percentile
  p99: number; // 99th percentile
  cacheHitRate: number; // 0-100
  successRate: number; // 0-100
  slowestOperations: Array<{
    operation: string;
    duration: number;
    timestamp: Date;
  }>;
  recommendations: string[];
}

// ============================================================================
// PERFORMANCE METRICS SERVICE
// ============================================================================

class PermissionPerformanceMetricsService {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 10000;

  /**
   * Record performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, "timestamp">): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date(),
    });

    // Maintain size
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get performance stats
   */
  getPerformanceStats(timeRange?: {
    start: Date;
    end: Date;
  }): PerformanceStats {
    let filtered = this.metrics;

    if (timeRange) {
      filtered = filtered.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
      );
    }

    if (filtered.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        cacheHitRate: 0,
        successRate: 0,
        slowestOperations: [],
        recommendations: [],
      };
    }

    const durations = filtered.map((m) => m.duration).sort((a, b) => a - b);
    const cacheHits = filtered.filter((m) => m.cacheHit).length;
    const successes = filtered.filter((m) => m.success).length;

    const averageDuration =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    const cacheHitRate = (cacheHits / filtered.length) * 100;
    const successRate = (successes / filtered.length) * 100;

    // Find slowest operations
    const slowest = filtered
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map((m) => ({
        operation: m.operation,
        duration: m.duration,
        timestamp: m.timestamp,
      }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      averageDuration,
      p95,
      cacheHitRate,
      successRate,
    );

    return {
      totalOperations: filtered.length,
      averageDuration,
      p50,
      p95,
      p99,
      cacheHitRate,
      successRate,
      slowestOperations: slowest,
      recommendations,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    avgDuration: number,
    p95: number,
    cacheHitRate: number,
    successRate: number,
  ): string[] {
    const recommendations: string[] = [];

    if (avgDuration > 100) {
      recommendations.push(
        "⚡ Average response time is high. Consider optimizing permission checks.",
      );
    }

    if (p95 > 500) {
      recommendations.push(
        "🐌 95th percentile response time is slow. Review slow operations.",
      );
    }

    if (cacheHitRate < 50) {
      recommendations.push(
        "💾 Cache hit rate is low. Consider improving caching strategy.",
      );
    }

    if (successRate < 95) {
      recommendations.push(
        "⚠️ Success rate is below optimal. Review failed operations.",
      );
    }

    if (avgDuration < 50 && cacheHitRate > 80) {
      recommendations.push("✅ Performance is optimal!");
    }

    return recommendations;
  }

  /**
   * Get metrics by operation type
   */
  getMetricsByOperation(
    operation: PerformanceMetric["operation"],
  ): PerformanceMetric[] {
    return this.metrics.filter((m) => m.operation === operation);
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const permissionPerformanceMetrics =
  new PermissionPerformanceMetricsService();

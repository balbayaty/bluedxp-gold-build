/**
 * Application Performance Monitoring (APM) Service
 *
 * Tracks and monitors application performance:
 * - Slow query detection
 * - N+1 query detection
 * - Memory leak detection
 * - Performance budgets
 * - Real-time performance metrics
 */

import { prisma } from "@/lib/services/database/prismaClient";

export interface QueryPerformance {
  query: string;
  duration: number;
  timestamp: Date;
  slow: boolean;
  nPlusOne?: boolean;
}

export interface PerformanceBudget {
  endpoint: string;
  maxResponseTime: number; // ms
  maxDatabaseQueries: number;
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // percentage
}

export interface BudgetResult {
  withinBudget: boolean;
  violations: Array<{
    metric: string;
    actual: number;
    budget: number;
    severity: "low" | "medium" | "high";
  }>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  databaseQueriesPerRequest: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface LeakReport {
  detected: boolean;
  severity: "low" | "medium" | "high" | "critical";
  memoryGrowth: number; // MB per hour
  recommendations: string[];
}

class APMService {
  private slowQueryThreshold = 1000; // ms
  private queryHistory: QueryPerformance[] = [];
  private performanceBudgets: Map<string, PerformanceBudget> = new Map();
  private requestMetrics: Array<{
    endpoint: string;
    responseTime: number;
    timestamp: Date;
    queries: number;
  }> = [];
  private memorySnapshots: Array<{
    timestamp: Date;
    heapUsed: number;
    heapTotal: number;
  }> = [];

  /**
   * Track slow query
   */
  async trackSlowQuery(query: string, duration: number): Promise<void> {
    if (duration > this.slowQueryThreshold) {
      const performance: QueryPerformance = {
        query: this.sanitizeQuery(query),
        duration,
        timestamp: new Date(),
        slow: true,
      };

      this.queryHistory.push(performance);

      // Keep only last 1000 queries
      if (this.queryHistory.length > 1000) {
        this.queryHistory.shift();
      }

      // Log slow query
      console.warn(
        `⚠️ Slow query detected: ${duration}ms - ${performance.query.substring(0, 100)}`,
      );

      // Store in database for analysis
      await this.storeSlowQuery(performance);
    }
  }

  /**
   * Detect N+1 queries
   */
  async detectNPlusOneQueries(
    queries: Array<{
      query: string;
      timestamp: number;
    }>,
  ): Promise<{
    detected: boolean;
    patterns: Array<{
      query: string;
      count: number;
      severity: "low" | "medium" | "high";
    }>;
  }> {
    // Group queries by pattern
    const queryPatterns = new Map<string, number>();

    for (const q of queries) {
      const pattern = this.extractQueryPattern(q.query);
      queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
    }

    // Detect N+1 patterns (same query executed multiple times)
    const nPlusOnePatterns: Array<{
      query: string;
      count: number;
      severity: "low" | "medium" | "high";
    }> = [];

    for (const [pattern, count] of queryPatterns.entries()) {
      if (count > 5) {
        // Potential N+1 query
        const severity = count > 50 ? "high" : count > 20 ? "medium" : "low";
        nPlusOnePatterns.push({
          query: pattern,
          count,
          severity,
        });
      }
    }

    return {
      detected: nPlusOnePatterns.length > 0,
      patterns: nPlusOnePatterns,
    };
  }

  /**
   * Detect memory leaks
   */
  async detectMemoryLeaks(): Promise<LeakReport> {
    // Take current memory snapshot
    const memoryUsage = process.memoryUsage();
    const snapshot = {
      timestamp: new Date(),
      heapUsed: memoryUsage.heapUsed / 1024 / 1024, // MB
      heapTotal: memoryUsage.heapTotal / 1024 / 1024, // MB
    };

    this.memorySnapshots.push(snapshot);

    // Keep only last 100 snapshots (last ~5 minutes if taken every 3 seconds)
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots.shift();
    }

    // Need at least 10 snapshots to detect leaks
    if (this.memorySnapshots.length < 10) {
      return {
        detected: false,
        severity: "low",
        memoryGrowth: 0,
        recommendations: [],
      };
    }

    // Calculate memory growth rate
    const first = this.memorySnapshots[0];
    const last = this.memorySnapshots[this.memorySnapshots.length - 1];
    const timeDiff =
      (last.timestamp.getTime() - first.timestamp.getTime()) / 1000 / 60; // minutes
    const memoryGrowth = (last.heapUsed - first.heapUsed) / timeDiff; // MB per minute

    // Convert to MB per hour
    const memoryGrowthPerHour = memoryGrowth * 60;

    // Detect leak (growing more than 10 MB per hour)
    if (memoryGrowthPerHour > 10) {
      const severity =
        memoryGrowthPerHour > 100
          ? "critical"
          : memoryGrowthPerHour > 50
            ? "high"
            : memoryGrowthPerHour > 20
              ? "medium"
              : "low";

      return {
        detected: true,
        severity,
        memoryGrowth: memoryGrowthPerHour,
        recommendations: [
          "Check for unclosed database connections",
          "Review event listeners that may not be cleaned up",
          "Check for circular references",
          "Review caching strategies",
          "Consider increasing memory limits",
        ],
      };
    }

    return {
      detected: false,
      severity: "low",
      memoryGrowth: memoryGrowthPerHour,
      recommendations: [],
    };
  }

  /**
   * Check performance budget
   */
  async checkPerformanceBudget(endpoint: string): Promise<BudgetResult> {
    const budget = this.performanceBudgets.get(endpoint);
    if (!budget) {
      return {
        withinBudget: true,
        violations: [],
      };
    }

    // Get recent metrics for this endpoint
    const recentMetrics = this.requestMetrics
      .filter((m) => m.endpoint === endpoint)
      .slice(-100); // Last 100 requests

    if (recentMetrics.length === 0) {
      return {
        withinBudget: true,
        violations: [],
      };
    }

    // Calculate averages
    const avgResponseTime =
      recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
      recentMetrics.length;
    const avgQueries =
      recentMetrics.reduce((sum, m) => sum + m.queries, 0) /
      recentMetrics.length;

    // Get current memory and CPU usage
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const cpuUsage = await this.getCpuUsage();

    const violations: BudgetResult["violations"] = [];

    // Check response time
    if (avgResponseTime > budget.maxResponseTime) {
      violations.push({
        metric: "responseTime",
        actual: avgResponseTime,
        budget: budget.maxResponseTime,
        severity:
          avgResponseTime > budget.maxResponseTime * 2 ? "high" : "medium",
      });
    }

    // Check database queries
    if (avgQueries > budget.maxDatabaseQueries) {
      violations.push({
        metric: "databaseQueries",
        actual: avgQueries,
        budget: budget.maxDatabaseQueries,
        severity:
          avgQueries > budget.maxDatabaseQueries * 2 ? "high" : "medium",
      });
    }

    // Check memory usage
    if (memoryUsage > budget.maxMemoryUsage) {
      violations.push({
        metric: "memoryUsage",
        actual: memoryUsage,
        budget: budget.maxMemoryUsage,
        severity: memoryUsage > budget.maxMemoryUsage * 1.5 ? "high" : "medium",
      });
    }

    // Check CPU usage
    if (cpuUsage > budget.maxCpuUsage) {
      violations.push({
        metric: "cpuUsage",
        actual: cpuUsage,
        budget: budget.maxCpuUsage,
        severity: cpuUsage > budget.maxCpuUsage * 1.5 ? "high" : "medium",
      });
    }

    return {
      withinBudget: violations.length === 0,
      violations,
    };
  }

  /**
   * Get real-time performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const recentMetrics = this.requestMetrics.slice(-1000); // Last 1000 requests

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        databaseQueriesPerRequest: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      };
    }

    // Sort by response time
    const responseTimes = recentMetrics
      .map((m) => m.responseTime)
      .sort((a, b) => a - b);

    // Calculate percentiles
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

    // Calculate averages
    const averageResponseTime =
      responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const databaseQueriesPerRequest =
      recentMetrics.reduce((sum, m) => sum + m.queries, 0) /
      recentMetrics.length;

    // Calculate requests per second
    const timeSpan =
      recentMetrics.length > 1
        ? (recentMetrics[recentMetrics.length - 1].timestamp.getTime() -
            recentMetrics[0].timestamp.getTime()) /
          1000
        : 1;
    const requestsPerSecond = recentMetrics.length / timeSpan;

    // Get memory and CPU
    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    const cpuUsage = await this.getCpuUsage();

    return {
      averageResponseTime,
      p50ResponseTime: p50 || 0,
      p95ResponseTime: p95 || 0,
      p99ResponseTime: p99 || 0,
      requestsPerSecond,
      errorRate: 0, // Would track errors separately
      databaseQueriesPerRequest,
      memoryUsage,
      cpuUsage,
    };
  }

  /**
   * Track request metrics
   */
  trackRequest(endpoint: string, responseTime: number, queries: number): void {
    this.requestMetrics.push({
      endpoint,
      responseTime,
      timestamp: new Date(),
      queries,
    });

    // Keep only last 10000 requests
    if (this.requestMetrics.length > 10000) {
      this.requestMetrics.shift();
    }
  }

  /**
   * Set performance budget
   */
  setPerformanceBudget(endpoint: string, budget: PerformanceBudget): void {
    this.performanceBudgets.set(endpoint, budget);
  }

  // Private helper methods

  private sanitizeQuery(query: string): string {
    // Remove sensitive data from query
    return query
      .replace(/'[^']*'/g, "'***'") // Replace string literals
      .replace(/\d+/g, "N") // Replace numbers
      .substring(0, 500); // Limit length
  }

  private extractQueryPattern(query: string): string {
    // Extract query pattern (remove values)
    return this.sanitizeQuery(query);
  }

  private async storeSlowQuery(performance: QueryPerformance): Promise<void> {
    // Store in database for analysis
    try {
      await prisma.slowQuery.create({
        data: {
          query: performance.query,
          duration: performance.duration,
          timestamp: performance.timestamp,
          slow: true,
        },
      });
    } catch (error) {
      // Table might not exist, that's okay
      console.warn("Could not store slow query:", error);
    }
  }

  private async getCpuUsage(): Promise<number> {
    // Get CPU usage (simplified)
    // In production, use a proper CPU monitoring library
    return 0; // Placeholder
  }
}

export const apmService = new APMService();

// Set default performance budgets
apmService.setPerformanceBudget("/api/inventory", {
  endpoint: "/api/inventory",
  maxResponseTime: 500,
  maxDatabaseQueries: 10,
  maxMemoryUsage: 100,
  maxCpuUsage: 80,
});

apmService.setPerformanceBudget("/api/shipments", {
  endpoint: "/api/shipments",
  maxResponseTime: 1000,
  maxDatabaseQueries: 20,
  maxMemoryUsage: 150,
  maxCpuUsage: 80,
});

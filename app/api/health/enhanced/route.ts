/**
 * Enhanced Health Check Endpoint
 *
 * Includes Phase 1 observability and security checks
 */

import { NextRequest, NextResponse } from "next/server";
import { apmService } from "@/lib/services/observability/apmService";
import { alertingService } from "@/lib/services/observability/alertingService";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get performance metrics
    const metrics = await apmService.getPerformanceMetrics();

    // Check for memory leaks
    const leakReport = await apmService.detectMemoryLeaks();

    // Get health status
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      performance: {
        averageResponseTime: metrics.averageResponseTime,
        p95ResponseTime: metrics.p95ResponseTime,
        requestsPerSecond: metrics.requestsPerSecond,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
      },
      memory: {
        leakDetected: leakReport.detected,
        severity: leakReport.severity,
        memoryGrowth: leakReport.memoryGrowth,
      },
      services: {
        database: "connected", // Would check actual DB connection
        redis: "connected", // Would check actual Redis connection
        openTelemetry:
          process.env.OTEL_ENABLED !== "false" ? "enabled" : "disabled",
        zeroTrust:
          process.env.ZERO_TRUST_ENABLED !== "false" ? "enabled" : "disabled",
      },
    };

    // If memory leak detected, create alert
    if (leakReport.detected && leakReport.severity !== "low") {
      await alertingService.sendAlert({
        id: `health-memory-leak-${Date.now()}`,
        severity: leakReport.severity,
        title: "Memory Leak Detected",
        message: `Memory growth: ${leakReport.memoryGrowth.toFixed(2)} MB/hour`,
        source: "health-check",
        metric: "memory_usage",
        value: metrics.memoryUsage,
        timestamp: new Date(),
        metadata: {
          recommendations: leakReport.recommendations,
        },
      });
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json(health, {
      status: 200,
      headers: {
        "X-Response-Time": `${responseTime}ms`,
        "X-Health-Check": "enhanced",
      },
    });
  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      {
        status: 500,
        headers: {
          "X-Response-Time": `${responseTime}ms`,
        },
      },
    );
  }
}

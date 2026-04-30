/**
 * QHSE Metrics API
 * Performance and operational metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { qhsePerformanceMonitor } from "@/lib/services/qhse/utils/performance";
import { qhseCache } from "@/lib/services/qhse/utils/cache";
import { qhseLogger } from "@/lib/services/qhse/utils/logger";
import { qhseRateLimiter } from "@/lib/services/qhse/utils/rateLimiter";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";

    const metrics: Record<string, any> = {};

    if (type === "all" || type === "performance") {
      metrics.performance = qhsePerformanceMonitor.getStats();
    }

    if (type === "all" || type === "cache") {
      metrics.cache = qhseCache.getStats();
    }

    if (type === "all" || type === "logs") {
      metrics.logs = {
        recent: qhseLogger.getLogs({ limit: 100 }),
        byLevel: {
          DEBUG: qhseLogger.getLogs({ level: "DEBUG" as any, limit: 10 })
            .length,
          INFO: qhseLogger.getLogs({ level: "INFO" as any, limit: 10 }).length,
          WARN: qhseLogger.getLogs({ level: "WARN" as any, limit: 10 }).length,
          ERROR: qhseLogger.getLogs({ level: "ERROR" as any, limit: 10 })
            .length,
          CRITICAL: qhseLogger.getLogs({ level: "CRITICAL" as any, limit: 10 })
            .length,
        },
      };
    }

    if (type === "all" || type === "rate-limits") {
      // Get rate limit status for common endpoints
      metrics.rateLimits = {
        "food-safety": qhseRateLimiter.getStatus("api:food-safety"),
        pharmaceutical: qhseRateLimiter.getStatus("api:pharmaceutical"),
        "oil-gas": qhseRateLimiter.getStatus("api:oil-gas"),
        "business-continuity": qhseRateLimiter.getStatus(
          "api:business-continuity",
        ),
        "ai-predictions": qhseRateLimiter.getStatus("api:ai-predictions"),
        "digital-twin": qhseRateLimiter.getStatus("api:digital-twin"),
      };
    }

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.metrics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

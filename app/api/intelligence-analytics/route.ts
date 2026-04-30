/**
 * Unified Intelligence Analytics API
 *
 * Main API route for unified intelligence analytics
 * Supports: root-cause, data-mining, process-mining, analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { unifiedIntelligenceService } from "@/lib/services/intelligence-analytics";
import type { IntelligenceAnalysisRequest } from "@/types/intelligence-analytics";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { action, type, tenantId: bodyTenantId, ...params } = body;
    // Try to get tenantId from context first (set by API gateway middleware), then fallback to body
    const tenantId =
      context?.tenantId || bodyTenantId || context?.user?.tenantId;

    if (!tenantId || String(tenantId).trim().length === 0) {
      return NextResponse.json(
        { error: "tenantId is required (multi-tenant day 1)" },
        { status: 400 },
      );
    }

    switch (action) {
      case "analyze": {
        const request: IntelligenceAnalysisRequest = {
          tenantId: String(tenantId),
          type: type || "analytics",
          source: params.source,
          context: params.context,
          options: params.options,
        };

        const result = await unifiedIntelligenceService.analyze(request);
        return NextResponse.json({ result });
      }

      case "root-cause": {
        const result = await unifiedIntelligenceService.analyzeRootCause({
          tenantId: String(tenantId),
          issueId: params.issueId,
          issueType: params.issueType,
          source: params.source || {
            module: "unknown",
            entityType: "unknown",
            entityId: "unknown",
          },
          context: params.context,
        });
        return NextResponse.json({ result });
      }

      case "data-mining": {
        const results = await unifiedIntelligenceService.runDataMining({
          tenantId: String(tenantId),
          moduleIds: params.moduleIds,
          timeRange: params.timeRange,
          algorithms: params.algorithms,
        });
        return NextResponse.json({ results });
      }

      case "process-mining": {
        const result = await unifiedIntelligenceService.discoverProcess({
          tenantId: String(tenantId),
          processType: params.processType || "GENERAL",
          moduleIds: params.moduleIds,
          timeRange: params.timeRange,
        });
        return NextResponse.json({ result });
      }

      case "analytics": {
        const result = await unifiedIntelligenceService.aggregateAnalytics({
          tenantId: String(tenantId),
          moduleIds: params.moduleIds,
          timeRange: params.timeRange,
        });
        return NextResponse.json({ result });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Unified Intelligence Analytics API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(handler, {
  moduleId: "intelligence",
  featureId: "intelligence.analytics",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(handler, {
  moduleId: "intelligence",
  featureId: "intelligence.analytics",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

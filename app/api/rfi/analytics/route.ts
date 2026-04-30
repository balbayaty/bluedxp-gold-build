/**
 * RFI Analytics API Route
 * Get analytics and throughput metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { rfiService } from "@/lib/services/proposals/RFIService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const { searchParams } = new URL(request.url);

    const timeRange = searchParams.get("timeRange")
      ? {
          from:
            searchParams.get("from") ||
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: searchParams.get("to") || new Date().toISOString(),
        }
      : undefined;

    const analytics = await rfiService.getAnalytics(tenantId);
    const throughput = await rfiService.getThroughputMetrics(
      tenantId,
      timeRange,
    );

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        throughput,
      },
    });
  } catch (error) {
    console.error("Error fetching RFI analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(GETHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.rfi",
  action: "read",
  requireAuth: true,
});

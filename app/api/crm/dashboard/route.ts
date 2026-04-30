/**
 * CRM Dashboard API
 * GET /api/crm/dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedCRMService } from "@/lib/services/crm/integration/unifiedCRMService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    const crmData = await unifiedCRMService.getUnifiedCRMData(tenantId);

    // Calculate KPIs
    const totalLeads = crmData.leads.length;
    const activeOpportunities = crmData.opportunities.filter(
      (o) => o.stage !== "CLOSED_WON" && o.stage !== "CLOSED_LOST",
    );
    const pipelineValue = activeOpportunities.reduce(
      (sum, o) => sum + o.value,
      0,
    );
    const weightedPipeline = activeOpportunities.reduce(
      (sum, o) => sum + o.value * (o.probability / 100),
      0,
    );
    const closedWon = crmData.opportunities.filter(
      (o) => o.stage === "CLOSED_WON",
    );
    const closedLost = crmData.opportunities.filter(
      (o) => o.stage === "CLOSED_LOST",
    );
    const winRate =
      closedWon.length + closedLost.length > 0
        ? (closedWon.length / (closedWon.length + closedLost.length)) * 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...crmData,
        kpis: {
          totalLeads,
          activeOpportunities: activeOpportunities.length,
          pipelineValue,
          weightedPipeline,
          winRate: winRate.toFixed(1),
        },
      },
    });
  } catch (error: unknown) {
    logger.error("Error fetching CRM dashboard", {
      error: error instanceof Error ? error.message : String(error),
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      { context: "crm-dashboard", action: "fetch" },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch CRM dashboard",
      },
      { status: 500 },
    );
  }
}

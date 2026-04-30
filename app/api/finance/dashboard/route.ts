/**
 * Financial Dashboard API
 * GET /api/finance/dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedFinanceService } from "@/lib/services/finance/integration/unifiedFinanceService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId;

    const summary =
      await unifiedFinanceService.getFinancialDashboardSummary(tenantId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: unknown) {
    logger.error("Error fetching financial dashboard", {
      error: error instanceof Error ? error.message : String(error),
      tenantId: context.tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "finance-dashboard",
        action: "fetch",
        tenantId: context.tenantId,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch financial dashboard",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.dashboard",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

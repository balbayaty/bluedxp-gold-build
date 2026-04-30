/**
 * Financial Integrations API
 * GET /api/finance/integrations - Get financial integrations status
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedFinanceService } from "@/lib/services/finance/integration/unifiedFinanceService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId;

    const integrations =
      await unifiedFinanceService.getFinancialIntegrations(tenantId);
    const unifiedData =
      await unifiedFinanceService.getUnifiedFinancialData(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        integrations,
        unifiedData,
      },
    });
  } catch (error: any) {
    console.error("Error fetching financial integrations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch financial integrations",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.integrations",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

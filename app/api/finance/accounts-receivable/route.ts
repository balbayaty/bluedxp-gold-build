/**
 * Accounts Receivable API
 * GET /api/finance/accounts-receivable - Get AR records
 */

import { NextRequest, NextResponse } from "next/server";
import { accountsReceivableService } from "@/lib/services/finance/accountsReceivableService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const customerId = searchParams.get("customerId") || undefined;
    const status = searchParams.get("status") as any;
    const invoiceSource = searchParams.get("invoiceSource") as any;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const records = await accountsReceivableService.getARRecords({
      tenantId,
      customerId,
      status,
      invoiceSource,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error: unknown) {
    logger.error("Error fetching AR records", {
      error: error instanceof Error ? error.message : String(error),
      tenantId: context.tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "finance-accounts-receivable",
        action: "fetch",
        tenantId: context.tenantId,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch AR records",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.accounts-receivable",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

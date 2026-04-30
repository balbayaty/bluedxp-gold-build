/**
 * Accounts Payable API
 * GET /api/finance/accounts-payable - Get AP records
 */

import { NextRequest, NextResponse } from "next/server";
import { accountsPayableService } from "@/lib/services/finance/accountsPayableService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const vendorId = searchParams.get("vendorId") || undefined;
    const status = searchParams.get("status") as any;
    const invoiceSource = searchParams.get("invoiceSource") as any;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const records = await accountsPayableService.getAPRecords({
      tenantId,
      vendorId,
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
    logger.error("Error fetching AP records", {
      error: error instanceof Error ? error.message : String(error),
      tenantId: context.tenantId,
    });
    errorTrackingService.captureException(
      error instanceof Error ? error : new Error(String(error)),
      {
        context: "finance-accounts-payable",
        action: "fetch",
        tenantId: context.tenantId,
      },
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch AP records",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.accounts-payable",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

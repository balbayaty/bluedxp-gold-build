/**
 * Financial Reports API
 * GET /api/finance/reports?type=profit_loss|balance_sheet|cash_flow|trial_balance|aging
 */

import { NextRequest, NextResponse } from "next/server";
import { financialReportingService } from "@/lib/services/finance/financialReportingService";
import { accountsPayableService } from "@/lib/services/finance/accountsPayableService";
import { accountsReceivableService } from "@/lib/services/finance/accountsReceivableService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId;
    const reportType = searchParams.get("type") || "profit_loss";
    const startDate =
      searchParams.get("startDate") ||
      new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get("endDate") || new Date().toISOString();
    const asOfDate = searchParams.get("asOfDate") || new Date().toISOString();

    const period = { startDate, endDate };

    let data: any;

    switch (reportType) {
      case "profit_loss":
        data = await financialReportingService.generateProfitLossStatement(
          tenantId,
          period,
        );
        break;
      case "balance_sheet":
        data = await financialReportingService.generateBalanceSheet(
          tenantId,
          asOfDate,
        );
        break;
      case "cash_flow":
        data = await financialReportingService.generateCashFlowStatement(
          tenantId,
          period,
        );
        break;
      case "trial_balance":
        data = await financialReportingService.generateTrialBalance(
          tenantId,
          period,
        );
        break;
      case "aging":
        const arAging =
          await accountsReceivableService.getARAgingReport(tenantId);
        const apAging = await accountsPayableService.getAPAgingReport(tenantId);
        data = {
          accountsReceivable: arAging,
          accountsPayable: apAging,
        };
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid report type",
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data,
      reportType,
      period,
    });
  } catch (error: any) {
    console.error("Error generating financial report:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate financial report",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.reports",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

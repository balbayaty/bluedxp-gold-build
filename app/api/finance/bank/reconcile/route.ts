/**
 * Bank Reconciliation API
 * POST /api/finance/bank/reconcile
 */

import { NextRequest, NextResponse } from "next/server";
import { bankReconciliationService } from "@/lib/services/finance/bankReconciliationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { bankAccountId, statementId } = body;

    if (!bankAccountId || !statementId) {
      return NextResponse.json(
        {
          success: false,
          error: "Bank account ID and statement ID are required",
        },
        { status: 400 },
      );
    }

    const reconciliation =
      await bankReconciliationService.reconcileBankStatement(
        tenantId,
        bankAccountId,
        statementId,
      );

    return NextResponse.json({
      success: true,
      data: reconciliation,
    });
  } catch (error: any) {
    console.error("Error reconciling bank statement:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to reconcile bank statement",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.bank.reconcile",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

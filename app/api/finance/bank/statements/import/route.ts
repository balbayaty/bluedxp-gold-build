/**
 * Bank Statement Import API
 * POST /api/finance/bank/statements/import
 */

import { NextRequest, NextResponse } from "next/server";
import { bankReconciliationService } from "@/lib/services/finance/bankReconciliationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { bankAccountId, statementData } = body;

    if (!bankAccountId || !statementData) {
      return NextResponse.json(
        {
          success: false,
          error: "Bank account ID and statement data are required",
        },
        { status: 400 },
      );
    }

    const statement = await bankReconciliationService.importBankStatement(
      tenantId,
      bankAccountId,
      statementData,
      context.userId,
    );

    return NextResponse.json({
      success: true,
      data: statement,
    });
  } catch (error: any) {
    console.error("Error importing bank statement:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to import bank statement",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.bank.statements",
  action: "import",
  requireAuth: true,
  rateLimit: true,
});

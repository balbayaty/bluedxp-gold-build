/**
 * Bank Accounts API
 * GET/POST /api/finance/bank/accounts
 */

import { NextRequest, NextResponse } from "next/server";
import { bankReconciliationService } from "@/lib/services/finance/bankReconciliationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId;

    const accounts = await bankReconciliationService.getBankAccounts(tenantId);

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error: any) {
    console.error("Error getting bank accounts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get bank accounts",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const tenantId = context.tenantId;
    const { accountData } = body;

    if (!accountData) {
      return NextResponse.json(
        {
          success: false,
          error: "Account data is required",
        },
        { status: 400 },
      );
    }

    const account = await bankReconciliationService.createBankAccount(
      tenantId,
      accountData,
    );

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create bank account",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "finance",
  featureId: "finance.bank.accounts",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "finance",
  featureId: "finance.bank.accounts",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

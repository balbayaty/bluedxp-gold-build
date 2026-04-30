/**
 * CRM Accounts API
 * GET /api/crm/accounts - Get accounts (extends WMS customers)
 */

import { NextRequest, NextResponse } from "next/server";
import { accountService } from "@/lib/services/crm/accountService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || "default";

    const accounts = await accountService.getAccounts(tenantId);

    return NextResponse.json({
      success: true,
      data: accounts,
    });
  } catch (error: any) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch accounts",
      },
      { status: 500 },
    );
  }
}

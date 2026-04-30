/**
 * API Route: List Universal Proposals
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { universalIntelligentProposalService } from "@/lib/services/proposals/universalIntelligentProposalService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      moduleId: searchParams.get("moduleId") || undefined,
      proposalType: searchParams.get("proposalType") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 50,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
    };

    const proposals = await universalIntelligentProposalService.listProposals(
      tenantId,
      filters,
    );

    return NextResponse.json({
      success: true,
      proposals,
      count: proposals.length,
    });
  } catch (error: any) {
    console.error("[API] Error listing proposals:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list proposals" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(GETHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.proposals",
  action: "read",
  requireAuth: true,
});

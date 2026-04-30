/**
 * API Route: Get Proposal Insights
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { universalIntelligentProposalService } from "@/lib/services/proposals/universalIntelligentProposalService";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    // Verify tenant access
    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    if (proposal.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    const insights = await universalIntelligentProposalService.getInsights(
      proposalId,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error: any) {
    console.error("[API] Error getting insights:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get insights" },
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

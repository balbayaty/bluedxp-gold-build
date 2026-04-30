/**
 * API Route: Get Universal Proposal by ID
 * Retrieves proposals created via universal proposal service
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { universalIntelligentProposalService } from "@/lib/services/proposals/universalIntelligentProposalService";
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

    // Get proposal from universal service
    const proposal = await universalIntelligentProposalService.getProposal(
      proposalId,
      tenantId,
    );

    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Get insights and win strategy if available
    const insights = await universalIntelligentProposalService
      .getInsights(proposalId, tenantId)
      .catch(() => []);
    const winStrategy = await universalIntelligentProposalService
      .getWinStrategy(proposalId, tenantId)
      .catch(() => null);

    return NextResponse.json({
      success: true,
      proposal,
      insights,
      winStrategy,
    });
  } catch (error: any) {
    console.error("[API] Error getting universal proposal:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get proposal",
        details:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
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

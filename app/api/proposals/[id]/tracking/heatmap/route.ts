/**
 * Proposal Engagement Heatmap API Endpoint
 * GET: Get engagement heatmap data for proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalTrackingService } from "@/lib/services/proposals/proposalTrackingService";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET: Get engagement heatmap data
// ============================================================================

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d"; // '7d', '30d', '90d', 'all'

    if (!proposalId) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    // Verify tenant access
    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    if (proposal.tenantId !== tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get engagement heatmap from tracking service
    const heatmap =
      await proposalTrackingService.getEngagementHeatmap(proposalId);

    if (!heatmap) {
      return NextResponse.json(
        { error: "Engagement heatmap not found" },
        { status: 404 },
      );
    }

    // Filter by time range if needed (would implement actual filtering)
    // For now, return full heatmap

    return NextResponse.json(heatmap);
  } catch (error) {
    console.error("Error fetching engagement heatmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch engagement heatmap" },
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

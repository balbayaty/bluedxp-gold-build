/**
 * Proposal Version Comparison API
 * Compare two versions side-by-side
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalCollaborationService } from "@/lib/services/proposals/proposalCollaborationService";
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
    const searchParams = request.nextUrl.searchParams;
    const version1 = parseInt(searchParams.get("version1") || "1");
    const version2 = parseInt(searchParams.get("version2") || "2");

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

    if (!version1 || !version2) {
      return NextResponse.json(
        { success: false, error: "Both version1 and version2 are required" },
        { status: 400 },
      );
    }

    const comparison = proposalCollaborationService.compareVersions(
      proposalId,
      version1,
      version2,
    );

    return NextResponse.json({
      success: true,
      data: {
        proposalId,
        version1,
        version2,
        ...comparison,
      },
    });
  } catch (error) {
    console.error("Error comparing versions:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to compare versions",
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

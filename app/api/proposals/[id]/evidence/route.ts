/**
 * Proposal Evidence API
 * Get evidence lineage and integrity for proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalEvidenceIntegration } from "@/lib/services/proposals/proposalEvidenceIntegration";
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

    const lineage = await proposalEvidenceIntegration.getProposalLineage(
      proposalId,
      tenantId,
    );
    const integrity = await proposalEvidenceIntegration.verifyProposalIntegrity(
      proposalId,
      tenantId,
    );

    return NextResponse.json({
      success: true,
      data: {
        ...lineage,
        integrity,
      },
    });
  } catch (error) {
    console.error("Error getting proposal evidence:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get proposal evidence",
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

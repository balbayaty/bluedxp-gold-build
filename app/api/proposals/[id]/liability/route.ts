/**
 * Proposal Liability API
 * Get liability assessment for proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalLiabilityIntegration } from "@/lib/services/proposals/proposalLiabilityIntegration";
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
    const userId = context.userId || "system";

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    // Verify tenant access
    if (proposal.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Check if assessment exists in metadata
    if (proposal.metadata?.liabilityAssessment) {
      // Return cached assessment (in real implementation, fetch from liability service)
      return NextResponse.json({
        success: true,
        data: proposal.metadata.liabilityAssessment,
      });
    }

    // Perform new assessment
    const assessment =
      await proposalLiabilityIntegration.assessProposalLiability(
        proposal,
        tenantId,
        userId,
      );

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    console.error("Error getting proposal liability:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get proposal liability",
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

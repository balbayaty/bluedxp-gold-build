/**
 * Proposal Learning API
 * Learn from proposal outcomes and store patterns
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const body = await request.json();
    const { outcome, feedback } = body;

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    if (!outcome || !["WON", "LOST", "PENDING"].includes(outcome)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid outcome (WON, LOST, PENDING) is required",
        },
        { status: 400 },
      );
    }

    // Verify proposal exists and tenant access
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

    // Learn from outcome
    await enhancedProposalService.learnFromOutcome(
      proposalId,
      outcome,
      feedback,
    );

    return NextResponse.json({
      success: true,
      message: "Learning processed successfully",
    });
  } catch (error) {
    console.error("Error processing learning:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process learning",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(POSTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.proposals",
  action: "write",
  requireAuth: true,
});

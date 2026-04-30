/**
 * Proposal Compliance API Endpoints
 * GET: Get compliance check/validation for proposal
 * POST: Trigger compliance check/validation
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalComplianceIntegration } from "@/lib/services/proposals/proposalComplianceIntegration";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET: Get compliance status for proposal
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
    const type = searchParams.get("type") || "check"; // 'check' or 'validation'

    if (!proposalId) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    if (type === "validation") {
      const validation =
        await proposalComplianceIntegration.getComplianceValidation(proposalId);
      if (!validation) {
        return NextResponse.json(
          { error: "Compliance validation not found. Run validation first." },
          { status: 404 },
        );
      }
      return NextResponse.json(validation);
    } else {
      const check =
        await proposalComplianceIntegration.getComplianceCheck(proposalId);
      if (!check) {
        return NextResponse.json(
          { error: "Compliance check not found. Run check first." },
          { status: 404 },
        );
      }
      return NextResponse.json(check);
    }
  } catch (error) {
    console.error("Error fetching proposal compliance:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance status" },
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

// ============================================================================
// POST: Trigger compliance check or validation
// ============================================================================

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const userId = context.userId || "system";
    const body = await request.json();
    const { type = "check" } = body;

    // Get proposal
    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 },
      );
    }

    if (type === "validation") {
      // Perform comprehensive validation
      const validation =
        await proposalComplianceIntegration.validateProposalCompliance(
          proposal,
          tenantId,
          userId,
        );
      return NextResponse.json(validation);
    } else {
      // Perform compliance check
      const check = await proposalComplianceIntegration.checkProposalCompliance(
        proposal,
        tenantId,
        userId,
      );
      return NextResponse.json(check);
    }
  } catch (error) {
    console.error("Error performing compliance check/validation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to perform compliance check",
      },
      { status: 500 },
    );
  }
}

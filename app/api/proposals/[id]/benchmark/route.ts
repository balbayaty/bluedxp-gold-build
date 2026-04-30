/**
 * Proposal Benchmarking API
 * Generate benchmarks and analytics for proposals
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
import { proposalBenchmarkingService } from "@/lib/services/proposals/proposalBenchmarkingService";
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

    // Get proposal
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

    // Generate benchmark
    const benchmark =
      await proposalBenchmarkingService.generateBenchmark(proposalId);

    // Get metrics
    const metrics = proposalBenchmarkingService.getMetrics(proposalId);

    return NextResponse.json({
      success: true,
      data: {
        benchmark,
        metrics,
      },
    });
  } catch (error) {
    console.error("Error generating benchmark:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate benchmark",
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

/**
 * Proposal Comparison API
 * Compare multiple proposals side-by-side
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId1 = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const searchParams = request.nextUrl.searchParams;
    const proposalId2 = searchParams.get("with");

    if (!proposalId1) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    if (!proposalId2) {
      return NextResponse.json(
        {
          success: false,
          error: "Second proposal ID (with parameter) is required",
        },
        { status: 400 },
      );
    }

    // Get both proposals
    const proposal1 = await enhancedProposalService.getProposal(proposalId1);
    const proposal2 = await enhancedProposalService.getProposal(proposalId2);

    if (!proposal1 || !proposal2) {
      return NextResponse.json(
        { success: false, error: "One or both proposals not found" },
        { status: 404 },
      );
    }

    // Verify tenant access
    if (proposal1.tenantId !== tenantId || proposal2.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // Compare proposals
    const comparison = {
      proposals: [proposal1, proposal2],
      differences: {
        title: proposal1.title !== proposal2.title,
        totalAmount: proposal1.totalAmount !== proposal2.totalAmount,
        sections: {
          count: proposal1.sections.length !== proposal2.sections.length,
          differences: compareSections(proposal1.sections, proposal2.sections),
        },
        pricing: {
          different:
            JSON.stringify(proposal1.pricing) !==
            JSON.stringify(proposal2.pricing),
          proposal1: proposal1.pricing,
          proposal2: proposal2.pricing,
        },
        status: proposal1.status !== proposal2.status,
        createdAt: {
          proposal1: proposal1.createdAt,
          proposal2: proposal2.createdAt,
        },
      },
      summary: {
        totalDifferences: 0, // Would calculate
        mostSignificantDifference: "pricing", // Would determine
        recommendation: generateComparisonRecommendation(proposal1, proposal2),
      },
    };

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    console.error("Error comparing proposals:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to compare proposals",
      },
      { status: 500 },
    );
  }
}

// Helper function to compare sections
function compareSections(sections1: any[], sections2: any[]): any[] {
  const differences: any[] = [];
  const maxLength = Math.max(sections1.length, sections2.length);

  for (let i = 0; i < maxLength; i++) {
    const section1 = sections1[i];
    const section2 = sections2[i];

    if (!section1) {
      differences.push({
        index: i,
        type: "ADDED",
        section: section2,
      });
    } else if (!section2) {
      differences.push({
        index: i,
        type: "DELETED",
        section: section1,
      });
    } else if (JSON.stringify(section1) !== JSON.stringify(section2)) {
      differences.push({
        index: i,
        type: "MODIFIED",
        section1,
        section2,
      });
    }
  }

  return differences;
}

// Generate comparison recommendation
function generateComparisonRecommendation(
  proposal1: any,
  proposal2: any,
): string {
  const recommendations: string[] = [];

  if (proposal1.totalAmount > proposal2.totalAmount) {
    recommendations.push(
      `Proposal 1 is ${(((proposal1.totalAmount - proposal2.totalAmount) / proposal2.totalAmount) * 100).toFixed(1)}% more expensive`,
    );
  } else if (proposal2.totalAmount > proposal1.totalAmount) {
    recommendations.push(
      `Proposal 2 is ${(((proposal2.totalAmount - proposal1.totalAmount) / proposal1.totalAmount) * 100).toFixed(1)}% more expensive`,
    );
  }

  if (proposal1.sections.length > proposal2.sections.length) {
    recommendations.push(
      `Proposal 1 has ${proposal1.sections.length - proposal2.sections.length} more sections`,
    );
  }

  if (proposal1.status === "WON" && proposal2.status !== "WON") {
    recommendations.push(
      "Proposal 1 was successful - consider adopting its approach",
    );
  }

  return recommendations.join(". ") || "Proposals are similar";
}

export const GET = withAPIGateway(GETHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.proposals",
  action: "read",
  requireAuth: true,
});

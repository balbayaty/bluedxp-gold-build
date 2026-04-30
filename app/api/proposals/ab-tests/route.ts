/**
 * Proposal A/B Testing API
 * Create and manage A/B tests for proposals
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalABTestingService } from "@/lib/services/proposals/proposalABTestingService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - List all A/B tests
// ============================================================================

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    let tests = proposalABTestingService.getAllTests();

    if (status) {
      tests = tests.filter((t) => t.status === status);
    }

    return NextResponse.json({
      success: true,
      data: tests,
      count: tests.length,
    });
  } catch (error) {
    console.error("Error listing A/B tests:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list A/B tests",
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

// ============================================================================
// POST - Create A/B test
// ============================================================================

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      baseProposalId,
      variants,
      trafficSplit,
      minimumSampleSize,
      confidenceLevel,
      successMetric,
    } = body;

    if (!name || !baseProposalId || !variants || variants.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, baseProposalId, and variants are required",
        },
        { status: 400 },
      );
    }

    const test = await proposalABTestingService.createABTest({
      name,
      description,
      baseProposalId,
      variants,
      trafficSplit,
      minimumSampleSize,
      confidenceLevel,
      successMetric,
    });

    return NextResponse.json(
      {
        success: true,
        data: test,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating A/B test:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create A/B test",
      },
      { status: 500 },
    );
  }
}

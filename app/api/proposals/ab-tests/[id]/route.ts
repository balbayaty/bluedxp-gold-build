/**
 * A/B Test Management API - Individual test operations
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalABTestingService } from "@/lib/services/proposals/proposalABTestingService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - Get A/B test by ID
// ============================================================================

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const testId = nextContext?.params?.id || "";

    if (!testId) {
      return NextResponse.json(
        { success: false, error: "Test ID is required" },
        { status: 400 },
      );
    }

    const test = proposalABTestingService.getTest(testId);

    if (!test) {
      return NextResponse.json(
        { success: false, error: "A/B test not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error("Error getting A/B test:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get A/B test",
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
// POST - Start A/B test or get variant
// ============================================================================

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const testId = nextContext?.params?.id || "";
    const body = await request.json();
    const { action, ...data } = body;

    if (!testId) {
      return NextResponse.json(
        { success: false, error: "Test ID is required" },
        { status: 400 },
      );
    }

    if (action === "start") {
      const test = await proposalABTestingService.startABTest(testId);
      return NextResponse.json({ success: true, data: test });
    }

    if (action === "get-variant") {
      const { customerId } = data;
      if (!customerId) {
        return NextResponse.json(
          { success: false, error: "customerId is required" },
          { status: 400 },
        );
      }

      const variant = proposalABTestingService.getVariantForCustomer(
        testId,
        customerId,
      );
      return NextResponse.json({ success: true, data: variant });
    }

    if (action === "calculate-results") {
      const results = await proposalABTestingService.calculateResults(testId);
      return NextResponse.json({ success: true, data: results });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in A/B test action:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to perform action",
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

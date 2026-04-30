/**
 * Follow-Up Rules API
 * Manage custom follow-up rules
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalFollowUpService } from "@/lib/services/proposals/proposalFollowUpService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - List follow-up rules
// ============================================================================

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const enabled = searchParams.get("enabled");

    let rules = proposalFollowUpService.getRules();

    // Filter by enabled status if provided
    if (enabled !== null) {
      const isEnabled = enabled === "true";
      rules = rules.filter((rule) => rule.enabled === isEnabled);
    }

    return NextResponse.json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    console.error("Error listing follow-up rules:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list follow-up rules",
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
// POST - Create custom follow-up rule
// ============================================================================

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const userId = context.userId || "system";
    const body = await request.json();
    const {
      name,
      description,
      trigger,
      triggerDelay,
      conditions,
      actions,
      enabled = true,
    } = body;

    if (!name || !trigger || !actions || actions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Name, trigger, and actions are required" },
        { status: 400 },
      );
    }

    const rule = await proposalFollowUpService.createRule({
      name,
      description,
      trigger,
      triggerDelay,
      conditions,
      actions,
      enabled,
    });

    return NextResponse.json(
      {
        success: true,
        data: rule,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating follow-up rule:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create follow-up rule",
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

// ============================================================================
// PUT - Update follow-up rule
// ============================================================================

async function PUTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const userId = context.userId || "system";
    const body = await request.json();
    const { ruleId, ...updates } = body;

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: "Rule ID is required" },
        { status: 400 },
      );
    }

    const updated = await proposalFollowUpService.updateRule(ruleId, updates);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Follow-up rule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating follow-up rule:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update follow-up rule",
      },
      { status: 500 },
    );
  }
}

export const PUT = withAPIGateway(PUTHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.proposals",
  action: "write",
  requireAuth: true,
});

// ============================================================================
// DELETE - Delete follow-up rule
// ============================================================================

async function DELETEHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ruleId = searchParams.get("ruleId");

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: "Rule ID is required" },
        { status: 400 },
      );
    }

    const deleted = proposalFollowUpService.deleteRule(ruleId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Follow-up rule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting follow-up rule:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete follow-up rule",
      },
      { status: 500 },
    );
  }
}
export const DELETE = withAPIGateway(DELETEHandler, {
  moduleId: "proposals-rfq",
  featureId: "proposals-rfq.proposals",
  action: "delete",
  requireAuth: true,
});

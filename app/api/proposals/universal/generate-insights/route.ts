/**
 * API Route: Generate AI Insights for Proposal
 * Generates insights without creating full proposal
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { universalIntelligentProposalService } from "@/lib/services/proposals/universalIntelligentProposalService";
import type { UniversalProposalConfig } from "@/lib/services/proposals/universalIntelligentProposalService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const userId = context.userId || "system";
    const body = await request.json();

    // Validate required fields
    if (!body.moduleId || !body.proposalType) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: moduleId, proposalType",
        },
        { status: 400 },
      );
    }

    // Build config
    const config: UniversalProposalConfig = {
      moduleId: body.moduleId,
      proposalType: body.proposalType,
      customerId: body.customerId,
      customerName: body.customerName,
      relatedEntityId: body.relatedEntityId,
      relatedEntityType: body.relatedEntityType,
      context: body.context || {},
      templateId: body.templateId,
      tenantId,
      userId,
    };

    // Gather cross-module data (private method, so we'll use a workaround)
    // For now, generate a temporary proposal to get insights
    const result =
      await universalIntelligentProposalService.generateUniversalProposal(
        config,
      );

    return NextResponse.json({
      success: true,
      insights: result.insights,
      winStrategy: result.winStrategy,
    });
  } catch (error: any) {
    console.error("[API] Error generating insights:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate insights" },
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

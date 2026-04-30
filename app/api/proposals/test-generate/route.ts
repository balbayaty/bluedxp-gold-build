/**
 * TEST ENDPOINT: Simple proposal generation test
 * This bypasses complex middleware to test if the service works
 */

import { NextRequest, NextResponse } from "next/server";
import { universalIntelligentProposalService } from "@/lib/services/proposals/universalIntelligentProposalService";

export async function POST(request: NextRequest) {
  try {
    console.log("[TEST] Starting proposal generation test...");

    const body = await request.json();
    console.log("[TEST] Request body:", JSON.stringify(body, null, 2));

    // Minimal config
    const config = {
      moduleId: body.moduleId || "proposals-rfq",
      proposalType: body.proposalType || "CUSTOM",
      customerId: body.customerId,
      customerName: body.customerName || "Test Customer",
      relatedEntityId: body.relatedEntityId,
      relatedEntityType: body.relatedEntityType,
      context: body.context || {
        title: body.title || "Test Proposal",
      },
      templateId: body.templateId,
      tenantId: body.tenantId || "default",
      userId: body.userId || "test-user",
    };

    console.log("[TEST] Config:", JSON.stringify(config, null, 2));
    console.log("[TEST] Calling generateUniversalProposal...");

    // Generate proposal
    const result =
      await universalIntelligentProposalService.generateUniversalProposal(
        config,
      );

    console.log(
      "[TEST] ✅ Proposal generated successfully:",
      result.proposal.id,
    );

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      insights: result.insights,
      winStrategy: result.winStrategy,
      message: "Test successful!",
    });
  } catch (error: any) {
    console.error("[TEST] ❌ Error:", error);
    console.error("[TEST] Error stack:", error?.stack);
    console.error("[TEST] Error message:", error?.message);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || error?.toString() || "Unknown error",
        stack:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
        details: {
          name: error?.name,
          message: error?.message,
        },
      },
      { status: 500 },
    );
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: "Proposal generation test endpoint",
    usage: "POST with { title, customerName, moduleId, proposalType }",
    example: {
      title: "Test Proposal",
      customerName: "Test Customer",
      moduleId: "proposals-rfq",
      proposalType: "CUSTOM",
    },
  });
}

/**
 * SIMPLE PROPOSAL CREATION - Uses Unified Proposal Service
 * Preserves all functionality: templates, rate cards, services
 * Now properly uses unifiedProposalService for consistency
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedProposalService } from "@/lib/services/proposals/unifiedProposalService";
import type { UnifiedProposalConfig } from "@/lib/services/proposals/unifiedProposalService";

// CORS headers for development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("=".repeat(80));
  console.log("[Simple Create] ===== PROPOSAL CREATION STARTED =====");
  console.log("[Simple Create] Timestamp:", new Date().toISOString());

  try {
    const body = await request.json();
    console.log(
      "[Simple Create] Request body received:",
      JSON.stringify(body, null, 2),
    );

    const {
      title,
      customerName,
      customerEmail,
      description,
      proposalType,
      tenantId = "default",
      userId = "system",
      validUntil,
      templateId,
      rateCardId,
      serviceCategoryIds,
    } = body;

    console.log("[Simple Create] Integration data:", {
      templateId,
      rateCardId,
      serviceCategoryIds,
    });

    // Validation
    if (!title || !customerName) {
      return NextResponse.json(
        { success: false, error: "Title and customer name are required" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Build unified config - preserve all template/rate card/service integration
    const config: UnifiedProposalConfig = {
      proposalType: proposalType || "CUSTOM",
      sourceData: {},
      tenantId,
      userId,
      useRAG: false, // Keep simple-create fast (no AI processing)
      generateInsights: false, // No AI insights for fast creation
      generateWinStrategy: false, // No win strategy for fast creation
      context: {
        title,
        description,
        customerId: undefined,
        customerName,
        customerEmail,
        templateId,
        rateCardId,
        serviceCategoryIds,
        validUntil,
      },
    };

    // Generate proposal using unified service
    console.log("[Simple Create] Generating proposal with unified service...");
    const result = await unifiedProposalService.generateProposal(config);

    const duration = Date.now() - startTime;
    console.log("[Simple Create] ✅ Proposal created:", result.proposal.id);
    console.log("[Simple Create] Time taken:", duration + "ms");
    console.log("[Simple Create] ===== PROPOSAL CREATION SUCCESS =====");
    console.log("=".repeat(80));

    // Return response
    return NextResponse.json(
      {
        success: true,
        proposal: result.proposal,
        insights: result.insights || [],
        winStrategy: result.winStrategy,
      },
      { headers: corsHeaders },
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("=".repeat(80));
    console.error("[Simple Create] ❌ ===== PROPOSAL CREATION FAILED =====");
    console.error("[Simple Create] Error type:", error?.constructor?.name);
    console.error("[Simple Create] Error:", error);
    console.error("[Simple Create] Error message:", error?.message);
    console.error("[Simple Create] Error code:", error?.code);
    console.error("[Simple Create] Error stack:", error?.stack);
    console.error("[Simple Create] Time taken before error:", duration + "ms");
    console.error("[Simple Create] ===== END ERROR =====");
    console.error("=".repeat(80));

    // Return detailed error for debugging
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create proposal",
        errorCode: error?.code,
        errorType: error?.constructor?.name,
        details:
          process.env.NODE_ENV === "development"
            ? {
                message: error?.message,
                code: error?.code,
                stack: error?.stack,
              }
            : undefined,
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: "Simple proposal creation endpoint",
    usage:
      "POST with { title, customerName, description?, proposalType?, tenantId?, userId?, templateId?, rateCardId?, serviceCategoryIds? }",
    features: [
      "Fast proposal creation",
      "Template integration",
      "Rate card integration",
      "Service category integration",
      "Uses unified service (no AI for speed)",
    ],
  });
}

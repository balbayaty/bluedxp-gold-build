/**
 * Unified Proposal Creation Endpoint
 *
 * Single endpoint for all proposal creation types:
 * - RFQ-based proposals
 * - Cross-module proposals
 * - Simple proposals
 * - Template-based proposals
 *
 * Replaces: /api/proposals/simple-create, /api/proposals/enhanced, /api/proposals/universal/generate
 * Maintains backward compatibility by redirecting old endpoints here
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedProposalService } from "@/lib/services/proposals/unifiedProposalService";
import type { UnifiedProposalConfig } from "@/lib/services/proposals/unifiedProposalService";

// CORS headers
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
  console.log("[Unified Create] ===== PROPOSAL CREATION STARTED =====");

  try {
    const body = await request.json();
    const {
      // Common fields
      title,
      customerName,
      customerEmail,
      description,
      proposalType,
      tenantId = "default",
      userId = "system",
      validUntil,

      // Template/Rate Card/Service integration
      templateId,
      rateCardId,
      serviceCategoryIds,

      // Enhanced service options
      useRAG = true,
      ragContext,
      submitForApproval = false,
      approvalConfig,
      autoSend = false,
      sendConfig,

      // Universal service options
      moduleId,
      relatedEntityId,
      relatedEntityType,
      context: additionalContext,

      // Generation options
      generateInsights = true,
      generateWinStrategy = true,

      // Source data (for RFQ/RFI based)
      sourceData,
    } = body;

    // Validation
    if (!title || !customerName) {
      return NextResponse.json(
        { success: false, error: "Title and customer name are required" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Build unified config
    const config: UnifiedProposalConfig = {
      proposalType: proposalType || "CUSTOM",
      sourceData: sourceData || {
        customerName,
        customerEmail,
      },
      tenantId,
      userId,
      useRAG,
      ragContext,
      generateInsights,
      generateWinStrategy,
      moduleId,
      relatedEntityId,
      relatedEntityType,
      context: {
        title,
        description,
        customerName,
        customerEmail,
        templateId,
        rateCardId,
        serviceCategoryIds,
        validUntil,
        ...additionalContext,
      },
      submitForApproval,
      approvalConfig,
      autoSend,
      sendConfig,
    };

    // Generate proposal using unified service
    console.log("[Unified Create] Generating proposal with unified service...");
    const result = await unifiedProposalService.generateProposal(config);

    const duration = Date.now() - startTime;
    console.log("[Unified Create] ✅ Proposal created:", result.proposal.id);
    console.log("[Unified Create] Time taken:", duration + "ms");

    // Return response
    return NextResponse.json(
      {
        success: true,
        proposal: {
          id: result.proposal.id,
          proposalNumber: result.proposal.proposalNumber,
          title: result.proposal.title,
          description: result.proposal.description,
          executiveSummary: result.proposal.executiveSummary,
          type: result.proposal.type,
          status: result.proposal.status,
          customerId: result.proposal.customerId,
          customerName: result.proposal.customerName,
          customerEmail: result.proposal.customerEmail,
          sections: result.proposal.sections,
          pricing: result.proposal.pricing,
          totalAmount: result.proposal.totalAmount,
          currency: result.proposal.currency,
          branding: result.proposal.branding,
          validUntil: result.proposal.validUntil,
          recipients: result.proposal.recipients,
          metadata: result.proposal.metadata,
          tags: result.proposal.tags || [],
          createdAt: result.proposal.createdAt,
          updatedAt: result.proposal.updatedAt,
          version: result.proposal.version || 1,
          createdBy: result.proposal.createdBy,
        },
        insights: result.insights || [],
        winStrategy: result.winStrategy,
      },
      { headers: corsHeaders },
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[Unified Create] ❌ Error:", error);
    console.error("[Unified Create] Time taken before error:", duration + "ms");

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create proposal",
        errorCode: error?.code,
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

// Allow GET for documentation
export async function GET() {
  return NextResponse.json({
    message: "Unified proposal creation endpoint",
    usage: "POST with proposal data",
    replaces: [
      "/api/proposals/simple-create",
      "/api/proposals/enhanced",
      "/api/proposals/universal/generate",
    ],
    features: [
      "RFQ-based proposals",
      "Cross-module proposals",
      "Template integration",
      "Rate card integration",
      "Service category integration",
      "RAG-powered content",
      "AI insights",
      "Win strategy calculation",
      "Approval workflows",
      "Auto-send",
    ],
  });
}

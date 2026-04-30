/**
 * API Route: Generate Universal Intelligent Proposal
 * Works across all modules (WMS, TMS, Marketplace, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { unifiedProposalService } from "@/lib/services/proposals/unifiedProposalService";
import type { UnifiedProposalConfig } from "@/lib/services/proposals/unifiedProposalService";
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
          error:
            "Missing required fields: moduleId, proposalType, tenantId, userId",
        },
        { status: 400 },
      );
    }

    // Build unified config (backward compatible)
    const config: UnifiedProposalConfig = {
      proposalType: body.proposalType || "CUSTOM",
      moduleId: body.moduleId,
      relatedEntityId: body.relatedEntityId,
      relatedEntityType: body.relatedEntityType,
      tenantId,
      userId,
      useRAG: body.useRAG !== false,
      generateInsights: body.generateInsights !== false,
      generateWinStrategy: body.generateWinStrategy !== false,
      context: {
        ...(body.context || {}),
        customerId: body.customerId,
        customerName: body.customerName,
        templateId: body.templateId,
      },
      sourceData: body.customerId
        ? {
            customerId: body.customerId,
            customerName: body.customerName,
          }
        : undefined,
    };

    // Generate proposal using unified service
    const result = await unifiedProposalService.generateProposal(config);

    return NextResponse.json({
      success: true,
      proposal: result.proposal,
      insights: result.insights,
      winStrategy: result.winStrategy,
    });
  } catch (error: any) {
    console.error("[API] Error generating universal proposal:", error);
    console.error("[API] Error stack:", error?.stack);
    try {
      const requestBody = await request.json().catch(() => ({}));
      console.error(
        "[API] Request body:",
        JSON.stringify(requestBody, null, 2),
      );
    } catch {
      // Request body already consumed, skip logging
    }

    const errorMessage =
      error?.message || error?.toString() || "Failed to generate proposal";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error?.stack : undefined,
      },
      { status: 500 },
    );
  }
}

// In development, allow bypassing auth for testing
const isDevelopment = process.env.NODE_ENV === "development";

export const POST = isDevelopment
  ? // Development: Allow direct access without auth for testing
    async (request: NextRequest) => {
      try {
        return await POSTHandler(request, {
          userId: "dev-user",
          tenantId: "default",
          user: null,
        } as any);
      } catch (error: any) {
        console.error("[API] Direct handler error:", error);
        return NextResponse.json(
          { success: false, error: error?.message || "Unknown error" },
          { status: 500 },
        );
      }
    }
  : // Production: Use full auth gateway
    withAPIGateway(POSTHandler, {
      moduleId: "proposals-rfq",
      featureId: "proposals-rfq.proposals",
      action: "write",
      requireAuth: true,
    });

/**
 * Proposal Translation API
 * Translate proposals to different languages
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalTranslationService } from "@/lib/services/proposals/proposalTranslationService";
import { enhancedProposalService } from "@/lib/services/proposals/enhancedProposalService";
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
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get("language") as any;

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    // Verify tenant access
    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    if (proposal.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    if (language) {
      const translation = proposalTranslationService.getTranslation(
        proposalId,
        language,
      );
      if (!translation) {
        return NextResponse.json(
          { success: false, error: "Translation not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: translation });
    }

    const translations =
      proposalTranslationService.getAllTranslations(proposalId);
    return NextResponse.json({ success: true, data: translations });
  } catch (error) {
    console.error("Error getting translation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get translation",
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

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const body = await request.json();
    const { targetLanguage, config } = body;

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { success: false, error: "Target language is required" },
        { status: 400 },
      );
    }

    // Verify tenant access
    const proposal = await enhancedProposalService.getProposal(proposalId);
    if (!proposal) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    if (proposal.tenantId !== tenantId) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    const translation = await proposalTranslationService.translateProposal(
      proposalId,
      targetLanguage,
      config,
    );

    return NextResponse.json(
      { success: true, data: translation },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error translating proposal:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to translate proposal",
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

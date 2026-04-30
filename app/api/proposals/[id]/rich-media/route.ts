/**
 * Proposal Rich Media API
 * Manage videos, 3D models, interactive charts
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalRichMediaService } from "@/lib/services/proposals/proposalRichMediaService";
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
    const sectionId = searchParams.get("sectionId");

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

    const assets = proposalRichMediaService.getAssets(
      proposalId,
      sectionId || undefined,
    );

    return NextResponse.json({
      success: true,
      data: assets,
      count: assets.length,
    });
  } catch (error) {
    console.error("Error getting rich media assets:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get rich media assets",
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
    const { action, ...data } = body;

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

    if (action === "add") {
      const validation = proposalRichMediaService.validateAsset({
        ...data,
        proposalId,
      });

      if (!validation.valid) {
        return NextResponse.json(
          { success: false, errors: validation.errors },
          { status: 400 },
        );
      }

      const asset = await proposalRichMediaService.addAsset({
        ...data,
        proposalId,
      });

      return NextResponse.json({ success: true, data: asset }, { status: 201 });
    }

    if (action === "remove") {
      const { assetId } = data;
      const removed = await proposalRichMediaService.removeAsset(
        proposalId,
        assetId,
      );
      return NextResponse.json({ success: removed });
    }

    if (action === "embed-code") {
      const { assetId } = data;
      const assets = proposalRichMediaService.getAssets(proposalId);
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) {
        return NextResponse.json(
          { success: false, error: "Asset not found" },
          { status: 404 },
        );
      }
      const embedCode = proposalRichMediaService.generateEmbedCode(asset);
      return NextResponse.json({ success: true, data: { embedCode } });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in rich media action:", error);
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

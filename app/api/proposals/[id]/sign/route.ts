/**
 * Proposal E-Signature API
 * Initiate, manage, and track proposal signatures
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalSignatureService } from "@/lib/services/proposals/proposalSignatureService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - Get signature status
// ============================================================================

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    const status = proposalSignatureService.getSignatureStatus(proposalId);

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Signature workflow not initiated" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error getting signature status:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get signature status",
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
// POST - Initiate or manage signature
// ============================================================================

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    if (action === "initiate") {
      const result = await proposalSignatureService.initiateSignature({
        proposalId,
        ...data,
      });
      return NextResponse.json(
        { success: true, data: result },
        { status: 201 },
      );
    }

    if (action === "cancel") {
      await proposalSignatureService.cancelSignature(proposalId);
      return NextResponse.json({
        success: true,
        message: "Signature workflow cancelled",
      });
    }

    if (action === "get-signing-url") {
      const { recipientEmail } = data;
      const url = await proposalSignatureService.getSigningUrl(
        proposalId,
        recipientEmail,
      );
      if (!url) {
        return NextResponse.json(
          { success: false, error: "Signing URL not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: { url } });
    }

    if (action === "prepare-pdf") {
      try {
        // Get proposal data - try multiple sources
        let proposal = null;

        // Try 1: Enhanced proposal service
        try {
          const { enhancedProposalService } =
            await import("@/lib/services/proposals/enhancedProposalService");
          proposal = await enhancedProposalService.getProposal(proposalId);
        } catch (err) {
          console.warn("Enhanced service failed, trying database:", err);
        }

        // Try 2: Database service
        if (!proposal) {
          try {
            const { proposalDatabaseService } =
              await import("@/lib/services/proposals/proposalDatabaseService");
            proposal = await proposalDatabaseService.getProposal(proposalId);
          } catch (err) {
            console.warn("Database service failed:", err);
          }
        }

        // Try 3: Direct API fetch
        if (!proposal) {
          try {
            const propRes = await fetch(
              `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002"}/api/proposals/${proposalId}`,
            );
            if (propRes.ok) {
              const propData = await propRes.json();
              if (propData.success && propData.data) {
                proposal = propData.data;
              }
            }
          } catch (err) {
            console.warn("Direct API fetch failed:", err);
          }
        }

        if (!proposal) {
          return NextResponse.json(
            { success: false, error: "Proposal not found" },
            { status: 404 },
          );
        }

        const result = await proposalSignatureService.preparePDFForSharing(
          proposalId,
          proposal,
          context.tenantId || "default",
          context.userId || "system",
        );

        return NextResponse.json(
          { success: true, data: result },
          { status: 201 },
        );
      } catch (error) {
        console.error("Error preparing PDF:", error);
        return NextResponse.json(
          {
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to prepare PDF",
          },
          { status: 500 },
        );
      }
    }

    if (action === "get-pdf-share-url") {
      const shareUrl = proposalSignatureService.getPDFShareUrl(proposalId);
      if (!shareUrl) {
        return NextResponse.json(
          { success: false, error: "PDF not prepared yet" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: { shareUrl } });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in signature action:", error);
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

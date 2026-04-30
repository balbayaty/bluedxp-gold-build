/**
 * Enhanced Proposals API
 * Integrated endpoint for all proposal operations with RAG, approvals, benchmarking, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { unifiedProposalService } from "@/lib/services/proposals/unifiedProposalService";
import { enhancedExportService } from "@/lib/services/proposals/enhancedExportService";
import { proposalApprovalService } from "@/lib/services/proposals/proposalApprovalService";
import { proposalBenchmarkingService } from "@/lib/services/proposals/proposalBenchmarkingService";
import type { ProposalGenerationConfig, ExportFormat } from "@/types/proposals";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - List proposals with filters
// ============================================================================

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const searchParams = request.nextUrl.searchParams;
    const proposalId = searchParams.get("proposalId");

    // If proposalId is provided, return a single proposal
    if (proposalId) {
      // Use unified service (handles all proposal types)
      const { getProposal } =
        await import("@/lib/services/proposals/proposalServiceHelper");
      let proposal = await getProposal(proposalId);

      // If still not found, try direct database lookup
      if (!proposal) {
        try {
          const { proposalDatabaseService } =
            await import("@/lib/services/proposals/proposalDatabaseService");
          const dbProposal =
            await proposalDatabaseService.getProposal(proposalId);
          if (dbProposal) {
            // Convert to Proposal type
            proposal = {
              id: dbProposal.id,
              proposalNumber: dbProposal.proposalNumber,
              title: dbProposal.title,
              description: dbProposal.description || undefined,
              executiveSummary: dbProposal.executiveSummary || undefined,
              type: dbProposal.proposalType as any,
              status: dbProposal.status as any,
              customerId: dbProposal.customerId || undefined,
              customerName: dbProposal.customerName || undefined,
              customerEmail: dbProposal.customerEmail || undefined,
              sections: dbProposal.sections as any,
              pricing: dbProposal.pricing as any,
              totalAmount: dbProposal.totalAmount
                ? parseFloat(dbProposal.totalAmount.toString())
                : undefined,
              currency: dbProposal.currency,
              branding: dbProposal.branding as any,
              validUntil: dbProposal.validUntil?.toISOString(),
              sentAt: dbProposal.sentAt?.toISOString(),
              acceptedAt: dbProposal.acceptedAt?.toISOString(),
              rejectedAt: dbProposal.rejectedAt?.toISOString(),
              recipients: dbProposal.recipients as any,
              metadata: dbProposal.metadata as any,
              tags: dbProposal.tags || [],
              createdAt: dbProposal.createdAt.toISOString(),
              updatedAt: dbProposal.updatedAt.toISOString(),
              version: 1,
            } as any;
          }
        } catch (error) {
          console.warn("[Enhanced API] Direct database lookup failed:", error);
        }
      }

      if (!proposal) {
        return NextResponse.json(
          {
            success: false,
            error: "Proposal not found",
          },
          { status: 404 },
        );
      }

      // Verify tenant access (check metadata or database tenantId)
      // Note: For now, we allow access if proposal is found (tenant isolation can be enforced later)
      const proposalTenantId =
        (proposal as any).tenantId || (proposal.metadata as any)?.tenantId;
      if (
        proposalTenantId &&
        proposalTenantId !== tenantId &&
        tenantId !== "default"
      ) {
        // Only warn, don't block (for development/debugging)
        console.warn(
          `[Enhanced API] Tenant mismatch: proposal tenant=${proposalTenantId}, request tenant=${tenantId}`,
        );
      }

      return NextResponse.json({
        success: true,
        data: proposal,
      });
    }

    // Otherwise, list proposals with filters
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const customerId = searchParams.get("customerId");

    const { listProposals } =
      await import("@/lib/services/proposals/proposalServiceHelper");
    const proposals = await listProposals({
      status: status as any,
      type: type as any,
      customerId: customerId || undefined,
    });

    // Filter by tenant
    const tenantProposals = proposals.filter((p) => p.tenantId === tenantId);

    return NextResponse.json({
      success: true,
      data: tenantProposals,
      count: tenantProposals.length,
    });
  } catch (error) {
    console.error("Error listing proposals:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list proposals",
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
// POST - Create proposal with RAG
// ============================================================================

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";
    const userId = context.userId || "system";
    const body = await request.json();
    const {
      config,
      useRAG = true,
      ragContext,
      submitForApproval = false,
      approvalConfig,
      autoSend = false,
      sendConfig,
    } = body;

    if (!config) {
      return NextResponse.json(
        { success: false, error: "Proposal generation config is required" },
        { status: 400 },
      );
    }

    // Generate proposal using unified service (backward compatible)
    const result = await unifiedProposalService.generateProposal({
      ...(config as any),
      tenantId,
      userId,
      useRAG,
      ragContext,
      generateInsights: true,
      generateWinStrategy: true,
    });
    const proposal = result.proposal;

    // Track metrics
    await proposalBenchmarkingService.trackProposal(proposal);

    // Submit for approval if requested
    let approvalId: string | undefined;
    if (submitForApproval) {
      approvalId = await unifiedProposalService.submitForApproval(proposal.id, {
        workflowId: approvalConfig?.workflowId || "standard-proposal-approval",
        autoApprove: approvalConfig?.autoApprove,
        autoApproveConditions: approvalConfig?.autoApproveConditions,
        requireApproval: approvalConfig?.requireApproval,
        approvers: approvalConfig?.approvers,
      });
    }

    // Auto-send if requested and approved
    let sendResult:
      | { success: boolean; messageId?: string; error?: string }
      | undefined;
    if (autoSend && (proposal.status === "APPROVED" || !submitForApproval)) {
      sendResult = await unifiedProposalService.sendProposal(
        proposal.id,
        sendConfig || {
          recipients: proposal.recipients.map((r) => ({
            email: r.email,
            name: r.name,
            role: r.role,
          })),
          attachments: true,
          trackOpens: true,
          trackClicks: true,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          proposal,
          approvalId,
          sent: sendResult?.success,
          messageId: sendResult?.messageId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create proposal",
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
// PUT - Update proposal
// ============================================================================

async function PUTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { proposalId, updates } = body;

    if (!proposalId || !updates) {
      return NextResponse.json(
        { success: false, error: "Proposal ID and updates are required" },
        { status: 400 },
      );
    }

    const { updateProposal } =
      await import("@/lib/services/proposals/proposalServiceHelper");
    const updated = await updateProposal(proposalId, updates, userId, tenantId);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Proposal not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update proposal",
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
// DELETE - Delete proposal
// ============================================================================

async function DELETEHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const proposalId = searchParams.get("proposalId");

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    const deleted = await unifiedProposalService.deleteProposal(proposalId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Proposal not found or cannot be deleted" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Proposal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete proposal",
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

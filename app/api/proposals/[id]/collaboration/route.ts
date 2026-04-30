/**
 * Proposal Collaboration API
 * Real-time collaboration, comments, mentions, version control
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { proposalCollaborationService } from "@/lib/services/proposals/proposalCollaborationService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - Get collaboration data (collaborators, comments, versions, presence)
// ============================================================================

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";
    const tenantId =
      context.tenantId || request.headers.get("x-tenant-id") || "default";

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const sectionId = searchParams.get("sectionId");

    // Get comments
    const comments = proposalCollaborationService.getComments(
      proposalId,
      sectionId || undefined,
    );

    // Get versions
    const versions = proposalCollaborationService.getVersions(proposalId);

    // Get active users
    const activeUsers = proposalCollaborationService.getActiveUsers(proposalId);

    return NextResponse.json({
      success: true,
      data: {
        comments,
        versions,
        activeUsers,
      },
    });
  } catch (error) {
    console.error("Error getting collaboration data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get collaboration data",
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
// POST - Add collaborator
// ============================================================================

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const proposalId = nextContext?.params?.id || "";
    const userId = context.userId || "system";

    if (!proposalId) {
      return NextResponse.json(
        { success: false, error: "Proposal ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "add-collaborator":
        await proposalCollaborationService.addCollaborator(
          proposalId,
          data.userId,
          data.role,
          data.addedBy || userId,
        );
        return NextResponse.json({
          success: true,
          message: "Collaborator added",
        });

      case "add-comment":
        const comment = await proposalCollaborationService.addComment(
          proposalId,
          data.sectionId,
          data.userId,
          data.userName,
          data.content,
          data.mentions,
          data.parentId,
        );
        return NextResponse.json({ success: true, data: comment });

      case "update-presence":
        await proposalCollaborationService.updatePresence(
          proposalId,
          data.userId,
          data.userName,
          data.status,
          data.sectionId,
        );
        return NextResponse.json({
          success: true,
          message: "Presence updated",
        });

      case "create-version":
        const version = await proposalCollaborationService.createVersion(
          proposalId,
          data.proposal,
          data.createdBy || userId,
        );
        return NextResponse.json({ success: true, data: version });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in collaboration action:", error);
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

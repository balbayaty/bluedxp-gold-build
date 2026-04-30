/**
 * Content Block API - Individual block operations
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { contentBlockLibraryService } from "@/lib/services/proposals/contentBlockLibrary";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - Get content block by ID
// ============================================================================

async function GETHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const blockId = nextContext?.params?.id || "";

    if (!blockId) {
      return NextResponse.json(
        { success: false, error: "Block ID is required" },
        { status: 400 },
      );
    }

    const block = contentBlockLibraryService.getBlock(blockId);

    if (!block) {
      return NextResponse.json(
        { success: false, error: "Content block not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: block,
    });
  } catch (error) {
    console.error("Error getting content block:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get content block",
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
// PUT - Update content block
// ============================================================================

async function PUTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const blockId = nextContext?.params?.id || "";
    const body = await request.json();
    const updates = body;

    if (!blockId) {
      return NextResponse.json(
        { success: false, error: "Block ID is required" },
        { status: 400 },
      );
    }

    const updated = await contentBlockLibraryService.updateBlock(
      blockId,
      updates,
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Content block not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating content block:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update content block",
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
// POST - Approve content block
// ============================================================================

async function POSTHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    const blockId = nextContext?.params?.id || "";
    const userId = context.userId || "system";
    const body = await request.json();
    const { action, approvedBy } = body;

    if (!blockId) {
      return NextResponse.json(
        { success: false, error: "Block ID is required" },
        { status: 400 },
      );
    }

    if (action === "approve") {
      const approved = await contentBlockLibraryService.approveBlock(
        blockId,
        approvedBy || userId,
      );

      if (!approved) {
        return NextResponse.json(
          { success: false, error: "Content block not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: approved,
        message: "Content block approved",
      });
    }

    if (action === "track-usage") {
      const { proposalId } = body;
      await contentBlockLibraryService.trackUsage(blockId, proposalId);
      return NextResponse.json({ success: true, message: "Usage tracked" });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in content block action:", error);
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

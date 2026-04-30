/**
 * Content Block Library API
 * Manage reusable content blocks for proposals
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { contentBlockLibraryService } from "@/lib/services/proposals/contentBlockLibrary";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - List content blocks with search and filters
// ============================================================================

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const tags = searchParams.get("tags")?.split(",");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const blocks = await contentBlockLibraryService.searchBlocks(query, {
      category: category || undefined,
      tags: tags || undefined,
      status: status as any,
      type: type as any,
    });

    // Get library stats
    const stats = contentBlockLibraryService.getLibraryStats();

    return NextResponse.json({
      success: true,
      data: {
        blocks,
        stats,
      },
      count: blocks.length,
    });
  } catch (error) {
    console.error("Error listing content blocks:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list content blocks",
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
// POST - Create content block
// ============================================================================

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const userId = context.userId || "system";
    const body = await request.json();
    const {
      title,
      content,
      category,
      tags,
      type,
      status = "DRAFT",
      createdBy,
      metadata,
    } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: "Title, content, and category are required" },
        { status: 400 },
      );
    }

    const block = await contentBlockLibraryService.createBlock({
      title,
      content,
      category,
      tags: tags || [],
      type: type || "TEXT",
      status,
      createdBy: createdBy || userId,
      metadata: metadata || {},
    });

    return NextResponse.json(
      {
        success: true,
        data: block,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating content block:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create content block",
      },
      { status: 500 },
    );
  }
}

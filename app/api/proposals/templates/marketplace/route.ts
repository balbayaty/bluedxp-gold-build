/**
 * Template Marketplace API
 * Browse, search, download, and publish proposal templates
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import { templateMarketplaceService } from "@/lib/services/proposals/templateMarketplaceService";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// ============================================================================
// GET - List marketplace templates
// ============================================================================

async function GETHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const tags = searchParams.get("tags")?.split(",");
    const featured = searchParams.get("featured") === "true";
    const verified = searchParams.get("verified") === "true";
    const pricing = searchParams.get("pricing") as any;
    const search = searchParams.get("search") || searchParams.get("q");
    const sortBy = searchParams.get("sortBy") as any;

    const templates = await templateMarketplaceService.listTemplates({
      category: category || undefined,
      tags: tags || undefined,
      featured: featured || undefined,
      verified: verified || undefined,
      pricing,
      search: search || undefined,
      sortBy: sortBy || "popular",
    });

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    console.error("Error listing marketplace templates:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to list templates",
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
// POST - Publish template or download
// ============================================================================

async function POSTHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const userId = context.userId || "system";
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "publish") {
      const template = await templateMarketplaceService.publishTemplate({
        ...data,
        publishedBy: userId,
      });
      return NextResponse.json(
        { success: true, data: template },
        { status: 201 },
      );
    }

    if (action === "download") {
      const { templateId } = data;
      const template = await templateMarketplaceService.downloadTemplate(
        templateId,
        userId,
      );
      if (!template) {
        return NextResponse.json(
          { success: false, error: "Template not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: template });
    }

    if (action === "review") {
      const { templateId, ...reviewData } = data;
      const review = await templateMarketplaceService.addReview(templateId, {
        ...reviewData,
        reviewedBy: userId,
      });
      return NextResponse.json(
        { success: true, data: review },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in marketplace action:", error);
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

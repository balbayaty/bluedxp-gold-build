/**
 * MSDS-SKU Link by ID API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { msdsSkuLinkingService } from "@/lib/services/msds-sku-linking/msdsSkuLinkingService";
import { requireAuth } from "../../_auth";
import { getMsdsSkuLinkingRbac } from "@/lib/services/msds-sku-linking/rbac";

// ============================================================================
// GET /api/msds-sku-linking/links/[id] - Get link
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const rbac = getMsdsSkuLinkingRbac();
    const authRes = await requireAuth(request, {
      anyRole: rbac.readerRoles,
    });
    if (!authRes.ok) return authRes.response;
    const { tenantId } = authRes.auth;

    const link = await msdsSkuLinkingService.getLink(tenantId, params.id);

    if (!link) {
      return NextResponse.json(
        {
          success: false,
          error: "Link not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: link,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error getting link:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get link",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// PATCH /api/msds-sku-linking/links/[id] - Update link
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const rbac = getMsdsSkuLinkingRbac();
    const authRes = await requireAuth(request, {
      anyRole: rbac.writerRoles,
    });
    if (!authRes.ok) return authRes.response;
    const { tenantId, userId } = authRes.auth;

    const body = await request.json();

    const link = await msdsSkuLinkingService.updateLink(tenantId, params.id, {
      ...body,
      updatedBy: userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: link,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating link:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update link",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// DELETE /api/msds-sku-linking/links/[id] - Delete link
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const rbac = getMsdsSkuLinkingRbac();
    const authRes = await requireAuth(request, {
      anyRole: rbac.writerRoles,
    });
    if (!authRes.ok) return authRes.response;
    const { tenantId, userId } = authRes.auth;

    await msdsSkuLinkingService.deleteLink(tenantId, params.id, userId);

    return NextResponse.json(
      {
        success: true,
        message: "Link deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting link:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete link",
      },
      { status: 500 },
    );
  }
}

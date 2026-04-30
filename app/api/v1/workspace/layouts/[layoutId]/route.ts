/**
 * GET /api/v1/workspace/layouts/[layoutId] - Get single layout
 * PUT /api/v1/workspace/layouts/[layoutId] - Update layout
 * DELETE /api/v1/workspace/layouts/[layoutId] - Delete layout
 */

import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/services/workspace/workspaceService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";
import type { UpdateWorkspaceLayoutInput } from "@/types/workspace";

export async function GET(
  request: NextRequest,
  { params }: { params: { layoutId: string } },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const layout = await workspaceService.getLayoutById(layoutId, user.id);

    return NextResponse.json(layout);
  } catch (error) {
    console.error("[API] Error getting layout:", error);
    if (error instanceof Error && error.message === "Layout not found") {
      return NextResponse.json({ error: "Layout not found" }, { status: 404 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { layoutId: string } },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as UpdateWorkspaceLayoutInput;
    const layout = await workspaceService.updateLayout(
      params.layoutId,
      user.id,
      body,
    );

    return NextResponse.json(layout);
  } catch (error) {
    console.error("[API] Error updating layout:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { layoutId: string } },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await workspaceService.deleteLayout(params.layoutId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error deleting layout:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

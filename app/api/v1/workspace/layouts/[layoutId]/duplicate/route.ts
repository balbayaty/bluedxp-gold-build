/**
 * POST /api/v1/workspace/layouts/[layoutId]/duplicate
 * Duplicate layout
 */

import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/lib/services/workspace/workspaceService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { layoutId: string } },
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const newName = body.name;

    const layout = await workspaceService.duplicateLayout(
      params.layoutId,
      user.id,
      newName,
    );

    return NextResponse.json(layout, { status: 201 });
  } catch (error) {
    console.error("[API] Error duplicating layout:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

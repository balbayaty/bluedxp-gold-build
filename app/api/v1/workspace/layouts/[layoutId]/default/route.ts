/**
 * POST /api/v1/workspace/layouts/[layoutId]/default
 * Set layout as default
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

    const layout = await workspaceService.setDefaultLayout(
      user.id,
      params.layoutId,
    );

    return NextResponse.json(layout);
  } catch (error) {
    console.error("[API] Error setting default layout:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

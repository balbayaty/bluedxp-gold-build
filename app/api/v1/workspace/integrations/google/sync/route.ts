/**
 * POST /api/v1/workspace/integrations/google/sync
 * Trigger Google Workspace sync
 */

import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceService } from "@/lib/services/workspace/integrations/googleWorkspaceService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await googleWorkspaceService.syncAll(user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Error syncing Google Workspace:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

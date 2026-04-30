/**
 * GET /api/v1/workspace/integrations/google/auth-url
 * Get Google OAuth authorization URL
 */

import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceService } from "@/lib/services/workspace/integrations/googleWorkspaceService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const redirectUri =
      searchParams.get("redirectUri") ||
      `${process.env.NEXT_PUBLIC_APP_URL}/workspace/integrations/google/callback`;
    const scopes = searchParams.get("scopes")?.split(",") || [];

    const authUrl = googleWorkspaceService.getAuthorizationUrl(
      redirectUri,
      scopes,
    );

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("[API] Error getting auth URL:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

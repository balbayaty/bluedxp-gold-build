/**
 * GET /api/v1/workspace/integrations/google - Get Google Workspace status
 * POST /api/v1/workspace/integrations/google - Initiate OAuth flow
 * DELETE /api/v1/workspace/integrations/google - Disconnect
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

    const integration = await googleWorkspaceService.getIntegrationStatus(
      user.id,
    );

    return NextResponse.json(integration || { connected: false });
  } catch (error) {
    console.error("[API] Error getting Google Workspace status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, redirectUri, scopes } = body;

    if (!code || !redirectUri) {
      return NextResponse.json(
        { error: "Code and redirectUri are required" },
        { status: 400 },
      );
    }

    const integration = await googleWorkspaceService.connectGoogleWorkspace(
      user.id,
      code,
      redirectUri,
      scopes || [],
    );

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("[API] Error connecting Google Workspace:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await googleWorkspaceService.disconnectGoogleWorkspace(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error disconnecting Google Workspace:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

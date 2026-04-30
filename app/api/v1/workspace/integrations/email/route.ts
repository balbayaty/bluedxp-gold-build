/**
 * GET /api/v1/workspace/integrations/email - Get email integrations
 * POST /api/v1/workspace/integrations/email - Connect email account
 * DELETE /api/v1/workspace/integrations/email - Disconnect email account
 */

import { NextRequest, NextResponse } from "next/server";
import { emailService } from "@/lib/services/workspace/integrations/emailService";
import { getAuthUser } from "@/lib/services/workspace/utils/auth";
import type { EmailProvider } from "@/types/workspace";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await emailService.getEmailIntegrations(user.id);

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("[API] Error getting email integrations:", error);
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
    const { provider, ...credentials } = body;

    if (!provider || !credentials.email) {
      return NextResponse.json(
        { error: "Provider and email are required" },
        { status: 400 },
      );
    }

    const integration = await emailService.connectEmailAccount(
      user.id,
      provider as EmailProvider,
      credentials,
    );

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error("[API] Error connecting email account:", error);
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

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 },
      );
    }

    await emailService.disconnectEmailAccount(user.id, accountId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Error disconnecting email account:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

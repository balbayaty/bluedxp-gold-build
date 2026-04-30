/**
 * LinkedIn OAuth API
 * Handle LinkedIn authentication flow
 */

import { NextRequest, NextResponse } from "next/server";
import { integrationManager } from "@/lib/services/external-integrations/integrationManager";

/**
 * GET /api/integrations/linkedin/auth
 * Get LinkedIn OAuth URL
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const redirectUri = searchParams.get("redirectUri");
    const tenantId = searchParams.get("tenantId");

    if (!redirectUri || !tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "redirectUri and tenantId are required",
        },
        { status: 400 },
      );
    }

    const state = `${tenantId}_${Date.now()}`;
    // Get clientId from request if provided (per-user credentials)
    const clientId = searchParams.get("clientId") || undefined;
    const authUrl = integrationManager.getLinkedInAuthUrl(
      redirectUri,
      state,
      clientId,
    );

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    });
  } catch (error: any) {
    console.error("Error generating LinkedIn auth URL:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate auth URL",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/integrations/linkedin/auth/callback
 * Handle LinkedIn OAuth callback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, redirectUri, tenantId, clientId, clientSecret, userId } =
      body;

    if (!code || !redirectUri || !tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "code, redirectUri, and tenantId are required",
        },
        { status: 400 },
      );
    }

    // Use per-user credentials if provided, otherwise fall back to environment variables
    const result = await integrationManager.handleLinkedInCallback(
      code,
      redirectUri,
      tenantId,
      clientId,
      clientSecret,
    );

    // If credentials were provided, store them in the integration config
    if (result.success && result.data && (clientId || clientSecret)) {
      const integration = result.data;
      const updatedConfig = {
        ...integration.config,
        ...(clientId && { clientId }),
        ...(clientSecret && { clientSecret }),
      };

      // Update integration with credentials
      await integrationManager.updateIntegrationConfig(
        integration.id,
        updatedConfig,
      );
    }

    if (!result.success) {
      return NextResponse.json(result, { status: result.statusCode || 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error handling LinkedIn callback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to handle callback",
      },
      { status: 500 },
    );
  }
}

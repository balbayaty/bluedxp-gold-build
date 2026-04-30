/**
 * Integrations API
 * Manage external integrations (LinkedIn, Telegram, WhatsApp, News Sites, Generic Sites)
 */

import { NextRequest, NextResponse } from "next/server";
import { integrationManager } from "@/lib/services/external-integrations/integrationManager";
import type { IntegrationType } from "@/types/external-integrations";

/**
 * GET /api/integrations
 * List all integrations
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId") || undefined;
    const type = searchParams.get("type") as IntegrationType | null;

    const integrations = await integrationManager.getIntegrations(
      tenantId,
      type || undefined,
    );

    return NextResponse.json({
      success: true,
      data: integrations,
      count: integrations.length,
    });
  } catch (error: any) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch integrations",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/integrations
 * Create new integration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, config, name, description, tenantId, userId } = body;

    if (!type || !tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Type and tenantId are required",
        },
        { status: 400 },
      );
    }

    const result = await integrationManager.connectIntegration(type, {
      name,
      description,
      tenantId,
      userId,
      config,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: result.statusCode || 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating integration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create integration",
      },
      { status: 500 },
    );
  }
}

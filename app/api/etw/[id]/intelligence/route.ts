/**
 * ETW Intelligence API
 *
 * GET /api/etw/[id]/intelligence - Get intelligence data (risk, congestion, ETA)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { etwService } from "@/lib/services/etw/etwService";
import { getETWIntelligenceService } from "@/lib/services/etw";

async function getIntelligence(
  request: NextRequest,
  context: APIRequestContext,
  nextContext?: { params?: { id: string } },
) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    const id =
      nextContext?.params?.id ||
      request.nextUrl.pathname.split("/").slice(0, -1).pop() ||
      "";
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ETW ID required" },
        { status: 400 },
      );
    }

    // Get ETW
    const etw = await etwService.get(id, context.tenantId);
    if (!etw) {
      return NextResponse.json(
        { success: false, error: "ETW not found" },
        { status: 404 },
      );
    }

    // Get intelligence service
    const intelligenceService = await getETWIntelligenceService();

    // Get sources from query params
    const { searchParams } = new URL(request.url);
    const sources = searchParams.get("sources")?.split(",") || undefined;

    // Get intelligence
    const intelligence = await intelligenceService.getIntelligence(
      etw,
      sources,
    );

    return NextResponse.json({
      success: true,
      data: intelligence,
    });
  } catch (error) {
    console.error("[ETW API] Get intelligence error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get intelligence",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getIntelligence, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

/**
 * ETW Seed Data API
 *
 * POST /api/etw/seed - Create seed data (4 example ETWs)
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { seedETWData } from "@/lib/services/etw/seedData";

async function seedETWs(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (!context.userId) {
      return NextResponse.json(
        { success: false, error: "User authentication required" },
        { status: 401 },
      );
    }

    // Only allow in development or with special permission
    if (
      process.env.NODE_ENV === "production" &&
      !context.userId.includes("admin")
    ) {
      return NextResponse.json(
        { success: false, error: "Seed data only available in development" },
        { status: 403 },
      );
    }

    const result = await seedETWData(context.tenantId, context.userId);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        etws: result.etws,
        count: result.etws.length,
      },
    });
  } catch (error) {
    console.error("[ETW API] Seed error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to seed ETW data",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(seedETWs, {
  moduleId: "tms",
  featureId: "tms.etw",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

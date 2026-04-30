/**
 * System Health Status API
 *
 * Comprehensive health status endpoint using System Health Service
 * Consolidates all health checks into a single, reliable endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { systemHealthService } from "@/lib/services/system-health";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await apiAuthMiddleware(req);
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && (!auth.authorized || !auth.context)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const forceRefresh = req.nextUrl.searchParams.get("refresh") === "true";
    const status = await systemHealthService.getHealthStatus(forceRefresh);

    return NextResponse.json({
      ok: status.overallStatus !== "down",
      ...status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
      },
      { status: 500 },
    );
  }
}

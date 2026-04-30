import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { systemHealthService } from "@/lib/services/system-health";

export const runtime = "nodejs";

// Types are now imported from systemHealthService

export async function GET(req: NextRequest) {
  // Delegate to System Health Service for consistency
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
    const healthStatus =
      await systemHealthService.getHealthStatus(forceRefresh);

    // Transform to match expected format
    return NextResponse.json({
      ok: healthStatus.overallStatus !== "down",
      status: healthStatus.overallStatus,
      timestamp: healthStatus.timestamp.toISOString(),
      environment: healthStatus.environment,
      services: healthStatus.services,
      modules: healthStatus.modules,
      docker: healthStatus.docker,
      environment_vars: healthStatus.environment_vars,
      summary: healthStatus.summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

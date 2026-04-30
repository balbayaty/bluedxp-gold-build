/**
 * Performance Center Bootstrap
 * Registers default Truth KPIs for customer↔supplier SLA/KPI evaluation.
 *
 * POST /api/performance-center/bootstrap
 * Body: { tenantId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { truthEngineService } from "@/lib/services/truth-engine";
import { getDefaultPerformanceKPIs } from "@/lib/services/performance/unifiedPerformanceKpiCatalog";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    // Hard gate: KPI registration should be privileged
    if (!auth.context.roles?.includes("SYSTEM_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = auth.context.tenantId;

    const defs = getDefaultPerformanceKPIs({ tenantId });
    const registered = await Promise.all(
      defs.map((kpi) => truthEngineService.registerKPI(kpi)),
    );

    return NextResponse.json({
      success: true,
      count: registered.length,
      kpis: registered,
    });
  } catch (error) {
    console.error("Performance KPI bootstrap error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to bootstrap KPIs",
      },
      { status: 500 },
    );
  }
}

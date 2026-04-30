/**
 * DMARC Alerts API
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { dmarcMonitoringService } from "@/lib/services/dmarc-monitoring";

export async function GET(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    const user = auth.context;

    const allowedRoles = ["SYSTEM_ADMIN", "IT_ADMIN"];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    const alerts = await dmarcMonitoringService.getAlerts(
      user.tenantId,
      domain || undefined,
    );

    return NextResponse.json(alerts);
  } catch (error: any) {
    console.error("DMARC alerts API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

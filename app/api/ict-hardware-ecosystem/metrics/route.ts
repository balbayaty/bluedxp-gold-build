/**
 * ICT Hardware Ecosystem Vision 2030 Metrics API
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { ictHardwareEcosystemService } from "@/lib/services/ict-hardware-ecosystem";

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

    const allowedRoles = [
      "SYSTEM_ADMIN",
      "PRODUCTION_MANAGER",
      "BUSINESS_DEVELOPMENT",
      "EXECUTIVE",
    ];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();

    const metrics = await ictHardwareEcosystemService.getVision2030Metrics(
      user.tenantId,
      startDate,
      endDate,
    );

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("ICT metrics API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

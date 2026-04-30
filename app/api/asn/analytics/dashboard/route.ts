/**
 * ASN Analytics Dashboard API
 */

import { NextRequest, NextResponse } from "next/server";
import { getAsnAnalyticsService } from "@/lib/services/asn";
import { authenticate } from "@/lib/auth";
import { validateTenant } from "@/lib/tenant";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    await validateTenant(user.tenantId);

    const { searchParams } = new URL(req.url);
    const dashboardType = searchParams.get("type") || "executive"; // executive, operational, analytical
    const days = searchParams.get("days")
      ? parseInt(searchParams.get("days")!)
      : 30;

    const analyticsService = getAsnAnalyticsService();

    let result;
    switch (dashboardType) {
      case "executive":
        result = await analyticsService.getExecutiveDashboard(
          user.tenantId,
          days,
        );
        break;
      case "operational":
        result = await analyticsService.getOperationalDashboard(user.tenantId);
        break;
      case "analytical":
        result = await analyticsService.getAnalyticalDashboard(
          user.tenantId,
          days,
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid dashboard type" },
          { status: 400 },
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("ASN analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 },
    );
  }
}

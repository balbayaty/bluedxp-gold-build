/**
 * Export House Business Plan API
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { exportHouseService } from "@/lib/services/export-house";

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
      "COMPLIANCE_OFFICER",
      "LEGAL_ADVISOR",
    ];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plans = await exportHouseService.getBusinessPlan(user.tenantId);
    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("Business plan API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized || !auth.context) {
      return (
        auth.response ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }
    const user = auth.context;

    const allowedRoles = ["SYSTEM_ADMIN", "COMPLIANCE_OFFICER"];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const plan = await exportHouseService.saveBusinessPlan(
      user.tenantId,
      body,
      user.userId,
    );

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("Business plan save error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

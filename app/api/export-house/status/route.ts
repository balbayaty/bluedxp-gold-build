/**
 * Export House License Status API
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

    // Check permissions
    const allowedRoles = [
      "SYSTEM_ADMIN",
      "COMPLIANCE_OFFICER",
      "LEGAL_ADVISOR",
    ];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const licenseStatus = await exportHouseService.getLicenseStatus(
      user.tenantId,
    );

    return NextResponse.json(
      licenseStatus || {
        status: "not_applied",
        message: "No license application found",
      },
    );
  } catch (error: any) {
    console.error("Export house status API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

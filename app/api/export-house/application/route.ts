/**
 * Export House License Application API
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { exportHouseService } from "@/lib/services/export-house";

export async function POST(request: NextRequest) {
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
    const allowedRoles = ["SYSTEM_ADMIN", "COMPLIANCE_OFFICER"];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const application = await exportHouseService.saveApplication(
      user.tenantId,
      body,
      user.userId,
    );

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error("Export house application API error:", error);
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
    const { action } = body;

    if (action === "submit") {
      await exportHouseService.submitApplication(
        user.tenantId,
        body.applicationId,
        user.userId,
      );
      return NextResponse.json({
        success: true,
        message: "Application submitted",
      });
    }

    // Update application
    const application = await exportHouseService.saveApplication(
      user.tenantId,
      body,
      user.userId,
    );

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error("Export house application update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

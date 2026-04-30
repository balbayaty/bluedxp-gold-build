/**
 * ICT Hardware Strategic Partnerships API
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

    const allowedRoles = ["SYSTEM_ADMIN", "BUSINESS_DEVELOPMENT", "EXECUTIVE"];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const partnerType = searchParams.get("partnerType");

    const partnerships = await ictHardwareEcosystemService.getPartnerships(
      user.tenantId,
      partnerType as any,
    );

    return NextResponse.json(partnerships);
  } catch (error: any) {
    console.error("ICT partnerships API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

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

    const allowedRoles = ["SYSTEM_ADMIN", "BUSINESS_DEVELOPMENT", "EXECUTIVE"];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const partnership = await ictHardwareEcosystemService.registerPartnership(
      user.tenantId,
      body,
    );

    return NextResponse.json({ success: true, partnership });
  } catch (error: any) {
    console.error("ICT partnership registration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

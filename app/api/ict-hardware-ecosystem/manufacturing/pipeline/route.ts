/**
 * ICT Hardware Manufacturing Pipeline API
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
      "PRODUCTION_ENGINEER",
    ];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");

    const pipelines = await ictHardwareEcosystemService.getPipelines(
      user.tenantId,
      stage as any,
    );

    return NextResponse.json(pipelines);
  } catch (error: any) {
    console.error("ICT pipeline API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

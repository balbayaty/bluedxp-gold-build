/**
 * DMARC Domain Reputation API
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

    const allowedRoles = ["SYSTEM_ADMIN", "IT_ADMIN", "COMPLIANCE_OFFICER"];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain") || "scsflex.com";

    const reputation = await dmarcMonitoringService.getDomainReputation(
      user.tenantId,
      domain,
    );

    return NextResponse.json(reputation);
  } catch (error: any) {
    console.error("DMARC reputation API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Accident Statistics API
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { accidentInvestigationService } from "@/lib/services/transportation/accidentInvestigationService";

async function getHandler(req: NextRequest, context: { tenantId?: string }) {
  const tenantId = context.tenantId;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const timeRange =
    from && to ? { from: new Date(from), to: new Date(to) } : undefined;

  const statistics = await accidentInvestigationService.getStatistics(
    tenantId,
    timeRange,
  );

  return NextResponse.json(statistics);
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "accidents",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

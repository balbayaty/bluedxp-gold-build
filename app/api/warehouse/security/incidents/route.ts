/**
 * Security Incidents API
 * GET: Get security incidents for warehouse
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { incidentService } from "@/lib/services/incidents/incidentService";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouseId");
    const severity = searchParams.get("severity") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    // Get incidents from service
    const incidents = await incidentService.getIncidents({
      warehouseId: warehouseId || undefined,
      severity,
      status,
      limit,
    });

    return NextResponse.json({
      success: true,
      incidents,
      count: incidents.length,
    });
  } catch (error: any) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch incidents" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.security.incidents",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

/**
 * Security Access Logs API
 * GET: Get access logs for warehouse
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { accessControlService } from "@/lib/services/warehouse/accessControlService";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouseId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const accessPoint = searchParams.get("accessPoint") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Get access logs from service
    const logs = await accessControlService.getAccessLogs({
      warehouseId,
      userId,
      accessPoint,
      status,
      limit,
    });

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error: any) {
    console.error("Error fetching access logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch access logs" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.security.access-logs",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

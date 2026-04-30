/**
 * OPC UA OEE Aggregates API
 */

import { NextRequest, NextResponse } from "next/server";
import { apiAuthMiddleware } from "@/middleware/apiAuth";
import { opcuaMonitoringService } from "@/lib/services/opc-ua-monitoring";

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
    const machineId = searchParams.get("machineId");
    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();

    if (!machineId) {
      return NextResponse.json(
        { error: "machineId is required" },
        { status: 400 },
      );
    }

    const oee = await opcuaMonitoringService.getOEE(
      machineId,
      startDate,
      endDate,
    );

    return NextResponse.json(oee);
  } catch (error: any) {
    console.error("OPC UA OEE API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

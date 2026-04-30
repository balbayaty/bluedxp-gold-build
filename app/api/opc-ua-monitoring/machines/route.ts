/**
 * OPC UA Machine Monitoring API
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

    // Get machines from service (service handles database)
    const machines = await opcuaMonitoringService.getMachines(user.tenantId);
    return NextResponse.json(machines);
  } catch (error: any) {
    console.error("OPC UA machines API error:", error);
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

    const allowedRoles = ["SYSTEM_ADMIN", "PRODUCTION_MANAGER"];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const machine = await opcuaMonitoringService.registerMachine(
      user.tenantId,
      body,
    );

    return NextResponse.json({ success: true, machine });
  } catch (error: any) {
    console.error("OPC UA machine registration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

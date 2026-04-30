/**
 * OPC UA Machine Alarms API
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

    if (!machineId) {
      return NextResponse.json(
        { error: "machineId is required" },
        { status: 400 },
      );
    }

    const alarms = await opcuaMonitoringService.getAlarms(machineId);

    return NextResponse.json(alarms);
  } catch (error: any) {
    console.error("OPC UA alarms API error:", error);
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

    const allowedRoles = [
      "SYSTEM_ADMIN",
      "PRODUCTION_MANAGER",
      "PRODUCTION_ENGINEER",
    ];
    if (!user.roles?.some((role) => allowedRoles.includes(role))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { machineId, alarmId } = body;

    if (!machineId || !alarmId) {
      return NextResponse.json(
        { error: "machineId and alarmId are required" },
        { status: 400 },
      );
    }

    await opcuaMonitoringService.acknowledgeAlarm(
      machineId,
      alarmId,
      user.userId,
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("OPC UA alarm acknowledge error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * HR Attendance API Route
 * GET /api/hr/attendance - List attendance records
 * POST /api/hr/attendance - Create attendance record
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { hrService } from "@/lib/services/hr";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  const tenantId = context.tenantId || "default-tenant";

  try {
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const employeeId = searchParams.get("employeeId");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      // Get attendance records - service uses in-memory store
      // For now, return empty array (will be populated when attendance is recorded)
      // In production, this would query the database via Prisma
      const attendance: any[] = [];

      return NextResponse.json({ attendance, count: attendance.length });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { employeeId, date, checkIn, checkOut } = body;
      const record = await hrService.recordAttendance(
        employeeId,
        new Date(date),
        checkIn ? new Date(checkIn) : undefined,
        checkOut ? new Date(checkOut) : undefined,
        tenantId,
      );
      return NextResponse.json({ record }, { status: 201 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("HR Attendance API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  requireAuth: true,
  rateLimit: { requests: 100, window: "1m" },
} as APIGatewayOptions);

export const POST = withAPIGateway(handler, {
  requireAuth: true,
  rateLimit: { requests: 50, window: "1m" },
} as APIGatewayOptions);

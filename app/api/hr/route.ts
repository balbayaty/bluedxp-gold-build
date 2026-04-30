/**
 * HR Dashboard API Route
 * GET /api/hr - Get HR dashboard data
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { hrService } from "@/lib/services/hr";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  const tenantId = context.tenantId || "default-tenant";

  try {
    if (req.method === "GET") {
      // Get dashboard summary data
      // In production, this would aggregate data from database
      const dashboard = {
        totalEmployees: 0,
        activeEmployees: 0,
        pendingTraining: 0,
        attendanceToday: 0,
        payrollPending: 0,
        recentActivity: [],
      };

      return NextResponse.json({ dashboard });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("HR Dashboard API error:", error);
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

/**
 * HR Training API Route
 * GET /api/hr/training - List training records
 * POST /api/hr/training - Create training record
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
      const status = searchParams.get("status");

      // Get training records - service uses in-memory store
      // For now, return empty array (will be populated when training is registered)
      // In production, this would query the database via Prisma
      const training: any[] = [];

      return NextResponse.json({ training, count: training.length });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { employeeId, programId, programName, expiryDays } = body;
      const record = await hrService.registerTraining(
        employeeId,
        programId,
        programName,
        expiryDays || 365,
        tenantId,
      );
      return NextResponse.json({ record }, { status: 201 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("HR Training API error:", error);
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

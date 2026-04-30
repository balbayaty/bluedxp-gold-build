/**
 * HR Employees API Route
 * GET /api/hr/employees - List employees
 * POST /api/hr/employees - Create employee
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { hrService } from "@/lib/services/hr";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  const tenantId = context.tenantId || "default-tenant";

  try {
    if (req.method === "GET") {
      // Get all employees - service uses in-memory store
      // For now, return empty array (will be populated when employees are created)
      // In production, this would query the database via Prisma
      const employees: any[] = [];
      return NextResponse.json({ employees, count: employees.length });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const employee = await hrService.createEmployee({
        ...body,
        tenantId,
      });
      return NextResponse.json({ employee }, { status: 201 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("HR Employees API error:", error);
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

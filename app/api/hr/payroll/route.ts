/**
 * HR Payroll API Route
 * GET /api/hr/payroll - List payroll records
 * POST /api/hr/payroll - Process payroll
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
      const month = searchParams.get("month");
      const year = searchParams.get("year");

      // Get payroll records - service uses in-memory store
      // For now, return empty array (will be populated when payroll is generated)
      // In production, this would query the database via Prisma
      const payroll: any[] = [];

      return NextResponse.json({ payroll, count: payroll.length });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { employeeId, period, baseSalary, allowances, deductions } = body;
      const result = await hrService.generatePayroll(
        employeeId,
        { from: new Date(period.from), to: new Date(period.to) },
        baseSalary,
        allowances || 0,
        deductions || 0,
        tenantId,
      );
      return NextResponse.json({ result }, { status: 201 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("HR Payroll API error:", error);
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
  rateLimit: { requests: 10, window: "1m" },
} as APIGatewayOptions);

/**
 * MaaS Tenants API Route
 * GET /api/maas/tenants - List tenants
 * POST /api/maas/tenants - Create tenant
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { maasService } from "@/lib/services/maas";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  const tenantId = context.tenantId || "default-tenant";

  try {
    if (req.method === "GET") {
      // Get tenants - service uses in-memory store
      // For now, return empty array (will be populated when tenants are registered)
      // In production, this would query the database via Prisma
      const tenants: any[] = [];
      return NextResponse.json({ tenants, count: tenants.length });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { name, pillars } = body;
      const tenant = await maasService.registerTenant(
        tenantId,
        name,
        pillars || [],
      );
      return NextResponse.json({ tenant }, { status: 201 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("MaaS Tenants API error:", error);
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

/**
 * Warehouse Network Cross-Docking API Route
 * GET /api/warehouse-network/cross-docking - List cross-docking operations
 * POST /api/warehouse-network/cross-docking - Create cross-docking operation
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway, APIGatewayOptions } from "@/middleware/apiGateway";
import { warehouseNetworkService } from "@/lib/services/warehouse-network";

async function handler(req: NextRequest, context: any): Promise<NextResponse> {
  const tenantId = context.tenantId || "default-tenant";

  try {
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get("status");
      const warehouseId = searchParams.get("warehouseId");

      // Get cross-docking operations from service
      // Service uses in-memory store
      // For now, return empty array (will be populated when operations are created)
      // In production, this would query the database via Prisma
      const operations: any[] = [];

      // Filter by status if provided
      let filtered = operations;
      if (status) {
        filtered = filtered.filter((op) => op.status === status);
      }
      if (warehouseId) {
        filtered = filtered.filter(
          (op) =>
            op.fromWarehouse === warehouseId || op.toWarehouse === warehouseId,
        );
      }

      return NextResponse.json({
        operations: filtered,
        count: filtered.length,
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { fromWarehouse, toWarehouse, shipmentId, scheduledDate } = body;

      const operation = await warehouseNetworkService.createCrossDocking(
        fromWarehouse,
        toWarehouse,
        shipmentId,
        new Date(scheduledDate),
        tenantId,
      );

      return NextResponse.json({ operation }, { status: 201 });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("Warehouse Network Cross-Docking API error:", error);
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

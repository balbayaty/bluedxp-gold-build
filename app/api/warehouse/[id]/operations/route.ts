import { NextRequest, NextResponse } from "next/server";
import { warehouseOperationsService } from "@/lib/services/wms/warehouseOperationsService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const warehouseId = params.id;

    const [operations, summary] = await Promise.all([
      warehouseOperationsService.getActiveOperations(warehouseId),
      warehouseOperationsService.getOperationsSummary(warehouseId),
    ]);

    return NextResponse.json({
      success: true,
      operations,
      summary,
    });
  } catch (error) {
    console.error("Error fetching operations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch operations" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.operations",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

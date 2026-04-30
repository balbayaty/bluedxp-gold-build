/**
 * WMS Putaway API
 * GET /api/wms/putaway - Get putaway tasks and suggestions
 * POST /api/wms/putaway - Create putaway task or execute putaway
 * 
 * Uses InboundService with Prisma - PRODUCTION READY
 */

import { NextRequest, NextResponse } from "next/server";
import { InboundService } from "@/lib/services/wms/InboundService";
import { prisma } from "@/lib/services/database/prismaClient";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

/**
 * GET /api/wms/putaway - Get putaway tasks
 */
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = context.tenantId || searchParams.get("tenantId") || "default";
    const asnId = searchParams.get("asnId") || "";
    const status = searchParams.get("status") || "";

    // Get pending inbound deliveries that need putaway
    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    } else {
      where.status = { in: ["RECEIVING", "RECEIVED"] };
    }

    const deliveries = await prisma.inboundDelivery.findMany({
      where,
      include: {
        items: true,
        receipts: {
          include: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Map to putaway tasks format
    const tasks = deliveries.flatMap((delivery) => {
      return delivery.items.map((item: any) => {
        // Calculate how much is received but not yet put away
        const receivedQty = item.receivedQty || 0;
        const expectedQty = item.expectedQty || 0;
        
        return {
          id: `putaway-${item.id}`,
          asnId: delivery.id,
          documentNumber: delivery.documentNumber,
          itemId: item.id,
          sku: item.sku,
          description: item.description,
          expectedQty,
          receivedQty,
          pendingPutaway: receivedQty,
          suggestedBin: null, // Would be populated by suggestPutawayBin
          status: receivedQty >= expectedQty ? "COMPLETED" : receivedQty > 0 ? "PARTIAL" : "PENDING",
          vendorName: delivery.vendorName,
          expectedDate: delivery.expectedDeliveryDate,
          createdAt: delivery.createdAt,
        };
      });
    });

    return NextResponse.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error("Error fetching putaway tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch putaway tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/wms/putaway - Execute putaway (receive items)
 */
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const userId = context.userId || body.userId || "system";

    if (!body.asnId || !body.itemId) {
      return NextResponse.json(
        { success: false, error: "asnId and itemId are required" },
        { status: 400 }
      );
    }

    if (!body.quantity || body.quantity <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid quantity is required" },
        { status: 400 }
      );
    }

    // Get bin suggestion if not provided
    let targetBinId = body.targetBinId;
    if (!targetBinId && body.sku) {
      targetBinId = await InboundService.suggestPutawayBin(body.sku);
    }

    // Execute putaway
    const result = await InboundService.receiveItem(
      body.asnId,
      body.itemId,
      body.quantity,
      targetBinId,
      userId
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Putaway completed successfully",
          receiptId: result.id,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error executing putaway:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute putaway" },
      { status: 500 }
    );
  }
}

/**
 * Suggest putaway bin endpoint
 */
export async function OPTIONS(request: NextRequest) {
  try {
    const sku = request.nextUrl.searchParams.get("sku");
    
    if (!sku) {
      return NextResponse.json(
        { success: false, error: "sku parameter is required" },
        { status: 400 }
      );
    }

    const suggestedBin = await InboundService.suggestPutawayBin(sku);

    return NextResponse.json({
      success: true,
      suggestedBin,
    });
  } catch (error) {
    console.error("Error suggesting putaway bin:", error);
    return NextResponse.json(
      { success: false, error: "Failed to suggest putaway bin" },
      { status: 500 }
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "wms",
  featureId: "wms.putaway",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "wms",
  featureId: "wms.putaway",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

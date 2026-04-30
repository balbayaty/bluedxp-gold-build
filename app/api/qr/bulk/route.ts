/**
 * QR Code Bulk Operations API
 * Bulk generate, update, delete QR codes
 */

import { NextRequest, NextResponse } from "next/server";
import { qrBulkService } from "@/lib/services/qr/qrBulkService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { operation, items, options } = body;

    if (!operation || !items) {
      return NextResponse.json(
        { success: false, error: "Operation and items are required" },
        { status: 400 },
      );
    }

    // Get user from context
    const createdBy = context.userId || "system";

    let result;

    switch (operation) {
      case "generate":
        result = await qrBulkService.bulkGenerate(
          { items, options },
          createdBy,
        );
        break;
      case "update":
        result = await qrBulkService.bulkUpdate({ items }, createdBy);
        break;
      case "delete":
        result = await qrBulkService.bulkDelete({ qrIds: items }, createdBy);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid operation" },
          { status: 400 },
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error in bulk operation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process bulk operation",
      },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const operationId = searchParams.get("operationId");

    if (operationId) {
      const operation = await qrBulkService.getOperationStatus(operationId);
      if (!operation) {
        return NextResponse.json(
          { success: false, error: "Operation not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({
        success: true,
        data: operation,
      });
    }

    // List operations
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const createdBy = searchParams.get("createdBy");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    const operations = await qrBulkService.listOperations({
      type: type as any,
      status: status as any,
      createdBy: createdBy || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: operations,
    });
  } catch (error: any) {
    console.error("Error listing operations:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to list operations" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.bulk",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.bulk",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

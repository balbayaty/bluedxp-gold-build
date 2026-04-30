/**
 * QHSE Bulk Operations API
 * Handle bulk operations for incidents, inspections, training
 */

import { NextRequest, NextResponse } from "next/server";
import { bulkOperationService } from "@/lib/services/qhse/bulk/bulkOperationService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { operation, data, createdBy } = body;

    if (!operation || !data || !createdBy) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: operation, data, createdBy",
        },
        { status: 400 },
      );
    }

    let result;

    switch (operation) {
      case "CREATE_INCIDENTS":
        result = await bulkOperationService.bulkCreateIncidents(
          data,
          createdBy,
        );
        break;

      case "ASSIGN_TRAINING":
        result = await bulkOperationService.bulkAssignTraining(data, createdBy);
        break;

      case "SCHEDULE_INSPECTIONS":
        result = await bulkOperationService.bulkScheduleInspections(
          data,
          createdBy,
        );
        break;

      case "UPDATE_STATUS":
        const { entityType, ids, status } = data;
        result = await bulkOperationService.bulkUpdateStatus(
          entityType,
          ids,
          status,
          createdBy,
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown operation: ${operation}` },
          { status: 400 },
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error in bulk operation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process bulk operation",
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
      const operation = bulkOperationService.getOperation(operationId);
      if (!operation) {
        return NextResponse.json(
          { success: false, error: "Operation not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: operation });
    }

    const operations = bulkOperationService.getAllOperations();
    return NextResponse.json({
      success: true,
      data: operations,
      count: operations.length,
    });
  } catch (error) {
    console.error("Error fetching bulk operations:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch operations",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.bulk",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.bulk",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

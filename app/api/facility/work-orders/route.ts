/**
 * Facility Work Orders API Route
 * Handles work order CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getWorkOrderService } from "@/lib/services/facility/maintenance/workOrderService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

const workOrderService = getWorkOrderService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId") || "facility-1";
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const workOrders = await workOrderService.getWorkOrders(facilityId, {
      type: type as any,
      status: status as any,
      priority: priority as any,
    });

    return NextResponse.json({
      success: true,
      data: workOrders,
      total: workOrders.length,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching work orders", err, {
      module: "facility",
      service: "work-orders",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "work-orders",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch work orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const workOrder = await workOrderService.createWorkOrder(body);

    return NextResponse.json({
      success: true,
      data: workOrder,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error creating work order", err, {
      module: "facility",
      service: "work-orders",
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "work-orders",
    });
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create work order" },
      { status: 500 },
    );
  }
}

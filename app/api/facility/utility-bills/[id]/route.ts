/**
 * Utility Bill Detail API Routes
 *
 * GET /api/facility/utility-bills/[id] - Get bill by ID
 * PUT /api/facility/utility-bills/[id] - Update bill
 * DELETE /api/facility/utility-bills/[id] - Delete bill (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { getUtilityBillService } from "@/lib/services/facility/utility-bills/utilityBillService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const billService = getUtilityBillService();
    const bill = await billService.getBill(params.id);

    if (!bill) {
      return NextResponse.json(
        { success: false, error: "Bill not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching utility bill", err, {
      module: "facility",
      service: "utility-bills",
      billId: params.id,
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "utility-bills",
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch utility bill",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const updates = await request.json();
    const updatedBy = request.headers.get("x-user-id") || undefined;

    const billService = getUtilityBillService();
    const bill = await billService.updateBill(params.id, updates, updatedBy);

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error("Error updating utility bill:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update utility bill",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const deletedBy = request.headers.get("x-user-id") || undefined;

    const billService = getUtilityBillService();
    await billService.deleteBill(params.id, deletedBy);

    return NextResponse.json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error deleting utility bill", err, {
      module: "facility",
      service: "utility-bills",
      billId: params.id,
    });
    errorTrackingService.captureException(err, {
      module: "facility",
      service: "utility-bills",
    });
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to delete utility bill",
      },
      { status: 500 },
    );
  }
}

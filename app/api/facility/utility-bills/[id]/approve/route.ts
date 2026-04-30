/**
 * Utility Bill Approval API Route
 *
 * POST /api/facility/utility-bills/[id]/approve - Approve bill
 */

import { NextRequest, NextResponse } from "next/server";
import { getUtilityBillService } from "@/lib/services/facility/utility-bills/utilityBillService";
import { logger } from "@/lib/services/observability/logger";
import { errorTrackingService } from "@/lib/services/observability/errorTracking";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { approvedBy } = await request.json();
    const userId = approvedBy || request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    const billService = getUtilityBillService();
    const bill = await billService.approveBill(params.id, userId);

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error approving utility bill", err, {
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
        error: err.message || "Failed to approve utility bill",
      },
      { status: 500 },
    );
  }
}

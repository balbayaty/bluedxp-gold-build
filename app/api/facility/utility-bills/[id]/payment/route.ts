/**
 * Utility Bill Payment API Route
 *
 * POST /api/facility/utility-bills/[id]/payment - Record payment
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
    const { paymentAmount, paymentMethod, paymentDate } = await request.json();

    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid payment amount is required" },
        { status: 400 },
      );
    }

    const billService = getUtilityBillService();
    const bill = await billService.recordPayment(
      params.id,
      paymentAmount,
      paymentMethod,
      paymentDate ? new Date(paymentDate) : undefined,
    );

    return NextResponse.json({
      success: true,
      data: bill,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error recording payment", err, {
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
        error: err.message || "Failed to record payment",
      },
      { status: 500 },
    );
  }
}

/**
 * Utility Bill Traceability API Route
 *
 * GET /api/facility/utility-bills/[id]/traceability - Get bill traceability chain
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
    const traceability = await billService.getBillTraceability(params.id);

    return NextResponse.json({
      success: true,
      data: traceability,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Error fetching traceability", err, {
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
        error: err.message || "Failed to fetch traceability",
      },
      { status: 500 },
    );
  }
}

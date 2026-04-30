/**
 * Bayan Regulatory API Routes
 */

import { NextRequest, NextResponse } from "next/server";
import { bayanAdapter } from "@/lib/adapters/regulatory/bayanAdapter";

/**
 * GET /api/tms/regulatory/bayan/:bayanNumber - Get Bayan status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bayanNumber: string } },
) {
  try {
    const result = await bayanAdapter.getBayanStatus(params.bayanNumber);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Bayan status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

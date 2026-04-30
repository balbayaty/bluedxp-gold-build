/**
 * ASN Status Update API
 * Update ASN status with lifecycle integration
 */

import { NextRequest, NextResponse } from "next/server";
import { asnService } from "@/lib/services/asn/asnService";
import type { ASNStatus, OrderStatus } from "@/types/asn";

/**
 * POST /api/asn/[id]/status
 * Update ASN status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { status, ...context } = body;

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          error: "Status is required",
        },
        { status: 400 },
      );
    }

    const asn = await asnService.updateASNStatus(
      params.id,
      status as ASNStatus | OrderStatus,
      context,
    );

    return NextResponse.json({
      success: true,
      data: asn,
      message: "ASN status updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in POST /api/asn/[id]/status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

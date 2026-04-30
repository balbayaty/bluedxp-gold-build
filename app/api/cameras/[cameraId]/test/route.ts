/**
 * Camera Test Connection API Route
 * POST: Test camera connection
 */

import { NextRequest, NextResponse } from "next/server";
import { dahuaCameraService } from "@/lib/services/cameras";

export async function POST(
  request: NextRequest,
  { params }: { params: { cameraId: string } },
) {
  try {
    const result = await dahuaCameraService.testConnection(params.cameraId);

    return NextResponse.json({
      success: result.success,
      ...result,
    });
  } catch (error: any) {
    console.error("Error testing camera:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test camera" },
      { status: 500 },
    );
  }
}

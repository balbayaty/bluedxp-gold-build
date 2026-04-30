/**
 * Camera Discovery API Route
 * POST: Discover cameras on the network
 */

import { NextRequest, NextResponse } from "next/server";
import { dahuaCameraService } from "@/lib/services/cameras";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { networkRange, port, timeout } = body;

    const result = await dahuaCameraService.discoverCameras({
      networkRange: networkRange || ["192.168.1.0/24"],
      port: port || 80,
      timeout: timeout || 5000,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error discovering cameras:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to discover cameras" },
      { status: 500 },
    );
  }
}

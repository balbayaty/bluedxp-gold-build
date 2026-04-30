/**
 * Cameras API Route
 * GET: List all cameras
 * POST: Register a new camera
 */

import { NextRequest, NextResponse } from "next/server";
import { dahuaCameraService } from "@/lib/services/cameras";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as
      | "online"
      | "offline"
      | "error"
      | "maintenance"
      | null;
    const warehouseId = searchParams.get("warehouseId");
    const online = searchParams.get("online") === "true";

    const cameras = dahuaCameraService.getAllCameras({
      status: status || undefined,
      warehouseId: warehouseId || undefined,
      online: online ? true : undefined,
    });

    return NextResponse.json({
      success: true,
      cameras,
      total: cameras.length,
    });
  } catch (error: any) {
    console.error("Error fetching cameras:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch cameras" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ipAddress,
      port,
      username,
      password,
      model,
      serialNumber,
      networkRange,
    } = body;

    if (!ipAddress || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: ipAddress, username, password",
        },
        { status: 400 },
      );
    }

    const camera = await dahuaCameraService.registerCamera({
      ipAddress,
      port,
      username,
      password,
      model,
      serialNumber,
      networkRange,
    });

    return NextResponse.json(
      {
        success: true,
        camera,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error registering camera:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register camera" },
      { status: 500 },
    );
  }
}

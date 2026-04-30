/**
 * Security Cameras API
 * GET: Get camera status for warehouse
 * Now integrated with Dahua Camera Service
 */

import { NextRequest, NextResponse } from "next/server";
import { dahuaCameraService } from "@/lib/services/cameras";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const warehouseId = searchParams.get("warehouseId") || "wh-001";

    // Get cameras from Dahua service filtered by warehouse
    const dahuaCameras = dahuaCameraService.getAllCameras({
      warehouseId,
    });

    // Transform to warehouse camera format
    const cameras = dahuaCameras.map((camera) => ({
      id: camera.id,
      name: camera.name,
      zone: camera.location?.zone || "Unknown",
      status: camera.status.toUpperCase(),
      lastActivity: camera.lastSeen?.toISOString() || new Date().toISOString(),
      recordingQuality: camera.health.health,
      storageUsed: 0, // Would come from camera/NVR storage info
      storageTotal: 1000,
      ipAddress: camera.ipAddress,
      model: camera.model,
      channels: camera.channels.length,
    }));

    // If no cameras found, return empty array (removed mock data)
    return NextResponse.json({
      cameras,
      total: cameras.length,
      warehouseId,
    });
  } catch (error: any) {
    console.error("Error fetching cameras:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch cameras" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.security.cameras",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

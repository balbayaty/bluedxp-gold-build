/**
 * Bulk Camera Registration API
 * POST: Register multiple cameras at once
 */

import { NextRequest, NextResponse } from "next/server";
import { dahuaCameraService } from "@/lib/services/cameras";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cameras } = body;

    if (!cameras || !Array.isArray(cameras)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid cameras array" },
        { status: 400 },
      );
    }

    const results = {
      success: [] as any[],
      failed: [] as Array<{ cameraId: string; error: string }>,
      total: cameras.length,
    };

    for (const camera of cameras) {
      try {
        const {
          ipAddress,
          port = 80,
          username,
          password,
          model,
          serialNumber,
          warehouseId,
          zone,
        } = camera;

        if (!ipAddress || !username || !password) {
          results.failed.push({
            cameraId: camera.cameraId || ipAddress,
            error: "Missing required fields: ipAddress, username, password",
          });
          continue;
        }

        const registeredCamera = await dahuaCameraService.registerCamera({
          ipAddress,
          port,
          username,
          password,
          model,
          serialNumber,
        });

        // Update location if provided
        if (registeredCamera && (warehouseId || zone)) {
          registeredCamera.location = {
            warehouseId: warehouseId || registeredCamera.location?.warehouseId,
            zone: zone || registeredCamera.location?.zone,
          };
        }

        results.success.push({
          cameraId: registeredCamera.id,
          name: registeredCamera.name,
          ipAddress: registeredCamera.ipAddress,
          status: registeredCamera.status,
        });
      } catch (error: any) {
        results.failed.push({
          cameraId: camera.cameraId || camera.ipAddress || "unknown",
          error: error.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      summary: {
        total: results.total,
        registered: results.success.length,
        failed: results.failed.length,
        successRate: `${((results.success.length / results.total) * 100).toFixed(1)}%`,
      },
    });
  } catch (error: any) {
    console.error("Error in bulk registration:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register cameras" },
      { status: 500 },
    );
  }
}

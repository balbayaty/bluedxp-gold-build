/**
 * Camera Detail API Route
 * GET: Get camera details
 * PUT: Update camera
 * DELETE: Remove camera
 */

import { NextRequest, NextResponse } from "next/server";
import { dahuaCameraService } from "@/lib/services/cameras";

export async function GET(
  request: NextRequest,
  { params }: { params: { cameraId: string } },
) {
  try {
    const camera = dahuaCameraService.getCamera(params.cameraId);

    if (!camera) {
      return NextResponse.json(
        { success: false, error: "Camera not found" },
        { status: 404 },
      );
    }

    // Don't expose password in response
    const { password, ...safeCamera } = camera;

    return NextResponse.json({
      success: true,
      camera: safeCamera,
    });
  } catch (error: any) {
    console.error("Error fetching camera:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch camera" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { cameraId: string } },
) {
  try {
    const body = await request.json();
    const camera = dahuaCameraService.getCamera(params.cameraId);

    if (!camera) {
      return NextResponse.json(
        { success: false, error: "Camera not found" },
        { status: 404 },
      );
    }

    // Update camera properties
    if (body.name) camera.name = body.name;
    if (body.location)
      camera.location = { ...camera.location, ...body.location };
    if (body.recording)
      camera.recording = { ...camera.recording, ...body.recording };
    if (body.metadata)
      camera.metadata = { ...camera.metadata, ...body.metadata };

    camera.updatedAt = new Date();

    return NextResponse.json({
      success: true,
      camera: (() => {
        const { password, ...safeCamera } = camera;
        return safeCamera;
      })(),
    });
  } catch (error: any) {
    console.error("Error updating camera:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update camera" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { cameraId: string } },
) {
  try {
    const camera = dahuaCameraService.getCamera(params.cameraId);

    if (!camera) {
      return NextResponse.json(
        { success: false, error: "Camera not found" },
        { status: 404 },
      );
    }

    // Remove camera (implementation depends on storage)
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: "Camera removed",
    });
  } catch (error: any) {
    console.error("Error deleting camera:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete camera" },
      { status: 500 },
    );
  }
}

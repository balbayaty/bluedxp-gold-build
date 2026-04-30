/**
 * QR-IoT Integration API
 * Integrates QR codes with IoT devices
 */

import { NextRequest, NextResponse } from "next/server";
import { qrModuleDeepIntegration } from "@/lib/services/qr/qrModuleDeepIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, deviceId, scanData } = body;

    if (action === "generate") {
      if (!deviceId) {
        return NextResponse.json(
          { success: false, error: "Device ID is required" },
          { status: 400 },
        );
      }

      const result = await qrModuleDeepIntegration.generateIoTQR(deviceId, {
        includeSensorData: body.includeSensorData,
        realTimeUpdates: body.realTimeUpdates,
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (action === "scan") {
      if (!scanData) {
        return NextResponse.json(
          { success: false, error: "Scan data is required" },
          { status: 400 },
        );
      }

      await qrModuleDeepIntegration.recordIoTScan(scanData);

      return NextResponse.json({
        success: true,
        message: "IoT scan recorded successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "generate" or "scan"' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR-IoT integration:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.integrations.iot",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

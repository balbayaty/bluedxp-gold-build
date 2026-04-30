/**
 * QR Digital Twin API
 * Digital twin management for QR codes
 */

import { NextRequest, NextResponse } from "next/server";
import { qrDigitalTwinService } from "@/lib/services/qr/qrDigitalTwinService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    if (action === "create-twin") {
      const twin = await qrDigitalTwinService.createDigitalTwin(
        data.qrId,
        data.initialData,
      );
      return NextResponse.json({ success: true, twin });
    }

    if (action === "run-simulation") {
      const simulation = await qrDigitalTwinService.runSimulation(data.twinId, {
        name: data.name,
        type: data.type,
        parameters: data.parameters,
      });
      return NextResponse.json({ success: true, simulation });
    }

    if (action === "synchronize") {
      await qrDigitalTwinService.synchronizeTwin(data.twinId);
      return NextResponse.json({ success: true, message: "Twin synchronized" });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR digital twin API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request" },
      { status: 500 },
    );
  }
}

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const twinId = searchParams.get("twinId");
    const qrId = searchParams.get("qrId");

    if (twinId) {
      // Get twin by ID
      return NextResponse.json({
        success: true,
        twin: null, // In production, query database
      });
    }

    if (qrId) {
      // Get twin by QR ID
      return NextResponse.json({
        success: true,
        twin: null, // In production, query database
      });
    }

    return NextResponse.json(
      { success: false, error: "twinId or qrId required" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR digital twin API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get twin" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.digital-twin",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.digital-twin",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

/**
 * QR Code Scan Tracking API
 * Explicit scan tracking endpoint (can be called from frontend)
 */

import { NextRequest, NextResponse } from "next/server";
import { documentQRService } from "@/lib/services/qr/documentQRService";
import { geolocationService } from "@/lib/services/qr/geolocationService";
import { broadcastQRScan } from "@/app/api/qr/realtime/route";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { qrId, userId } = body;

    if (!qrId) {
      return NextResponse.json(
        { success: false, error: "QR ID is required" },
        { status: 400 },
      );
    }

    // Extract IP address from request
    const ip = geolocationService.extractIPFromRequest(request.headers);

    // Get geolocation data
    const locationData = await geolocationService.getLocationFromIP(ip);

    // Parse user agent
    const userAgent = request.headers.get("user-agent") || "unknown";
    const deviceInfo = geolocationService.parseUserAgent(userAgent);

    // Build comprehensive location string
    const locationParts = [
      locationData.city,
      locationData.region,
      locationData.country,
    ].filter(Boolean);
    const locationString = locationParts.join(", ") || "Unknown Location";

    // Track the scan
    const scanTimestamp = new Date();
    await documentQRService.trackScan(qrId, {
      timestamp: scanTimestamp.toISOString(),
      location: locationString,
      device: `${deviceInfo.device} (${deviceInfo.os})`,
      userAgent,
      ipAddress: ip,
      userId: userId || context.userId,
    });

    // Broadcast real-time event
    try {
      broadcastQRScan({
        qrId,
        location: locationString,
        device: `${deviceInfo.device} (${deviceInfo.os})`,
        timestamp: scanTimestamp,
        userId: userId || context.userId,
        tenantId: context.tenantId,
      });
    } catch (error) {
      console.warn("Could not broadcast QR scan event:", error);
    }

    return NextResponse.json({
      success: true,
      tracked: true,
      location: {
        country: locationData.country,
        countryCode: locationData.countryCode,
        city: locationData.city,
        region: locationData.region,
        area: locationData.area,
        coordinates: locationData.coordinates,
        ip: ip,
      },
      device: deviceInfo,
    });
  } catch (error: any) {
    console.error("Error tracking QR scan:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to track scan" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.scan.track",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

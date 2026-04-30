/**
 * QR Code Scan Handler
 * Tracks QR code scans with comprehensive location data and redirects to document
 * NOTE: This route is intentionally NOT authenticated to allow public QR scanning
 */

import { NextRequest, NextResponse } from "next/server";
import { documentQRService } from "@/lib/services/qr/documentQRService";
import { geolocationService } from "@/lib/services/qr/geolocationService";
import { broadcastQRScan } from "@/app/api/qr/realtime/route";

export async function GET(
  request: NextRequest,
  { params }: { params: { qrId: string } },
) {
  try {
    const qrId = params.qrId;

    // Extract IP address from request
    const ip = geolocationService.extractIPFromRequest(request.headers);

    // Get geolocation data
    const locationData = await geolocationService.getLocationFromIP(ip);

    // Parse user agent
    const userAgent = request.headers.get("user-agent") || "unknown";
    const deviceInfo = geolocationService.parseUserAgent(userAgent);

    // Build location string
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
      userId: undefined, // Could extract from session if authenticated
    });

    // Broadcast real-time event
    try {
      broadcastQRScan({
        qrId,
        location: locationString,
        device: `${deviceInfo.device} (${deviceInfo.os})`,
        timestamp: scanTimestamp,
        userId: undefined,
        tenantId: undefined, // Could extract from session
      });
    } catch (error) {
      console.warn("Could not broadcast QR scan event:", error);
      // Continue even if broadcast fails
    }

    // Get QR code data to determine redirect URL
    try {
      const { QRCodeModel } = await import("@/lib/database/models/qrModel");
      const { getDatabaseClient } = await import("@/lib/database/client");

      const db = getDatabaseClient();

      // Try to connect if not already connected (will be no-op if already connected)
      try {
        await db.connect();
      } catch (error) {
        // Database might already be connected or not available
        console.warn("Database connection check:", error);
      }

      const qrModel = new QRCodeModel(db);
      const qrCode = await qrModel.getById(qrId);

      if (qrCode && qrCode.qrData) {
        const qrData = qrCode.qrData;

        // Redirect based on document type
        if (qrData.documentType === "msds" && qrData.documentId) {
          return NextResponse.redirect(
            new URL(`/msds?id=${qrData.documentId}`, request.url),
          );
        } else if (qrData.url) {
          // Use the URL from QR data
          const redirectUrl = qrData.url.startsWith("http")
            ? qrData.url
            : new URL(qrData.url, request.url).toString();
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (error) {
      console.error("Error getting QR code data:", error);
    }

    // Fallback: redirect to MSDS page if documentId is in qrId
    const msdsIdMatch = qrId.match(/qr-msds-([^-]+)/);
    if (msdsIdMatch) {
      return NextResponse.redirect(
        new URL(`/msds?id=${msdsIdMatch[1]}`, request.url),
      );
    }

    // Ultimate fallback
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error: any) {
    console.error("Error handling QR scan:", error);
    // Still redirect even if tracking fails
    return NextResponse.redirect(new URL("/", request.url));
  }
}

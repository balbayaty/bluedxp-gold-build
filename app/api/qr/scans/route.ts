/**
 * QR Code Scans API
 * Get all scan events with comprehensive location data
 */

import { NextRequest, NextResponse } from "next/server";
import { QRCodeModel } from "@/lib/database/models/qrModel";
import { getDatabaseClient } from "@/lib/database/client";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const { searchParams } = new URL(request.url);
    const qrId = searchParams.get("qrId");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 1000;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const db = getDatabaseClient();
    const qrModel = new QRCodeModel(db);

    if (qrId) {
      // Get scans for specific QR code
      const scanEvents = await qrModel.getScanEvents(qrId, limit);

      return NextResponse.json({
        success: true,
        qrId,
        scans: scanEvents.map((scan) => ({
          id: scan.id,
          timestamp: scan.timestamp,
          location: scan.location,
          device: scan.device,
          userAgent: scan.userAgent,
          ipAddress: scan.ipAddress,
          userId: scan.userId,
          metadata: scan.metadata,
        })),
        count: scanEvents.length,
      });
    } else {
      // Get all scans (admin view)
      let query = `
        SELECT 
          s.*,
          q.document_id,
          q.document_type,
          q.qr_id
        FROM qr_scan_events s
        LEFT JOIN qr_codes q ON s.qr_id = q.qr_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (startDate) {
        query += ` AND s.timestamp >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        query += ` AND s.timestamp <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      query += ` ORDER BY s.timestamp DESC LIMIT $${paramIndex}`;
      params.push(limit);

      const scans = await db.query(query, params);

      // Group by location for analytics
      const locationStats: Record<string, number> = {};
      const countryStats: Record<string, number> = {};
      const deviceStats: Record<string, number> = {};

      scans.forEach((scan: any) => {
        // Parse location for stats
        if (scan.location) {
          locationStats[scan.location] =
            (locationStats[scan.location] || 0) + 1;

          // Extract country
          const countryMatch = scan.location.match(/, ([^,]+)$/);
          if (countryMatch) {
            const country = countryMatch[1].trim();
            countryStats[country] = (countryStats[country] || 0) + 1;
          }
        }

        if (scan.device) {
          deviceStats[scan.device] = (deviceStats[scan.device] || 0) + 1;
        }
      });

      return NextResponse.json({
        success: true,
        scans: scans.map((scan: any) => ({
          id: scan.id,
          qrId: scan.qr_id,
          documentId: scan.document_id,
          documentType: scan.document_type,
          timestamp: scan.timestamp,
          location: scan.location,
          device: scan.device,
          userAgent: scan.user_agent,
          ipAddress: scan.ip_address,
          userId: scan.user_id,
          metadata: scan.metadata,
        })),
        statistics: {
          total: scans.length,
          byLocation: locationStats,
          byCountry: countryStats,
          byDevice: deviceStats,
        },
        count: scans.length,
      });
    }
  } catch (error: any) {
    console.error("Error getting QR scans:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to get scans" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.scans",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

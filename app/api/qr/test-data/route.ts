/**
 * QR Code Test Data API
 * Generate and return test data for visualization
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateQRTestData,
  generateQRAnalyticsTestData,
  generateScanEventTestData,
} from "@/lib/utils/qrTestDataGenerator";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";

    if (type === "qr-codes") {
      const data = await generateQRTestData();
      return NextResponse.json({
        success: true,
        data: data.qrCodes,
      });
    }

    if (type === "analytics") {
      const analytics = generateQRAnalyticsTestData();
      return NextResponse.json({
        success: true,
        data: analytics,
      });
    }

    if (type === "scan-events") {
      const count = parseInt(searchParams.get("count") || "50");
      const events = generateScanEventTestData(count);
      return NextResponse.json({
        success: true,
        data: events,
      });
    }

    if (type === "templates") {
      const data = await generateQRTestData();
      return NextResponse.json({
        success: true,
        data: data.templates,
      });
    }

    if (type === "bulk-operations") {
      const data = await generateQRTestData();
      return NextResponse.json({
        success: true,
        data: data.bulkOperations,
      });
    }

    // Return all test data
    const data = await generateQRTestData();
    const analytics = generateQRAnalyticsTestData();
    const events = generateScanEventTestData(50);

    return NextResponse.json({
      success: true,
      data: {
        qrCodes: data.qrCodes,
        templates: data.templates,
        bulkOperations: data.bulkOperations,
        analytics,
        scanEvents: events,
      },
    });
  } catch (error: any) {
    console.error("Error generating test data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate test data",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.test-data",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

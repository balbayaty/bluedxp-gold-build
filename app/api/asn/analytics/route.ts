/**
 * ASN Analytics API
 * Get comprehensive analytics for ASNs
 */

import { NextRequest, NextResponse } from "next/server";
import { asnService } from "@/lib/services/asn/asnService";
import { asnAnalyticsService } from "@/lib/services/asn/asnAnalyticsService";

/**
 * GET /api/asn/analytics
 * Get comprehensive ASN analytics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const processType = searchParams.get("processType") as
      | "INBOUND"
      | "OUTBOUND"
      | null;
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const vendorNumber = searchParams.get("vendorNumber");
    const type = searchParams.get("type"); // 'basic' | 'comprehensive'

    const filters: any = {};
    if (processType) filters.processType = processType;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (vendorNumber) filters.vendorNumber = vendorNumber;

    // Return comprehensive analytics if requested
    if (type === "comprehensive") {
      const analytics = await asnAnalyticsService.getAnalytics(filters);
      return NextResponse.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString(),
      });
    }

    // Otherwise return basic statistics
    const statistics = await asnService.getASNStatistics(filters);

    return NextResponse.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/asn/analytics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

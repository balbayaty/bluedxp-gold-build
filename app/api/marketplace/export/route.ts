/**
 * Marketplace Export API
 * Export listings, bookings, reviews, and statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { marketplaceExportService } from "@/lib/services/marketplace/marketplaceExportService";
import { marketplaceService } from "@/lib/services/marketplace/marketplaceService";
import type { ExportFormat } from "@/lib/services/export/exportService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "listings"; // listings, bookings, reviews, stats, provider
    const format = (searchParams.get("format") || "xlsx") as ExportFormat;
    const providerId = searchParams.get("providerId");
    const periodStart = searchParams.get("periodStart");
    const periodEnd = searchParams.get("periodEnd");

    let result;

    switch (type) {
      case "listings":
        const listings = await marketplaceService.searchListings({});
        result = await marketplaceExportService.exportListings(
          listings,
          format,
        );
        break;

      case "bookings":
        const bookings = providerId
          ? await marketplaceService.getProviderBookings(providerId)
          : await marketplaceService.searchBookings({});
        result = await marketplaceExportService.exportBookings(
          bookings,
          format,
        );
        break;

      case "reviews":
        // Get reviews from listings
        const allListings = await marketplaceService.searchListings({});
        const reviews = allListings.flatMap((l) => l.reviews || []);
        result = await marketplaceExportService.exportReviews(reviews, format);
        break;

      case "stats":
        if (!periodStart || !periodEnd) {
          return NextResponse.json(
            {
              success: false,
              error: "periodStart and periodEnd are required for stats export",
            },
            { status: 400 },
          );
        }
        result = await marketplaceExportService.exportMarketplaceStats(
          { start: periodStart, end: periodEnd },
          format,
        );
        break;

      case "provider":
        if (!providerId) {
          return NextResponse.json(
            {
              success: false,
              error: "providerId is required for provider export",
            },
            { status: 400 },
          );
        }
        result = await marketplaceExportService.exportProviderPerformance(
          providerId,
          format,
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Invalid export type: ${type}` },
          { status: 400 },
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Export failed" },
        { status: 500 },
      );
    }

    // Return file download
    const headers = new Headers();
    headers.set("Content-Type", getContentType(format));
    headers.set(
      "Content-Disposition",
      `attachment; filename="${result.filename}"`,
    );

    return new NextResponse(result.blob, { headers });
  } catch (error: any) {
    console.error("Failed to export:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export" },
      { status: 500 },
    );
  }
}

function getContentType(format: ExportFormat): string {
  switch (format) {
    case "pdf":
      return "application/pdf";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";
    default:
      return "application/octet-stream";
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "marketplace",
  featureId: "marketplace.export",
  action: "export",
  requireAuth: true,
  rateLimit: true,
});

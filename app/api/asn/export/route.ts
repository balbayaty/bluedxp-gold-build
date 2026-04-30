/**
 * ASN Export API
 * Export ASN data to various formats (Excel, PDF, CSV)
 */

import { NextRequest, NextResponse } from "next/server";
import { asnExportService } from "@/lib/services/asn/asnExportService";

/**
 * POST /api/asn/export
 * Export ASNs to specified format
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, filters } = body;

    if (!format || !["xlsx", "pdf", "csv"].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid format. Must be xlsx, pdf, or csv",
        },
        { status: 400 },
      );
    }

    let result;

    switch (format) {
      case "xlsx":
        result = await asnExportService.exportToExcel(filters);
        break;
      case "pdf":
        result = await asnExportService.exportToPDF(filters);
        break;
      case "csv":
        result = await asnExportService.exportToCSV(filters);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Unsupported format",
          },
          { status: 400 },
        );
    }

    // Return file as response
    return new NextResponse(result.blob, {
      headers: {
        "Content-Type":
          format === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : format === "pdf"
              ? "application/pdf"
              : "text/csv",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/asn/export:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

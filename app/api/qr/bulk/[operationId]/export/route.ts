/**
 * Export Bulk Operation Results
 */

import { NextRequest, NextResponse } from "next/server";
import { qrBulkService } from "@/lib/services/qr/qrBulkService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  nextContext: { params: { operationId: string } },
) {
  try {
    const { operationId } = nextContext.params;
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv";

    const results = await qrBulkService.exportOperationResults(operationId);

    if (format === "json") {
      return NextResponse.json({
        success: true,
        data: results.json,
      });
    }

    // Return CSV
    return new NextResponse(results.csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="qr-bulk-${operationId}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting results:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export results" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qr",
  featureId: "qr.bulk.export",
  action: "export",
  requireAuth: true,
  rateLimit: true,
});

/**
 * Export Drill-Down Level API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { drillDownService } from "@/lib/services/iso-ims/drilldown/drillDownService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const exportSchema = z.object({
  format: z.enum(["JSON", "CSV", "PDF", "EXCEL"]),
});

async function postHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { sessionId: string } },
) {
  try {
    const body = await request.json();
    const validated = exportSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validated.error.errors },
        { status: 400 },
      );
    }

    const exportData = await drillDownService.exportLevel(
      params.sessionId,
      validated.data.format,
    );

    // Return JSON for now (would implement CSV/PDF/EXCEL conversion)
    return NextResponse.json(exportData, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${exportData.filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting level:", error);
    return NextResponse.json(
      { error: "Failed to export level" },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.drilldown.export",
  action: "export",
  requireAuth: true,
  rateLimit: true,
});

/**
 * Export Download API Route
 *
 * Download exported files
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { exportReportingService } from "@/lib/services/transportation/exportReportingService";

export const GET = withTransportationAPI(
  async (req: NextRequest, context: { tenantId?: string }) => {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const exportId = req.nextUrl.pathname.split("/").slice(-2, -1)[0] || "";
    if (!exportId)
      return NextResponse.json(
        { error: "exportId is required" },
        { status: 400 },
      );

    const exportResult = await exportReportingService.getExport(
      String(tenantId),
      exportId,
    );
    if (!exportResult)
      return NextResponse.json({ error: "Export not found" }, { status: 404 });

    if (new Date() > exportResult.expiresAt)
      return NextResponse.json(
        { error: "Export has expired" },
        { status: 410 },
      );

    const payload = await exportReportingService.getExportPayload(
      String(tenantId),
      exportId,
    );
    if (!payload) {
      return NextResponse.json(
        { error: "Export payload not available" },
        { status: 410 },
      );
    }

    return new NextResponse(payload.content, {
      status: 200,
      headers: {
        "Content-Type": payload.mimeType,
        "Content-Disposition": `attachment; filename="${payload.fileName}"`,
      },
    });
  },
  {
    featureId: "exports",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);

import { NextRequest, NextResponse } from "next/server";
import { warehouseQRServicesIntegration } from "@/lib/services/wms/qrServicesIntegration";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(
  request: NextRequest,
  context: APIRequestContext,
  { params }: { params: { id: string } },
) {
  try {
    const warehouseId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "summary";

    if (action === "analytics") {
      const analytics =
        await warehouseQRServicesIntegration.getAnalytics(warehouseId);
      return NextResponse.json({ success: true, analytics });
    }

    if (action === "codes") {
      const type = (searchParams.get("type") || "inventory") as any;
      const codes = await warehouseQRServicesIntegration.getQRCodesByType(
        warehouseId,
        type,
      );
      return NextResponse.json({ success: true, codes });
    }

    // Default: return both (efficient for UI)
    const [analytics, codes] = await Promise.all([
      warehouseQRServicesIntegration.getAnalytics(warehouseId),
      warehouseQRServicesIntegration.getQRCodesByType(warehouseId, "inventory"),
    ]);

    return NextResponse.json({ success: true, analytics, codes });
  } catch (error: any) {
    console.error("Error fetching warehouse QR data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch warehouse QR data",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "warehouse",
  featureId: "warehouse.qr",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

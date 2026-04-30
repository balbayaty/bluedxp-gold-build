/**
 * Dangerous Goods Validation API
 * IATA DGR Compliance Checking
 */

import { NextRequest, NextResponse } from "next/server";
import { airFreightService } from "@/lib/services/transportation/modes/airFreightService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { unNumber, hazardClass, shipment } = body;
    const tenantId = request.headers.get("x-tenant-id") || "default";

    // Create shipment with hazmat info
    const shipmentWithHazmat: any = {
      ...shipment,
      hazmat: {
        isHazmat: true,
        unNumber,
        hazardClass,
        properShippingName: "", // Would lookup from UN database
        packingGroup: "II", // Would determine from UN number
      },
    };

    const validation = await airFreightService.validateDangerousGoods(
      shipmentWithHazmat,
      tenantId,
    );

    return NextResponse.json(validation);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Validation failed" },
      { status: 500 },
    );
  }
}

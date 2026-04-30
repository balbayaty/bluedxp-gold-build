/**
 * Volumetric Weight Calculation API
 * IATA Standard: (L × W × H in cm) / 6000
 */

import { NextRequest, NextResponse } from "next/server";
import { airFreightService } from "@/lib/services/transportation/modes/airFreightService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    // Create mock shipment for calculation
    const mockShipment: any = {
      items: items.map((item: any) => ({
        ...item,
        dimensions: {
          length: item.length,
          width: item.width,
          height: item.height,
          unit: "CM",
        },
      })),
      totalWeight: items.reduce(
        (sum: number, item: any) => sum + item.weight * item.quantity,
        0,
      ),
      totalVolume: items.reduce(
        (sum: number, item: any) =>
          sum +
          (item.length * item.width * item.height * item.quantity) / 1000000,
        0,
      ),
    };

    const result =
      await airFreightService.calculateVolumetricWeight(mockShipment);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Calculation failed" },
      { status: 500 },
    );
  }
}

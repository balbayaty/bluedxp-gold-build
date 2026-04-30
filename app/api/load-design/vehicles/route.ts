/**
 * Vehicle Specifications API
 *
 * GET /api/load-design/vehicles
 *
 * Get all vehicle specifications
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllVehicleSpecifications,
  getVehicleSpecsByCategory,
} from "@/lib/services/load-design/vehicleSpecifications";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as
      | "TRUCK"
      | "CONTAINER"
      | "ULD"
      | "RAIL"
      | null;

    if (category) {
      const specs = getVehicleSpecsByCategory(category);
      return NextResponse.json({ vehicles: specs }, { status: 200 });
    }

    const allSpecs = getAllVehicleSpecifications();
    const vehicles = Array.from(allSpecs.values());

    return NextResponse.json({ vehicles }, { status: 200 });
  } catch (error: any) {
    console.error("Get vehicles error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get vehicles" },
      { status: 500 },
    );
  }
}

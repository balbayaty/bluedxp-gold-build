/**
 * Flight Search API
 * Search available flights for air freight
 */

import { NextRequest, NextResponse } from "next/server";
import { airFreightService } from "@/lib/services/transportation/modes/airFreightService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, date, weight, volume } = body;
    const tenantId = request.headers.get("x-tenant-id") || "default";

    const flights = await airFreightService.searchFlights({
      origin: origin.airportCode || origin.address?.city,
      destination: destination.airportCode || destination.address?.city,
      date: new Date(date || Date.now()),
      weight: weight || 0,
      volume: volume || 0,
      tenantId,
    });

    return NextResponse.json(flights);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 },
    );
  }
}

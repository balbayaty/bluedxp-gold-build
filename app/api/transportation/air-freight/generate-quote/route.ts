/**
 * Air Freight Quote Generation API
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipment, flight } = body;

    // Calculate pricing
    const baseRate = flight.price || 1200;
    const fuelSurcharge = baseRate * 0.15; // 15% fuel surcharge
    const securityFee = 50;
    const handling = 100;
    const total = baseRate + fuelSurcharge + securityFee + handling;

    const quote = {
      baseRate,
      fuelSurcharge,
      securityFee,
      handling,
      total,
      currency: "USD",
      validUntil: new Date(Date.now() + 7 * 24 * 3600000),
    };

    return NextResponse.json(quote);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Quote generation failed",
      },
      { status: 500 },
    );
  }
}

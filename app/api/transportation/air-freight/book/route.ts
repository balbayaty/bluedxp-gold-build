/**
 * Air Freight Booking API
 *
 * Handles complete air freight booking workflow:
 * - AWB generation
 * - Flight booking
 * - Dangerous goods validation
 * - Document generation
 * - State machine transition
 *
 * USES: Air Freight Service + State Machine
 */

import { NextRequest, NextResponse } from "next/server";
import { airFreightService } from "@/lib/services/transportation/modes/airFreightService";
import { shipmentStateMachine } from "@/lib/services/transportation/stateMachine/shipmentStateMachine";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import type { Shipment } from "@/types/tms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipment, flight, quote } = body;
    const tenantId = request.headers.get("x-tenant-id") || "default";
    const userId = request.headers.get("x-user-id") || "system";

    // 1. Book flight with carrier
    const booking = await airFreightService.bookAirFreight({
      shipment: shipment as Shipment,
      flight,
      tenantId,
    });

    // 2. Update shipment with booking details
    const updatedShipment = booking.awb.shipment as any;
    updatedShipment.bookingNumber = booking.bookingReference;
    updatedShipment.confirmationNumber = booking.bookingReference;
    updatedShipment.awbNumber = booking.awb.awbNumber;
    updatedShipment.freightCharges = {
      baseRate: quote.baseRate || 0,
      fuelSurcharge: quote.fuelSurcharge || 0,
      subtotal: quote.total || 0,
      taxes: 0,
      total: quote.total || 0,
      currency: "USD",
    };

    // 3. Transition to BOOKED state (triggers all automations)
    const transitionResult = await shipmentStateMachine.transition(
      updatedShipment as Shipment,
      "BOOKED",
      { tenantId, userId },
    );

    if (!transitionResult.success) {
      return NextResponse.json(
        { error: "State transition failed", details: transitionResult.errors },
        { status: 400 },
      );
    }

    // 4. Save to database
    await transportationDatabaseAdapterInstance.storeShipment(
      transitionResult.shipment as Shipment,
      { tenantId, createdBy: userId },
    );

    return NextResponse.json({
      confirmed: true,
      shipment: transitionResult.shipment,
      awb: booking.awb,
      booking: booking.bookingReference,
      automationsExecuted: transitionResult.automationsExecuted,
    });
  } catch (error) {
    console.error("Air freight booking error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 500 },
    );
  }
}

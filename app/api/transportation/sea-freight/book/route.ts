/**
 * Sea Freight Booking API
 * Handles FCL and LCL bookings
 */

import { NextRequest, NextResponse } from "next/server";
import { seaFreightService } from "@/lib/services/transportation/modes/seaFreightService";
import { shipmentStateMachine } from "@/lib/services/transportation/stateMachine/shipmentStateMachine";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import type { Shipment } from "@/types/tms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipment, containerType, containerCount, shippingLine } = body;
    const tenantId = request.headers.get("x-tenant-id") || "default";
    const userId = request.headers.get("x-user-id") || "system";

    // Book FCL container
    const booking = await seaFreightService.bookFCLContainer({
      shipment: shipment as Shipment,
      containerType,
      containerCount,
      shippingLine,
      portOfLoading: shipment.origin,
      portOfDischarge: shipment.destination,
      tenantId,
    });

    // Transition to BOOKED state
    const transitionResult = await shipmentStateMachine.transition(
      shipment as Shipment,
      "BOOKED",
      { tenantId, userId },
    );

    if (!transitionResult.success) {
      return NextResponse.json(
        { error: "State transition failed", details: transitionResult.errors },
        { status: 400 },
      );
    }

    // Save to database
    await transportationDatabaseAdapterInstance.storeShipment(
      transitionResult.shipment as Shipment,
      { tenantId, createdBy: userId },
    );

    return NextResponse.json({
      confirmed: true,
      shipment: transitionResult.shipment,
      booking,
      automationsExecuted: transitionResult.automationsExecuted,
    });
  } catch (error) {
    console.error("Sea freight booking error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 500 },
    );
  }
}

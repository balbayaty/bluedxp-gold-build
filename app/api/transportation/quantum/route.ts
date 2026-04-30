/**
 * Quantum Transportation API
 *
 * Get quantum state, collapse state, and quantum state history
 */

import { NextRequest, NextResponse } from "next/server";
import { schrodingersTruckService } from "@/lib/services/schrodingers-truck";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const searchParams = request.nextUrl.searchParams;
    const shipmentId = searchParams.get("shipmentId");
    const action = searchParams.get("action");

    if (action === "history" && shipmentId) {
      const history =
        await schrodingersTruckService.getQuantumStateHistory(shipmentId);
      return NextResponse.json({ history });
    }

    if (shipmentId) {
      const quantumState =
        await schrodingersTruckService.getQuantumState(shipmentId);
      if (!quantumState) {
        return NextResponse.json(
          { error: "Quantum state not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(quantumState);
    }

    // List all quantum states for tenant
    const allStates =
      await schrodingersTruckService.getAllQuantumStates(tenantId);
    return NextResponse.json({ states: allStates });
  } catch (error) {
    console.error("Error getting quantum state:", error);
    return NextResponse.json(
      {
        error: "Failed to get quantum state",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function postHandler(
  request: NextRequest,
  context: { tenantId?: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const { action, shipmentId, trigger, data } = body;

    if (action === "collapse" && shipmentId && trigger) {
      const collapsed = await schrodingersTruckService.collapseQuantumState(
        shipmentId,
        trigger,
        data || {},
        { tenantId } as any,
      );
      return NextResponse.json(collapsed);
    }

    if (action === "initialize" && shipmentId) {
      // Get shipment from shipments API
      const shipmentRes = await fetch(
        `${request.nextUrl.origin}/api/transportation/shipments/${shipmentId}`,
      );
      if (!shipmentRes.ok) {
        return NextResponse.json(
          { error: "Shipment not found" },
          { status: 404 },
        );
      }
      const shipment = await shipmentRes.json();

      const quantumState =
        await schrodingersTruckService.initializeQuantumState(
          shipment,
          body.driver,
          body.route,
          body.cargo,
        );
      return NextResponse.json(quantumState, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error processing quantum action:", error);
    return NextResponse.json(
      {
        error: "Failed to process quantum action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(getHandler, {
  featureId: "quantum",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withTransportationAPI(postHandler, {
  featureId: "quantum",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

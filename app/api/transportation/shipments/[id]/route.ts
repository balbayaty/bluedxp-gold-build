/**
 * Individual Shipment API
 */

import { NextRequest, NextResponse } from "next/server";
import type { Shipment } from "@/types/tms";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";

async function getHandler(
  request: NextRequest,
  context: { tenantId?: string },
  params: { id: string },
) {
  try {
    const tenantId = context.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const shipment = await transportationDatabaseAdapterInstance.getShipment(
      tenantId,
      params.id,
    );

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error("Error fetching shipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipment" },
      { status: 500 },
    );
  }
}

async function putHandler(
  request: NextRequest,
  context: { tenantId?: string; userId?: string },
  params: { id: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = await request.json();
    const existing = await transportationDatabaseAdapterInstance.getShipment(
      tenantId,
      params.id,
    );

    if (!existing) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    const updatedShipment: Shipment = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    await transportationDatabaseAdapterInstance.storeShipment(updatedShipment, {
      tenantId,
      createdBy: userId,
    });

    return NextResponse.json(updatedShipment);
  } catch (error) {
    console.error("Error updating shipment:", error);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 },
    );
  }
}

async function deleteHandler(
  _request: NextRequest,
  context: { tenantId?: string; userId?: string },
  params: { id: string },
) {
  try {
    const tenantId = context.tenantId;
    const userId = context.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const existing = await transportationDatabaseAdapterInstance.getShipment(
      tenantId,
      params.id,
    );
    if (!existing) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    // Soft-cancel (keeps audit trail; real delete can be implemented in DB adapter later)
    const cancelled: Shipment = {
      ...existing,
      status: "CANCELLED",
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };
    await transportationDatabaseAdapterInstance.storeShipment(cancelled, {
      tenantId,
      createdBy: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shipment:", error);
    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 },
    );
  }
}

export const GET = withTransportationAPI(
  async (req: NextRequest, ctx: any) => {
    const id = req.nextUrl.pathname.split("/").pop() || "";
    return getHandler(req, ctx, { id });
  },
  {
    featureId: "shipments",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);

export const PUT = withTransportationAPI(
  async (req: NextRequest, ctx: any) => {
    const id = req.nextUrl.pathname.split("/").pop() || "";
    return putHandler(req, ctx, { id });
  },
  {
    featureId: "shipments",
    action: "write",
    requireAuth: true,
    rateLimit: true,
  },
);

export const DELETE = withTransportationAPI(
  async (req: NextRequest, ctx: any) => {
    const id = req.nextUrl.pathname.split("/").pop() || "";
    return deleteHandler(req, ctx, { id });
  },
  {
    featureId: "shipments",
    action: "delete",
    requireAuth: true,
    rateLimit: true,
  },
);

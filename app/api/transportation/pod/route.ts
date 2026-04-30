/**
 * Transportation Proof of Delivery (POD) API
 *
 * Tenant-safe, RBAC protected (via withTransportationAPI).
 * Provides POD records derived from delivered shipments.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";

type PodVM = {
  id: string;
  podNumber: string;
  trackingNumber: string;
  shipmentNumber: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: string;
  deliveredBy: string;
  receivedBy: string;
  signature?: string;
  photo?: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  deliveryNotes?: string;
  customerConfirmation: "PENDING" | "CONFIRMED" | "REJECTED";
  itemsDelivered: number;
  itemsReceived: number;
  damageReport?: {
    hasDamage: boolean;
    damageType?: string;
    damageDescription?: string;
    photos?: string[];
  };
  createdAt: string;
};

function safeIso(d: unknown): string {
  const dt = d instanceof Date ? d : new Date(String(d || Date.now()));
  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

async function handler(_req: NextRequest, context: { tenantId?: string }) {
  const tenantId = context.tenantId;
  if (!tenantId)
    return NextResponse.json(
      { error: "Tenant context required" },
      { status: 400 },
    );

  const shipments = await transportationDatabaseAdapterInstance.listShipments({
    tenantId,
    limit: 1000,
    offset: 0,
  });

  const delivered = shipments.filter((s) => String(s.status) === "DELIVERED");

  const pods: PodVM[] = delivered.map((s, idx) => {
    const deliveredAt = safeIso(
      s.actualDelivery || s.estimatedDelivery || s.updatedAt || s.createdAt,
    );
    const dt = new Date(deliveredAt);
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");

    return {
      id: `POD-${s.id}-${idx}`,
      podNumber: `POD-${String(idx + 1).padStart(6, "0")}`,
      trackingNumber: s.trackingNumber || "",
      shipmentNumber: s.shipmentNumber || s.id,
      soNumber: s.referenceNumber || "",
      customerNumber: s.customerReference || "",
      customerName: "",
      deliveryDate: deliveredAt,
      deliveryTime: `${hh}:${mm}`,
      deliveryAddress:
        s.destination?.address?.street ||
        s.destination?.address?.city ||
        "Delivery Address",
      deliveredBy: "",
      receivedBy: "",
      status: "COMPLETED",
      customerConfirmation: "PENDING",
      itemsDelivered: s.items?.length || 0,
      itemsReceived: s.items?.length || 0,
      createdAt: deliveredAt,
    };
  });

  return NextResponse.json(pods);
}

export const GET = withTransportationAPI(handler, {
  featureId: "pod",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

/**
 * Transportation Freight API
 *
 * Tenant-safe, RBAC protected (via withTransportationAPI).
 * Provides freight records for the `/freight` page.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";

type FreightRecordVM = {
  id: string;
  freightNumber: string;
  shipmentNumber: string;
  carrier: string;
  destination: string;
  freightType: string;
  paymentStatus: string;
  totalFreight: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
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
    limit: 500,
    offset: 0,
  });

  const records: FreightRecordVM[] = shipments.map((s, idx) => {
    const base = (s.route?.distance || 100) * 2.5 + (s.totalWeight || 0) * 0.01;
    const totalFreight = Number(base.toFixed(2));
    const invoiceDate = safeIso(s.createdAt);
    const due = new Date(invoiceDate);
    due.setDate(due.getDate() + 14);

    return {
      id: `FRT-${s.id}-${idx}`,
      freightNumber: `FREIGHT-${String(idx + 1).padStart(6, "0")}`,
      shipmentNumber: s.shipmentNumber || s.id,
      carrier: s.carrierName || s.carrierId || "UNKNOWN",
      destination:
        s.destination?.address?.city ||
        s.destination?.address?.country ||
        "Destination",
      freightType: "STANDARD",
      paymentStatus: "PENDING",
      totalFreight,
      currency: s.currency || "SAR",
      invoiceDate,
      dueDate: due.toISOString(),
    };
  });

  return NextResponse.json(records);
}

export const GET = withTransportationAPI(handler, {
  featureId: "freight",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

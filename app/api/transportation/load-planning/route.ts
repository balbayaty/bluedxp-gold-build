/**
 * Transportation Load Planning API
 *
 * Tenant-safe, RBAC protected (via withTransportationAPI).
 * Provides load plan records for the `/load-planning` page derived from shipments.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";

type LoadPlanVM = {
  id: string;
  loadNumber: string;
  truckNumber: string;
  truckType: string;
  driverName: string;
  origin: string;
  destination: string;
  plannedDate: string;
  status: string;
  totalWeight: number;
  totalVolume: number;
  truckCapacity: number;
  volumeCapacity: number;
  weightUtilization: number;
  volumeUtilization: number;
  totalItems: number;
  totalOrders: number;
  estimatedDistance: number;
  estimatedDuration: number;
  routeOptimized: boolean;
  requiresSpecialHandling: boolean;
  temperatureControlled: boolean;
  createdAt: string;
};

function safeIso(d: unknown): string {
  const dt = d instanceof Date ? d : new Date(String(d || Date.now()));
  return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

  // Group shipments into loads (simple heuristic: 5 shipments per load)
  const chunkSize = 5;
  const loads: LoadPlanVM[] = [];

  for (let i = 0; i < shipments.length; i += chunkSize) {
    const chunk = shipments.slice(i, i + chunkSize);
    const totalWeight = chunk.reduce((sum, s) => sum + (s.totalWeight || 0), 0);
    const totalVolume = chunk.reduce((sum, s) => sum + (s.totalVolume || 0), 0);
    const truckCapacity = 25000;
    const volumeCapacity = 80;
    const weightUtilization = clamp(
      (totalWeight / truckCapacity) * 100,
      0,
      100,
    );
    const volumeUtilization = clamp(
      (totalVolume / volumeCapacity) * 100,
      0,
      100,
    );

    const createdAt = safeIso(chunk[0]?.createdAt);
    const plannedDate = safeIso(Date.now() + 24 * 60 * 60 * 1000);

    loads.push({
      id: `LOAD-${tenantId}-${i / chunkSize + 1}`,
      loadNumber: `LOAD-${String(i / chunkSize + 1).padStart(6, "0")}`,
      truckNumber: `TRUCK-${String((i / chunkSize + 1) * 7).padStart(4, "0")}`,
      truckType: "DRY_VAN",
      driverName: "",
      origin: chunk[0]?.origin?.address?.city || "Warehouse",
      destination: chunk[0]?.destination?.address?.city || "Customer",
      plannedDate,
      status: "PLANNED",
      totalWeight: Number(totalWeight.toFixed(2)),
      totalVolume: Number(totalVolume.toFixed(2)),
      truckCapacity,
      volumeCapacity,
      weightUtilization: Number(weightUtilization.toFixed(2)),
      volumeUtilization: Number(volumeUtilization.toFixed(2)),
      totalItems: chunk.reduce((sum, s) => sum + (s.items?.length || 0), 0),
      totalOrders: chunk.length,
      estimatedDistance: chunk.reduce(
        (sum, s) => sum + (s.route?.distance || 0),
        0,
      ),
      estimatedDuration: Math.round(
        chunk.reduce((sum, s) => sum + (s.transitTime?.estimated || 0), 0) /
          Math.max(1, chunk.length),
      ),
      routeOptimized: true,
      requiresSpecialHandling: chunk.some((s) => !!s.specialHandling),
      temperatureControlled: chunk.some((s) => !!s.temperatureControl),
      createdAt,
    });
  }

  return NextResponse.json(loads);
}

export const GET = withTransportationAPI(handler, {
  featureId: "load-planning",
  action: "read_only",
  requireAuth: true,
  rateLimit: true,
});

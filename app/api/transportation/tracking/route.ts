/**
 * Transportation Tracking API
 *
 * Returns a tracking-friendly view model for shipments.
 * Tenant context is enforced via withTransportationAPI -> API Gateway -> apiAuthMiddleware.
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { transportationDatabaseAdapterInstance } from "@/lib/services/transportation/database/transportationDatabaseAdapter";
import type { Shipment } from "@/types/tms";
import { evidenceService } from "@/lib/services/evidence";
import { eventBus } from "@/lib/services/event-store";
import { createEvent } from "@/lib/services/event-store/utils";
import { isProd } from "@/lib/services/transportation/strictMode";

type TrackingShipmentVM = {
  id: string;
  trackingNumber: string;
  shipmentNumber: string;
  soNumber: string;
  customerNumber: string;
  customerName: string;
  carrierCode: string;
  carrierName: string;
  status: string;
  pickupDate: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  origin: string;
  destination: string;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
    timestamp: string;
  };
  destinationLocation: { lat: number; lng: number; address: string };
  distance: number;
  estimatedTimeRemaining: number;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  exceptionType?: string | null;
  exceptionDescription?: string | null;
  podStatus?: "PENDING" | "COMPLETED";
  podDate?: string | null;
  totalWeight: number;
  totalVolume: number;
  totalItems: number;
  createdAt: string;
  lastUpdate: string;
};

function safeIso(d: unknown): string | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(String(d));
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

function locToLabel(s: Shipment, which: "origin" | "destination"): string {
  const loc = which === "origin" ? (s as any).origin : (s as any).destination;
  const city = loc?.address?.city;
  const country = loc?.address?.country || loc?.address?.countryCode;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  return which === "origin" ? "Origin" : "Destination";
}

function computePseudoLatLng(seed: string): { lat: number; lng: number } {
  // Stable-ish pseudo coords for UI maps when real telemetry is not yet integrated.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const lat = 24 + (h % 6000) / 1000; // ~24..30
  const lng = 38 + ((h / 6000) % 6000) / 1000; // ~38..44
  return { lat, lng };
}

function readLatLngFromShipment(
  loc: unknown,
): { lat: number; lng: number } | null {
  if (!loc || typeof loc !== "object") return null;
  const o = loc as Record<string, unknown>;
  const lat = o.lat ?? (o.latitude as unknown);
  const lng = o.lng ?? (o.lon as unknown) ?? (o.longitude as unknown);
  const nLat =
    typeof lat === "number" ? lat : typeof lat === "string" ? Number(lat) : NaN;
  const nLng =
    typeof lng === "number" ? lng : typeof lng === "string" ? Number(lng) : NaN;
  if (Number.isFinite(nLat) && Number.isFinite(nLng))
    return { lat: nLat, lng: nLng };
  return null;
}

function toTrackingVM(s: Shipment): TrackingShipmentVM {
  const originLabel = locToLabel(s, "origin");
  const destinationLabel = locToLabel(s, "destination");
  const curStored = readLatLngFromShipment((s as any).currentLocation);
  const destStored =
    readLatLngFromShipment((s as any).destinationLocation) ||
    readLatLngFromShipment((s as any).destination?.location) ||
    readLatLngFromShipment((s as any).destination?.geo);

  const dest =
    destStored ||
    (isProd() ? { lat: 0, lng: 0 } : computePseudoLatLng(`${s.id}-dest`));
  const cur =
    curStored ||
    (isProd() ? { lat: 0, lng: 0 } : computePseudoLatLng(`${s.id}-cur`));

  const trackingNumber =
    (s as any).trackingNumber ||
    `TRK-${String((s as any).shipmentNumber || s.id).slice(-8)}`;
  const shipmentNumber =
    (s as any).shipmentNumber || `SH-${String(s.id).slice(-8)}`;

  const createdAt = safeIso((s as any).createdAt) || new Date().toISOString();
  const updatedAt = safeIso((s as any).updatedAt) || createdAt;

  return {
    id: String(s.id),
    trackingNumber,
    shipmentNumber,
    soNumber: String((s as any).soNumber || ""),
    customerNumber: String((s as any).customerNumber || ""),
    customerName: String((s as any).customerName || ""),
    carrierCode: String((s as any).carrierId || (s as any).carrierCode || ""),
    carrierName: String((s as any).carrierName || ""),
    status: String((s as any).status || "CREATED"),
    pickupDate: safeIso((s as any).pickupDate),
    estimatedDelivery: safeIso((s as any).estimatedDelivery),
    actualDelivery: safeIso((s as any).actualDelivery),
    origin: originLabel,
    destination: destinationLabel,
    currentLocation: {
      lat: cur.lat,
      lng: cur.lng,
      address: String(
        (s as any).currentLocation?.address ||
          originLabel ||
          "Location not reported",
      ),
      timestamp: updatedAt,
    },
    destinationLocation: {
      lat: dest.lat,
      lng: dest.lng,
      address: destinationLabel,
    },
    distance: 0,
    estimatedTimeRemaining: 0,
    driverName: String((s as any).driverName || ""),
    driverPhone: String((s as any).driverPhone || ""),
    vehicleNumber: String((s as any).vehicleNumber || ""),
    exceptionType: (s as any).exceptionType || null,
    exceptionDescription: (s as any).exceptionDescription || null,
    podStatus: (s as any).podStatus,
    podDate: safeIso((s as any).podDate),
    totalWeight: Number((s as any).totalWeight || 0),
    totalVolume: Number((s as any).totalVolume || 0),
    totalItems: Number((s as any).totalItems || 0),
    createdAt,
    lastUpdate: updatedAt,
  };
}

export const GET = withTransportationAPI(
  async (req: NextRequest, ctx: { tenantId?: string }) => {
    const tenantId = ctx.tenantId;
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") || undefined;
    const carrierId = sp.get("carrierId") || undefined;
    const limit = Math.min(500, Math.max(1, Number(sp.get("limit") || 200)));
    const offset = Math.max(0, Number(sp.get("offset") || 0));

    const shipments = await transportationDatabaseAdapterInstance.listShipments(
      { tenantId, status, carrierId, limit, offset },
    );
    return NextResponse.json(shipments.map(toTrackingVM));
  },
  {
    featureId: "tracking",
    action: "read_only",
    requireAuth: true,
    rateLimit: true,
  },
);

export const POST = withTransportationAPI(
  async (req: NextRequest, ctx: { tenantId?: string; userId?: string }) => {
    const tenantId = ctx.tenantId;
    const userId = ctx.userId || "api-user";
    if (!tenantId)
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );

    const body = (await req.json().catch(() => null)) as {
      shipmentId?: string;
      lat?: number;
      lng?: number;
      address?: string;
      timestamp?: string;
    } | null;
    if (!body)
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    if (!body.shipmentId)
      return NextResponse.json(
        { error: "shipmentId is required" },
        { status: 400 },
      );

    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "lat and lng must be valid numbers" },
        { status: 400 },
      );
    }

    const shipment = await transportationDatabaseAdapterInstance.getShipment(
      tenantId,
      String(body.shipmentId),
    );
    if (!shipment)
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );

    const nowIso = new Date().toISOString();
    const updated = {
      ...shipment,
      currentLocation: {
        lat,
        lng,
        address: body.address || "",
        timestamp: body.timestamp || nowIso,
      },
      updatedAt: nowIso,
      updatedBy: userId,
    } as unknown as Shipment;

    await transportationDatabaseAdapterInstance.storeShipment(updated, {
      tenantId,
      createdBy: userId,
    });

    const evidence = await evidenceService.create({
      tenantId,
      type: "event",
      category: "operational",
      title: `Tracking update: ${String(body.shipmentId)}`,
      description:
        "Shipment tracking location updated via Transportation Tracking API",
      content: JSON.stringify(
        {
          shipmentId: body.shipmentId,
          lat,
          lng,
          address: body.address || "",
          timestamp: body.timestamp || nowIso,
        },
        null,
        2,
      ),
      createdBy: userId,
      metadata: {
        source: "transportation-api",
        capturedAt: nowIso,
        capturedMethod: "api",
      },
      relatedEntities: [
        {
          entityId: String(body.shipmentId),
          entityType: "shipment",
          relationship: "subject",
          addedAt: nowIso,
        },
      ],
      tags: ["tms", "transportation", "tracking"],
    } as any);

    await eventBus.publish(
      createEvent(
        "transportation.tracking.location.updated",
        String(body.shipmentId),
        "Shipment",
        {
          shipmentId: body.shipmentId,
          lat,
          lng,
          address: body.address || "",
          evidenceId: evidence.id,
        },
        1,
        { tenantId, userId },
      ),
    );

    return NextResponse.json({ ok: true });
  },
  {
    featureId: "tracking",
    action: "write",
    requireAuth: true,
    rateLimit: true,
  },
);

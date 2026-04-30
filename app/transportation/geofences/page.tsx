/**
 * Geofence System - Complete UI
 *
 * Full-featured geofence management with:
 * - Zone management (Circle & Polygon)
 * - Interactive map view
 * - Event history
 * - Dwell time tracking
 * - Test detection
 * - Operating hours & contacts
 *
 * Based on: BlueDXP_FINAL_COMPLETE_V5.md Appendix D
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTemplate from "@/components/PageTemplate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import MapView from "@/components/maps/MapView";
import GeofenceAnalyticsDashboard from "@/components/geofence/GeofenceAnalyticsDashboard";
import GeofenceRealtimeUpdates from "@/components/geofence/GeofenceRealtimeUpdates";
import { GeofenceTooltip } from "@/components/geofence/tooltips/GeofenceTooltips";
import LocationIntelligenceInput from "@/components/geofence/LocationIntelligenceInput";
import type { GeofenceEvent, GeofenceZone } from "@/lib/services/geofence";
import type { LocationIntelligenceResult } from "@/lib/services/geofence/ai/locationIntelligenceService";

type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiError = { error: string; message?: string };

type GeofenceZoneDTO = Omit<GeofenceZone, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type GeofenceEventDTO = Omit<GeofenceEvent, "timestamp"> & {
  timestamp: string;
};

function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  if (!value || typeof value !== "object") return false;
  return (value as { success?: unknown }).success === true;
}

function asNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatZoneGeometry(zone: GeofenceZoneDTO): string {
  if (zone.geometry.type === "CIRCLE") {
    const coords = zone.geometry.coordinates as {
      center: { lat: number; lng: number };
      radius: number;
    };
    return `Circle: (${coords.center.lat.toFixed(4)}, ${coords.center.lng.toFixed(4)}) • ${coords.radius}m radius`;
  }
  const coords = zone.geometry.coordinates as number[][];
  return `Polygon: ${Array.isArray(coords) ? coords.length : 0} points`;
}

// Professional zone type colors with comprehensive coverage
const ZONE_TYPE_COLORS: Record<string, string> = {
  // Origin & Destination
  ORIGIN_FACILITY: "#3b82f6",
  DESTINATION_FACILITY: "#10b981",
  WAREHOUSE: "#3b82f6",
  CUSTOMER_SITE: "#10b981",

  // Border & Customs
  BORDER_ENTRY_POINT: "#ef4444",
  BORDER_EXIT_POINT: "#f97316",
  CUSTOMS_CLEARANCE_FACILITY: "#dc2626",
  CUSTOMS_INSPECTION_AREA: "#b91c1c",
  NO_MANS_LAND: "#991b1b",
  BORDER_CROSSING_COMPLEX: "#7f1d1d",

  // Regulatory & Compliance
  REGULATORY_CHECKPOINT: "#f59e0b",
  INSPECTION_FACILITY: "#d97706",
  DOCUMENTATION_CENTER: "#b45309",
  COMPLIANCE_VERIFICATION_POINT: "#92400e",

  // Transportation Infrastructure
  PORT_TERMINAL: "#06b6d4",
  AIRPORT_CARGO_TERMINAL: "#0891b2",
  RAILWAY_TERMINAL: "#0e7490",
  DRY_PORT: "#155e75",
  LOGISTICS_HUB: "#164e63",

  // Route Infrastructure
  HIGHWAY_TOLL_PLAZA: "#8b5cf6",
  WEIGH_STATION: "#7c3aed",
  REST_AREA: "#6d28d9",
  FUEL_STATION: "#ec4899",
  SERVICE_AREA: "#db2777",

  // Security & Restricted
  SECURITY_CHECKPOINT: "#f97316",
  RESTRICTED_AREA: "#ea580c",
  QUARANTINE_ZONE: "#c2410c",
  HAZMAT_HANDLING_AREA: "#9a3412",

  // Administrative
  CITY_LIMIT: "#14b8a6",
  PROVINCE_BOUNDARY: "#0d9488",
  COUNTRY_BOUNDARY: "#0f766e",
  FREE_ZONE: "#115e59",

  // Legacy/Default
  CHECKPOINT: "#f59e0b",
  BORDER_CROSSING: "#ef4444",
  CUSTOM: "#6b7280",
};

const EVENT_TYPE_LABELS: Record<
  GeofenceEvent["eventType"],
  { label: string; color: string; icon: string }
> = {
  ZONE_ENTRY: { label: "Zone Entry", color: "text-green-400", icon: "→" },
  ZONE_EXIT: { label: "Zone Exit", color: "text-blue-400", icon: "←" },
  DWELL_TIME_WARNING: {
    label: "Dwell Warning",
    color: "text-yellow-400",
    icon: "⚠",
  },
  DWELL_TIME_EXCEEDED: {
    label: "Dwell Exceeded",
    color: "text-red-400",
    icon: "🚨",
  },
  ROUTE_DEVIATION: {
    label: "Route Deviation",
    color: "text-orange-400",
    icon: "↗",
  },
  SPEED_VIOLATION: {
    label: "Speed Violation",
    color: "text-red-500",
    icon: "⚡",
  },
  UNEXPECTED_STOP: {
    label: "Unexpected Stop",
    color: "text-purple-400",
    icon: "⏸",
  },
};

function GeofenceSystemPageContent() {
  const [tenantId, setTenantId] = useState("default");
  const [activeTab, setActiveTab] = useState<
    "zones" | "map" | "events" | "dwell" | "test" | "analytics"
  >("zones");

  // Zones
  const [loadingZones, setLoadingZones] = useState(false);
  const [zones, setZones] = useState<GeofenceZoneDTO[]>([]);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<GeofenceZoneDTO | null>(
    null,
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [geometryType, setGeometryType] = useState<"CIRCLE" | "POLYGON">(
    "CIRCLE",
  );

  // Create zone form
  const [zoneName, setZoneName] = useState("");
  const [zoneType, setZoneType] = useState<GeofenceZone["type"]>("WAREHOUSE");
  const [circleLat, setCircleLat] = useState("24.7136");
  const [circleLng, setCircleLng] = useState("46.6753");
  const [circleRadius, setCircleRadius] = useState("250");
  const [polygonCoords, setPolygonCoords] = useState(
    "24.7136,46.6753\n24.7140,46.6760\n24.7145,46.6755\n24.7140,46.6750",
  );
  const [expectedDwellTime, setExpectedDwellTime] = useState("30");
  const [maxDwellTime, setMaxDwellTime] = useState("90");
  const [creatingZone, setCreatingZone] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Events
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [events, setEvents] = useState<GeofenceEventDTO[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<
    GeofenceEvent["eventType"] | "ALL"
  >("ALL");

  // Dwell tracking
  const [dwellTracking, setDwellTracking] = useState<
    Array<{
      shipmentId: string;
      zoneId: string;
      zoneName: string;
      entryTime: string;
      currentDwell: number;
      status: string;
    }>
  >([]);

  // Test detection
  const [testLat, setTestLat] = useState("24.7136");
  const [testLng, setTestLng] = useState("46.6753");
  const [testShipmentId, setTestShipmentId] = useState("shipment-001");
  const [testVehicleId, setTestVehicleId] = useState("vehicle-001");
  const [testDriverName, setTestDriverName] = useState("Driver One");
  const [detecting, setDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<GeofenceEventDTO | null>(
    null,
  );
  const [detectError, setDetectError] = useState<string | null>(null);

  const zonesCount = useMemo(() => zones.length, [zones]);
  const enabledZones = useMemo(() => zones.filter((z) => z.enabled), [zones]);
  const filteredEvents = useMemo(() => {
    if (eventFilter === "ALL") return events;
    return events.filter((e) => e.eventType === eventFilter);
  }, [events, eventFilter]);

  const loadZones = useCallback(async () => {
    setLoadingZones(true);
    setZonesError(null);
    try {
      const res = await fetch(
        `/api/geofence/zones?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        const err =
          (json as ApiError | null)?.error || `Request failed (${res.status})`;
        throw new Error(err);
      }
      if (
        !isApiSuccess<{ zones: GeofenceZoneDTO[]; totalCount: number }>(json)
      ) {
        throw new Error("Unexpected response from server");
      }
      setZones(json.data.zones);
    } catch (e) {
      setZonesError(e instanceof Error ? e.message : "Failed to load zones");
    } finally {
      setLoadingZones(false);
    }
  }, [tenantId]);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    setEventsError(null);
    try {
      // Events are emitted on geofence transitions; this view will populate once the projection endpoint is wired.
      setEvents([]);
    } catch (e) {
      setEventsError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadZones();
    void loadEvents();
  }, [loadZones, loadEvents]);

  const onCreateZone = useCallback(async () => {
    setCreateError(null);
    setCreatingZone(true);
    try {
      let geometry: GeofenceZone["geometry"];

      if (geometryType === "CIRCLE") {
        const lat = asNumber(circleLat);
        const lng = asNumber(circleLng);
        const radius = asNumber(circleRadius);
        if (lat === null || lng === null || radius === null) {
          throw new Error(
            "Latitude, longitude, and radius must be valid numbers",
          );
        }
        if (radius <= 0) {
          throw new Error("Radius must be greater than 0");
        }
        geometry = {
          type: "CIRCLE",
          coordinates: { center: { lat, lng }, radius },
        };
      } else {
        // Parse polygon coordinates
        const lines = polygonCoords
          .trim()
          .split("\n")
          .filter((l) => l.trim());
        const coords = lines.map((line) => {
          const parts = line.split(",").map((s) => s.trim());
          if (parts.length !== 2) throw new Error("Invalid coordinate format");
          const lat = asNumber(parts[0]);
          const lng = asNumber(parts[1]);
          if (lat === null || lng === null)
            throw new Error("Invalid coordinate values");
          return [lat, lng];
        });
        if (coords.length < 3) {
          throw new Error("Polygon must have at least 3 points");
        }
        geometry = {
          type: "POLYGON",
          coordinates: coords,
        };
      }

      const expectedDwell = asNumber(expectedDwellTime);
      const maxDwell = asNumber(maxDwellTime);

      const payload = {
        name: zoneName || "Unnamed Zone",
        type: zoneType,
        tenantId,
        enabled: true,
        geometry,
        metadata: {
          expectedDwellTime: expectedDwell || undefined,
          maxDwellTime: maxDwell || undefined,
          contacts: [],
        },
      };

      const res = await fetch("/api/geofence/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const err =
          (json as ApiError | null)?.error || `Request failed (${res.status})`;
        throw new Error(err);
      }
      if (!isApiSuccess<GeofenceZoneDTO>(json)) {
        throw new Error("Unexpected response from server");
      }

      await loadZones();
      setShowCreateForm(false);
      setZoneName("");
      setCircleLat("24.7136");
      setCircleLng("46.6753");
      setCircleRadius("250");
      setPolygonCoords(
        "24.7136,46.6753\n24.7140,46.6760\n24.7145,46.6755\n24.7140,46.6750",
      );
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create zone");
    } finally {
      setCreatingZone(false);
    }
  }, [
    circleLat,
    circleLng,
    circleRadius,
    expectedDwellTime,
    geometryType,
    loadZones,
    maxDwellTime,
    polygonCoords,
    tenantId,
    zoneName,
    zoneType,
  ]);

  const onDeleteZone = useCallback(
    async (zoneId: string) => {
      setZonesError(null);
      try {
        const res = await fetch(
          `/api/geofence/zones/${encodeURIComponent(zoneId)}?tenantId=${encodeURIComponent(tenantId)}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          },
        );
        const json: unknown = await res.json();
        if (!res.ok) {
          const err =
            (json as ApiError | null)?.error ||
            `Request failed (${res.status})`;
          throw new Error(err);
        }
        await loadZones();
      } catch (e) {
        setZonesError(e instanceof Error ? e.message : "Failed to delete zone");
      }
    },
    [loadZones, tenantId],
  );

  const onToggleZone = useCallback(
    async (zoneId: string, enabled: boolean) => {
      setZonesError(null);
      try {
        const res = await fetch(
          `/api/geofence/zones/${encodeURIComponent(zoneId)}?tenantId=${encodeURIComponent(tenantId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled: !enabled }),
          },
        );
        const json: unknown = await res.json();
        if (!res.ok) {
          const err =
            (json as ApiError | null)?.error ||
            `Request failed (${res.status})`;
          throw new Error(err);
        }
        await loadZones();
      } catch (e) {
        setZonesError(e instanceof Error ? e.message : "Failed to update zone");
      }
    },
    [loadZones, tenantId],
  );

  const onTestDetect = useCallback(async () => {
    setDetectError(null);
    setDetectResult(null);
    setDetecting(true);
    try {
      const lat = asNumber(testLat);
      const lng = asNumber(testLng);
      if (lat === null || lng === null) {
        throw new Error("Test latitude/longitude must be valid numbers");
      }

      const payload = {
        tenantId,
        shipmentId: testShipmentId,
        vehicleId: testVehicleId,
        driverName: testDriverName,
        location: { lat, lng },
      };

      const res = await fetch("/api/geofence/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const err =
          (json as ApiError | null)?.error || `Request failed (${res.status})`;
        throw new Error(err);
      }
      if (!isApiSuccess<GeofenceEventDTO | null>(json)) {
        throw new Error("Unexpected response from server");
      }
      setDetectResult(json.data);
      if (json.data) {
        await loadEvents(); // Refresh events if detection succeeded
      }
    } catch (e) {
      setDetectError(
        e instanceof Error ? e.message : "Failed to detect geofence event",
      );
    } finally {
      setDetecting(false);
    }
  }, [
    loadEvents,
    tenantId,
    testDriverName,
    testLat,
    testLng,
    testShipmentId,
    testVehicleId,
  ]);

  // Map markers from zones
  const mapMarkers = useMemo(() => {
    return enabledZones.map((zone) => {
      let center: { lat: number; lng: number };
      if (zone.geometry.type === "CIRCLE") {
        const coords = zone.geometry.coordinates as {
          center: { lat: number; lng: number };
          radius: number;
        };
        center = coords.center;
      } else {
        // Use first point of polygon as center
        const coords = zone.geometry.coordinates as number[][];
        center = { lat: coords[0]?.[0] || 0, lng: coords[0]?.[1] || 0 };
      }
      return {
        id: zone.id,
        location: {
          address: zone.name,
          city: "",
          country: "",
          coordinates: center,
        },
        label: zone.name.substring(0, 2).toUpperCase(),
        color: ZONE_TYPE_COLORS[zone.type] || "#6b7280",
        onClick: () => setSelectedZone(zone),
      };
    });
  }, [enabledZones]);

  const mapCenter = useMemo(() => {
    if (mapMarkers.length > 0) {
      return mapMarkers[0].location.coordinates;
    }
    return { lat: 24.7136, lng: 46.6753 }; // Default: Riyadh
  }, [mapMarkers]);

  return (
    <PageTemplate
      title="Geofence System"
      description="Zone Management & Entry/Exit Detection - Complete Implementation"
      icon="ri-map-pin-range-line"
    >
      <div className="space-y-6">
        {/* Header with Tenant Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">
                Geofence Management
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Manage zones, track events, and monitor dwell times. Tenant:{" "}
                <span className="font-mono text-gray-700 dark:text-gray-300">
                  {tenantId}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="tenantId"
              />
              <button
                onClick={() => void loadZones()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors text-sm"
                disabled={loadingZones}
              >
                {loadingZones ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 overflow-x-auto">
            {(
              ["zones", "map", "events", "dwell", "test", "analytics"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "zones" && zonesCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                    {zonesCount}
                  </span>
                )}
                {tab === "events" && events.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                    {events.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "zones" && (
            <motion.div
              key="zones"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Zones List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Zones</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {zonesCount} total • {enabledZones.length} enabled
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors text-sm"
                  >
                    {showCreateForm ? "Cancel" : "+ Create Zone"}
                  </button>
                </div>

                {zonesError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                    {zonesError}
                  </div>
                )}

                {/* Create Zone Form */}
                {showCreateForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                  >
                    <h4 className="font-semibold mb-4">Create New Zone</h4>
                    {createError && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                        {createError}
                      </div>
                    )}

                    {/* AI Location Intelligence */}
                    <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                      <LocationIntelligenceInput
                        onResult={(result: LocationIntelligenceResult) => {
                          // Auto-fill form from AI result
                          setZoneName(result.zoneDraft.name);
                          setZoneType(
                            result.zoneDraft.type as GeofenceZone["type"],
                          );
                          if (result.location.coordinates) {
                            setCircleLat(
                              result.location.coordinates.lat.toString(),
                            );
                            setCircleLng(
                              result.location.coordinates.lng.toString(),
                            );
                          }
                          if (
                            result.zoneDraft.suggestedMetadata.expectedDwellTime
                          ) {
                            setExpectedDwellTime(
                              result.zoneDraft.suggestedMetadata.expectedDwellTime.toString(),
                            );
                          }
                          if (result.zoneDraft.suggestedMetadata.maxDwellTime) {
                            setMaxDwellTime(
                              result.zoneDraft.suggestedMetadata.maxDwellTime.toString(),
                            );
                          }
                        }}
                        onError={(error) => setCreateError(error)}
                        tenantId={tenantId}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Zone Name
                          </label>
                          <input
                            value={zoneName}
                            onChange={(e) => setZoneName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Main Warehouse Gate"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Zone Type (Professional)
                          </label>
                          <select
                            value={zoneType}
                            onChange={(e) =>
                              setZoneType(
                                e.target.value as GeofenceZone["type"],
                              )
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <optgroup label="Origin & Destination">
                              <option value="ORIGIN_FACILITY">
                                🏭 Origin Facility (Shipper Plant)
                              </option>
                              <option value="DESTINATION_FACILITY">
                                🏢 Destination Facility (Delivery Location)
                              </option>
                              <option value="WAREHOUSE">
                                📦 Warehouse (Distribution Center)
                              </option>
                              <option value="CUSTOMER_SITE">
                                🏪 Customer Site (End Customer)
                              </option>
                            </optgroup>
                            <optgroup label="Border & Customs">
                              <option value="BORDER_ENTRY_POINT">
                                🚪 Border Entry Point (Country Entry)
                              </option>
                              <option value="BORDER_EXIT_POINT">
                                🚪 Border Exit Point (Country Exit)
                              </option>
                              <option value="CUSTOMS_CLEARANCE_FACILITY">
                                🏛️ Customs Clearance Facility
                              </option>
                              <option value="CUSTOMS_INSPECTION_AREA">
                                🔍 Customs Inspection Area
                              </option>
                              <option value="NO_MANS_LAND">
                                🌐 No Man's Land (Neutral Zone)
                              </option>
                              <option value="BORDER_CROSSING_COMPLEX">
                                🏛️ Border Crossing Complex
                              </option>
                            </optgroup>
                            <optgroup label="Regulatory & Compliance">
                              <option value="REGULATORY_CHECKPOINT">
                                ✅ Regulatory Checkpoint (TGA, SFDA, etc.)
                              </option>
                              <option value="INSPECTION_FACILITY">
                                🔬 Inspection Facility
                              </option>
                              <option value="DOCUMENTATION_CENTER">
                                📄 Documentation Center
                              </option>
                              <option value="COMPLIANCE_VERIFICATION_POINT">
                                ✓ Compliance Verification Point
                              </option>
                            </optgroup>
                            <optgroup label="Transportation Infrastructure">
                              <option value="PORT_TERMINAL">
                                ⚓ Port Terminal (Sea Port)
                              </option>
                              <option value="AIRPORT_CARGO_TERMINAL">
                                ✈️ Airport Cargo Terminal
                              </option>
                              <option value="RAILWAY_TERMINAL">
                                🚂 Railway Terminal
                              </option>
                              <option value="DRY_PORT">
                                🚢 Dry Port (Inland Port)
                              </option>
                              <option value="LOGISTICS_HUB">
                                🚛 Logistics Hub (Multi-modal)
                              </option>
                            </optgroup>
                            <optgroup label="Route Infrastructure">
                              <option value="HIGHWAY_TOLL_PLAZA">
                                🛣️ Highway Toll Plaza
                              </option>
                              <option value="WEIGH_STATION">
                                ⚖️ Weigh Station
                              </option>
                              <option value="REST_AREA">🛌 Rest Area</option>
                              <option value="FUEL_STATION">
                                ⛽ Fuel Station
                              </option>
                              <option value="SERVICE_AREA">
                                🛠️ Service Area
                              </option>
                            </optgroup>
                            <optgroup label="Security & Restricted">
                              <option value="SECURITY_CHECKPOINT">
                                🔒 Security Checkpoint
                              </option>
                              <option value="RESTRICTED_AREA">
                                🚫 Restricted Area
                              </option>
                              <option value="QUARANTINE_ZONE">
                                🦠 Quarantine Zone
                              </option>
                              <option value="HAZMAT_HANDLING_AREA">
                                ⚠️ Hazmat Handling Area
                              </option>
                            </optgroup>
                            <optgroup label="Administrative">
                              <option value="CITY_LIMIT">🏙️ City Limit</option>
                              <option value="PROVINCE_BOUNDARY">
                                🗺️ Province Boundary
                              </option>
                              <option value="COUNTRY_BOUNDARY">
                                🌍 Country Boundary
                              </option>
                              <option value="FREE_ZONE">🆓 Free Zone</option>
                            </optgroup>
                            <optgroup label="Other">
                              <option value="CUSTOM">⚙️ Custom Zone</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Geometry Type
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setGeometryType("CIRCLE")}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                              geometryType === "CIRCLE"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            Circle
                          </button>
                          <button
                            onClick={() => setGeometryType("POLYGON")}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                              geometryType === "POLYGON"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            Polygon
                          </button>
                        </div>
                      </div>

                      {geometryType === "CIRCLE" ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Latitude
                            </label>
                            <input
                              value={circleLat}
                              onChange={(e) => setCircleLat(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="24.7136"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Longitude
                            </label>
                            <input
                              value={circleLng}
                              onChange={(e) => setCircleLng(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="46.6753"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Radius (meters)
                            </label>
                            <input
                              value={circleRadius}
                              onChange={(e) => setCircleRadius(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="250"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Polygon Coordinates (one per line: lat,lng)
                          </label>
                          <textarea
                            value={polygonCoords}
                            onChange={(e) => setPolygonCoords(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            rows={6}
                            placeholder="24.7136,46.6753&#10;24.7140,46.6760&#10;24.7145,46.6755&#10;24.7140,46.6750"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Minimum 3 points required. Format:
                            latitude,longitude (one per line)
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GeofenceTooltip feature="dwell-time">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Expected Dwell Time (minutes)
                            </label>
                            <input
                              value={expectedDwellTime}
                              onChange={(e) =>
                                setExpectedDwellTime(e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="30"
                            />
                          </div>
                        </GeofenceTooltip>
                        <GeofenceTooltip feature="dwell-time">
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Max Dwell Time (minutes)
                            </label>
                            <input
                              value={maxDwellTime}
                              onChange={(e) => setMaxDwellTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="90"
                            />
                          </div>
                        </GeofenceTooltip>
                      </div>

                      <button
                        onClick={() => void onCreateZone()}
                        className="w-full px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-60"
                        disabled={creatingZone || !zoneName.trim()}
                      >
                        {creatingZone ? "Creating…" : "Create Zone"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Zones List */}
                {loadingZones ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading zones…
                  </div>
                ) : zones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No zones yet. Click "Create Zone" to add one.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {zones.map((zone) => (
                      <div
                        key={zone.id}
                        className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: ZONE_TYPE_COLORS[zone.type],
                                }}
                              />
                              <div className="font-semibold">{zone.name}</div>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full border ${
                                  zone.enabled
                                    ? "border-green-500/40 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-500/40 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                                }`}
                              >
                                {zone.enabled ? "ENABLED" : "DISABLED"}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {zone.type}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <div>{formatZoneGeometry(zone)}</div>
                              {zone.metadata.expectedDwellTime && (
                                <div>
                                  Expected dwell:{" "}
                                  {zone.metadata.expectedDwellTime} min
                                </div>
                              )}
                              {zone.metadata.maxDwellTime && (
                                <div>
                                  Max dwell: {zone.metadata.maxDwellTime} min
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                Created:{" "}
                                {new Date(zone.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                void onToggleZone(zone.id, zone.enabled)
                              }
                              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                zone.enabled
                                  ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700"
                                  : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                              }`}
                            >
                              {zone.enabled ? "Disable" : "Enable"}
                            </button>
                            <button
                              onClick={() => void onDeleteZone(zone.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "map" && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">Zone Map View</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Interactive map showing all enabled zones. Click markers to
                  view zone details.
                </p>
              </div>
              {enabledZones.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No enabled zones to display on map. Create and enable zones
                  first.
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <MapView
                    center={mapCenter}
                    zoom={12}
                    markers={mapMarkers}
                    height="600px"
                    interactive={true}
                    showControls={true}
                  />
                </div>
              )}
              {selectedZone && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        {selectedZone.name}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        {formatZoneGeometry(selectedZone)}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Type: {selectedZone.type} • Status:{" "}
                        {selectedZone.enabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedZone(null)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "events" && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Event History</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Zone entry/exit events and alerts
                  </p>
                </div>
                <select
                  value={eventFilter}
                  onChange={(e) =>
                    setEventFilter(e.target.value as typeof eventFilter)
                  }
                  className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="ALL">All Events</option>
                  {Object.entries(EVENT_TYPE_LABELS).map(
                    ([type, { label }]) => (
                      <option key={type} value={type}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {loadingEvents ? (
                <div className="text-center py-8 text-gray-500">
                  Loading events…
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">No events yet.</p>
                  <p className="text-sm">
                    Use the "Test" tab to trigger detection events.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => {
                    const eventInfo = EVENT_TYPE_LABELS[event.eventType];
                    return (
                      <div
                        key={event.id}
                        className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`text-2xl ${eventInfo.color}`}>
                              {eventInfo.icon}
                            </div>
                            <div>
                              <div className="font-semibold">
                                {eventInfo.label}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Zone:{" "}
                                {zones.find((z) => z.id === event.zoneId)
                                  ?.name || event.zoneId}
                              </div>
                              {event.shipmentId && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Shipment: {event.shipmentId} • Vehicle:{" "}
                                  {event.vehicleId}
                                </div>
                              )}
                              {event.dwellTime !== undefined && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Dwell time: {event.dwellTime.toFixed(1)}{" "}
                                  minutes
                                </div>
                              )}
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {new Date(event.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {event.location.lat.toFixed(4)},{" "}
                            {event.location.lng.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "dwell" && (
            <motion.div
              key="dwell"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">
                  Dwell Time Tracking
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Active shipments currently within zones
                </p>
              </div>

              {dwellTracking.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">No active dwell tracking.</p>
                  <p className="text-sm">
                    Dwell tracking starts when a shipment enters a zone.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dwellTracking.map((tracking) => (
                    <div
                      key={tracking.shipmentId}
                      className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">
                            {tracking.zoneName}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Shipment: {tracking.shipmentId}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Entry:{" "}
                            {new Date(tracking.entryTime).toLocaleString()}
                          </div>
                          <div className="text-sm font-medium mt-2">
                            Current Dwell: {tracking.currentDwell.toFixed(1)}{" "}
                            minutes
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            tracking.status === "EXCEEDED"
                              ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                              : tracking.status === "WARNING"
                                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                                : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                          }`}
                        >
                          {tracking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "test" && (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-1">Test Detection</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manually test zone entry/exit detection by providing location
                  coordinates.
                </p>
              </div>

              {detectError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  {detectError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Shipment ID
                  </label>
                  <input
                    value={testShipmentId}
                    onChange={(e) => setTestShipmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="shipment-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vehicle ID
                  </label>
                  <input
                    value={testVehicleId}
                    onChange={(e) => setTestVehicleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="vehicle-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Driver Name (optional)
                  </label>
                  <input
                    value={testDriverName}
                    onChange={(e) => setTestDriverName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Driver One"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Latitude
                    </label>
                    <input
                      value={testLat}
                      onChange={(e) => setTestLat(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="24.7136"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Longitude
                    </label>
                    <input
                      value={testLng}
                      onChange={(e) => setTestLng(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="46.6753"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => void onTestDetect()}
                className="w-full md:w-auto px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-60 mb-4"
                disabled={detecting}
              >
                {detecting ? "Detecting…" : "Run Detection"}
              </button>

              {detectResult && (
                <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl text-green-600 dark:text-green-400">
                      {EVENT_TYPE_LABELS[detectResult.eventType]?.icon || "✓"}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-green-900 dark:text-green-100">
                        {EVENT_TYPE_LABELS[detectResult.eventType]?.label ||
                          detectResult.eventType}
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300 mt-2">
                        <div>
                          Zone:{" "}
                          {zones.find((z) => z.id === detectResult.zoneId)
                            ?.name || detectResult.zoneId}
                        </div>
                        <div>
                          Location: {detectResult.location.lat.toFixed(4)},{" "}
                          {detectResult.location.lng.toFixed(4)}
                        </div>
                        {detectResult.dwellTime !== undefined && (
                          <div>
                            Dwell Time: {detectResult.dwellTime.toFixed(1)}{" "}
                            minutes
                          </div>
                        )}
                        <div>
                          Time:{" "}
                          {new Date(detectResult.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!detectResult && !detecting && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>How it works:</strong> Enter coordinates and click
                    "Run Detection". If the location is inside an enabled zone,
                    you'll get a{" "}
                    <span className="font-mono text-green-600 dark:text-green-400">
                      ZONE_ENTRY
                    </span>{" "}
                    event. If you were previously inside and now outside, you'll
                    get a{" "}
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      ZONE_EXIT
                    </span>{" "}
                    event.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <GeofenceAnalyticsDashboard tenantId={tenantId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTemplate>
  );
}

export default function GeofenceSystemPage() {
  return (
    <ErrorBoundary
      fallback={
        <PageTemplate
          title="Geofence System"
          description="Zone Management & Entry/Exit Detection"
          icon="ri-map-pin-range-line"
        >
          <div className="text-center py-12">
            <p className="text-red-600">
              Something went wrong. Please refresh the page.
            </p>
          </div>
        </PageTemplate>
      }
    >
      <GeofenceSystemPageContent />
    </ErrorBoundary>
  );
}

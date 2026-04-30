/**
 * Geofence Zone Service
 *
 * Zone definition and management
 * Entry/exit detection
 * Dwell time tracking
 *
 * @module geofence
 */

import { eventBus, createEvent } from "@/lib/services/event-store";
import { schrodingersTruckService } from "@/lib/services/schrodingers-truck/service";
import { geofencePredictiveAnalyticsService } from "./ai/predictiveAnalyticsService";
import { patternLearningService } from "./learning/patternLearningService";
import { geofenceRealtimeService } from "./realtime/geofenceRealtimeService";
import { anomalyDetectionAgent } from "./agents/geofenceAgents";
import { geofenceSlaKpiAdapter } from "@/lib/services/sla-kpi";
import { geofenceDatabaseService } from "./database/geofenceDatabaseService";
import type { GeofenceZone, GeofenceEvent, DwellTimeTracking } from "./types";
import type { CollapseTrigger } from "@/lib/services/schrodingers-truck/types";

// ============================================================================
// IN-MEMORY STORE (Will be replaced with database)
// ============================================================================

class ZoneStore {
  private zones: Map<string, GeofenceZone> = new Map();
  private dwellTracking: Map<string, DwellTimeTracking> = new Map();

  getZone(id: string): GeofenceZone | undefined {
    return this.zones.get(id);
  }

  setZone(id: string, zone: GeofenceZone): void {
    this.zones.set(id, zone);
  }

  getAllZones(): GeofenceZone[] {
    return Array.from(this.zones.values());
  }

  getZonesByTenant(tenantId: string): GeofenceZone[] {
    return this.getAllZones().filter((z) => z.tenantId === tenantId);
  }

  getDwellTracking(shipmentId: string): DwellTimeTracking | undefined {
    return this.dwellTracking.get(shipmentId);
  }

  setDwellTracking(shipmentId: string, tracking: DwellTimeTracking): void {
    this.dwellTracking.set(shipmentId, tracking);
  }

  getAllDwellTrackings(): Array<[string, DwellTimeTracking]> {
    return Array.from(this.dwellTracking.entries());
  }

  deleteZone(zoneId: string): boolean {
    return this.zones.delete(zoneId);
  }
}

const store = new ZoneStore();

// Check if database is available
const useDatabase =
  process.env.DATABASE_URL !== undefined &&
  process.env.USE_DATABASE !== "false";
const strictProd = process.env.NODE_ENV === "production";

function strictDbOrThrow(error: unknown): never {
  const msg = error instanceof Error ? error.message : String(error);
  throw new Error(
    `GEOFENCE_STRICT_MODE: Database operation failed in production. ${msg}`,
  );
}

// ============================================================================
// ZONE SERVICE
// ============================================================================

export class GeofenceZoneService {
  /**
   * List zones for a tenant
   */
  async listZones(tenantId: string): Promise<GeofenceZone[]> {
    if (useDatabase) {
      try {
        return await geofenceDatabaseService.listZones(tenantId);
      } catch (error) {
        if (strictProd) strictDbOrThrow(error);
        console.warn(
          "⚠️ Geofence: Database error, falling back to in-memory:",
          error,
        );
      }
    }
    return store.getZonesByTenant(tenantId);
  }

  /**
   * Get a zone by id (optionally tenant-scoped)
   */
  async getZone(
    zoneId: string,
    tenantId?: string,
  ): Promise<GeofenceZone | null> {
    if (useDatabase && tenantId) {
      try {
        return await geofenceDatabaseService.getZone(zoneId, tenantId);
      } catch (error) {
        if (strictProd) strictDbOrThrow(error);
        console.warn(
          "⚠️ Geofence: Database error, falling back to in-memory:",
          error,
        );
      }
    }
    const zone = store.getZone(zoneId);
    if (!zone) return null;
    if (tenantId && zone.tenantId !== tenantId) return null;
    return zone;
  }

  /**
   * Create geofence zone
   */
  async createZone(
    zone: Omit<GeofenceZone, "id" | "createdAt" | "updatedAt">,
  ): Promise<GeofenceZone> {
    const newZone: GeofenceZone = {
      ...zone,
      id: `zone-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Try database first
    if (useDatabase) {
      try {
        const created = await geofenceDatabaseService.createZone(newZone);
        // Also store in memory for fast access
        store.setZone(created.id, created);
        // Publish event
        await eventBus.publish(
          createEvent(
            "GeofenceZoneCreated",
            created.id,
            "GeofenceZone",
            {
              zoneId: created.id,
              zoneName: created.name,
              zoneType: created.type,
            },
            1,
            {
              tenantId: created.tenantId,
              correlationId: `geofence-create-${Date.now()}`,
              userId: "geofence-service",
            },
          ),
        );
        return created;
      } catch (error) {
        if (strictProd) strictDbOrThrow(error);
        console.warn(
          "⚠️ Geofence: Database error, falling back to in-memory:",
          error,
        );
      }
    }

    // Fallback to in-memory
    if (strictProd) {
      throw new Error(
        "GEOFENCE_STRICT_MODE: In-memory geofence zones are forbidden in production.",
      );
    }
    store.setZone(newZone.id, newZone);

    // Publish event
    await eventBus.publish(
      createEvent(
        "GeofenceZoneCreated",
        newZone.id,
        "GeofenceZone",
        {
          zoneId: newZone.id,
          name: newZone.name,
          type: newZone.type,
        },
        1,
        {
          tenantId: newZone.tenantId,
          correlationId: `zone-create-${Date.now()}`,
          userId: "geofence-service",
        },
      ),
    );

    return newZone;
  }

  /**
   * Update geofence zone (partial)
   */
  async updateZone(
    zoneId: string,
    tenantId: string,
    updates: Partial<
      Omit<GeofenceZone, "id" | "tenantId" | "createdAt" | "updatedAt">
    >,
  ): Promise<GeofenceZone> {
    const existing = await this.getZone(zoneId, tenantId);
    if (!existing) {
      throw new Error("Zone not found");
    }

    const updated: GeofenceZone = {
      ...existing,
      ...updates,
      metadata: updates.metadata
        ? { ...existing.metadata, ...updates.metadata }
        : existing.metadata,
      updatedAt: new Date(),
      tenantId: existing.tenantId,
      id: existing.id,
      createdAt: existing.createdAt,
    };

    // Try database first
    if (useDatabase) {
      try {
        const dbUpdated = await geofenceDatabaseService.updateZone(
          zoneId,
          tenantId,
          updated,
        );
        // Also update in-memory cache
        store.setZone(zoneId, dbUpdated);
        // Publish event
        await eventBus.publish(
          createEvent(
            "GeofenceZoneUpdated",
            zoneId,
            "GeofenceZone",
            {
              zoneId,
              updates,
            },
            1,
            {
              tenantId,
              correlationId: `geofence-update-${Date.now()}`,
              userId: "geofence-service",
            },
          ),
        );
        return dbUpdated;
      } catch (error) {
        if (strictProd) strictDbOrThrow(error);
        console.warn(
          "⚠️ Geofence: Database error, falling back to in-memory:",
          error,
        );
      }
    }

    // Fallback to in-memory
    if (strictProd) {
      throw new Error(
        "GEOFENCE_STRICT_MODE: In-memory geofence zone updates are forbidden in production.",
      );
    }
    store.setZone(zoneId, updated);

    await eventBus.publish(
      createEvent(
        "GeofenceZoneUpdated",
        updated.id,
        "GeofenceZone",
        {
          zoneId: updated.id,
          updates: Object.keys(updates),
        },
        1,
        {
          tenantId: updated.tenantId,
          correlationId: `zone-update-${Date.now()}`,
          userId: "geofence-service",
        },
      ),
    );

    return updated;
  }

  /**
   * Disable (soft delete) a zone
   */
  async disableZone(zoneId: string, tenantId: string): Promise<GeofenceZone> {
    // Try database first
    if (useDatabase) {
      try {
        await geofenceDatabaseService.disableZone(zoneId, tenantId);
        const disabled = await this.getZone(zoneId, tenantId);
        if (disabled) {
          // Publish event
          await eventBus.publish(
            createEvent(
              "GeofenceZoneDisabled",
              zoneId,
              "GeofenceZone",
              {
                zoneId,
              },
              1,
              {
                tenantId,
                correlationId: `geofence-disable-${Date.now()}`,
                userId: "geofence-service",
              },
            ),
          );
          return disabled;
        }
      } catch (error) {
        if (strictProd) strictDbOrThrow(error);
        console.warn(
          "⚠️ Geofence: Database error, falling back to in-memory:",
          error,
        );
      }
    }

    // Fallback to updateZone method
    return await this.updateZone(zoneId, tenantId, { enabled: false });
  }

  /**
   * Check if location is inside zone
   */
  isInsideZone(
    location: { lat: number; lng: number },
    zone: GeofenceZone,
  ): boolean {
    if (zone.geometry.type === "CIRCLE") {
      const circle = zone.geometry.coordinates as {
        center: { lat: number; lng: number };
        radius: number;
      };
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        circle.center.lat,
        circle.center.lng,
      );
      return distance <= circle.radius;
    } else {
      const polygon = zone.geometry.coordinates as number[][];
      return this.isPointInPolygon(location, polygon);
    }
  }

  /**
   * Detect zone entry/exit
   */
  async detectZoneEvent(
    location: { lat: number; lng: number },
    shipmentId: string,
    vehicleId: string,
    tenantId: string,
  ): Promise<GeofenceEvent | null> {
    // Get zones (try database first)
    let zones: GeofenceZone[];
    if (useDatabase) {
      try {
        zones = await geofenceDatabaseService.listZones(tenantId, true); // enabled only
      } catch (error) {
        if (strictProd) strictDbOrThrow(error);
        console.warn(
          "⚠️ Geofence: Database error, falling back to in-memory:",
          error,
        );
        zones = store.getZonesByTenant(tenantId).filter((z) => z.enabled);
      }
    } else {
      if (strictProd) {
        throw new Error(
          "GEOFENCE_STRICT_MODE: Database is required in production (no in-memory zone list).",
        );
      }
      zones = store.getZonesByTenant(tenantId).filter((z) => z.enabled);
    }

    for (const zone of zones) {
      const isInside = this.isInsideZone(location, zone);

      // Check if we have previous tracking (try database first)
      let tracking: DwellTimeTracking | undefined;
      if (useDatabase) {
        try {
          tracking =
            (await geofenceDatabaseService.getDwellTracking(
              shipmentId,
              zone.id,
            )) || undefined;
        } catch (error) {
          if (strictProd) strictDbOrThrow(error);
          console.warn(
            "⚠️ Geofence: Database error getting dwell tracking, falling back to in-memory:",
            error,
          );
          tracking = store.getDwellTracking(shipmentId);
        }
      } else {
        if (strictProd) {
          throw new Error(
            "GEOFENCE_STRICT_MODE: Database is required in production (no in-memory dwell tracking).",
          );
        }
        tracking = store.getDwellTracking(shipmentId);
      }
      const wasInside =
        tracking && tracking.zoneId === zone.id && tracking.status === "ACTIVE";

      if (isInside && !wasInside) {
        // Zone entry
        const event: GeofenceEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          zoneId: zone.id,
          shipmentId,
          vehicleId,
          eventType: "ZONE_ENTRY",
          location,
          timestamp: new Date(),
        };

        // Start dwell time tracking (try database first)
        const newTracking: DwellTimeTracking = {
          zoneId: zone.id,
          shipmentId,
          entryTime: new Date(),
          status: "ACTIVE",
        };
        if (useDatabase) {
          try {
            await geofenceDatabaseService.upsertDwellTracking(
              newTracking,
              tenantId,
            );
          } catch (error) {
            if (strictProd) strictDbOrThrow(error);
            console.warn(
              "⚠️ Geofence: Database error storing dwell tracking, falling back to in-memory:",
              error,
            );
            store.setDwellTracking(shipmentId, newTracking);
          }
        } else {
          if (strictProd) {
            throw new Error(
              "GEOFENCE_STRICT_MODE: Database is required in production (no in-memory dwell tracking).",
            );
          }
          store.setDwellTracking(shipmentId, newTracking);
        }

        // Store event in database
        if (useDatabase) {
          try {
            await geofenceDatabaseService.createEvent(event);
          } catch (error) {
            if (strictProd) strictDbOrThrow(error);
            console.warn(
              "⚠️ Geofence: Database error storing event, continuing:",
              error,
            );
          }
        }

        // Trigger quantum state update
        try {
          const trigger: CollapseTrigger = "GEOFENCE_ENTRY";
          await schrodingersTruckService.updateQuantumState(
            shipmentId,
            trigger,
            { zoneId: zone.id },
          );
        } catch (error) {
          console.warn(
            "Error updating quantum state for geofence entry:",
            error,
          );
        }

        // Publish event
        await eventBus.publish(
          createEvent(
            "GeofenceZoneEntry",
            shipmentId,
            "Shipment",
            {
              shipmentId,
              zoneId: zone.id,
              zoneName: zone.name,
              location,
            },
            1,
            {
              tenantId,
              correlationId: `geofence-entry-${Date.now()}`,
              userId: "geofence-service",
            },
          ),
        );

        // Publish to event bus for cross-module integration
        await eventBus.publish({
          type: "geofence.zone.entry",
          data: { event, zone },
          metadata: {
            source: "geofence-zone-service",
            timestamp: new Date().toISOString(),
          },
        });

        // Real-time update
        await geofenceRealtimeService.publishUpdate({
          type: "ZONE_ENTRY",
          event,
          zone,
          data: { shipmentId, vehicleId },
          timestamp: new Date(),
          priority: "MEDIUM",
        });

        // Learn from event
        await patternLearningService.learnFromEvent(event, zone, tenantId);

        // Detect anomalies
        const anomaly = await geofencePredictiveAnalyticsService.detectAnomaly(
          event,
          zone,
          [],
        );
        if (anomaly) {
          await geofenceRealtimeService.publishUpdate({
            type: "ANOMALY",
            event,
            zone,
            data: { anomaly },
            timestamp: new Date(),
            priority:
              anomaly.severity === "CRITICAL"
                ? "CRITICAL"
                : anomaly.severity === "HIGH"
                  ? "HIGH"
                  : "MEDIUM",
          });
        }

        return event;
      } else if (!isInside && wasInside) {
        // Zone exit
        const exitTime = new Date();
        const dwellTime = tracking
          ? (exitTime.getTime() - tracking.entryTime.getTime()) / (1000 * 60)
          : 0;

        const event: GeofenceEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          zoneId: zone.id,
          shipmentId,
          vehicleId,
          eventType: "ZONE_EXIT",
          location,
          timestamp: exitTime,
          dwellTime,
        };

        // Update tracking
        if (tracking) {
          tracking.exitTime = exitTime;
          tracking.dwellTime = dwellTime;
          tracking.status = "COMPLETED";

          // Check if exceeded max dwell time
          if (
            zone.metadata.maxDwellTime &&
            dwellTime > zone.metadata.maxDwellTime
          ) {
            tracking.status = "EXCEEDED";
            event.eventType = "DWELL_TIME_EXCEEDED";

            // Publish alert
            await eventBus.publish(
              createEvent(
                "GeofenceDwellTimeExceeded",
                shipmentId,
                "Shipment",
                {
                  shipmentId,
                  zoneId: zone.id,
                  dwellTime,
                  maxDwellTime: zone.metadata.maxDwellTime,
                },
                1,
                {
                  tenantId,
                  correlationId: `dwell-exceeded-${Date.now()}`,
                  userId: "geofence-service",
                },
              ),
            );
          }

          // Update dwell tracking (try database first)
          if (useDatabase) {
            try {
              await geofenceDatabaseService.upsertDwellTracking(
                tracking,
                tenantId,
              );
            } catch (error) {
              console.warn(
                "⚠️ Geofence: Database error updating dwell tracking, falling back to in-memory:",
                error,
              );
              store.setDwellTracking(shipmentId, tracking);
            }
          } else {
            store.setDwellTracking(shipmentId, tracking);
          }

          // Store event in database
          if (useDatabase) {
            try {
              await geofenceDatabaseService.createEvent(event);
            } catch (error) {
              console.warn(
                "⚠️ Geofence: Database error storing event, continuing:",
                error,
              );
            }
          }
        }

        // Trigger quantum state update
        try {
          const trigger: CollapseTrigger = "GEOFENCE_EXIT";
          await schrodingersTruckService.updateQuantumState(
            shipmentId,
            trigger,
            { zoneId: zone.id, dwellTime },
          );
        } catch (error) {
          console.warn(
            "Error updating quantum state for geofence exit:",
            error,
          );
        }

        // Publish event
        await eventBus.publish(
          createEvent(
            "GeofenceZoneExit",
            shipmentId,
            "Shipment",
            {
              shipmentId,
              zoneId: zone.id,
              zoneName: zone.name,
              location,
              dwellTime,
            },
            1,
            {
              tenantId,
              correlationId: `geofence-exit-${Date.now()}`,
              userId: "geofence-service",
            },
          ),
        );

        // Publish to event bus for cross-module integration
        await eventBus.publish({
          type: "geofence.zone.exit",
          data: { event, zone },
          metadata: {
            source: "geofence-zone-service",
            timestamp: new Date().toISOString(),
          },
        });

        // Real-time update
        await geofenceRealtimeService.publishUpdate({
          type:
            event.eventType === "DWELL_TIME_EXCEEDED"
              ? "DWELL_EXCEEDED"
              : "ZONE_EXIT",
          event,
          zone,
          data: { shipmentId, vehicleId, dwellTime },
          timestamp: new Date(),
          priority:
            event.eventType === "DWELL_TIME_EXCEEDED" ? "HIGH" : "MEDIUM",
        });

        // Check SLA/KPI compliance for exit
        try {
          const complianceResults =
            await geofenceSlaKpiService.checkSLACompliance(
              event,
              zone,
              tenantId,
            );
          if (complianceResults.length > 0) {
            const violations = complianceResults.filter(
              (r) => !r.compliance.met,
            );
            if (violations.length > 0) {
              await geofenceRealtimeService.publishUpdate({
                type: "SLA_VIOLATION",
                event,
                zone,
                data: { violations, complianceResults },
                timestamp: new Date(),
                priority: "HIGH",
              });
            }
          }
        } catch (error) {
          console.warn("Error checking SLA compliance:", error);
        }

        // Learn from event
        await patternLearningService.learnFromEvent(event, zone, tenantId);

        // Detect anomalies
        const anomaly = await geofencePredictiveAnalyticsService.detectAnomaly(
          event,
          zone,
          [],
        );
        if (anomaly) {
          await geofenceRealtimeService.publishUpdate({
            type: "ANOMALY",
            event,
            zone,
            data: { anomaly },
            timestamp: new Date(),
            priority:
              anomaly.severity === "CRITICAL"
                ? "CRITICAL"
                : anomaly.severity === "HIGH"
                  ? "HIGH"
                  : "MEDIUM",
          });
        }

        return event;
      }
    }

    return null;
  }

  /**
   * Check dwell time warnings
   */
  async checkDwellTimeWarnings(tenantId: string): Promise<GeofenceEvent[]> {
    const warnings: GeofenceEvent[] = [];
    const zones = store.getZonesByTenant(tenantId).filter((z) => z.enabled);

    for (const [shipmentId, tracking] of store.getAllDwellTrackings()) {
      if (tracking.status === "ACTIVE") {
        const zone = zones.find((z) => z.id === tracking.zoneId);
        if (zone && zone.metadata.expectedDwellTime) {
          const currentDwellTime =
            (Date.now() - tracking.entryTime.getTime()) / (1000 * 60);

          if (currentDwellTime > zone.metadata.expectedDwellTime * 1.5) {
            // Warning threshold
            warnings.push({
              id: `warning-${Date.now()}`,
              zoneId: zone.id,
              shipmentId: tracking.shipmentId,
              eventType: "DWELL_TIME_WARNING",
              location: { lat: 0, lng: 0 }, // Would get from tracking
              timestamp: new Date(),
              dwellTime: currentDwellTime,
            });
          }
        }
      }
    }

    return warnings;
  }

  // ============================================================================
  // GEOMETRY HELPERS
  // ============================================================================

  /**
   * Ray-casting point in polygon.
   *
   * Accepts polygon points as number[][] (each point is either [lat,lng] or [lng,lat]).
   */
  private isPointInPolygon(
    point: { lat: number; lng: number },
    polygon: number[][],
  ): boolean {
    if (!Array.isArray(polygon) || polygon.length < 3) return false;

    const pts = polygon
      .map((p) => this.normalizeLatLngPair(p))
      .filter((p): p is { lat: number; lng: number } => p !== null);

    if (pts.length < 3) return false;

    // x = lng, y = lat
    const x = point.lng;
    const y = point.lat;

    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].lng;
      const yi = pts[i].lat;
      const xj = pts[j].lng;
      const yj = pts[j].lat;

      const intersect =
        yi > y !== yj > y &&
        x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  }

  private normalizeLatLngPair(
    pair: number[],
  ): { lat: number; lng: number } | null {
    if (!Array.isArray(pair) || pair.length < 2) return null;
    const a = Number(pair[0]);
    const b = Number(pair[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

    // Heuristic:
    // - If a looks like latitude and b looks like longitude -> [lat,lng]
    // - Otherwise assume [lng,lat]
    const aLooksLikeLat = Math.abs(a) <= 90;
    const bLooksLikeLng = Math.abs(b) <= 180;
    const aLooksLikeLng = Math.abs(a) <= 180;
    const bLooksLikeLat = Math.abs(b) <= 90;

    if (aLooksLikeLat && bLooksLikeLng) return { lat: a, lng: b };
    if (aLooksLikeLng && bLooksLikeLat) return { lat: b, lng: a };
    // Fallback: treat as [lat,lng]
    return { lat: a, lng: b };
  }

  /**
   * Calculate distance between two points (Haversine)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton
export const geofenceZoneService = new GeofenceZoneService();

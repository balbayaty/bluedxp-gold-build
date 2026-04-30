/**
 * Transportation Module Integration
 *
 * Deep integration with Transportation module:
 * - Shipment lifecycle tracking
 * - Route optimization
 * - Driver management
 * - Vehicle tracking
 * - Journey analysis
 */

import { eventBus } from "@/lib/services/event-store";
import { geofenceZoneService } from "../zone-service";
import { geofencePredictiveAnalyticsService } from "../ai/predictiveAnalyticsService";
import type { GeofenceEvent } from "../types";

// ============================================================================
// INTEGRATION SERVICE
// ============================================================================

class TransportationIntegrationService {
  private initialized = false;

  /**
   * Initialize transportation module integration
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Subscribe to transportation events
    this.subscribeToTransportationEvents();

    this.initialized = true;
    console.log("✅ Geofence Transportation Integration initialized");
  }

  /**
   * Subscribe to transportation module events
   */
  private subscribeToTransportationEvents(): void {
    // Shipment created - initialize geofence tracking
    eventBus.subscribe(
      "transportation.shipment.created",
      async (event: any) => {
        try {
          const shipment = event.data.shipment;
          if (shipment && shipment.route) {
            // Auto-create zones from route waypoints if needed
            await this.autoCreateZonesFromRoute(
              shipment.route,
              event.data.tenantId,
            );

            // Initialize predictive analytics
            if (shipment.id && shipment.route.waypoints) {
              for (const waypoint of shipment.route.waypoints) {
                const zone = await this.findOrCreateZoneForWaypoint(
                  waypoint,
                  event.data.tenantId,
                );
                if (zone) {
                  await geofencePredictiveAnalyticsService.predictZoneEntry(
                    shipment.id,
                    zone.id,
                    zone,
                    { lat: waypoint.lat, lng: waypoint.lng },
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error("Error handling shipment.created event:", error);
        }
      },
    );

    // Shipment status changed - update zone expectations
    eventBus.subscribe(
      "transportation.shipment.status.changed",
      async (event: any) => {
        try {
          const shipment = event.data.shipment;
          const newStatus = event.data.newStatus;

          // Update zone priorities based on status
          if (newStatus === "IN_TRANSIT" && shipment.route) {
            // Activate zones for active route
            await this.activateZonesForRoute(
              shipment.route,
              event.data.tenantId,
            );
          }
        } catch (error) {
          console.error("Error handling shipment.status.changed event:", error);
        }
      },
    );

    // Route optimized - update zone configurations
    eventBus.subscribe("transportation.route.optimized", async (event: any) => {
      try {
        const route = event.data.route;
        if (route && route.waypoints) {
          // Update zone priorities based on optimized route
          await this.updateZonePriorities(route, event.data.tenantId);
        }
      } catch (error) {
        console.error("Error handling route.optimized event:", error);
      }
    });

    // Driver assigned - link driver to zones
    eventBus.subscribe("transportation.driver.assigned", async (event: any) => {
      try {
        const driver = event.data.driver;
        const shipment = event.data.shipment;

        if (driver && shipment && shipment.route) {
          // Update zone metadata with driver info
          await this.updateZonesWithDriverInfo(
            shipment.route,
            driver,
            event.data.tenantId,
          );
        }
      } catch (error) {
        console.error("Error handling driver.assigned event:", error);
      }
    });

    // Publish geofence events to transportation module
    eventBus.subscribe("geofence.zone.entry", async (event: any) => {
      try {
        const geofenceEvent = event.data.event as GeofenceEvent;
        if (geofenceEvent.shipmentId) {
          // Update shipment status
          await eventBus.publish({
            type: "transportation.shipment.geofence.entry",
            data: {
              shipmentId: geofenceEvent.shipmentId,
              zoneId: geofenceEvent.zoneId,
              timestamp: geofenceEvent.timestamp,
            },
            metadata: {
              source: "geofence-transportation-integration",
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        console.error(
          "Error publishing geofence entry to transportation:",
          error,
        );
      }
    });

    eventBus.subscribe("geofence.zone.exit", async (event: any) => {
      try {
        const geofenceEvent = event.data.event as GeofenceEvent;
        if (geofenceEvent.shipmentId) {
          // Update shipment status
          await eventBus.publish({
            type: "transportation.shipment.geofence.exit",
            data: {
              shipmentId: geofenceEvent.shipmentId,
              zoneId: geofenceEvent.zoneId,
              dwellTime: geofenceEvent.dwellTime,
              timestamp: geofenceEvent.timestamp,
            },
            metadata: {
              source: "geofence-transportation-integration",
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        console.error(
          "Error publishing geofence exit to transportation:",
          error,
        );
      }
    });
  }

  /**
   * Auto-create zones from route waypoints
   */
  private async autoCreateZonesFromRoute(
    route: any,
    tenantId: string,
  ): Promise<void> {
    if (!route.waypoints || route.waypoints.length === 0) return;

    for (const waypoint of route.waypoints) {
      await this.findOrCreateZoneForWaypoint(waypoint, tenantId);
    }
  }

  /**
   * Find or create zone for waypoint
   */
  private async findOrCreateZoneForWaypoint(
    waypoint: any,
    tenantId: string,
  ): Promise<any> {
    // Check if zone already exists (simplified - would check distance)
    const zones = await geofenceZoneService.listZones(tenantId);
    const existingZone = zones.find((z) => {
      if (z.geometry.type === "CIRCLE") {
        const coords = z.geometry.coordinates as {
          center: { lat: number; lng: number };
          radius: number;
        };
        const distance = this.calculateDistance(
          { lat: waypoint.lat, lng: waypoint.lng },
          coords.center,
        );
        return distance <= coords.radius;
      }
      return false;
    });

    if (existingZone) return existingZone;

    // Create new zone for waypoint
    try {
      const zone = await geofenceZoneService.createZone({
        name:
          waypoint.address ||
          `Waypoint ${waypoint.lat.toFixed(4)}, ${waypoint.lng.toFixed(4)}`,
        type: "CUSTOMER_SITE",
        geometry: {
          type: "CIRCLE",
          coordinates: {
            center: { lat: waypoint.lat, lng: waypoint.lng },
            radius: 500, // 500m default radius
          },
        },
        metadata: {
          expectedDwellTime: 30,
          maxDwellTime: 90,
        },
        tenantId,
        enabled: true,
      });
      return zone;
    } catch (error) {
      console.error("Error creating zone for waypoint:", error);
      return null;
    }
  }

  /**
   * Activate zones for route
   * When a shipment goes IN_TRANSIT, activate relevant zones along the route
   */
  private async activateZonesForRoute(
    route: any,
    tenantId: string,
  ): Promise<void> {
    if (!route.waypoints || route.waypoints.length === 0) return;

    try {
      // Get all zones for this tenant
      const allZones = await geofenceZoneService.listZones(tenantId);

      // Find zones that match route waypoints
      const zonesToActivate: string[] = [];

      for (const waypoint of route.waypoints) {
        const matchingZone = allZones.find((zone) => {
          if (!zone.enabled) return false;

          if (zone.geometry.type === "CIRCLE") {
            const coords = zone.geometry.coordinates as {
              center: { lat: number; lng: number };
              radius: number;
            };
            const distance = this.calculateDistance(
              { lat: waypoint.lat, lng: waypoint.lng },
              coords.center,
            );
            return distance <= coords.radius;
          }
          // For POLYGON, would need point-in-polygon check (simplified here)
          return false;
        });

        if (matchingZone && !zonesToActivate.includes(matchingZone.id)) {
          zonesToActivate.push(matchingZone.id);
        }
      }

      // Activate zones by updating metadata with route priority
      for (const zoneId of zonesToActivate) {
        await geofenceZoneService.updateZone(zoneId, tenantId, {
          enabled: true,
          metadata: {
            ...((await geofenceZoneService.getZone(zoneId, tenantId))
              ?.metadata || {}),
            routePriority: "ACTIVE",
            activatedAt: new Date().toISOString(),
          },
        });
      }

      if (zonesToActivate.length > 0) {
        console.log(`✅ Activated ${zonesToActivate.length} zones for route`);
      }
    } catch (error) {
      console.error("Error activating zones for route:", error);
    }
  }

  /**
   * Update zone priorities based on optimized route
   * When route is optimized, update zone metadata to reflect new priorities
   */
  private async updateZonePriorities(
    route: any,
    tenantId: string,
  ): Promise<void> {
    if (!route.waypoints || route.waypoints.length === 0) return;

    try {
      const allZones = await geofenceZoneService.listZones(tenantId);

      // Calculate priority based on route order (earlier waypoints = higher priority)
      for (let i = 0; i < route.waypoints.length; i++) {
        const waypoint = route.waypoints[i];
        const priority = route.waypoints.length - i; // Higher number = higher priority

        const matchingZone = allZones.find((zone) => {
          if (zone.geometry.type === "CIRCLE") {
            const coords = zone.geometry.coordinates as {
              center: { lat: number; lng: number };
              radius: number;
            };
            const distance = this.calculateDistance(
              { lat: waypoint.lat, lng: waypoint.lng },
              coords.center,
            );
            return distance <= coords.radius;
          }
          return false;
        });

        if (matchingZone) {
          await geofenceZoneService.updateZone(matchingZone.id, tenantId, {
            metadata: {
              ...matchingZone.metadata,
              routePriority: priority,
              routeOrder: i + 1,
              optimizedAt: new Date().toISOString(),
            },
          });
        }
      }

      console.log(`✅ Updated zone priorities for optimized route`);
    } catch (error) {
      console.error("Error updating zone priorities:", error);
    }
  }

  /**
   * Update zones with driver info
   * When driver is assigned, add driver contact info to relevant zones
   */
  private async updateZonesWithDriverInfo(
    route: any,
    driver: any,
    tenantId: string,
  ): Promise<void> {
    if (!route.waypoints || route.waypoints.length === 0 || !driver) return;

    try {
      const allZones = await geofenceZoneService.listZones(tenantId);
      const zonesToUpdate: string[] = [];

      // Find zones along the route
      for (const waypoint of route.waypoints) {
        const matchingZone = allZones.find((zone) => {
          if (zone.geometry.type === "CIRCLE") {
            const coords = zone.geometry.coordinates as {
              center: { lat: number; lng: number };
              radius: number;
            };
            const distance = this.calculateDistance(
              { lat: waypoint.lat, lng: waypoint.lng },
              coords.center,
            );
            return distance <= coords.radius;
          }
          return false;
        });

        if (matchingZone && !zonesToUpdate.includes(matchingZone.id)) {
          zonesToUpdate.push(matchingZone.id);
        }
      }

      // Update zones with driver contact information
      const driverContact = {
        name: driver.name || driver.driverName || "Unknown Driver",
        phone: driver.phone || driver.mobile || driver.contactNumber || "",
        role: "DRIVER",
        assignedAt: new Date().toISOString(),
      };

      for (const zoneId of zonesToUpdate) {
        const zone = await geofenceZoneService.getZone(zoneId, tenantId);
        if (zone) {
          const existingContacts = zone.metadata?.contacts || [];
          // Check if driver already in contacts
          const driverExists = existingContacts.some(
            (c: any) => c.role === "DRIVER" && c.phone === driverContact.phone,
          );

          if (!driverExists) {
            await geofenceZoneService.updateZone(zoneId, tenantId, {
              metadata: {
                ...zone.metadata,
                contacts: [...existingContacts, driverContact],
                assignedDriver: driverContact.name,
                driverAssignedAt: new Date().toISOString(),
              },
            });
          }
        }
      }

      if (zonesToUpdate.length > 0) {
        console.log(
          `✅ Updated ${zonesToUpdate.length} zones with driver information`,
        );
      }
    } catch (error) {
      console.error("Error updating zones with driver info:", error);
    }
  }

  /**
   * Calculate distance between two points (Haversine)
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
    const dLng = ((point2.lng - point1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Return in meters
  }
}

export const transportationIntegrationService =
  new TransportationIntegrationService();

// Auto-initialize on import
if (typeof window === "undefined") {
  transportationIntegrationService.initialize().catch(console.error);
}

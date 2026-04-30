/**
 * WMS Module Integration
 *
 * Integration with Warehouse Management System:
 * - Warehouse zone mapping
 * - Inventory tracking
 * - Loading/unloading events
 * - Facility management
 */

import { eventBus } from "@/lib/services/event-store";
import { geofenceZoneService } from "../zone-service";

class WMSIntegrationService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.subscribeToWMSEvents();
    this.initialized = true;
    console.log("✅ Geofence WMS Integration initialized");
  }

  private subscribeToWMSEvents(): void {
    // Inventory moved - trigger zone entry if applicable
    eventBus.subscribe("wms.inventory.moved", async (event: any) => {
      try {
        const inventory = event.data.inventory;
        const location = event.data.location;

        if (location && location.coordinates) {
          // Check if location is within a zone
          // This would trigger zone entry detection
          await eventBus.publish({
            type: "geofence.detect.request",
            data: {
              location: location.coordinates,
              entityType: "INVENTORY",
              entityId: inventory.id,
              tenantId: event.data.tenantId,
            },
            metadata: {
              source: "wms-integration",
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (error) {
        console.error("Error handling inventory.moved event:", error);
      }
    });

    // Loading completed - update shipment status
    eventBus.subscribe("wms.loading.completed", async (event: any) => {
      try {
        const shipment = event.data.shipment;
        const facility = event.data.facility;

        if (shipment && facility) {
          // Find warehouse zone
          const zones = await geofenceZoneService.listZones(
            event.data.tenantId,
          );
          const warehouseZone = zones.find(
            (z) =>
              z.type === "WAREHOUSE" &&
              z.name.toLowerCase().includes(facility.name?.toLowerCase() || ""),
          );

          if (warehouseZone) {
            // Publish zone exit event (shipment leaving warehouse)
            await eventBus.publish({
              type: "geofence.zone.exit",
              data: {
                event: {
                  id: `exit-${Date.now()}`,
                  eventType: "ZONE_EXIT",
                  zoneId: warehouseZone.id,
                  shipmentId: shipment.id,
                  timestamp: new Date(),
                  location: facility.location || { lat: 0, lng: 0 },
                },
              },
              metadata: {
                source: "wms-integration",
                timestamp: new Date().toISOString(),
              },
            });
          }
        }
      } catch (error) {
        console.error("Error handling loading.completed event:", error);
      }
    });

    // Facility updated - sync zone definitions
    eventBus.subscribe("wms.facility.updated", async (event: any) => {
      try {
        const facility = event.data.facility;

        if (facility && facility.location) {
          // Find or create zone for facility
          const zones = await geofenceZoneService.listZones(
            event.data.tenantId,
          );
          let zone = zones.find((z) => z.name === facility.name);

          if (!zone && facility.location.coordinates) {
            // Create warehouse zone
            zone = await geofenceZoneService.createZone({
              name: facility.name,
              type: "WAREHOUSE",
              geometry: {
                type: "CIRCLE",
                coordinates: {
                  center: facility.location.coordinates,
                  radius: 1000, // 1km default
                },
              },
              metadata: {
                expectedDwellTime: 60,
                maxDwellTime: 180,
              },
              tenantId: event.data.tenantId,
              enabled: true,
            });
          } else if (zone && facility.location.coordinates) {
            // Update zone location if changed
            await geofenceZoneService.updateZone(zone.id, event.data.tenantId, {
              geometry: {
                type: "CIRCLE",
                coordinates: {
                  center: facility.location.coordinates,
                  radius:
                    zone.geometry.type === "CIRCLE"
                      ? (zone.geometry.coordinates as { radius: number }).radius
                      : 1000,
                },
              },
            });
          }
        }
      } catch (error) {
        console.error("Error handling facility.updated event:", error);
      }
    });
  }
}

export const wmsIntegrationService = new WMSIntegrationService();

if (typeof window === "undefined") {
  wmsIntegrationService.initialize().catch(console.error);
}

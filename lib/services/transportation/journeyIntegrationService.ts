/**
 * Journey Workflow Integration Service
 *
 * Integrates transportation shipments with Journey Analysis module
 * for unified physical journey tracking
 */

import type { Shipment } from "@/types/tms";
import type {
  JourneyAnalysis,
  JourneyTouchpoint,
} from "@/types/journey-analysis";

export interface JourneyIntegration {
  shipmentId: string;
  journeyId: string;
  touchpoints: JourneyTouchpoint[];
  currentTouchpoint?: JourneyTouchpoint;
  lastSyncedAt: Date | string;
}

export class JourneyIntegrationService {
  /**
   * Create or link journey for shipment
   */
  async createJourneyForShipment(shipment: Shipment): Promise<string> {
    // In production, call Journey Analysis module API
    // For now, generate journey ID
    const journeyId = `journey-${shipment.id}`;

    // Create touchpoints from shipment tracking events
    const touchpoints = this.createTouchpointsFromShipment(shipment);

    // Store integration (in production, save to database)
    // journeyIntegrations.set(shipment.id, { shipmentId: shipment.id, journeyId, touchpoints, lastSyncedAt: new Date() })

    return journeyId;
  }

  /**
   * Sync shipment with journey
   */
  async syncShipmentWithJourney(
    shipment: Shipment,
    journey: JourneyAnalysis,
  ): Promise<void> {
    // Update shipment with journey data
    shipment.journeyId = journey.routeId;

    // Update current location from journey
    if (journey.touchpoints && journey.touchpoints.length > 0) {
      const currentTouchpoint =
        journey.touchpoints.find((t) => t.status === "IN_PROGRESS") ||
        journey.touchpoints[journey.touchpoints.length - 1];

      if (currentTouchpoint && currentTouchpoint.location) {
        shipment.currentLocation = {
          lat: currentTouchpoint.location.lat,
          lng: currentTouchpoint.location.lng,
          address: currentTouchpoint.location.address || "",
          timestamp: currentTouchpoint.timestamp,
        };
      }
    }
  }

  /**
   * Create touchpoints from shipment tracking events
   */
  private createTouchpointsFromShipment(
    shipment: Shipment,
  ): JourneyTouchpoint[] {
    const touchpoints: JourneyTouchpoint[] = [];

    // Origin touchpoint
    touchpoints.push({
      id: `tp-${shipment.id}-origin`,
      name: "Origin",
      type: "ORIGIN",
      location: {
        lat: shipment.origin.coordinates?.lat || 0,
        lng: shipment.origin.coordinates?.lng || 0,
        address: `${shipment.origin.address.street}, ${shipment.origin.address.city}, ${shipment.origin.address.country}`,
      },
      timestamp: shipment.pickupDate || shipment.createdAt,
      status: "COMPLETED",
      duration: 0,
      metadata: {
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
      },
    });

    // Tracking event touchpoints
    shipment.trackingEvents.forEach((event, index) => {
      if (event.location) {
        touchpoints.push({
          id: `tp-${shipment.id}-${index}`,
          name: event.description || event.status,
          type: this.mapStatusToTouchpointType(event.status),
          location: {
            lat: event.location.lat || 0,
            lng: event.location.lng || 0,
            address: event.location.address,
          },
          timestamp: event.timestamp,
          status: event.status === "DELIVERED" ? "COMPLETED" : "IN_PROGRESS",
          duration: 0,
          metadata: {
            shipmentId: shipment.id,
            eventId: event.id,
            source: event.source,
          },
        });
      }
    });

    // Destination touchpoint
    touchpoints.push({
      id: `tp-${shipment.id}-destination`,
      name: "Destination",
      type: "DESTINATION",
      location: {
        lat: shipment.destination.coordinates?.lat || 0,
        lng: shipment.destination.coordinates?.lng || 0,
        address: `${shipment.destination.address.street}, ${shipment.destination.address.city}, ${shipment.destination.address.country}`,
      },
      timestamp:
        shipment.actualDelivery ||
        shipment.estimatedDelivery ||
        new Date().toISOString(),
      status: shipment.status === "DELIVERED" ? "COMPLETED" : "PENDING",
      duration: 0,
      metadata: {
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber,
      },
    });

    return touchpoints;
  }

  /**
   * Map shipment status to touchpoint type
   */
  private mapStatusToTouchpointType(status: string): JourneyTouchpoint["type"] {
    const statusMap: Record<string, JourneyTouchpoint["type"]> = {
      PICKED_UP: "TRANSPORT",
      IN_TRANSIT: "TRANSPORT",
      AT_PORT: "PORT",
      CUSTOMS_CLEARANCE: "CUSTOMS",
      OUT_FOR_DELIVERY: "TRANSPORT",
      DELIVERED: "DESTINATION",
    };

    return statusMap[status] || "TRANSPORT";
  }

  /**
   * Get unified journey data
   */
  async getUnifiedJourney(
    shipment: Shipment,
  ): Promise<JourneyIntegration | null> {
    if (!shipment.journeyId) {
      return null;
    }

    // In production, fetch from Journey Analysis module
    // For now, create from shipment data
    const touchpoints = this.createTouchpointsFromShipment(shipment);

    return {
      shipmentId: shipment.id,
      journeyId: shipment.journeyId,
      touchpoints,
      currentTouchpoint:
        touchpoints.find((t) => t.status === "IN_PROGRESS") ||
        touchpoints[touchpoints.length - 1],
      lastSyncedAt: new Date().toISOString(),
    };
  }
}

export const journeyIntegrationService = new JourneyIntegrationService();

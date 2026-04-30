/**
 * Location Abnormality & Theft Avoidance Service
 *
 * Compares coordinates from multiple sources (Vehicle GPS vs Driver Phone)
 * to detect abnormalities and potential theft/unauthorized stops.
 */

import { eventBus } from "@/lib/services/event-store";
import { logger } from "@/lib/services/observability/logger";
import { whatsappService } from "@/lib/services/whatsapp/whatsappService";

export interface LocationSource {
  lat: number;
  lng: number;
  timestamp: string;
  source: "VEHICLE_GPS" | "DRIVER_PHONE" | "WHATSAPP" | "GOVERNMENT_WASL";
}

export interface AbnormalityAlert {
  shipmentId: string;
  vehiclePlate: string;
  distanceDelta: number; // meters
  threshold: number;
  locations: LocationSource[];
  timestamp: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export class LocationAbnormalityService {
  private static instance: LocationAbnormalityService;
  private shipmentLocations: Map<string, LocationSource[]> = new Map();
  private readonly DEFAULT_THRESHOLD = 500; // 500 meters

  private constructor() {
    this.setupSubscriptions();
  }

  public static getInstance(): LocationAbnormalityService {
    if (!LocationAbnormalityService.instance) {
      LocationAbnormalityService.instance = new LocationAbnormalityService();
    }
    return LocationAbnormalityService.instance;
  }

  private setupSubscriptions() {
    // Listen for vehicle GPS updates (e.g., from Daleel or IoT)
    eventBus.subscribe(
      "transportation.shipment.location.updated",
      async (event) => {
        const { shipmentId, vehiclePlate, location, source } = event.payload;
        await this.processLocationUpdate(
          shipmentId || vehiclePlate,
          {
            lat: location.lat,
            lng: location.lng,
            timestamp: location.timestamp || new Date().toISOString(),
            source: source === "daleel" ? "GOVERNMENT_WASL" : "VEHICLE_GPS",
          },
          vehiclePlate,
        );
      },
    );

    // Listen for driver phone updates (e.g., from WhatsApp or Driver App)
    eventBus.subscribe(
      "transportation.driver.location.updated",
      async (event) => {
        const { shipmentId, lat, lng, timestamp, source } = event.payload;
        await this.processLocationUpdate(shipmentId, {
          lat,
          lng,
          timestamp: timestamp || new Date().toISOString(),
          source: source === "whatsapp" ? "WHATSAPP" : "DRIVER_PHONE",
        });
      },
    );
  }

  private async processLocationUpdate(
    shipmentId: string,
    location: LocationSource,
    vehiclePlate?: string,
  ) {
    if (!shipmentId) return;

    let history = this.shipmentLocations.get(shipmentId) || [];

    // Add new location and keep only latest from each source
    history = history.filter((l) => l.source !== location.source);
    history.push(location);
    this.shipmentLocations.set(shipmentId, history);

    // If we have at least two different sources, compare them
    if (history.length >= 2) {
      await this.checkAbnormality(shipmentId, history, vehiclePlate);
    }
  }

  private async checkAbnormality(
    shipmentId: string,
    locations: LocationSource[],
    vehiclePlate?: string,
  ) {
    const vehicleLoc = locations.find(
      (l) => l.source === "VEHICLE_GPS" || l.source === "GOVERNMENT_WASL",
    );
    const driverLoc = locations.find(
      (l) => l.source === "DRIVER_PHONE" || l.source === "WHATSAPP",
    );

    if (vehicleLoc && driverLoc) {
      const distance = this.calculateDistance(
        vehicleLoc.lat,
        vehicleLoc.lng,
        driverLoc.lat,
        driverLoc.lng,
      );

      if (distance > this.DEFAULT_THRESHOLD) {
        await this.triggerAlert({
          shipmentId,
          vehiclePlate: vehiclePlate || "UNKNOWN",
          distanceDelta: distance,
          threshold: this.DEFAULT_THRESHOLD,
          locations: [vehicleLoc, driverLoc],
          timestamp: new Date().toISOString(),
          severity: distance > 2000 ? "CRITICAL" : "HIGH",
        });
      }
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async triggerAlert(alert: AbnormalityAlert) {
    logger.warn(
      `[Abnormality Detection] Discrepancy detected for shipment ${alert.shipmentId}: ${alert.distanceDelta.toFixed(0)}m difference!`,
      alert,
    );

    // Publish abnormality event
    await eventBus.publish({
      type: "transportation.security.abnormality_detected",
      payload: alert,
      metadata: {
        timestamp: alert.timestamp,
        source: "location-abnormality-service",
      },
    });

    // Auto-ping driver via WhatsApp for critical alerts
    if (alert.severity === "CRITICAL") {
      try {
        await whatsappService.sendMessage({
          to: "DRIVER_PHONE_PLACEHOLDER", // This would come from shipment data
          body: `⚠️ Security Alert: A significant discrepancy has been detected between your vehicle's GPS and your reported location. Please confirm your status immediately.`,
        });
      } catch (error) {
        logger.error("Failed to send WhatsApp security alert", error as Error);
      }
    }
  }
}

export const locationAbnormalityService =
  LocationAbnormalityService.getInstance();

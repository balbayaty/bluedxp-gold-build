/**
 * Port Geofence Converter Service
 *
 * Converts land port data into geofence zones
 * Handles bulk conversion and import
 *
 * @module geofence
 */

import type { GeofenceZone } from "./types";
import type { LandPortData } from "@/data/geofences/middle-east-land-ports";

// ============================================================================
// CONVERTER SERVICE
// ============================================================================

export class PortGeofenceConverter {
  /**
   * Convert a single land port to geofence zone
   */
  convertPortToGeofence(
    port: LandPortData,
    tenantId: string = "default",
  ): GeofenceZone {
    const zoneId = `geofence-${port.id}`;
    const radius = port.geofenceRadius || 500; // Default 500m radius

    // Convert operating hours to geofence format
    const operatingDays: string[] = [];
    const hours = port.operatingHours;

    if (hours.sunday) operatingDays.push("Sunday");
    if (hours.monday) operatingDays.push("Monday");
    if (hours.tuesday) operatingDays.push("Tuesday");
    if (hours.wednesday) operatingDays.push("Wednesday");
    if (hours.thursday) operatingDays.push("Thursday");
    if (hours.friday) operatingDays.push("Friday");
    if (hours.saturday) operatingDays.push("Saturday");

    // Get first available day's hours as default
    const firstDay =
      hours.monday ||
      hours.sunday ||
      hours.tuesday ||
      hours.wednesday ||
      hours.thursday ||
      hours.friday ||
      hours.saturday;
    const defaultHours = firstDay
      ? { from: firstDay.open, to: firstDay.close }
      : undefined;

    // Build contacts array
    const contacts: Array<{ name: string; phone: string; role: string }> = [];
    if (port.customsOffice) {
      contacts.push({
        name: port.customsOffice,
        phone: port.phone || "N/A",
        role: "customs",
      });
    }

    // Build metadata
    const metadata: GeofenceZone["metadata"] = {
      expectedDwellTime: port.expectedDwellTime,
      maxDwellTime: port.maxDwellTime,
      operatingHours:
        defaultHours && operatingDays.length > 0
          ? {
              from: defaultHours.from,
              to: defaultHours.close,
              days: operatingDays,
            }
          : undefined,
      contacts: contacts.length > 0 ? contacts : undefined,
    };

    // Add port-specific metadata
    const portMetadata: Record<string, unknown> = {
      portCode: port.code,
      portName: port.name,
      portNameLocal: port.nameLocal,
      country: port.country,
      portType: port.type,
      hasCustoms: port.hasCustoms,
      hasImmigration: port.hasImmigration,
      hasQuarantine: port.hasQuarantine,
      hasSecurity: port.hasSecurity,
      hasXRayScanning: port.hasXRayScanning,
      hasWeighbridge: port.hasWeighbridge,
      hasColdStorage: port.hasColdStorage,
      hasDangerousGoodsHandling: port.hasDangerousGoodsHandling,
      hasLivestockHandling: port.hasLivestockHandling,
      averageProcessingTime: port.averageProcessingTime,
      maxVehicleCapacity: port.maxVehicleCapacity,
      reliabilityScore: port.reliabilityScore,
      congestionLevel: port.congestionLevel,
      connectedPort: port.connectedPort,
      distanceToConnected: port.distanceToConnected,
      notes: port.notes,
      timezone: port.operatingHours.timezone,
    };

    // Merge port metadata into zone metadata
    Object.assign(metadata, portMetadata);

    // Create circle geometry (default for land ports)
    const geometry: GeofenceZone["geometry"] = {
      type: "CIRCLE",
      coordinates: {
        center: {
          lat: port.coordinates.lat,
          lng: port.coordinates.lng,
        },
        radius: radius, // meters
      },
    };

    // Determine zone type based on port type
    let zoneType: GeofenceZone["type"] = "BORDER_CROSSING_COMPLEX";
    switch (port.type) {
      case "BORDER_ENTRY_POINT":
        zoneType = "BORDER_ENTRY_POINT";
        break;
      case "BORDER_EXIT_POINT":
        zoneType = "BORDER_EXIT_POINT";
        break;
      case "CUSTOMS_CLEARANCE_FACILITY":
        zoneType = "CUSTOMS_CLEARANCE_FACILITY";
        break;
      case "DRY_PORT":
        zoneType = "DRY_PORT";
        break;
      case "LOGISTICS_HUB":
        zoneType = "LOGISTICS_HUB";
        break;
      default:
        zoneType = "BORDER_CROSSING_COMPLEX";
    }

    const now = new Date();

    return {
      id: zoneId,
      name: port.nameLocal ? `${port.name} (${port.nameLocal})` : port.name,
      type: zoneType,
      geometry,
      metadata,
      tenantId,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Convert multiple ports to geofence zones
   */
  convertPortsToGeofences(
    ports: LandPortData[],
    tenantId: string = "default",
  ): GeofenceZone[] {
    return ports.map((port) => this.convertPortToGeofence(port, tenantId));
  }

  /**
   * Convert ports by country
   */
  convertPortsByCountry(
    countryCode: string,
    ports: LandPortData[],
    tenantId: string = "default",
  ): GeofenceZone[] {
    const countryPorts = ports.filter((port) => port.country === countryCode);
    return this.convertPortsToGeofences(countryPorts, tenantId);
  }

  /**
   * Convert ports by type
   */
  convertPortsByType(
    type: LandPortData["type"],
    ports: LandPortData[],
    tenantId: string = "default",
  ): GeofenceZone[] {
    const typedPorts = ports.filter((port) => port.type === type);
    return this.convertPortsToGeofences(typedPorts, tenantId);
  }

  /**
   * Validate port data before conversion
   */
  validatePort(port: LandPortData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!port.id || port.id.trim().length === 0) {
      errors.push("Port ID is required");
    }

    if (!port.code || port.code.trim().length === 0) {
      errors.push("Port code is required");
    }

    if (!port.name || port.name.trim().length === 0) {
      errors.push("Port name is required");
    }

    if (!port.country || port.country.trim().length === 0) {
      errors.push("Country code is required");
    }

    if (
      !port.coordinates ||
      typeof port.coordinates.lat !== "number" ||
      typeof port.coordinates.lng !== "number"
    ) {
      errors.push("Valid coordinates (lat, lng) are required");
    }

    if (
      port.coordinates &&
      (port.coordinates.lat < -90 || port.coordinates.lat > 90)
    ) {
      errors.push("Latitude must be between -90 and 90");
    }

    if (
      port.coordinates &&
      (port.coordinates.lng < -180 || port.coordinates.lng > 180)
    ) {
      errors.push("Longitude must be between -180 and 180");
    }

    if (!port.operatingHours || !port.operatingHours.timezone) {
      errors.push("Operating hours with timezone are required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate multiple ports
   */
  validatePorts(ports: LandPortData[]): {
    valid: boolean;
    validPorts: LandPortData[];
    invalidPorts: Array<{ port: LandPortData; errors: string[] }>;
  } {
    const validPorts: LandPortData[] = [];
    const invalidPorts: Array<{ port: LandPortData; errors: string[] }> = [];

    for (const port of ports) {
      const validation = this.validatePort(port);
      if (validation.valid) {
        validPorts.push(port);
      } else {
        invalidPorts.push({ port, errors: validation.errors });
      }
    }

    return {
      valid: invalidPorts.length === 0,
      validPorts,
      invalidPorts,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const portGeofenceConverter = new PortGeofenceConverter();

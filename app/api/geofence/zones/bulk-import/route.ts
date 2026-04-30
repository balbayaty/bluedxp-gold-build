/**
 * Bulk Import Geofence Zones API
 *
 * POST /api/geofence/zones/bulk-import
 *
 * Bulk import geofence zones from land port data
 *
 * @module api/geofence
 */

import { NextRequest, NextResponse } from "next/server";
import { geofenceZoneService } from "@/lib/services/geofence";
import { portGeofenceConverter } from "@/lib/services/geofence/port-geofence-converter";
import {
  allMiddleEastLandPorts,
  getLandPortsByCountry,
  getLandPortsByType,
} from "@/data/geofences/middle-east-land-ports";
import type { LandPortData } from "@/data/geofences/middle-east-land-ports";
import { withGeofenceAPI } from "@/lib/services/geofence/apiMiddleware";
import { Action } from "@/types/user";

// ============================================================================
// API HANDLER
// ============================================================================

export const POST = withGeofenceAPI(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const {
        tenantId,
        country,
        portType,
        portIds,
        ports, // Direct port data array
        overwrite = false, // Whether to overwrite existing zones
      } = body;

      if (
        !tenantId ||
        typeof tenantId !== "string" ||
        tenantId.trim().length === 0
      ) {
        return NextResponse.json(
          { error: "tenantId is required" },
          { status: 400 },
        );
      }

      // Determine which ports to import
      let portsToImport: LandPortData[] = [];

      if (ports && Array.isArray(ports)) {
        // Direct port data provided
        portsToImport = ports;
      } else if (portIds && Array.isArray(portIds)) {
        // Specific port IDs provided
        portsToImport = allMiddleEastLandPorts.filter((port) =>
          portIds.includes(port.id),
        );
      } else if (country && typeof country === "string") {
        // Filter by country
        portsToImport = getLandPortsByCountry(country);
      } else if (portType && typeof portType === "string") {
        // Filter by type
        portsToImport = getLandPortsByType(portType as LandPortData["type"]);
      } else {
        // Import all Middle East land ports
        portsToImport = allMiddleEastLandPorts;
      }

      if (portsToImport.length === 0) {
        return NextResponse.json(
          {
            error: "No ports found matching the criteria",
            message:
              "Please provide country, portType, portIds, or ports array",
          },
          { status: 400 },
        );
      }

      // Validate ports
      const validation = portGeofenceConverter.validatePorts(portsToImport);

      if (validation.invalidPorts.length > 0) {
        return NextResponse.json(
          {
            error: "Some ports failed validation",
            invalidPorts: validation.invalidPorts,
            validCount: validation.validPorts.length,
            invalidCount: validation.invalidPorts.length,
          },
          { status: 400 },
        );
      }

      // Convert ports to geofence zones
      const zones = portGeofenceConverter.convertPortsToGeofences(
        validation.validPorts,
        tenantId,
      );

      // Import zones
      const results = {
        created: [] as string[],
        skipped: [] as string[],
        errors: [] as Array<{ zoneId: string; error: string }>,
      };

      for (const zone of zones) {
        try {
          // Check if zone already exists
          const existing = await geofenceZoneService.getZone(zone.id, tenantId);

          if (existing && !overwrite) {
            results.skipped.push(zone.id);
            continue;
          }

          if (existing && overwrite) {
            // Update existing zone
            const updates = {
              name: zone.name,
              type: zone.type,
              geometry: zone.geometry,
              metadata: zone.metadata,
              enabled: zone.enabled,
            };
            await geofenceZoneService.updateZone(zone.id, tenantId, updates);
            results.created.push(zone.id);
          } else {
            // Create new zone
            await geofenceZoneService.createZone(zone);
            results.created.push(zone.id);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          results.errors.push({
            zoneId: zone.id,
            error: errorMessage,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk import completed: ${results.created.length} created, ${results.skipped.length} skipped, ${results.errors.length} errors`,
        data: {
          total: zones.length,
          created: results.created.length,
          skipped: results.skipped.length,
          errors: results.errors.length,
          createdIds: results.created,
          skippedIds: results.skipped,
          errors: results.errors,
        },
      });
    } catch (error) {
      console.error("Error in bulk import:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        {
          error: "Failed to import geofence zones",
          message: errorMessage,
        },
        { status: 500 },
      );
    }
  },
  {
    action: "create" as Action,
    featureId: "geofence",
  },
);

// ============================================================================
// GET HANDLER - List available ports for import
// ============================================================================

export const GET = withGeofenceAPI(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const country = searchParams.get("country");
      const portType = searchParams.get("portType");

      let ports = allMiddleEastLandPorts;

      if (country) {
        ports = getLandPortsByCountry(country);
      }

      if (portType) {
        ports = ports.filter((port) => port.type === portType);
      }

      // Return summary information
      const summary = {
        total: ports.length,
        byCountry: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        ports: ports.map((port) => ({
          id: port.id,
          code: port.code,
          name: port.name,
          nameLocal: port.nameLocal,
          country: port.country,
          type: port.type,
          coordinates: port.coordinates,
          hasCustoms: port.hasCustoms,
          hasImmigration: port.hasImmigration,
          reliabilityScore: port.reliabilityScore,
          congestionLevel: port.congestionLevel,
        })),
      };

      // Calculate statistics
      for (const port of ports) {
        summary.byCountry[port.country] =
          (summary.byCountry[port.country] || 0) + 1;
        summary.byType[port.type] = (summary.byType[port.type] || 0) + 1;
      }

      return NextResponse.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error("Error listing ports:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        {
          error: "Failed to list ports",
          message: errorMessage,
        },
        { status: 500 },
      );
    }
  },
  {
    action: "read" as Action,
    featureId: "geofence",
  },
);

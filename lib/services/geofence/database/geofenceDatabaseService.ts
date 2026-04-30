/**
 * Geofence Database Service
 *
 * Database persistence for geofence module using Prisma
 * Part of Transportation module
 */

import { prisma } from "@/lib/services/database/prismaClient";
import type { GeofenceZone, GeofenceEvent, DwellTimeTracking } from "../types";

// ============================================================================
// ZONE OPERATIONS
// ============================================================================

export class GeofenceDatabaseService {
  /**
   * Create zone
   */
  async createZone(zone: GeofenceZone): Promise<GeofenceZone> {
    const created = await prisma.geofenceZone.create({
      data: {
        id: zone.id,
        tenantId: zone.tenantId,
        name: zone.name,
        type: zone.type,
        geometry: zone.geometry as any,
        metadata: zone.metadata as any,
        enabled: zone.enabled,
        createdAt: zone.createdAt,
        updatedAt: zone.updatedAt,
      },
    });

    return this.mapZoneFromDb(created);
  }

  /**
   * Get zone by ID
   */
  async getZone(id: string, tenantId: string): Promise<GeofenceZone | null> {
    const zone = await prisma.geofenceZone.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    return zone ? this.mapZoneFromDb(zone) : null;
  }

  /**
   * List zones
   */
  async listZones(
    tenantId: string,
    enabled?: boolean,
  ): Promise<GeofenceZone[]> {
    const where: any = { tenantId };
    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    const zones = await prisma.geofenceZone.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return zones.map((z) => this.mapZoneFromDb(z));
  }

  /**
   * Update zone
   */
  async updateZone(
    id: string,
    tenantId: string,
    updates: Partial<GeofenceZone>,
  ): Promise<GeofenceZone> {
    const updated = await prisma.geofenceZone.update({
      where: {
        id,
        tenantId,
      },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.type && { type: updates.type }),
        ...(updates.geometry && { geometry: updates.geometry as any }),
        ...(updates.metadata && { metadata: updates.metadata as any }),
        ...(updates.enabled !== undefined && { enabled: updates.enabled }),
        updatedAt: new Date(),
      },
    });

    return this.mapZoneFromDb(updated);
  }

  /**
   * Delete zone (soft delete by disabling)
   */
  async disableZone(id: string, tenantId: string): Promise<void> {
    await prisma.geofenceZone.update({
      where: {
        id,
        tenantId,
      },
      data: {
        enabled: false,
        updatedAt: new Date(),
      },
    });
  }

  // ============================================================================
  // EVENT OPERATIONS
  // ============================================================================

  /**
   * Create event
   */
  async createEvent(event: GeofenceEvent): Promise<GeofenceEvent> {
    const created = await prisma.geofenceEvent.create({
      data: {
        id: event.id,
        zoneId: event.zoneId,
        shipmentId: event.shipmentId,
        vehicleId: event.vehicleId,
        eventType: event.eventType,
        location: event.location as any,
        timestamp: event.timestamp,
        dwellTime: event.dwellTime,
        metadata: event.metadata as any,
        tenantId: (event.metadata?.tenantId as string) || "default",
      },
    });

    return this.mapEventFromDb(created);
  }

  /**
   * List events
   */
  async listEvents(
    tenantId: string,
    options: {
      zoneId?: string;
      shipmentId?: string;
      vehicleId?: string;
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<GeofenceEvent[]> {
    const where: any = { tenantId };
    if (options.zoneId) where.zoneId = options.zoneId;
    if (options.shipmentId) where.shipmentId = options.shipmentId;
    if (options.vehicleId) where.vehicleId = options.vehicleId;
    if (options.eventType) where.eventType = options.eventType;
    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    const events = await prisma.geofenceEvent.findMany({
      where,
      orderBy: {
        timestamp: "desc",
      },
      take: options.limit || 100,
      skip: options.offset || 0,
    });

    return events.map((e) => this.mapEventFromDb(e));
  }

  /**
   * Get event by ID
   */
  async getEvent(id: string, tenantId: string): Promise<GeofenceEvent | null> {
    const event = await prisma.geofenceEvent.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    return event ? this.mapEventFromDb(event) : null;
  }

  // ============================================================================
  // DWELL TIME TRACKING
  // ============================================================================

  /**
   * Create or update dwell time tracking
   */
  async upsertDwellTracking(
    tracking: DwellTimeTracking,
    tenantId: string,
  ): Promise<DwellTimeTracking> {
    try {
      const trackingId = `dwell-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const data = {
        zoneId: tracking.zoneId,
        shipmentId: tracking.shipmentId,
        entryTime: tracking.entryTime,
        exitTime: tracking.exitTime || null,
        dwellTime: tracking.dwellTime || null,
        status: tracking.status,
        tenantId,
      };

      // Try to find existing by unique constraint
      const existing = await prisma.geofenceDwellTimeTracking.findFirst({
        where: {
          zoneId: tracking.zoneId,
          shipmentId: tracking.shipmentId,
          entryTime: tracking.entryTime,
        },
      });

      let created;
      if (existing) {
        created = await prisma.geofenceDwellTimeTracking.update({
          where: { id: existing.id },
          data,
        });
      } else {
        created = await prisma.geofenceDwellTimeTracking.create({
          data: {
            id: trackingId,
            ...data,
          },
        });
      }

      return {
        zoneId: created.zoneId,
        shipmentId: created.shipmentId,
        entryTime: created.entryTime,
        exitTime: created.exitTime || undefined,
        dwellTime: created.dwellTime || undefined,
        status: created.status as DwellTimeTracking["status"],
      };
    } catch (error) {
      console.warn(
        "⚠️ Geofence: Database error upserting dwell tracking:",
        error,
      );
      throw error;
    }
  }

  /**
   * Get dwell tracking
   */
  async getDwellTracking(
    shipmentId: string,
    zoneId?: string,
  ): Promise<DwellTimeTracking | null> {
    try {
      const where: any = {
        shipmentId,
        status: "ACTIVE",
      };
      if (zoneId) where.zoneId = zoneId;

      const tracking = await prisma.geofenceDwellTimeTracking.findFirst({
        where,
        orderBy: {
          entryTime: "desc",
        },
      });

      if (!tracking) return null;

      return {
        zoneId: tracking.zoneId,
        shipmentId: tracking.shipmentId,
        entryTime: tracking.entryTime,
        exitTime: tracking.exitTime || undefined,
        dwellTime: tracking.dwellTime || undefined,
        status: tracking.status as DwellTimeTracking["status"],
      };
    } catch (error) {
      console.warn(
        "⚠️ Geofence: Database error getting dwell tracking:",
        error,
      );
      return null;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private mapZoneFromDb(dbZone: any): GeofenceZone {
    return {
      id: dbZone.id,
      name: dbZone.name,
      type: dbZone.type as GeofenceZone["type"],
      geometry: dbZone.geometry,
      metadata: dbZone.metadata || {},
      tenantId: dbZone.tenantId,
      enabled: dbZone.enabled,
      createdAt: dbZone.createdAt,
      updatedAt: dbZone.updatedAt,
    };
  }

  private mapEventFromDb(dbEvent: any): GeofenceEvent {
    return {
      id: dbEvent.id,
      zoneId: dbEvent.zoneId,
      shipmentId: dbEvent.shipmentId || undefined,
      vehicleId: dbEvent.vehicleId || undefined,
      eventType: dbEvent.eventType as GeofenceEvent["eventType"],
      location: dbEvent.location,
      timestamp: dbEvent.timestamp,
      dwellTime: dbEvent.dwellTime || undefined,
      metadata: dbEvent.metadata || {},
    };
  }
}

// Singleton instance
export const geofenceDatabaseService = new GeofenceDatabaseService();

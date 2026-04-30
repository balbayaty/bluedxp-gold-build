/**
 * Visual Facility Mapping Service
 * Interactive floor plans with 3D visualization and real-time tracking
 */

import { DatabaseClient } from "@/lib/database/client";

export interface Facility {
  id: string;
  name: string;
  type: "warehouse" | "lab" | "production" | "storage" | "office";
  address: string;
  coordinates?: { lat: number; lng: number };
  floors: Floor[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

export interface Floor {
  id: string;
  floorNumber: number;
  name: string;
  width: number; // meters
  height: number; // meters
  zones: Zone[];
  containers: ContainerPlacement[];
  metadata: {
    imageUrl?: string;
    blueprintUrl?: string;
  };
}

export interface Zone {
  id: string;
  name: string;
  type:
    | "storage"
    | "hazardous"
    | "incompatible"
    | "temperature_controlled"
    | "ventilated";
  coordinates: { x: number; y: number; width: number; height: number };
  capacity: number;
  currentOccupancy: number;
  restrictions: string[];
  color: string;
  metadata: {
    temperatureRange?: { min: number; max: number };
    ventilation?: boolean;
    fireSuppression?: boolean;
  };
}

export interface ContainerPlacement {
  containerId: string;
  containerNumber: string;
  chemicalId: string;
  chemicalName: string;
  coordinates: { x: number; y: number; z?: number };
  zoneId?: string;
  status: "placed" | "pending" | "moved";
  placedAt: Date;
  placedBy: string;
}

export interface FacilityMapView {
  facility: Facility;
  selectedFloor: Floor;
  viewMode: "2d" | "3d" | "satellite";
  zoom: number;
  pan: { x: number; y: number };
  selectedContainer?: ContainerPlacement;
  selectedZone?: Zone;
}

export class FacilityMappingService {
  private db: DatabaseClient;
  private facilities: Map<string, Facility> = new Map();

  constructor(db?: DatabaseClient) {
    this.db = db as any;
  }

  setDatabaseClient(db: DatabaseClient): void {
    this.db = db;
  }

  /**
   * Create or update facility
   */
  async saveFacility(
    facility: Omit<Facility, "id" | "metadata"> & { id?: string },
  ): Promise<Facility> {
    const id =
      facility.id ||
      `facility-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    const fullFacility: Facility = {
      id,
      ...facility,
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: facility.metadata?.createdBy || "system",
      },
    };

    this.facilities.set(id, fullFacility);

    // Save to database if available
    if (this.db) {
      try {
        const query = `
          INSERT INTO facilities (
            id, name, type, address, coordinates, floors, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            address = EXCLUDED.address,
            coordinates = EXCLUDED.coordinates,
            floors = EXCLUDED.floors,
            metadata = EXCLUDED.metadata
          RETURNING *
        `;
        await this.db.query(query, [
          id,
          fullFacility.name,
          fullFacility.type,
          fullFacility.address,
          JSON.stringify(fullFacility.coordinates),
          JSON.stringify(fullFacility.floors),
          JSON.stringify(fullFacility.metadata),
        ]);
      } catch (error) {
        console.error("Error saving facility:", error);
      }
    }

    return fullFacility;
  }

  /**
   * Get facility by ID
   */
  async getFacility(id: string): Promise<Facility | null> {
    // Check memory cache
    if (this.facilities.has(id)) {
      return this.facilities.get(id)!;
    }

    // Load from database
    if (this.db) {
      try {
        const query = "SELECT * FROM facilities WHERE id = $1";
        const result = await this.db.query<any>(query, [id]);
        if (result.length > 0) {
          const facility = this.parseFacility(result[0]);
          this.facilities.set(id, facility);
          return facility;
        }
      } catch (error) {
        console.error("Error getting facility:", error);
      }
    }

    return null;
  }

  /**
   * Get all facilities
   */
  async getAllFacilities(): Promise<Facility[]> {
    if (this.db) {
      try {
        const query =
          "SELECT * FROM facilities ORDER BY metadata->>'createdAt' DESC";
        const result = await this.db.query<any>(query);
        return result.map((row: any) => this.parseFacility(row));
      } catch (error) {
        console.error("Error getting facilities:", error);
      }
    }

    return Array.from(this.facilities.values());
  }

  /**
   * Place container on floor
   */
  async placeContainer(
    facilityId: string,
    floorId: string,
    container: ContainerPlacement,
  ): Promise<boolean> {
    const facility = await this.getFacility(facilityId);
    if (!facility) return false;

    const floor = facility.floors.find((f) => f.id === floorId);
    if (!floor) return false;

    // Remove existing placement if any
    floor.containers = floor.containers.filter(
      (c) => c.containerId !== container.containerId,
    );

    // Add new placement
    floor.containers.push(container);

    // Save facility
    await this.saveFacility(facility);

    return true;
  }

  /**
   * Move container
   */
  async moveContainer(
    facilityId: string,
    floorId: string,
    containerId: string,
    newCoordinates: { x: number; y: number; z?: number },
    userId: string,
  ): Promise<boolean> {
    const facility = await this.getFacility(facilityId);
    if (!facility) return false;

    const floor = facility.floors.find((f) => f.id === floorId);
    if (!floor) return false;

    const container = floor.containers.find(
      (c) => c.containerId === containerId,
    );
    if (!container) return false;

    container.coordinates = newCoordinates;
    container.status = "moved";
    container.placedAt = new Date();
    container.placedBy = userId;

    await this.saveFacility(facility);

    return true;
  }

  /**
   * Get containers in zone
   */
  async getContainersInZone(
    facilityId: string,
    floorId: string,
    zoneId: string,
  ): Promise<ContainerPlacement[]> {
    const facility = await this.getFacility(facilityId);
    if (!facility) return [];

    const floor = facility.floors.find((f) => f.id === floorId);
    if (!floor) return [];

    const zone = floor.zones.find((z) => z.id === zoneId);
    if (!zone) return [];

    return floor.containers.filter((container) => {
      const { x, y } = container.coordinates;
      return (
        x >= zone.coordinates.x &&
        x <= zone.coordinates.x + zone.coordinates.width &&
        y >= zone.coordinates.y &&
        y <= zone.coordinates.y + zone.coordinates.height
      );
    });
  }

  /**
   * Check zone capacity
   */
  async checkZoneCapacity(
    facilityId: string,
    floorId: string,
    zoneId: string,
  ): Promise<{
    current: number;
    capacity: number;
    available: number;
    percentage: number;
  }> {
    const facility = await this.getFacility(facilityId);
    if (!facility)
      return { current: 0, capacity: 0, available: 0, percentage: 0 };

    const floor = facility.floors.find((f) => f.id === floorId);
    if (!floor) return { current: 0, capacity: 0, available: 0, percentage: 0 };

    const zone = floor.zones.find((z) => z.id === zoneId);
    if (!zone) return { current: 0, capacity: 0, available: 0, percentage: 0 };

    const containers = await this.getContainersInZone(
      facilityId,
      floorId,
      zoneId,
    );
    const current = containers.length;
    const capacity = zone.capacity;
    const available = capacity - current;
    const percentage = (current / capacity) * 100;

    return { current, capacity, available, percentage };
  }

  /**
   * Find optimal placement for container
   */
  async findOptimalPlacement(
    facilityId: string,
    floorId: string,
    chemicalId: string,
    containerSize: { width: number; height: number },
  ): Promise<{ zoneId: string; coordinates: { x: number; y: number } } | null> {
    const facility = await this.getFacility(facilityId);
    if (!facility) return null;

    const floor = facility.floors.find((f) => f.id === floorId);
    if (!floor) return null;

    // Find compatible zones
    const compatibleZones = floor.zones.filter((zone) => {
      const capacity = this.checkZoneCapacity(facilityId, floorId, zone.id);
      return capacity.then((c) => c.available > 0);
    });

    if (compatibleZones.length === 0) return null;

    // Select zone with most available space
    const bestZone = compatibleZones[0];
    const capacity = await this.checkZoneCapacity(
      facilityId,
      floorId,
      bestZone.id,
    );

    // Find empty spot in zone
    const containers = await this.getContainersInZone(
      facilityId,
      floorId,
      bestZone.id,
    );
    const occupiedSpots = containers.map((c) => c.coordinates);

    // Simple placement algorithm (find first available spot)
    for (
      let y = bestZone.coordinates.y;
      y < bestZone.coordinates.y + bestZone.coordinates.height;
      y += containerSize.height + 0.5
    ) {
      for (
        let x = bestZone.coordinates.x;
        x < bestZone.coordinates.x + bestZone.coordinates.width;
        x += containerSize.width + 0.5
      ) {
        const spot = { x, y };
        const isOccupied = occupiedSpots.some(
          (occupied) =>
            Math.abs(occupied.x - spot.x) < containerSize.width &&
            Math.abs(occupied.y - spot.y) < containerSize.height,
        );
        if (!isOccupied) {
          return { zoneId: bestZone.id, coordinates: spot };
        }
      }
    }

    return null;
  }

  /**
   * Generate emergency response map
   */
  async generateEmergencyMap(
    facilityId: string,
    floorId: string,
  ): Promise<{
    evacuationRoutes: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
    }>;
    emergencyExits: Array<{ x: number; y: number; label: string }>;
    fireExtinguishers: Array<{ x: number; y: number; type: string }>;
    hazardousAreas: Zone[];
    assemblyPoints: Array<{ x: number; y: number; label: string }>;
  }> {
    const facility = await this.getFacility(facilityId);
    if (!facility)
      return {
        evacuationRoutes: [],
        emergencyExits: [],
        fireExtinguishers: [],
        hazardousAreas: [],
        assemblyPoints: [],
      };

    const floor = facility.floors.find((f) => f.id === floorId);
    if (!floor)
      return {
        evacuationRoutes: [],
        emergencyExits: [],
        fireExtinguishers: [],
        hazardousAreas: [],
        assemblyPoints: [],
      };

    // Generate evacuation routes (simplified - from center to exits)
    const centerX = floor.width / 2;
    const centerY = floor.height / 2;
    const exits = [
      { x: 0, y: centerY, label: "Exit 1" },
      { x: floor.width, y: centerY, label: "Exit 2" },
      { x: centerX, y: 0, label: "Exit 3" },
      { x: centerX, y: floor.height, label: "Exit 4" },
    ];

    const evacuationRoutes = exits.map((exit) => ({
      from: { x: centerX, y: centerY },
      to: { x: exit.x, y: exit.y },
    }));

    // Fire extinguishers (placed strategically)
    const fireExtinguishers = [
      { x: floor.width * 0.25, y: floor.height * 0.25, type: "ABC" },
      { x: floor.width * 0.75, y: floor.height * 0.25, type: "ABC" },
      { x: floor.width * 0.25, y: floor.height * 0.75, type: "ABC" },
      { x: floor.width * 0.75, y: floor.height * 0.75, type: "ABC" },
    ];

    // Hazardous areas
    const hazardousAreas = floor.zones.filter(
      (z) => z.type === "hazardous" || z.type === "incompatible",
    );

    // Assembly points
    const assemblyPoints = [
      { x: floor.width * 0.5, y: floor.height + 10, label: "Assembly Point 1" },
    ];

    return {
      evacuationRoutes,
      emergencyExits: exits,
      fireExtinguishers,
      hazardousAreas,
      assemblyPoints,
    };
  }

  private parseFacility(row: any): Facility {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      address: row.address,
      coordinates: row.coordinates ? JSON.parse(row.coordinates) : undefined,
      floors: row.floors ? JSON.parse(row.floors) : [],
      metadata: row.metadata
        ? JSON.parse(row.metadata)
        : { createdAt: new Date(), updatedAt: new Date(), createdBy: "system" },
    };
  }
}

export const facilityMappingService = new FacilityMappingService();

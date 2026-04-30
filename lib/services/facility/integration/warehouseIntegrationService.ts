/**
 * Warehouse Integration Service
 *
 * Intelligent integration between Facility Management and Warehouse Management:
 * - Facility ↔ Warehouse mapping
 * - Asset ↔ Location mapping
 * - Space Management ↔ Warehouse Zones
 * - Maintenance ↔ Warehouse Equipment
 * - Work Orders ↔ Warehouse Operations
 * - Real-time synchronization
 */

import type {
  Facility,
  FacilityAsset,
  Space,
  MaintenanceTask,
  WorkOrder,
} from "@/types/facility";
import type {
  StorageLocation,
  LocationAddress,
} from "@/types/warehouseLocation";
import type { WarehouseArea } from "@/types/warehouseArea";
import type { Warehouse } from "@/types/tenant";
import { eventBus } from "@/lib/services/event-store";

export interface FacilityWarehouseMapping {
  facilityId: string;
  facilityName: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  mappingType: "one-to-one" | "one-to-many" | "many-to-one";
  isPrimary?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetLocationMapping {
  assetId: string;
  assetName: string;
  facilityId: string;
  warehouseId?: string;
  storageLocationId?: string;
  locationCode?: string; // e.g., "A-01-02-03"
  zoneId?: string;
  zoneName?: string;
  coordinates?: {
    x: number;
    y: number;
    z?: number; // floor/level
  };
  mappedAt: Date;
  updatedAt: Date;
}

export interface SpaceZoneMapping {
  spaceId: string;
  spaceName: string;
  facilityId: string;
  warehouseId: string;
  zoneId: string;
  zoneName: string;
  zoneType?: string;
  utilization?: {
    current: number;
    capacity: number;
    percentage: number;
  };
  mappedAt: Date;
  updatedAt: Date;
}

export interface MaintenanceEquipmentMapping {
  maintenanceTaskId: string;
  assetId: string;
  warehouseId?: string;
  locationId?: string;
  equipmentType?: string;
  impactOnOperations?: "none" | "low" | "medium" | "high" | "critical";
  requiresShutdown?: boolean;
  affectedZones?: string[];
  mappedAt: Date;
}

export interface WorkOrderWarehouseMapping {
  workOrderId: string;
  facilityId: string;
  warehouseId?: string;
  locationId?: string;
  zoneId?: string;
  operationType?:
    | "inbound"
    | "outbound"
    | "internal"
    | "maintenance"
    | "inspection";
  priority: "low" | "medium" | "high" | "critical";
  estimatedDuration?: number; // minutes
  requiresWarehouseAccess?: boolean;
  mappedAt: Date;
}

export class WarehouseIntegrationService {
  private facilityWarehouseMappings: Map<string, FacilityWarehouseMapping[]> =
    new Map();
  private assetLocationMappings: Map<string, AssetLocationMapping> = new Map();
  private spaceZoneMappings: Map<string, SpaceZoneMapping> = new Map();
  private maintenanceEquipmentMappings: Map<
    string,
    MaintenanceEquipmentMapping
  > = new Map();
  private workOrderWarehouseMappings: Map<string, WorkOrderWarehouseMapping> =
    new Map();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Subscribe to warehouse events
    eventBus.subscribe(
      "warehouse.location.created",
      this.handleLocationCreated.bind(this),
    );
    eventBus.subscribe(
      "warehouse.location.updated",
      this.handleLocationUpdated.bind(this),
    );
    eventBus.subscribe(
      "warehouse.zone.created",
      this.handleZoneCreated.bind(this),
    );
    eventBus.subscribe(
      "warehouse.zone.updated",
      this.handleZoneUpdated.bind(this),
    );
    eventBus.subscribe(
      "warehouse.created",
      this.handleWarehouseCreated.bind(this),
    );
    eventBus.subscribe(
      "warehouse.updated",
      this.handleWarehouseUpdated.bind(this),
    );

    // Subscribe to facility events
    eventBus.subscribe(
      "facility.asset.created",
      this.handleAssetCreated.bind(this),
    );
    eventBus.subscribe(
      "facility.asset.updated",
      this.handleAssetUpdated.bind(this),
    );
    eventBus.subscribe(
      "facility.space.created",
      this.handleSpaceCreated.bind(this),
    );
    eventBus.subscribe(
      "facility.maintenance.created",
      this.handleMaintenanceCreated.bind(this),
    );
    eventBus.subscribe(
      "facility.workorder.created",
      this.handleWorkOrderCreated.bind(this),
    );
  }

  // ============================================================================
  // FACILITY ↔ WAREHOUSE MAPPING
  // ============================================================================

  /**
   * Map a facility to one or more warehouses
   */
  async mapFacilityToWarehouse(
    facilityId: string,
    warehouseId: string,
    options?: {
      isPrimary?: boolean;
      mappingType?: "one-to-one" | "one-to-many" | "many-to-one";
    },
  ): Promise<FacilityWarehouseMapping> {
    const mapping: FacilityWarehouseMapping = {
      facilityId,
      facilityName: "", // Will be populated from facility service
      warehouseId,
      warehouseName: "", // Will be populated from warehouse service
      warehouseCode: "", // Will be populated from warehouse service
      mappingType: options?.mappingType || "one-to-one",
      isPrimary: options?.isPrimary ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existing = this.facilityWarehouseMappings.get(facilityId) || [];
    existing.push(mapping);
    this.facilityWarehouseMappings.set(facilityId, existing);

    // Emit event
    await eventBus.publish("facility.warehouse.mapped", {
      facilityId,
      warehouseId,
      mapping,
    });

    return mapping;
  }

  /**
   * Get warehouses for a facility
   */
  async getWarehousesForFacility(
    facilityId: string,
  ): Promise<FacilityWarehouseMapping[]> {
    return this.facilityWarehouseMappings.get(facilityId) || [];
  }

  /**
   * Get facilities for a warehouse
   */
  async getFacilitiesForWarehouse(
    warehouseId: string,
  ): Promise<FacilityWarehouseMapping[]> {
    const allMappings: FacilityWarehouseMapping[] = [];
    for (const mappings of this.facilityWarehouseMappings.values()) {
      allMappings.push(
        ...mappings.filter((m) => m.warehouseId === warehouseId),
      );
    }
    return allMappings;
  }

  // ============================================================================
  // ASSET ↔ LOCATION MAPPING
  // ============================================================================

  /**
   * Map an asset to a warehouse location
   */
  async mapAssetToLocation(
    assetId: string,
    options: {
      facilityId: string;
      warehouseId?: string;
      storageLocationId?: string;
      locationCode?: string;
      zoneId?: string;
      coordinates?: { x: number; y: number; z?: number };
    },
  ): Promise<AssetLocationMapping> {
    const mapping: AssetLocationMapping = {
      assetId,
      assetName: "", // Will be populated from asset service
      facilityId: options.facilityId,
      warehouseId: options.warehouseId,
      storageLocationId: options.storageLocationId,
      locationCode: options.locationCode,
      zoneId: options.zoneId,
      coordinates: options.coordinates,
      mappedAt: new Date(),
      updatedAt: new Date(),
    };

    this.assetLocationMappings.set(assetId, mapping);

    // Emit event
    await eventBus.publish("facility.asset.location.mapped", {
      assetId,
      mapping,
    });

    return mapping;
  }

  /**
   * Get location mapping for an asset
   */
  async getAssetLocation(
    assetId: string,
  ): Promise<AssetLocationMapping | undefined> {
    return this.assetLocationMappings.get(assetId);
  }

  /**
   * Get all assets at a warehouse location
   */
  async getAssetsAtLocation(
    warehouseId: string,
    locationId?: string,
    zoneId?: string,
  ): Promise<AssetLocationMapping[]> {
    const assets: AssetLocationMapping[] = [];
    for (const mapping of this.assetLocationMappings.values()) {
      if (mapping.warehouseId === warehouseId) {
        if (locationId && mapping.storageLocationId === locationId) {
          assets.push(mapping);
        } else if (zoneId && mapping.zoneId === zoneId) {
          assets.push(mapping);
        } else if (!locationId && !zoneId) {
          assets.push(mapping);
        }
      }
    }
    return assets;
  }

  /**
   * Find assets by location code (e.g., "A-01-02-03")
   */
  async findAssetsByLocationCode(
    locationCode: string,
  ): Promise<AssetLocationMapping[]> {
    const assets: AssetLocationMapping[] = [];
    for (const mapping of this.assetLocationMappings.values()) {
      if (mapping.locationCode === locationCode) {
        assets.push(mapping);
      }
    }
    return assets;
  }

  // ============================================================================
  // SPACE ↔ ZONE MAPPING
  // ============================================================================

  /**
   * Map a facility space to a warehouse zone
   */
  async mapSpaceToZone(
    spaceId: string,
    options: {
      facilityId: string;
      warehouseId: string;
      zoneId: string;
      zoneName: string;
      zoneType?: string;
      utilization?: { current: number; capacity: number; percentage: number };
    },
  ): Promise<SpaceZoneMapping> {
    const mapping: SpaceZoneMapping = {
      spaceId,
      spaceName: "", // Will be populated from space service
      facilityId: options.facilityId,
      warehouseId: options.warehouseId,
      zoneId: options.zoneId,
      zoneName: options.zoneName,
      zoneType: options.zoneType,
      utilization: options.utilization,
      mappedAt: new Date(),
      updatedAt: new Date(),
    };

    this.spaceZoneMappings.set(spaceId, mapping);

    // Emit event
    await eventBus.publish("facility.space.zone.mapped", {
      spaceId,
      mapping,
    });

    return mapping;
  }

  /**
   * Get zone mapping for a space
   */
  async getSpaceZone(spaceId: string): Promise<SpaceZoneMapping | undefined> {
    return this.spaceZoneMappings.get(spaceId);
  }

  /**
   * Get all spaces in a warehouse zone
   */
  async getSpacesInZone(
    warehouseId: string,
    zoneId: string,
  ): Promise<SpaceZoneMapping[]> {
    const spaces: SpaceZoneMapping[] = [];
    for (const mapping of this.spaceZoneMappings.values()) {
      if (mapping.warehouseId === warehouseId && mapping.zoneId === zoneId) {
        spaces.push(mapping);
      }
    }
    return spaces;
  }

  // ============================================================================
  // MAINTENANCE ↔ EQUIPMENT MAPPING
  // ============================================================================

  /**
   * Map a maintenance task to warehouse equipment/location
   */
  async mapMaintenanceToWarehouse(
    maintenanceTaskId: string,
    options: {
      assetId: string;
      warehouseId?: string;
      locationId?: string;
      equipmentType?: string;
      impactOnOperations?: "none" | "low" | "medium" | "high" | "critical";
      requiresShutdown?: boolean;
      affectedZones?: string[];
    },
  ): Promise<MaintenanceEquipmentMapping> {
    const mapping: MaintenanceEquipmentMapping = {
      maintenanceTaskId,
      assetId: options.assetId,
      warehouseId: options.warehouseId,
      locationId: options.locationId,
      equipmentType: options.equipmentType,
      impactOnOperations: options.impactOnOperations || "none",
      requiresShutdown: options.requiresShutdown || false,
      affectedZones: options.affectedZones || [],
      mappedAt: new Date(),
    };

    this.maintenanceEquipmentMappings.set(maintenanceTaskId, mapping);

    // Emit event
    await eventBus.publish("facility.maintenance.warehouse.mapped", {
      maintenanceTaskId,
      mapping,
    });

    return mapping;
  }

  /**
   * Get warehouse mapping for a maintenance task
   */
  async getMaintenanceWarehouseMapping(
    maintenanceTaskId: string,
  ): Promise<MaintenanceEquipmentMapping | undefined> {
    return this.maintenanceEquipmentMappings.get(maintenanceTaskId);
  }

  /**
   * Get all maintenance tasks affecting a warehouse location
   */
  async getMaintenanceAtLocation(
    warehouseId: string,
    locationId?: string,
  ): Promise<MaintenanceEquipmentMapping[]> {
    const tasks: MaintenanceEquipmentMapping[] = [];
    for (const mapping of this.maintenanceEquipmentMappings.values()) {
      if (mapping.warehouseId === warehouseId) {
        if (!locationId || mapping.locationId === locationId) {
          tasks.push(mapping);
        }
      }
    }
    return tasks;
  }

  // ============================================================================
  // WORK ORDER ↔ WAREHOUSE OPERATIONS MAPPING
  // ============================================================================

  /**
   * Map a work order to warehouse operations
   */
  async mapWorkOrderToWarehouse(
    workOrderId: string,
    options: {
      facilityId: string;
      warehouseId?: string;
      locationId?: string;
      zoneId?: string;
      operationType?:
        | "inbound"
        | "outbound"
        | "internal"
        | "maintenance"
        | "inspection";
      priority: "low" | "medium" | "high" | "critical";
      estimatedDuration?: number;
      requiresWarehouseAccess?: boolean;
    },
  ): Promise<WorkOrderWarehouseMapping> {
    const mapping: WorkOrderWarehouseMapping = {
      workOrderId,
      facilityId: options.facilityId,
      warehouseId: options.warehouseId,
      locationId: options.locationId,
      zoneId: options.zoneId,
      operationType: options.operationType,
      priority: options.priority,
      estimatedDuration: options.estimatedDuration,
      requiresWarehouseAccess: options.requiresWarehouseAccess || false,
      mappedAt: new Date(),
    };

    this.workOrderWarehouseMappings.set(workOrderId, mapping);

    // Emit event
    await eventBus.publish("facility.workorder.warehouse.mapped", {
      workOrderId,
      mapping,
    });

    return mapping;
  }

  /**
   * Get warehouse mapping for a work order
   */
  async getWorkOrderWarehouseMapping(
    workOrderId: string,
  ): Promise<WorkOrderWarehouseMapping | undefined> {
    return this.workOrderWarehouseMappings.get(workOrderId);
  }

  /**
   * Get all work orders for a warehouse
   */
  async getWorkOrdersForWarehouse(
    warehouseId: string,
    filters?: {
      operationType?: string;
      priority?: string;
      status?: string;
    },
  ): Promise<WorkOrderWarehouseMapping[]> {
    const workOrders: WorkOrderWarehouseMapping[] = [];
    for (const mapping of this.workOrderWarehouseMappings.values()) {
      if (mapping.warehouseId === warehouseId) {
        if (!filters || this.matchesFilters(mapping, filters)) {
          workOrders.push(mapping);
        }
      }
    }
    return workOrders;
  }

  private matchesFilters(
    mapping: WorkOrderWarehouseMapping,
    filters: { operationType?: string; priority?: string; status?: string },
  ): boolean {
    if (
      filters.operationType &&
      mapping.operationType !== filters.operationType
    ) {
      return false;
    }
    if (filters.priority && mapping.priority !== filters.priority) {
      return false;
    }
    return true;
  }

  // ============================================================================
  // INTELLIGENT QUERIES & ANALYTICS
  // ============================================================================

  /**
   * Get comprehensive view of facility-warehouse integration
   */
  async getFacilityWarehouseOverview(facilityId: string): Promise<{
    facility: Facility | null;
    warehouses: FacilityWarehouseMapping[];
    assets: AssetLocationMapping[];
    spaces: SpaceZoneMapping[];
    maintenance: MaintenanceEquipmentMapping[];
    workOrders: WorkOrderWarehouseMapping[];
  }> {
    return {
      facility: null, // Would fetch from facility service
      warehouses: await this.getWarehousesForFacility(facilityId),
      assets: Array.from(this.assetLocationMappings.values()).filter(
        (a) => a.facilityId === facilityId,
      ),
      spaces: Array.from(this.spaceZoneMappings.values()).filter(
        (s) => s.facilityId === facilityId,
      ),
      maintenance: Array.from(
        this.maintenanceEquipmentMappings.values(),
      ).filter((m) => {
        const assetMapping = this.assetLocationMappings.get(m.assetId);
        return assetMapping?.facilityId === facilityId;
      }),
      workOrders: Array.from(this.workOrderWarehouseMappings.values()).filter(
        (wo) => wo.facilityId === facilityId,
      ),
    };
  }

  /**
   * Get warehouse impact analysis for facility operations
   */
  async getWarehouseImpactAnalysis(warehouseId: string): Promise<{
    totalAssets: number;
    totalSpaces: number;
    activeMaintenance: number;
    activeWorkOrders: number;
    criticalMaintenance: number;
    affectedZones: string[];
    operationalImpact: "none" | "low" | "medium" | "high" | "critical";
  }> {
    const assets = await this.getAssetsAtLocation(warehouseId);
    const maintenance = await this.getMaintenanceAtLocation(warehouseId);
    const workOrders = await this.getWorkOrdersForWarehouse(warehouseId);

    const criticalMaintenance = maintenance.filter(
      (m) =>
        m.impactOnOperations === "critical" || m.impactOnOperations === "high",
    );

    const affectedZones = new Set<string>();
    maintenance.forEach((m) => {
      m.affectedZones?.forEach((z) => affectedZones.add(z));
    });

    let operationalImpact: "none" | "low" | "medium" | "high" | "critical" =
      "none";
    if (criticalMaintenance.length > 0) {
      operationalImpact = "critical";
    } else if (
      maintenance.filter((m) => m.impactOnOperations === "medium").length > 0
    ) {
      operationalImpact = "medium";
    } else if (maintenance.length > 0) {
      operationalImpact = "low";
    }

    return {
      totalAssets: assets.length,
      totalSpaces: Array.from(this.spaceZoneMappings.values()).filter(
        (s) => s.warehouseId === warehouseId,
      ).length,
      activeMaintenance: maintenance.length,
      activeWorkOrders: workOrders.length,
      criticalMaintenance: criticalMaintenance.length,
      affectedZones: Array.from(affectedZones),
      operationalImpact,
    };
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  private async handleLocationCreated(event: any) {
    // Auto-map assets if location matches facility asset location
    // This is intelligent auto-mapping
  }

  private async handleLocationUpdated(event: any) {
    // Update asset location mappings if needed
  }

  private async handleZoneCreated(event: any) {
    // Auto-map spaces if zone matches facility space
  }

  private async handleZoneUpdated(event: any) {
    // Update space zone mappings if needed
  }

  private async handleWarehouseCreated(event: any) {
    // Auto-suggest facility-warehouse mapping
  }

  private async handleWarehouseUpdated(event: any) {
    // Update facility-warehouse mappings if needed
  }

  private async handleAssetCreated(event: any) {
    // Auto-suggest location mapping if asset has location info
  }

  private async handleAssetUpdated(event: any) {
    // Update location mapping if asset location changed
  }

  private async handleSpaceCreated(event: any) {
    // Auto-suggest zone mapping if space matches warehouse zone
  }

  private async handleMaintenanceCreated(event: any) {
    // Auto-suggest warehouse mapping if maintenance affects warehouse equipment
  }

  private async handleWorkOrderCreated(event: any) {
    // Auto-suggest warehouse mapping if work order is for warehouse operations
  }
}

// Export singleton instance
export const warehouseIntegrationService = new WarehouseIntegrationService();

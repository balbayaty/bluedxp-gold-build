/**
 * Warehouse Facility Management Integration Service
 * Integrates warehouse operations with facility management services
 */

import { getFacilityIntegrationService } from "@/lib/services/facility/integration/facilityIntegrationService";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// TYPES
// ============================================================================

export interface WarehouseFacilityData {
  warehouseId: string;
  facilityId?: string;
  assets: WarehouseFacilityAsset[];
  maintenance: WarehouseMaintenanceRecord[];
  energy: WarehouseEnergyData[];
  space: WarehouseSpaceData;
}

export interface WarehouseFacilityAsset {
  id: string;
  warehouseId: string;
  assetId: string;
  type: "equipment" | "infrastructure" | "system" | "other";
  name: string;
  status: "operational" | "maintenance" | "out_of_service";
  lastMaintenance?: string;
  nextMaintenance?: string;
}

export interface WarehouseMaintenanceRecord {
  id: string;
  warehouseId: string;
  assetId: string;
  type: "preventive" | "corrective" | "inspection";
  scheduledDate: string;
  completedDate?: string;
  status: "scheduled" | "in_progress" | "completed" | "overdue";
  cost?: number;
}

export interface WarehouseEnergyData {
  date: string;
  consumption: number;
  cost?: number;
  type: "electricity" | "water" | "gas" | "other";
}

export interface WarehouseSpaceData {
  totalArea: number;
  usedArea: number;
  availableArea: number;
  utilizationRate: number;
  zones: Array<{
    zoneId: string;
    area: number;
    utilization: number;
  }>;
}

export interface WarehouseFacilityStats {
  totalAssets: number;
  assetsByStatus: Record<string, number>;
  maintenanceScheduled: number;
  maintenanceOverdue: number;
  energyConsumption: number;
  spaceUtilization: number;
  costThisMonth: number;
}

// ============================================================================
// SERVICE
// ============================================================================

class WarehouseFacilityManagementIntegration {
  private facilityData: Map<string, WarehouseFacilityData> = new Map();
  private assets: Map<string, WarehouseFacilityAsset> = new Map();
  private maintenance: Map<string, WarehouseMaintenanceRecord> = new Map();
  private facilityIntegrationService = getFacilityIntegrationService();

  /**
   * Get facility data for warehouse
   */
  async getFacilityData(warehouseId: string): Promise<WarehouseFacilityData> {
    // Check if we have cached data
    let data = this.facilityData.get(warehouseId);

    if (!data) {
      // Create new facility data structure
      data = {
        warehouseId,
        assets: [],
        maintenance: [],
        energy: [],
        space: {
          totalArea: 0,
          usedArea: 0,
          availableArea: 0,
          utilizationRate: 0,
          zones: [],
        },
      };
      this.facilityData.set(warehouseId, data);
    }

    // Enhance with facility integration service data if available
    try {
      // Facility integration service is available for future enhancements
      // For now, return mock/enhanced data
    } catch (error) {
      console.error("Error fetching facility data:", error);
    }

    return data;
  }

  /**
   * Register warehouse asset
   */
  async registerAsset(
    warehouseId: string,
    asset: {
      assetId: string;
      type: WarehouseFacilityAsset["type"];
      name: string;
      status?: WarehouseFacilityAsset["status"];
    },
  ): Promise<WarehouseFacilityAsset> {
    const warehouseAsset: WarehouseFacilityAsset = {
      id: `wfa-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      assetId: asset.assetId,
      type: asset.type,
      name: asset.name,
      status: asset.status || "operational",
    };

    this.assets.set(warehouseAsset.id, warehouseAsset);

    // Update facility data
    const facilityData = await this.getFacilityData(warehouseId);
    facilityData.assets.push(warehouseAsset);
    this.facilityData.set(warehouseId, facilityData);

    // Publish event
    await eventBus.publish({
      id: `warehouse-asset-registered-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.asset.registered",
      aggregateId: warehouseId,
      payload: {
        assetId: warehouseAsset.id,
        type: asset.type,
      },
      timestamp: new Date().toISOString(),
    });

    return warehouseAsset;
  }

  /**
   * Schedule maintenance
   */
  async scheduleMaintenance(
    warehouseId: string,
    maintenance: {
      assetId: string;
      type: WarehouseMaintenanceRecord["type"];
      scheduledDate: string;
      cost?: number;
    },
  ): Promise<WarehouseMaintenanceRecord> {
    const record: WarehouseMaintenanceRecord = {
      id: `wfm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      warehouseId,
      assetId: maintenance.assetId,
      type: maintenance.type,
      scheduledDate: maintenance.scheduledDate,
      status: "scheduled",
      cost: maintenance.cost,
    };

    this.maintenance.set(record.id, record);

    // Update facility data
    const facilityData = await this.getFacilityData(warehouseId);
    facilityData.maintenance.push(record);
    this.facilityData.set(warehouseId, facilityData);

    // Publish event
    await eventBus.publish({
      id: `warehouse-maintenance-scheduled-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.maintenance.scheduled",
      aggregateId: warehouseId,
      payload: {
        maintenanceId: record.id,
        assetId: maintenance.assetId,
        type: maintenance.type,
      },
      timestamp: new Date().toISOString(),
    });

    return record;
  }

  /**
   * Get facility statistics
   */
  async getStats(warehouseId: string): Promise<WarehouseFacilityStats> {
    const facilityData = await this.getFacilityData(warehouseId);
    const warehouseAssets = Array.from(this.assets.values()).filter(
      (a) => a.warehouseId === warehouseId,
    );
    const warehouseMaintenance = Array.from(this.maintenance.values()).filter(
      (m) => m.warehouseId === warehouseId,
    );

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats: WarehouseFacilityStats = {
      totalAssets: warehouseAssets.length,
      assetsByStatus: {},
      maintenanceScheduled: warehouseMaintenance.filter(
        (m) => m.status === "scheduled",
      ).length,
      maintenanceOverdue: warehouseMaintenance.filter((m) => {
        if (m.status === "scheduled" && m.scheduledDate) {
          return new Date(m.scheduledDate) < now;
        }
        return false;
      }).length,
      energyConsumption: facilityData.energy.reduce(
        (sum, e) => sum + e.consumption,
        0,
      ),
      spaceUtilization: facilityData.space.utilizationRate,
      costThisMonth: warehouseMaintenance
        .filter((m) => {
          if (m.completedDate) {
            return new Date(m.completedDate) >= thisMonth;
          }
          return false;
        })
        .reduce((sum, m) => sum + (m.cost || 0), 0),
    };

    // Count assets by status
    warehouseAssets.forEach((asset) => {
      stats.assetsByStatus[asset.status] =
        (stats.assetsByStatus[asset.status] || 0) + 1;
    });

    return stats;
  }

  /**
   * Update space utilization
   */
  async updateSpaceUtilization(
    warehouseId: string,
    space: WarehouseSpaceData,
  ): Promise<void> {
    const facilityData = await this.getFacilityData(warehouseId);
    facilityData.space = space;
    this.facilityData.set(warehouseId, facilityData);

    // Publish event
    await eventBus.publish({
      id: `warehouse-space-updated-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type: "warehouse.space.updated",
      aggregateId: warehouseId,
      payload: {
        utilizationRate: space.utilizationRate,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export const warehouseFacilityManagementIntegration =
  new WarehouseFacilityManagementIntegration();

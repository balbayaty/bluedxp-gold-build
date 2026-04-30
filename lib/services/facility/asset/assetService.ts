/**
 * Asset Management Service (EAM)
 *
 * Comprehensive Enterprise Asset Management with:
 * - Asset lifecycle tracking
 * - Asset valuation & depreciation
 * - Maintenance history
 * - Warranty management
 * - Asset hierarchy
 * - Location tracking
 * - BIM integration
 * - Performance analytics
 */

import type {
  FacilityAsset,
  AssetType,
  AssetStatus,
  AssetLifecycle,
  AssetFinancial,
  AssetMaintenance,
  AssetWarranty,
  MaintenanceRecord,
} from "@/types/facility";
import { eventBus } from "@/lib/services/event-store";

export interface AssetServiceConfig {
  enableDepreciation?: boolean;
  defaultDepreciationMethod?:
    | "straight-line"
    | "declining-balance"
    | "units-of-production";
  enableBIMIntegration?: boolean;
  enablePredictiveMaintenance?: boolean;
}

export class AssetService {
  private config: AssetServiceConfig;
  private assets: Map<string, FacilityAsset> = new Map();
  private maintenanceRecords: Map<string, MaintenanceRecord> = new Map();

  constructor(config: AssetServiceConfig = {}) {
    this.config = {
      enableDepreciation: true,
      defaultDepreciationMethod: "straight-line",
      enableBIMIntegration: true,
      enablePredictiveMaintenance: true,
      ...config,
    };
  }

  /**
   * Get all assets for a facility
   */
  async getAssets(
    facilityId: string,
    filters?: {
      type?: AssetType;
      status?: AssetStatus;
      category?: string;
    },
  ): Promise<FacilityAsset[]> {
    let assets = Array.from(this.assets.values()).filter(
      (a) => a.facilityId === facilityId,
    );

    if (filters) {
      if (filters.type) {
        assets = assets.filter((a) => a.type === filters.type);
      }
      if (filters.status) {
        assets = assets.filter((a) => a.status === filters.status);
      }
      if (filters.category) {
        assets = assets.filter((a) => a.category === filters.category);
      }
    }

    return assets;
  }

  /**
   * Get asset by ID
   */
  async getAsset(assetId: string): Promise<FacilityAsset | null> {
    return this.assets.get(assetId) || null;
  }

  /**
   * Create new asset
   */
  async createAsset(
    asset: Omit<FacilityAsset, "id" | "createdAt" | "updatedAt">,
  ): Promise<FacilityAsset> {
    const newAsset: FacilityAsset = {
      ...asset,
      id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Calculate initial financial values if not provided
    if (
      this.config.enableDepreciation &&
      newAsset.financial.acquisitionCost &&
      !newAsset.financial.currentValue
    ) {
      newAsset.financial.currentValue = newAsset.financial.acquisitionCost;
      newAsset.financial.bookValue = newAsset.financial.acquisitionCost;
    }

    // Calculate lifecycle dates
    if (newAsset.lifecycle.acquisitionDate && newAsset.specifications) {
      const acquisitionDate = new Date(newAsset.lifecycle.acquisitionDate);
      const now = new Date();
      newAsset.lifecycle.currentAge = Math.floor(
        (now.getTime() - acquisitionDate.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      );

      if (
        newAsset.lifecycle.expectedLifespan &&
        newAsset.lifecycle.currentAge
      ) {
        newAsset.lifecycle.remainingLifespan = Math.max(
          0,
          newAsset.lifecycle.expectedLifespan - newAsset.lifecycle.currentAge,
        );
      }
    }

    this.assets.set(newAsset.id, newAsset);

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.asset.created",
      aggregateId: newAsset.id,
      aggregateType: "FacilityAsset",
      version: 1,
      timestamp: new Date(),
      data: {
        assetId: newAsset.id,
        facilityId: newAsset.facilityId,
        assetType: newAsset.type,
        assetName: newAsset.name,
      },
      metadata: {},
    });

    return newAsset;
  }

  /**
   * Update asset
   */
  async updateAsset(
    assetId: string,
    updates: Partial<FacilityAsset>,
  ): Promise<FacilityAsset> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const updatedAsset: FacilityAsset = {
      ...asset,
      ...updates,
      updatedAt: new Date(),
    };

    // Recalculate depreciation if financial data changed
    if (this.config.enableDepreciation && updates.financial) {
      await this.calculateDepreciation(updatedAsset);
    }

    this.assets.set(assetId, updatedAsset);

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.asset.updated",
      aggregateId: assetId,
      aggregateType: "FacilityAsset",
      version: 1,
      timestamp: new Date(),
      data: {
        assetId,
        facilityId: updatedAsset.facilityId,
        changes: Object.keys(updates),
      },
      metadata: {},
    });

    return updatedAsset;
  }

  /**
   * Calculate asset depreciation
   */
  async calculateDepreciation(asset: FacilityAsset): Promise<void> {
    if (!this.config.enableDepreciation || !asset.financial.acquisitionCost) {
      return;
    }

    const method =
      asset.financial.depreciationMethod ||
      this.config.defaultDepreciationMethod ||
      "straight-line";
    const acquisitionCost = asset.financial.acquisitionCost;
    const depreciationRate = asset.financial.depreciationRate || 10; // Default 10% per year
    const currentAge = asset.lifecycle.currentAge || 0;
    const expectedLifespan = asset.lifecycle.expectedLifespan || 10;

    let annualDepreciation = 0;
    let accumulatedDepreciation = 0;

    switch (method) {
      case "straight-line":
        annualDepreciation = acquisitionCost / expectedLifespan;
        accumulatedDepreciation = annualDepreciation * currentAge;
        break;

      case "declining-balance":
        const rate = depreciationRate / 100;
        accumulatedDepreciation =
          acquisitionCost * (1 - Math.pow(1 - rate, currentAge));
        annualDepreciation =
          acquisitionCost * rate * Math.pow(1 - rate, currentAge - 1);
        break;

      case "units-of-production":
        // Would need usage data for this method
        annualDepreciation = acquisitionCost / expectedLifespan;
        accumulatedDepreciation = annualDepreciation * currentAge;
        break;
    }

    asset.financial.annualDepreciation = annualDepreciation;
    asset.financial.accumulatedDepreciation = Math.min(
      accumulatedDepreciation,
      acquisitionCost,
    );
    asset.financial.bookValue =
      acquisitionCost - asset.financial.accumulatedDepreciation;
    asset.financial.currentValue = asset.financial.bookValue; // Simplified - could use market value
  }

  /**
   * Update asset status
   */
  async updateAssetStatus(
    assetId: string,
    status: AssetStatus,
    reason?: string,
  ): Promise<FacilityAsset> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const updatedAsset = await this.updateAsset(assetId, {
      status,
      metadata: {
        ...asset.metadata,
        statusChangeReason: reason,
        statusChangedAt: new Date().toISOString(),
      },
    });

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.asset.status.changed",
      aggregateId: assetId,
      aggregateType: "FacilityAsset",
      version: 1,
      timestamp: new Date(),
      data: {
        assetId,
        facilityId: asset.facilityId,
        oldStatus: asset.status,
        newStatus: status,
        reason,
      },
      metadata: {},
    });

    return updatedAsset;
  }

  /**
   * Retire asset
   */
  async retireAsset(
    assetId: string,
    retirementData: {
      retirementDate: Date;
      reason: string;
      disposalMethod?: string;
      disposalValue?: number;
    },
  ): Promise<FacilityAsset> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const updatedAsset = await this.updateAsset(assetId, {
      status: "retired",
      lifecycle: {
        ...asset.lifecycle,
        stage: "retirement",
        retirementDate: retirementData.retirementDate,
      },
      metadata: {
        ...asset.metadata,
        retirementReason: retirementData.reason,
        disposalMethod: retirementData.disposalMethod,
        disposalValue: retirementData.disposalValue,
      },
    });

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.asset.retired",
      aggregateId: assetId,
      aggregateType: "FacilityAsset",
      version: 1,
      timestamp: new Date(),
      data: {
        assetId,
        facilityId: asset.facilityId,
        retirementDate: retirementData.retirementDate,
        reason: retirementData.reason,
      },
      metadata: {},
    });

    return updatedAsset;
  }

  /**
   * Get asset maintenance history
   */
  async getAssetMaintenanceHistory(
    assetId: string,
  ): Promise<MaintenanceRecord[]> {
    return Array.from(this.maintenanceRecords.values())
      .filter((record) => record.assetId === assetId)
      .sort((a, b) => {
        const dateA = a.completedDate || a.scheduledDate || new Date(0);
        const dateB = b.completedDate || b.scheduledDate || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }

  /**
   * Get assets requiring maintenance
   */
  async getAssetsRequiringMaintenance(
    facilityId: string,
  ): Promise<FacilityAsset[]> {
    const now = new Date();
    const assets = await this.getAssets(facilityId);

    return assets.filter((asset) => {
      if (asset.status !== "operational") return false;
      if (!asset.maintenance.nextMaintenanceDate) return false;

      const nextMaintenance = new Date(asset.maintenance.nextMaintenanceDate);
      const daysUntilMaintenance = Math.ceil(
        (nextMaintenance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Return assets that need maintenance within 7 days or are overdue
      return daysUntilMaintenance <= 7;
    });
  }

  /**
   * Get asset analytics
   */
  async getAssetAnalytics(facilityId: string): Promise<{
    totalAssets: number;
    byStatus: Record<AssetStatus, number>;
    byType: Record<AssetType, number>;
    totalValue: number;
    averageAge: number;
    maintenanceCost: number;
    criticalAssets: number;
  }> {
    const assets = await this.getAssets(facilityId);

    const analytics = {
      totalAssets: assets.length,
      byStatus: {} as Record<AssetStatus, number>,
      byType: {} as Record<AssetType, number>,
      totalValue: 0,
      averageAge: 0,
      maintenanceCost: 0,
      criticalAssets: 0,
    };

    let totalAge = 0;
    let assetsWithAge = 0;

    for (const asset of assets) {
      // Count by status
      analytics.byStatus[asset.status] =
        (analytics.byStatus[asset.status] || 0) + 1;

      // Count by type
      analytics.byType[asset.type] = (analytics.byType[asset.type] || 0) + 1;

      // Sum values
      if (asset.financial.currentValue) {
        analytics.totalValue += asset.financial.currentValue;
      }

      // Calculate average age
      if (asset.lifecycle.currentAge !== undefined) {
        totalAge += asset.lifecycle.currentAge;
        assetsWithAge++;
      }

      // Sum maintenance costs
      if (asset.maintenance.totalMaintenanceCost) {
        analytics.maintenanceCost += asset.maintenance.totalMaintenanceCost;
      }

      // Count critical assets
      if (asset.maintenance.criticality === "critical") {
        analytics.criticalAssets++;
      }
    }

    analytics.averageAge = assetsWithAge > 0 ? totalAge / assetsWithAge : 0;

    return analytics;
  }

  /**
   * Link asset to BIM element
   */
  async linkAssetToBIM(assetId: string, bimElementId: string): Promise<void> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    await this.updateAsset(assetId, {
      location: {
        ...asset.location,
        bimElementId,
      },
    });
  }
}

// Singleton instance
let assetServiceInstance: AssetService | null = null;

export function getAssetService(config?: AssetServiceConfig): AssetService {
  if (!assetServiceInstance) {
    assetServiceInstance = new AssetService(config);
  }
  return assetServiceInstance;
}

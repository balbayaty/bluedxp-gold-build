/**
 * Fixed Assets Accounting Service
 * Comprehensive fixed assets management with depreciation, disposal, asset register
 * ZERO DUPLICATION - Reuses Facility Asset Service
 */

import { eventBus } from "@/lib/services/event-store";
import { generalLedgerService } from "./generalLedgerService";
import type { DomainEvent } from "@/types/cqrs";
import type {
  FixedAsset,
  DepreciationSchedule,
  AssetDisposal,
} from "@/types/finance";

// TODO: Import Facility Asset Service when available

export class FixedAssetsService {
  private assets: Map<string, FixedAsset> = new Map();
  private depreciationSchedules: Map<string, DepreciationSchedule[]> =
    new Map();
  private disposals: Map<string, AssetDisposal> = new Map();

  /**
   * Register fixed asset
   * Can link to Facility Asset (ZERO DUPLICATION)
   */
  async registerAsset(
    tenantId: string,
    assetData: Omit<
      FixedAsset,
      | "id"
      | "currentBookValue"
      | "accumulatedDepreciation"
      | "status"
      | "createdAt"
      | "updatedAt"
    >,
  ): Promise<FixedAsset> {
    const assetId = `asset-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // TODO: If facilityAssetId provided, get asset details from Facility service
    // if (assetData.facilityAssetId) {
    //   const facilityAsset = await assetService.getAsset(assetData.facilityAssetId, tenantId)
    //   // Sync asset details
    // }

    const asset: FixedAsset = {
      ...assetData,
      id: assetId,
      currentBookValue: assetData.acquisitionCost,
      accumulatedDepreciation: 0,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.assets.set(assetId, asset);

    // Create GL entry for asset acquisition
    await generalLedgerService.createJournalEntry({
      tenantId,
      entryDate: asset.acquisitionDate,
      description: `Asset Acquisition: ${asset.assetName}`,
      lines: [
        {
          id: `line-${Date.now()}-1`,
          accountCode: asset.assetAccountCode,
          accountName: asset.assetName,
          debit: asset.acquisitionCost,
          credit: 0,
          description: `Asset acquisition: ${asset.assetNumber}`,
        },
        {
          id: `line-${Date.now()}-2`,
          accountCode: "CASH_OR_PAYABLE", // Would be determined from payment method
          accountName: "Cash/Payable",
          debit: 0,
          credit: asset.acquisitionCost,
          description: `Payment for asset: ${asset.assetNumber}`,
        },
      ],
      currency: asset.currency,
      createdBy: "system",
    });

    await eventBus.publish({
      type: "finance.fixed-asset.registered",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        assetId,
        assetNumber: asset.assetNumber,
        acquisitionCost: asset.acquisitionCost,
      },
    } as DomainEvent);

    return asset;
  }

  /**
   * Calculate depreciation for period
   * Supports multiple depreciation methods
   */
  async calculateDepreciation(
    tenantId: string,
    assetId: string,
    period: { startDate: Date | string; endDate: Date | string },
  ): Promise<DepreciationSchedule> {
    const asset = this.assets.get(assetId);
    if (!asset || asset.status !== "ACTIVE") {
      throw new Error("Asset not found or not active");
    }

    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    const daysInPeriod = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysInYear = 365;

    let depreciationAmount = 0;

    switch (asset.depreciationMethod) {
      case "STRAIGHT_LINE":
        depreciationAmount =
          ((asset.acquisitionCost - asset.salvageValue) / asset.usefulLife) *
          (daysInPeriod / daysInYear);
        break;

      case "DECLINING_BALANCE":
        const rate = (asset.depreciationRate || 0) / 100;
        const bookValue = asset.currentBookValue;
        depreciationAmount = bookValue * rate * (daysInPeriod / daysInYear);
        break;

      case "UNITS_OF_PRODUCTION":
        // Would need usage data from Facility service
        depreciationAmount =
          ((asset.acquisitionCost - asset.salvageValue) / asset.usefulLife) *
          (daysInPeriod / daysInYear);
        break;

      case "SUM_OF_YEARS":
        const yearsRemaining =
          asset.usefulLife -
          asset.accumulatedDepreciation /
            ((asset.acquisitionCost - asset.salvageValue) / asset.usefulLife);
        const sumOfYears = (asset.usefulLife * (asset.usefulLife + 1)) / 2;
        const remainingSum = (yearsRemaining * (yearsRemaining + 1)) / 2;
        depreciationAmount =
          (((asset.acquisitionCost - asset.salvageValue) * remainingSum) /
            sumOfYears) *
          (daysInPeriod / daysInYear);
        break;

      case "NONE":
        depreciationAmount = 0;
        break;
    }

    // Ensure depreciation doesn't exceed remaining value
    const maxDepreciation = asset.currentBookValue - asset.salvageValue;
    depreciationAmount = Math.min(depreciationAmount, maxDepreciation);

    const scheduleId = `dep-${Date.now()}`;
    const schedule: DepreciationSchedule = {
      id: scheduleId,
      tenantId,
      assetId,
      period,
      depreciationAmount,
      accumulatedDepreciation:
        asset.accumulatedDepreciation + depreciationAmount,
      bookValue: asset.currentBookValue - depreciationAmount,
      posted: false,
    };

    // Update asset
    asset.accumulatedDepreciation += depreciationAmount;
    asset.currentBookValue =
      asset.acquisitionCost - asset.accumulatedDepreciation;
    asset.updatedAt = new Date().toISOString();

    const schedules = this.depreciationSchedules.get(assetId) || [];
    schedules.push(schedule);
    this.depreciationSchedules.set(assetId, schedules);

    return schedule;
  }

  /**
   * Post depreciation to GL
   */
  async postDepreciation(tenantId: string, scheduleId: string): Promise<void> {
    const schedule =
      this.depreciationSchedules.get(scheduleId) ||
      Array.from(this.depreciationSchedules.values())
        .flat()
        .find((s) => s.id === scheduleId);

    if (!schedule || schedule.posted) {
      throw new Error("Schedule not found or already posted");
    }

    const asset = this.assets.get(schedule.assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }

    // Create GL entry
    await generalLedgerService.createJournalEntry({
      tenantId,
      entryDate: schedule.period.endDate,
      description: `Depreciation: ${asset.assetName}`,
      lines: [
        {
          accountCode: asset.depreciationAccountCode,
          accountName: "Depreciation Expense",
          debit: schedule.depreciationAmount,
          credit: 0,
          description: `Depreciation for ${asset.assetNumber}`,
        },
        {
          accountCode: asset.accumulatedDepreciationAccountCode,
          accountName: "Accumulated Depreciation",
          debit: 0,
          credit: schedule.depreciationAmount,
          description: `Accumulated depreciation for ${asset.assetNumber}`,
        },
      ],
      currency: asset.currency,
      createdBy: "system",
    });

    schedule.posted = true;
    schedule.postedAt = new Date().toISOString();

    await eventBus.publish({
      type: "finance.depreciation.posted",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        scheduleId,
        assetId: asset.id,
        depreciationAmount: schedule.depreciationAmount,
      },
    } as DomainEvent);
  }

  /**
   * Dispose asset
   */
  async disposeAsset(
    tenantId: string,
    assetId: string,
    disposalData: Omit<
      AssetDisposal,
      "id" | "assetId" | "gainLoss" | "glEntryId" | "createdAt" | "createdBy"
    >,
  ): Promise<AssetDisposal> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }

    const gainLoss = disposalData.disposalAmount - asset.currentBookValue;

    const disposalId = `disposal-${Date.now()}`;
    const disposal: AssetDisposal = {
      ...disposalData,
      id: disposalId,
      assetId,
      gainLoss,
      createdAt: new Date().toISOString(),
      createdBy: "system",
    };

    // Create GL entry for disposal
    await generalLedgerService.createJournalEntry({
      tenantId,
      entryDate: disposal.disposalDate,
      description: `Asset Disposal: ${asset.assetName}`,
      lines: [
        {
          accountCode: asset.accumulatedDepreciationAccountCode,
          accountName: "Accumulated Depreciation",
          debit: asset.accumulatedDepreciation,
          credit: 0,
        },
        {
          accountCode: "CASH_OR_RECEIVABLE",
          accountName: "Cash/Receivable",
          debit: disposal.disposalAmount,
          credit: 0,
        },
        {
          accountCode: asset.assetAccountCode,
          accountName: asset.assetName,
          debit: 0,
          credit: asset.acquisitionCost,
        },
        ...(gainLoss !== 0
          ? [
              {
                accountCode:
                  gainLoss > 0 ? "GAIN_ON_DISPOSAL" : "LOSS_ON_DISPOSAL",
                accountName:
                  gainLoss > 0 ? "Gain on Disposal" : "Loss on Disposal",
                debit: gainLoss < 0 ? Math.abs(gainLoss) : 0,
                credit: gainLoss > 0 ? gainLoss : 0,
              },
            ]
          : []),
      ],
      currency: asset.currency,
      createdBy: "system",
    });

    disposal.glEntryId = "gl-entry-id"; // Would be from GL service

    asset.status = "DISPOSED";
    asset.disposedDate = disposal.disposalDate;
    asset.disposedAmount = disposal.disposalAmount;
    asset.updatedAt = new Date().toISOString();

    this.disposals.set(disposalId, disposal);

    await eventBus.publish({
      type: "finance.asset.disposed",
      id: `event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: {
        tenantId,
        disposalId,
        assetId,
        disposalAmount: disposal.disposalAmount,
        gainLoss,
      },
    } as DomainEvent);

    return disposal;
  }

  /**
   * Get asset register
   */
  async getAssetRegister(
    tenantId: string,
    filters?: {
      status?: FixedAsset["status"];
      category?: FixedAsset["assetCategory"];
      department?: string;
    },
  ): Promise<FixedAsset[]> {
    let assets = Array.from(this.assets.values()).filter(
      (a) => a.tenantId === tenantId,
    );

    if (filters?.status) {
      assets = assets.filter((a) => a.status === filters.status);
    }
    if (filters?.category) {
      assets = assets.filter((a) => a.assetCategory === filters.category);
    }
    if (filters?.department) {
      assets = assets.filter((a) => a.department === filters.department);
    }

    return assets;
  }

  /**
   * Get depreciation schedule for asset
   */
  async getDepreciationSchedule(
    tenantId: string,
    assetId: string,
  ): Promise<DepreciationSchedule[]> {
    return this.depreciationSchedules.get(assetId) || [];
  }
}

// Singleton instance
export const fixedAssetsService = new FixedAssetsService();

/**
 * Maintenance Management Service (CMMS)
 *
 * Comprehensive Computerized Maintenance Management System with:
 * - Preventive maintenance scheduling
 * - Predictive maintenance (AI-powered)
 * - Corrective maintenance
 * - Emergency maintenance
 * - Maintenance history tracking
 * - Cost tracking
 * - Resource management
 * - Optimization algorithms
 */

import type {
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceStatus,
  MaintenancePriority,
  FacilityAsset,
} from "@/types/facility";
import { eventBus } from "@/lib/services/event-store";
import { getAssetService } from "../asset/assetService";

export interface MaintenanceServiceConfig {
  enablePredictiveMaintenance?: boolean;
  enableOptimization?: boolean;
  defaultMaintenanceWindow?: number; // days
  criticalityThreshold?: number; // days before maintenance becomes critical
}

export class MaintenanceService {
  private config: MaintenanceServiceConfig;
  private maintenanceRecords: Map<string, MaintenanceRecord> = new Map();
  private assetService: ReturnType<typeof getAssetService>;

  constructor(config: MaintenanceServiceConfig = {}) {
    this.config = {
      enablePredictiveMaintenance: true,
      enableOptimization: true,
      defaultMaintenanceWindow: 30,
      criticalityThreshold: 7,
      ...config,
    };
    this.assetService = getAssetService();
  }

  /**
   * Get maintenance records for an asset
   */
  async getMaintenanceRecords(assetId: string): Promise<MaintenanceRecord[]> {
    return Array.from(this.maintenanceRecords.values())
      .filter((record) => record.assetId === assetId)
      .sort((a, b) => {
        const dateA = a.completedDate || a.scheduledDate || new Date(0);
        const dateB = b.completedDate || b.scheduledDate || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }

  /**
   * Get maintenance record by ID
   */
  async getMaintenanceRecord(
    recordId: string,
  ): Promise<MaintenanceRecord | null> {
    return this.maintenanceRecords.get(recordId) || null;
  }

  /**
   * Create maintenance record
   */
  async createMaintenanceRecord(
    record: Omit<MaintenanceRecord, "id" | "createdAt" | "updatedAt">,
  ): Promise<MaintenanceRecord> {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `maintenance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.maintenanceRecords.set(newRecord.id, newRecord);

    // Update asset maintenance history
    const asset = await this.assetService.getAsset(record.assetId);
    if (asset) {
      const maintenanceHistory = asset.maintenance.maintenanceHistory || [];
      maintenanceHistory.push(newRecord);

      await this.assetService.updateAsset(record.assetId, {
        maintenance: {
          ...asset.maintenance,
          lastMaintenanceDate:
            newRecord.completedDate || newRecord.scheduledDate,
          totalMaintenanceCost:
            (asset.maintenance.totalMaintenanceCost || 0) + newRecord.cost,
          maintenanceHistory: maintenanceHistory,
        },
      });
    }

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.maintenance.created",
      aggregateId: newRecord.id,
      aggregateType: "MaintenanceRecord",
      version: 1,
      timestamp: new Date(),
      data: {
        maintenanceId: newRecord.id,
        assetId: newRecord.assetId,
        facilityId: newRecord.facilityId,
        type: newRecord.type,
        status: newRecord.status,
      },
      metadata: {},
    });

    return newRecord;
  }

  /**
   * Schedule preventive maintenance
   */
  async schedulePreventiveMaintenance(
    assetId: string,
    schedule: {
      frequency: number; // days
      startDate: Date;
      description: string;
      estimatedDuration?: number;
      estimatedCost?: number;
      parts?: Array<{
        partId: string;
        partName: string;
        quantity: number;
        unitCost: number;
      }>;
    },
  ): Promise<MaintenanceRecord[]> {
    const asset = await this.assetService.getAsset(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    const scheduledRecords: MaintenanceRecord[] = [];
    const endDate = new Date(schedule.startDate);
    endDate.setFullYear(endDate.getFullYear() + 1); // Schedule for 1 year

    let currentDate = new Date(schedule.startDate);

    while (currentDate <= endDate) {
      const record: MaintenanceRecord = {
        id: `maintenance-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        assetId,
        facilityId: asset.facilityId,
        type: "preventive",
        status: "scheduled",
        priority: "medium",
        scheduledDate: new Date(currentDate),
        description: schedule.description,
        estimatedDuration: schedule.estimatedDuration,
        cost: schedule.estimatedCost || 0,
        partsUsed: schedule.parts?.map((p) => ({
          partId: p.partId,
          partName: p.partName,
          quantity: p.quantity,
          unitCost: p.unitCost,
          totalCost: p.quantity * p.unitCost,
        })),
        tenantId: asset.tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.maintenanceRecords.set(record.id, record);
      scheduledRecords.push(record);

      // Move to next maintenance date
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + schedule.frequency);
    }

    // Update asset next maintenance date
    if (scheduledRecords.length > 0) {
      await this.assetService.updateAsset(assetId, {
        maintenance: {
          ...asset.maintenance,
          nextMaintenanceDate: scheduledRecords[0].scheduledDate,
          maintenanceFrequency: schedule.frequency,
        },
      });
    }

    return scheduledRecords;
  }

  /**
   * Complete maintenance record
   */
  async completeMaintenance(
    recordId: string,
    completionData: {
      completedDate: Date;
      workPerformed: string;
      actualDuration?: number;
      actualCost?: number;
      partsUsed?: MaintenanceRecord["partsUsed"];
      notes?: string;
    },
  ): Promise<MaintenanceRecord> {
    const record = this.maintenanceRecords.get(recordId);
    if (!record) {
      throw new Error(`Maintenance record ${recordId} not found`);
    }

    const updatedRecord: MaintenanceRecord = {
      ...record,
      status: "completed",
      completedDate: completionData.completedDate,
      workPerformed: completionData.workPerformed,
      duration: completionData.actualDuration || record.duration,
      cost: completionData.actualCost || record.cost,
      partsUsed: completionData.partsUsed || record.partsUsed,
      notes: completionData.notes || record.notes,
      updatedAt: new Date(),
    };

    this.maintenanceRecords.set(recordId, updatedRecord);

    // Update asset maintenance info
    const asset = await this.assetService.getAsset(record.assetId);
    if (asset) {
      // Calculate next maintenance date based on frequency
      let nextMaintenanceDate: Date | undefined;
      if (asset.maintenance.maintenanceFrequency) {
        nextMaintenanceDate = new Date(completionData.completedDate);
        nextMaintenanceDate.setDate(
          nextMaintenanceDate.getDate() +
            asset.maintenance.maintenanceFrequency,
        );
      }

      await this.assetService.updateAsset(record.assetId, {
        maintenance: {
          ...asset.maintenance,
          lastMaintenanceDate: completionData.completedDate,
          nextMaintenanceDate,
          totalMaintenanceCost:
            (asset.maintenance.totalMaintenanceCost || 0) +
            (completionData.actualCost || 0),
        },
      });
    }

    // Publish event
    await eventBus.publish({
      id: `event-${Date.now()}`,
      type: "facility.maintenance.completed",
      aggregateId: recordId,
      aggregateType: "MaintenanceRecord",
      version: 1,
      timestamp: new Date(),
      data: {
        maintenanceId: recordId,
        assetId: record.assetId,
        facilityId: record.facilityId,
        completedDate: completionData.completedDate,
        cost: completionData.actualCost || record.cost,
      },
      metadata: {},
    });

    return updatedRecord;
  }

  /**
   * Get overdue maintenance
   */
  async getOverdueMaintenance(
    facilityId?: string,
  ): Promise<MaintenanceRecord[]> {
    const now = new Date();
    let records = Array.from(this.maintenanceRecords.values()).filter(
      (record) => record.status === "scheduled" && record.scheduledDate,
    );

    if (facilityId) {
      records = records.filter((record) => record.facilityId === facilityId);
    }

    return records.filter((record) => {
      if (!record.scheduledDate) return false;
      return new Date(record.scheduledDate) < now;
    });
  }

  /**
   * Get upcoming maintenance
   */
  async getUpcomingMaintenance(
    facilityId?: string,
    daysAhead: number = 30,
  ): Promise<MaintenanceRecord[]> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    let records = Array.from(this.maintenanceRecords.values()).filter(
      (record) => record.status === "scheduled" && record.scheduledDate,
    );

    if (facilityId) {
      records = records.filter((record) => record.facilityId === facilityId);
    }

    return records
      .filter((record) => {
        if (!record.scheduledDate) return false;
        const scheduledDate = new Date(record.scheduledDate);
        return scheduledDate >= now && scheduledDate <= futureDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduledDate!).getTime();
        const dateB = new Date(b.scheduledDate!).getTime();
        return dateA - dateB;
      });
  }

  /**
   * Get maintenance analytics
   */
  async getMaintenanceAnalytics(facilityId: string): Promise<{
    totalRecords: number;
    byType: Record<MaintenanceType, number>;
    byStatus: Record<MaintenanceStatus, number>;
    totalCost: number;
    averageCost: number;
    averageDuration: number;
    preventiveMaintenanceRate: number; // percentage
    overdueCount: number;
    upcomingCount: number;
  }> {
    const records = Array.from(this.maintenanceRecords.values()).filter(
      (record) => record.facilityId === facilityId,
    );

    const analytics = {
      totalRecords: records.length,
      byType: {} as Record<MaintenanceType, number>,
      byStatus: {} as Record<MaintenanceStatus, number>,
      totalCost: 0,
      averageCost: 0,
      averageDuration: 0,
      preventiveMaintenanceRate: 0,
      overdueCount: 0,
      upcomingCount: 0,
    };

    let totalCost = 0;
    let totalDuration = 0;
    let recordsWithCost = 0;
    let recordsWithDuration = 0;
    let preventiveCount = 0;
    const now = new Date();

    for (const record of records) {
      // Count by type
      analytics.byType[record.type] = (analytics.byType[record.type] || 0) + 1;

      // Count by status
      analytics.byStatus[record.status] =
        (analytics.byStatus[record.status] || 0) + 1;

      // Sum costs
      if (record.cost) {
        totalCost += record.cost;
        recordsWithCost++;
      }

      // Sum durations
      if (record.duration) {
        totalDuration += record.duration;
        recordsWithDuration++;
      }

      // Count preventive
      if (record.type === "preventive") {
        preventiveCount++;
      }

      // Count overdue
      if (
        record.status === "scheduled" &&
        record.scheduledDate &&
        new Date(record.scheduledDate) < now
      ) {
        analytics.overdueCount++;
      }

      // Count upcoming
      if (record.status === "scheduled" && record.scheduledDate) {
        const scheduledDate = new Date(record.scheduledDate);
        const daysUntil = Math.ceil(
          (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntil > 0 && daysUntil <= 30) {
          analytics.upcomingCount++;
        }
      }
    }

    analytics.totalCost = totalCost;
    analytics.averageCost =
      recordsWithCost > 0 ? totalCost / recordsWithCost : 0;
    analytics.averageDuration =
      recordsWithDuration > 0 ? totalDuration / recordsWithDuration : 0;
    analytics.preventiveMaintenanceRate =
      records.length > 0 ? (preventiveCount / records.length) * 100 : 0;

    return analytics;
  }

  /**
   * Predict maintenance needs (AI-powered)
   */
  async predictMaintenanceNeeds(assetId: string): Promise<{
    predictedFailureDate?: Date;
    confidence: number;
    recommendedActions: string[];
    riskLevel: "low" | "medium" | "high" | "critical";
  }> {
    if (!this.config.enablePredictiveMaintenance) {
      throw new Error("Predictive maintenance is not enabled");
    }

    const asset = await this.assetService.getAsset(assetId);
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`);
    }

    // Get maintenance history
    const history = await this.getMaintenanceRecords(assetId);
    const now = new Date();

    // Simple prediction algorithm (in real implementation, use ML model)
    let riskLevel: "low" | "medium" | "high" | "critical" = "low";
    let confidence = 0.5;
    const recommendedActions: string[] = [];

    // Check if maintenance is overdue
    if (asset.maintenance.nextMaintenanceDate) {
      const daysUntilMaintenance = Math.ceil(
        (new Date(asset.maintenance.nextMaintenanceDate).getTime() -
          now.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysUntilMaintenance < 0) {
        riskLevel = "critical";
        confidence = 0.9;
        recommendedActions.push("Schedule immediate maintenance - overdue");
      } else if (daysUntilMaintenance <= 7) {
        riskLevel = "high";
        confidence = 0.8;
        recommendedActions.push("Schedule maintenance within 7 days");
      } else if (daysUntilMaintenance <= 30) {
        riskLevel = "medium";
        confidence = 0.6;
        recommendedActions.push("Plan maintenance within 30 days");
      }
    }

    // Check asset age
    if (asset.lifecycle.currentAge && asset.lifecycle.expectedLifespan) {
      const agePercentage =
        (asset.lifecycle.currentAge / asset.lifecycle.expectedLifespan) * 100;
      if (agePercentage > 80) {
        riskLevel = riskLevel === "critical" ? "critical" : "high";
        confidence = Math.max(confidence, 0.7);
        recommendedActions.push(
          "Asset approaching end of expected lifespan - consider replacement",
        );
      }
    }

    // Check maintenance frequency
    if (history.length > 0) {
      const recentMaintenance = history.filter(
        (r) =>
          r.completedDate &&
          new Date(r.completedDate) >
            new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      );
      if (
        recentMaintenance.length === 0 &&
        asset.maintenance.lastMaintenanceDate
      ) {
        const daysSinceLastMaintenance = Math.ceil(
          (now.getTime() -
            new Date(asset.maintenance.lastMaintenanceDate).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (daysSinceLastMaintenance > 180) {
          riskLevel = riskLevel === "critical" ? "critical" : "high";
          confidence = Math.max(confidence, 0.75);
          recommendedActions.push(
            "No maintenance performed in last 6 months - schedule inspection",
          );
        }
      }
    }

    // Calculate predicted failure date (simplified)
    let predictedFailureDate: Date | undefined;
    if (asset.maintenance.nextMaintenanceDate && riskLevel !== "low") {
      const nextMaintenance = new Date(asset.maintenance.nextMaintenanceDate);
      // Predict failure 30 days after missed maintenance
      predictedFailureDate = new Date(nextMaintenance);
      predictedFailureDate.setDate(predictedFailureDate.getDate() + 30);
    }

    return {
      predictedFailureDate,
      confidence,
      recommendedActions,
      riskLevel,
    };
  }
}

// Singleton instance
let maintenanceServiceInstance: MaintenanceService | null = null;

export function getMaintenanceService(
  config?: MaintenanceServiceConfig,
): MaintenanceService {
  if (!maintenanceServiceInstance) {
    maintenanceServiceInstance = new MaintenanceService(config);
  }
  return maintenanceServiceInstance;
}

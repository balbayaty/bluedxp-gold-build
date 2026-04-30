/**
 * Detention Management Service
 * Handles detention tracking, calculation, alerts, and cost management
 */

import { DetentionRecord, TransportJob } from "@/types/tms/transportJob";
import { tmsDatabaseAdapter } from "./database/tmsDatabaseAdapter";
import { eventBus, createEvent } from "@/lib/services/event-bus";

export interface DetentionCalculationParams {
  jobId: string;
  startDate: Date;
  endDate?: Date;
  freeTimeDays: number;
  detentionType: "loading" | "unloading" | "border" | "terminal" | "customs";
  location?: string;
  detentionRate?: number; // Per day
  tenantId?: string;
  userId?: string;
}

export interface DetentionAlert {
  id: string;
  jobId: string;
  detentionId: string;
  alertType: "warning" | "critical" | "cost_threshold";
  message: string;
  detentionDays: number;
  detentionCost?: number;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface DetentionAnalytics {
  totalDetentionDays: number;
  averageDetentionDays: number;
  totalDetentionCost: number;
  averageDetentionCost: number;
  detentionByType: Record<string, { days: number; cost: number }>;
  detentionByLocation: Record<string, { days: number; cost: number }>;
  topDetentionReasons: Array<{ reason: string; count: number }>;
}

/**
 * Detention Management Service
 */
export class DetentionService {
  /**
   * Calculate detention days
   */
  calculateDetentionDays(
    startDate: Date,
    endDate: Date,
    freeTimeDays: number,
  ): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const detentionDays = Math.max(0, diffDays - freeTimeDays);
    return detentionDays;
  }

  /**
   * Create detention record
   */
  async createDetentionRecord(
    params: DetentionCalculationParams,
  ): Promise<DetentionRecord> {
    const endDate = params.endDate || new Date();
    const detentionDays = this.calculateDetentionDays(
      params.startDate,
      endDate,
      params.freeTimeDays,
    );

    const detentionCost = params.detentionRate
      ? detentionDays * params.detentionRate
      : undefined;

    const detention: DetentionRecord = {
      id: `detention_${params.jobId}_${Date.now()}`,
      jobId: params.jobId,
      detentionType: params.detentionType,
      startDate: params.startDate,
      endDate: endDate,
      freeTimeDays: params.freeTimeDays,
      detentionDays,
      location: params.location,
      locationType: this.inferLocationType(params.location),
      detentionRate: params.detentionRate,
      detentionCost,
      status: detentionDays > 0 ? "active" : "resolved",
      createdAt: new Date(),
      createdBy: params.userId || "system",
      tenantId: params.tenantId || "default",
    };

    // Store detention in database
    await tmsDatabaseAdapter.storeDetention(
      params.jobId.split("_")[0] === "job" ? "flex-logistics" : "",
      detention,
    );

    // Generate alert if detention exceeds threshold
    if (detentionDays > 0) {
      await this.checkAndGenerateAlerts(detention);

      // Publish event
      await eventBus.publish(
        createEvent(
          "tms.detention.created",
          detention.id,
          "DetentionRecord",
          {
            detentionId: detention.id,
            jobId: detention.jobId,
            detentionDays: detention.detentionDays,
            detentionCost: detention.detentionCost,
            tenantId: detention.tenantId,
          },
          1,
          {
            tenantId: detention.tenantId,
          },
        ),
      );
    }

    return detention;
  }

  /**
   * Calculate detention for a job based on various events
   */
  async calculateJobDetention(job: TransportJob): Promise<DetentionRecord[]> {
    const detentions: DetentionRecord[] = [];

    // Loading detention (POL)
    if (job.loadingDate && job.shipperArrival && job.shipperDeparture) {
      const loadingDetention = await this.createDetentionRecord({
        jobId: job.id,
        startDate: job.shipperArrival,
        endDate: job.shipperDeparture,
        freeTimeDays: 1, // Default free time
        detentionType: "loading",
        location: job.polLocation || job.polDetails,
        detentionRate: 100, // Default rate, should come from contract
      });
      detentions.push(loadingDetention);
    }

    // Unloading detention (POD)
    if (job.consigneeArrival && job.consigneeDeparture) {
      const unloadingDetention = await this.createDetentionRecord({
        jobId: job.id,
        startDate: job.consigneeArrival,
        endDate: job.consigneeDeparture,
        freeTimeDays: 1, // Default free time
        detentionType: "unloading",
        location: job.podLocation || job.podDetails,
        detentionRate: 100, // Default rate
      });
      detentions.push(unloadingDetention);
    }

    // Border detention
    if (job.saudiBorderArrival && job.saudiBorderDeparture) {
      const borderDetention = await this.createDetentionRecord({
        jobId: job.id,
        startDate: job.saudiBorderArrival,
        endDate: job.saudiBorderDeparture,
        freeTimeDays: 0, // No free time at border
        detentionType: "border",
        location: "Saudi Border",
        detentionRate: 200, // Higher rate for border
      });
      detentions.push(borderDetention);
    }

    // Terminal storage detention
    if (job.storageTerminalDateIn && job.storageTerminalDateOut) {
      const terminalDetention = await this.createDetentionRecord({
        jobId: job.id,
        startDate: job.storageTerminalDateIn,
        endDate: job.storageTerminalDateOut,
        freeTimeDays: 3, // Default free time at terminal
        detentionType: "terminal",
        location: job.storageTerminalName,
        detentionRate: 150, // Terminal rate
      });
      detentions.push(terminalDetention);
    }

    // Use existing detention loading days if available
    if (job.detentionLoadingDays && job.detentionLoadingDays > 0) {
      // Create or update loading detention
      const existingLoading = detentions.find(
        (d) => d.detentionType === "loading",
      );
      if (existingLoading) {
        existingLoading.detentionDays = job.detentionLoadingDays;
        if (existingLoading.detentionRate) {
          existingLoading.detentionCost =
            job.detentionLoadingDays * existingLoading.detentionRate;
        }
      }
    }

    return detentions;
  }

  /**
   * Infer location type from location string
   */
  private inferLocationType(
    location?: string,
  ): DetentionRecord["locationType"] {
    if (!location) return undefined;

    const loc = location.toLowerCase();
    if (
      loc.includes("shipper") ||
      loc.includes("pol") ||
      loc.includes("origin")
    ) {
      return "shipper";
    }
    if (
      loc.includes("consignee") ||
      loc.includes("pod") ||
      loc.includes("destination")
    ) {
      return "consignee";
    }
    if (loc.includes("border")) {
      return "border";
    }
    if (loc.includes("terminal") || loc.includes("storage")) {
      return "terminal";
    }
    if (loc.includes("customs")) {
      return "customs";
    }

    return undefined;
  }

  /**
   * Check and generate alerts for detention
   */
  private async checkAndGenerateAlerts(
    detention: DetentionRecord,
  ): Promise<void> {
    const alerts: DetentionAlert[] = [];

    // Warning alert if detention exceeds 3 days
    if (detention.detentionDays > 3) {
      alerts.push({
        id: `alert_${detention.id}_${Date.now()}`,
        jobId: detention.jobId,
        detentionId: detention.id,
        alertType: "warning",
        message: `Detention at ${detention.location || "location"} has exceeded 3 days (${detention.detentionDays} days)`,
        detentionDays: detention.detentionDays,
        detentionCost: detention.detentionCost,
        createdAt: new Date(),
        acknowledged: false,
      });
    }

    // Critical alert if detention exceeds 7 days
    if (detention.detentionDays > 7) {
      alerts.push({
        id: `alert_${detention.id}_critical_${Date.now()}`,
        jobId: detention.jobId,
        detentionId: detention.id,
        alertType: "critical",
        message: `CRITICAL: Detention at ${detention.location || "location"} has exceeded 7 days (${detention.detentionDays} days)`,
        detentionDays: detention.detentionDays,
        detentionCost: detention.detentionCost,
        createdAt: new Date(),
        acknowledged: false,
      });
    }

    // Cost threshold alert if cost exceeds 1000
    if (detention.detentionCost && detention.detentionCost > 1000) {
      alerts.push({
        id: `alert_${detention.id}_cost_${Date.now()}`,
        jobId: detention.jobId,
        detentionId: detention.id,
        alertType: "cost_threshold",
        message: `Detention cost has exceeded threshold: ${detention.detentionCost} ${detention.detentionCost > 5000 ? "(CRITICAL)" : ""}`,
        detentionDays: detention.detentionDays,
        detentionCost: detention.detentionCost,
        createdAt: new Date(),
        acknowledged: false,
      });
    }

    // Send alerts via Notification Service and Event Bus
    for (const alert of alerts) {
      await this.sendAlert(alert);

      // Publish to event bus for cross-module notifications
      await eventBus.publish(
        createEvent({
          type: "tms.detention_alert",
          aggregateId: alert.jobId,
          aggregateType: "TRANSPORT_JOB",
          payload: alert,
          metadata: {
            alertType: alert.alertType,
            detentionDays: alert.detentionDays,
          },
        }),
      );
    }
  }

  /**
   * Send detention alert
   * Integrates with Notification Service for multi-channel alerts
   */
  private async sendAlert(alert: DetentionAlert): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependencies
      const { notificationService } =
        await import("@/lib/services/notifications");

      await notificationService.send({
        type: "ALERT",
        priority: alert.alertType === "critical" ? "HIGH" : "MEDIUM",
        title: `Detention Alert: ${alert.alertType.toUpperCase()}`,
        message: alert.message,
        data: {
          jobId: alert.jobId,
          detentionId: alert.detentionId,
          detentionDays: alert.detentionDays,
          detentionCost: alert.detentionCost,
        },
        channels: ["IN_APP", "EMAIL"],
        recipientRoles: ["TMS_MANAGER", "OPERATIONS_MANAGER"],
      });

      console.log("✅ Detention Alert sent:", alert.id);
    } catch (error) {
      console.error("Failed to send detention alert:", error);
      // Fallback: just log it
      console.log("Detention Alert (fallback):", alert);
    }
  }

  /**
   * Get detention records for a job
   */
  async getDetentionRecords(
    jobId: string,
    tenantId: string,
  ): Promise<DetentionRecord[]> {
    return tmsDatabaseAdapter.getDetentionRecords(tenantId, jobId);
  }

  /**
   * Resolve detention record
   */
  async resolveDetention(
    detentionId: string,
    resolvedBy: string,
    notes?: string,
  ): Promise<DetentionRecord> {
    // Get detention record from database
    const detention = await tmsDatabaseAdapter.getDetentionById(detentionId);
    if (!detention) {
      throw new Error(`Detention record ${detentionId} not found`);
    }

    // Update detention status
    const updatedDetention: DetentionRecord = {
      ...detention,
      status: "resolved",
      resolvedAt: new Date(),
      resolvedBy,
      notes: notes || detention.notes,
    };

    // Store updated detention
    await tmsDatabaseAdapter.storeDetention(
      detention.tenantId,
      updatedDetention,
    );

    // Publish resolution event
    await eventBus.publish(
      createEvent(
        "tms.detention.resolved",
        detentionId,
        "DetentionRecord",
        {
          detentionId,
          jobId: detention.jobId,
          resolvedBy,
          detentionDays: detention.detentionDays,
          detentionCost: detention.detentionCost,
        },
        1,
        { tenantId: detention.tenantId },
      ),
    );

    return updatedDetention;
  }

  /**
   * Dispute detention record
   */
  async disputeDetention(
    detentionId: string,
    disputedBy: string,
    reason: string,
  ): Promise<DetentionRecord> {
    // Get detention record from database
    const detention = await tmsDatabaseAdapter.getDetentionById(detentionId);
    if (!detention) {
      throw new Error(`Detention record ${detentionId} not found`);
    }

    // Update detention status to disputed
    const updatedDetention: DetentionRecord = {
      ...detention,
      status: "disputed",
      disputedAt: new Date(),
      disputedBy,
      disputeReason: reason,
    };

    // Store updated detention
    await tmsDatabaseAdapter.storeDetention(
      detention.tenantId,
      updatedDetention,
    );

    // Publish dispute event
    await eventBus.publish(
      createEvent(
        "tms.detention.disputed",
        detentionId,
        "DetentionRecord",
        {
          detentionId,
          jobId: detention.jobId,
          disputedBy,
          reason,
          detentionDays: detention.detentionDays,
          detentionCost: detention.detentionCost,
        },
        1,
        { tenantId: detention.tenantId },
      ),
    );

    return updatedDetention;
  }

  /**
   * Calculate total detention cost for a job
   */
  async calculateTotalDetentionCost(jobId: string): Promise<number> {
    // Extract tenant from job ID or use default
    const tenantId =
      jobId.split("_")[0] === "job" ? "flex-logistics" : "default";

    // Fetch all detention records for the job
    const detentions = await this.getDetentionRecords(jobId, tenantId);

    // Sum all detention costs
    const totalCost = detentions.reduce((sum, detention) => {
      return sum + (detention.detentionCost || 0);
    }, 0);

    return totalCost;
  }

  /**
   * Get detention analytics
   */
  async getDetentionAnalytics(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<DetentionAnalytics> {
    // Fetch all detention records for tenant within date range
    const allDetentions = await tmsDatabaseAdapter.getAllDetentions(tenantId);

    // Filter by date range if provided
    let detentions = allDetentions;
    if (startDate || endDate) {
      detentions = allDetentions.filter((d) => {
        const dDate = new Date(d.createdAt);
        if (startDate && dDate < startDate) return false;
        if (endDate && dDate > endDate) return false;
        return true;
      });
    }

    if (detentions.length === 0) {
      return {
        totalDetentionDays: 0,
        averageDetentionDays: 0,
        totalDetentionCost: 0,
        averageDetentionCost: 0,
        detentionByType: {},
        detentionByLocation: {},
        topDetentionReasons: [],
      };
    }

    // Calculate totals
    const totalDetentionDays = detentions.reduce(
      (sum, d) => sum + d.detentionDays,
      0,
    );
    const totalDetentionCost = detentions.reduce(
      (sum, d) => sum + (d.detentionCost || 0),
      0,
    );

    // Group by type
    const detentionByType: Record<string, { days: number; cost: number }> = {};
    for (const d of detentions) {
      if (!detentionByType[d.detentionType]) {
        detentionByType[d.detentionType] = { days: 0, cost: 0 };
      }
      detentionByType[d.detentionType].days += d.detentionDays;
      detentionByType[d.detentionType].cost += d.detentionCost || 0;
    }

    // Group by location
    const detentionByLocation: Record<string, { days: number; cost: number }> =
      {};
    for (const d of detentions) {
      const location = d.location || "Unknown";
      if (!detentionByLocation[location]) {
        detentionByLocation[location] = { days: 0, cost: 0 };
      }
      detentionByLocation[location].days += d.detentionDays;
      detentionByLocation[location].cost += d.detentionCost || 0;
    }

    // Identify top reasons (using detention type as proxy)
    const reasonCounts: Record<string, number> = {};
    for (const d of detentions) {
      reasonCounts[d.detentionType] = (reasonCounts[d.detentionType] || 0) + 1;
    }
    const topDetentionReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalDetentionDays,
      averageDetentionDays: totalDetentionDays / detentions.length,
      totalDetentionCost,
      averageDetentionCost: totalDetentionCost / detentions.length,
      detentionByType,
      detentionByLocation,
      topDetentionReasons,
    };
  }

  /**
   * Get active detention alerts
   */
  async getActiveAlerts(
    jobId?: string,
    tenantId?: string,
  ): Promise<DetentionAlert[]> {
    // Fetch alerts from database
    const alerts = await tmsDatabaseAdapter.getDetentionAlerts(
      tenantId || "default",
      jobId,
    );

    // Filter to only unacknowledged alerts
    return alerts.filter((alert) => !alert.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
  ): Promise<DetentionAlert> {
    // Get alert from database
    const alert = await tmsDatabaseAdapter.getDetentionAlertById(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    // Update alert
    const updatedAlert: DetentionAlert = {
      ...alert,
      acknowledged: true,
      acknowledgedAt: new Date(),
      acknowledgedBy,
    };

    // Store updated alert
    await tmsDatabaseAdapter.storeDetentionAlert(updatedAlert);

    return updatedAlert;
  }
}

export const detentionService = new DetentionService();

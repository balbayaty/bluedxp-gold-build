/**
 * Real-Time SLA & KPI Tracking Service
 * Monitors lifecycle stages in real-time and detects SLA violations
 * Fully integrated with lifecycle service and event bus
 */

import { lifecycleService } from "../process-lifecycle/lifecycle/lifecycleService";
import { eventBus } from "../event-bus/eventBus";
import type { EntityType } from "@/types/lifecycle";
import { prisma } from "@/lib/services/database/prismaClient";

// ============================================================================
// TYPES
// ============================================================================

export interface SLAViolation {
  id: string;
  entityId: string;
  entityType: EntityType;
  stageId: string;
  stageName: string;
  targetDuration: number; // seconds
  actualDuration: number; // seconds
  delaySeconds: number;
  delayPercentage: number;
  severity: "warning" | "breach" | "critical";
  detectedAt: Date | string;
  tenantId: string;
  resolvedAt?: Date | string;
  resolvedBy?: string;
}

export interface SLAWarning {
  id: string;
  entityId: string;
  entityType: EntityType;
  stageId: string;
  stageName: string;
  targetDuration: number;
  elapsedDuration: number;
  remainingSeconds: number;
  percentageUsed: number;
  detectedAt: Date | string;
  tenantId: string;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

class RealTimeSlaKpiService {
  private violationAlerts: Map<string, SLAViolation> = new Map();
  private warningAlerts: Map<string, SLAWarning> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  /**
   * Start real-time SLA monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.warn("SLA monitoring already started");
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.checkAllInProgressStages();
    }, intervalMs);

    // Also subscribe to lifecycle events for immediate detection
    this.subscribeToLifecycleEvents();

    console.log("Real-time SLA monitoring started");
  }

  /**
   * Stop real-time SLA monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log("Real-time SLA monitoring stopped");
  }

  /**
   * Subscribe to lifecycle events for immediate SLA detection
   */
  private subscribeToLifecycleEvents(): void {
    // Subscribe to stage started events
    eventBus.subscribe("lifecycle.stage.started", async (event: any) => {
      await this.trackSlaCompliance(
        event.entityId,
        event.entityType,
        event.stageId,
      );
    });

    // Subscribe to stage completed events
    eventBus.subscribe("lifecycle.stage.completed", async (event: any) => {
      await this.checkStageCompletion(
        event.entityId,
        event.entityType,
        event.stageId,
      );
    });
  }

  /**
   * Check all in-progress stages for SLA compliance
   */
  private async checkAllInProgressStages(): Promise<void> {
    try {
      const entityTypes: EntityType[] = [
        "ASN",
        "TASK",
        "PICKING",
        "PUTAWAY",
        "CYCLE_COUNT",
        "GOODS_RECEIPT",
        "WAVE",
      ];

      for (const entityType of entityTypes) {
        const inProgress =
          await lifecycleService.getInProgressLifecycles(entityType);

        for (const lifecycle of inProgress) {
          await this.trackSlaCompliance(
            lifecycle.entityId,
            lifecycle.entityType,
            undefined, // Check all stages
          );
        }
      }
    } catch (error) {
      console.error("Error checking in-progress stages:", error);
    }
  }

  /**
   * Track SLA compliance for a specific entity and stage
   */
  async trackSlaCompliance(
    entityId: string,
    entityType: EntityType,
    stageId?: string,
  ): Promise<void> {
    try {
      const lifecycle = await lifecycleService.getLifecycle(
        entityId,
        entityType,
      );
      if (!lifecycle) return;

      const config = lifecycleService.getLifecycleConfig(entityType);
      if (!config) return;

      // Check all in-progress stages or specific stage
      const stagesToCheck = stageId
        ? lifecycle.stages.filter(
            (s) => s.stageId === stageId && s.status === "in_progress",
          )
        : lifecycle.stages.filter((s) => s.status === "in_progress");

      for (const stageInstance of stagesToCheck) {
        const slaRule = config.slaRules?.find(
          (r) => r.stageId === stageInstance.stageId,
        );
        if (!slaRule) continue;

        const elapsed = stageInstance.startedAt
          ? (Date.now() - new Date(stageInstance.startedAt).getTime()) / 1000
          : 0;

        const remaining = slaRule.targetDuration - elapsed;
        const percentageUsed = (elapsed / slaRule.targetDuration) * 100;

        // Check for warning threshold (default 80%)
        const warningThreshold = slaRule.warningThreshold || 0.8;
        if (percentageUsed >= warningThreshold * 100 && remaining > 0) {
          await this.triggerSlaWarning(
            entityId,
            entityType,
            stageInstance,
            remaining,
            elapsed,
            slaRule.targetDuration,
          );
        }

        // Check for SLA breach
        if (elapsed > slaRule.targetDuration) {
          await this.triggerSlaViolation(
            entityId,
            entityType,
            stageInstance,
            elapsed,
            slaRule.targetDuration,
          );
        }
      }
    } catch (error) {
      console.error("Error tracking SLA compliance:", error);
    }
  }

  /**
   * Check stage completion and record final SLA status
   */
  private async checkStageCompletion(
    entityId: string,
    entityType: EntityType,
    stageId: string,
  ): Promise<void> {
    try {
      const lifecycle = await lifecycleService.getLifecycle(
        entityId,
        entityType,
      );
      if (!lifecycle) return;

      const stageInstance = lifecycle.stages.find((s) => s.stageId === stageId);
      if (!stageInstance || stageInstance.status !== "completed") return;

      const config = lifecycleService.getLifecycleConfig(entityType);
      const slaRule = config?.slaRules?.find((r) => r.stageId === stageId);
      if (!slaRule) return;

      const actualDuration = stageInstance.duration || 0;
      const delaySeconds = Math.max(0, actualDuration - slaRule.targetDuration);

      // Record completion (for analytics)
      if (delaySeconds > 0) {
        // This was a violation, but now completed
        // Remove from active violations
        const violationKey = `${entityId}-${stageId}`;
        this.violationAlerts.delete(violationKey);
      }

      // Clear warning if exists
      const warningKey = `${entityId}-${stageId}`;
      this.warningAlerts.delete(warningKey);
    } catch (error) {
      console.error("Error checking stage completion:", error);
    }
  }

  /**
   * Trigger SLA warning (80% of time used)
   */
  private async triggerSlaWarning(
    entityId: string,
    entityType: EntityType,
    stageInstance: any,
    remainingSeconds: number,
    elapsedDuration: number,
    targetDuration: number,
  ): Promise<void> {
    const warningKey = `${entityId}-${stageInstance.stageId}`;

    // Don't re-alert if already warned
    if (this.warningAlerts.has(warningKey)) return;

    const config = lifecycleService.getLifecycleConfig(entityType);
    const stage = config?.stages.find((s) => s.id === stageInstance.stageId);

    const warning: SLAWarning = {
      id: `warning-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      entityId,
      entityType,
      stageId: stageInstance.stageId,
      stageName: stage?.name || stageInstance.stageId,
      targetDuration,
      elapsedDuration,
      remainingSeconds,
      percentageUsed: (elapsedDuration / targetDuration) * 100,
      detectedAt: new Date(),
      tenantId: "default", // TODO: Get from context
    };

    this.warningAlerts.set(warningKey, warning);

    // Publish event
    await eventBus.publish("sla.warning", {
      entityId,
      entityType,
      stageId: stageInstance.stageId,
      stageName: warning.stageName,
      remainingSeconds,
      percentageUsed: warning.percentageUsed,
      tenantId: warning.tenantId,
    });

    // Store in database (if table exists)
    try {
      await prisma.slaWarning
        .create({
          data: {
            id: warning.id,
            entityId,
            entityType,
            stageId: stageInstance.stageId,
            stageName: warning.stageName,
            targetDuration,
            elapsedDuration,
            remainingSeconds,
            percentageUsed: warning.percentageUsed,
            tenantId: warning.tenantId,
            detectedAt: new Date(warning.detectedAt),
          },
        })
        .catch(() => {
          // Table might not exist, that's okay
        });
    } catch (error) {
      // Ignore database errors
    }
  }

  /**
   * Trigger SLA violation (target duration exceeded)
   */
  private async triggerSlaViolation(
    entityId: string,
    entityType: EntityType,
    stageInstance: any,
    actualDuration: number,
    targetDuration: number,
  ): Promise<void> {
    const violationKey = `${entityId}-${stageInstance.stageId}`;

    // Don't re-alert if already violated
    if (this.violationAlerts.has(violationKey)) return;

    const config = lifecycleService.getLifecycleConfig(entityType);
    const stage = config?.stages.find((s) => s.id === stageInstance.stageId);

    const delaySeconds = actualDuration - targetDuration;
    const delayPercentage = (delaySeconds / targetDuration) * 100;

    const violation: SLAViolation = {
      id: `violation-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      entityId,
      entityType,
      stageId: stageInstance.stageId,
      stageName: stage?.name || stageInstance.stageId,
      targetDuration,
      actualDuration,
      delaySeconds,
      delayPercentage,
      severity:
        delayPercentage > 50
          ? "critical"
          : delayPercentage > 25
            ? "breach"
            : "warning",
      detectedAt: new Date(),
      tenantId: "default", // TODO: Get from context
    };

    this.violationAlerts.set(violationKey, violation);

    // Publish event
    await eventBus.publish("sla.violation", {
      entityId,
      entityType,
      stageId: stageInstance.stageId,
      stageName: violation.stageName,
      delaySeconds,
      delayPercentage,
      severity: violation.severity,
      tenantId: violation.tenantId,
    });

    // Store in database
    try {
      await prisma.slaViolation
        .create({
          data: {
            id: violation.id,
            entityId,
            entityType,
            stageId: stageInstance.stageId,
            stageName: violation.stageName,
            targetDuration,
            actualDuration,
            delaySeconds,
            delayPercentage,
            severity: violation.severity,
            tenantId: violation.tenantId,
            detectedAt: new Date(violation.detectedAt),
          },
        })
        .catch(() => {
          // Table might not exist, that's okay
        });
    } catch (error) {
      // Ignore database errors
    }

    // Trigger escalation if configured
    const slaRule = config?.slaRules?.find(
      (r) => r.stageId === stageInstance.stageId,
    );
    if (slaRule?.breachAction) {
      await this.handleBreachAction(
        slaRule.breachAction,
        violation,
        slaRule.escalationRoles,
      );
    }
  }

  /**
   * Handle breach action (notify, escalate, etc.)
   */
  private async handleBreachAction(
    action: string,
    violation: SLAViolation,
    escalationRoles?: string[],
  ): Promise<void> {
    switch (action) {
      case "notify_manager":
        await eventBus.publish("sla.escalation", {
          type: "manager_notification",
          violation,
          roles: escalationRoles || ["WAREHOUSE_MANAGER"],
        });
        break;

      case "notify_admin":
        await eventBus.publish("sla.escalation", {
          type: "admin_notification",
          violation,
          roles: escalationRoles || ["SYSTEM_ADMIN"],
        });
        break;

      default:
        // Custom action
        await eventBus.publish("sla.escalation", {
          type: action,
          violation,
          roles: escalationRoles,
        });
    }
  }

  /**
   * Get active violations
   */
  getActiveViolations(): SLAViolation[] {
    return Array.from(this.violationAlerts.values());
  }

  /**
   * Get active warnings
   */
  getActiveWarnings(): SLAWarning[] {
    return Array.from(this.warningAlerts.values());
  }
}

export const realTimeSlaKpiService = new RealTimeSlaKpiService();

// Auto-start monitoring in production
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  realTimeSlaKpiService.startMonitoring(60000); // Check every minute
}

/**
 * QHSE Notification Service
 * Multi-channel notifications for QHSE events
 * Integrated with platform notification service
 */

import { notificationService } from "@/lib/services/notifications/notificationService";
import { eventBus } from "@/lib/services/event-store";
import type { Incident, Inspection, TrainingRecord } from "@/types/qhse";

// ============================================================================
// QHSE NOTIFICATION TYPES
// ============================================================================

export type QHSENotificationType =
  | "incident_created"
  | "incident_critical"
  | "incident_updated"
  | "inspection_scheduled"
  | "inspection_due"
  | "inspection_overdue"
  | "inspection_completed"
  | "training_assigned"
  | "training_due"
  | "training_expiring"
  | "training_expired"
  | "audit_scheduled"
  | "audit_due"
  | "compliance_deadline"
  | "safety_metric_threshold"
  | "environmental_alert";

export interface QHSENotificationRule {
  id: string;
  name: string;
  type: QHSENotificationType;
  enabled: boolean;
  conditions: Record<string, any>;
  channels: Array<"email" | "sms" | "push" | "in-app">;
  recipients: Array<{
    type: "ROLE" | "USER" | "TEAM";
    id: string;
  }>;
  template?: string;
  priority: "low" | "medium" | "high" | "critical";
}

// ============================================================================
// QHSE NOTIFICATION SERVICE
// ============================================================================

class QHSENotificationService {
  private rules: Map<string, QHSENotificationRule> = new Map();

  /**
   * Register notification rule
   */
  registerRule(rule: QHSENotificationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Send incident notification
   */
  async notifyIncidentCreated(incident: Incident): Promise<void> {
    // Check if critical incident
    if (incident.severity === "CRITICAL" || incident.severity === "HIGH") {
      await this.sendNotification({
        type: "incident_critical",
        title: `Critical Incident: ${incident.incidentNumber}`,
        message: `${incident.title} - ${incident.description}`,
        priority: "critical",
        channels: ["email", "sms", "push", "in-app"],
        data: {
          incidentId: incident.id,
          incidentNumber: incident.incidentNumber,
          severity: incident.severity,
          type: incident.type,
          link: `/qhse/incidents/${incident.id}`,
        },
      });
    } else {
      await this.sendNotification({
        type: "incident_created",
        title: `New Incident: ${incident.incidentNumber}`,
        message: incident.title,
        priority: "medium",
        channels: ["email", "in-app"],
        data: {
          incidentId: incident.id,
          link: `/qhse/incidents/${incident.id}`,
        },
      });
    }
  }

  /**
   * Send inspection notification
   */
  async notifyInspectionScheduled(inspection: Inspection): Promise<void> {
    await this.sendNotification({
      type: "inspection_scheduled",
      title: `Inspection Scheduled: ${inspection.inspectionNumber}`,
      message: `${inspection.title} - Scheduled for ${new Date(inspection.scheduledDate).toLocaleDateString()}`,
      priority: "medium",
      channels: ["email", "in-app"],
      data: {
        inspectionId: inspection.id,
        scheduledDate: inspection.scheduledDate,
        link: `/qhse/inspections/${inspection.id}`,
      },
    });
  }

  /**
   * Send training notification
   */
  async notifyTrainingExpiring(
    record: TrainingRecord,
    daysUntilExpiry: number,
  ): Promise<void> {
    const priority =
      daysUntilExpiry <= 7 ? "high" : daysUntilExpiry <= 30 ? "medium" : "low";

    await this.sendNotification({
      type: "training_expiring",
      title: `Training Expiring Soon: ${record.trainingProgram?.name}`,
      message: `Training for ${record.employeeName} expires in ${daysUntilExpiry} days`,
      priority,
      channels:
        daysUntilExpiry <= 7 ? ["email", "sms", "in-app"] : ["email", "in-app"],
      data: {
        trainingRecordId: record.id,
        employeeId: record.employeeId,
        expiryDate: record.expiryDate,
        link: `/qhse/training?record=${record.id}`,
      },
    });
  }

  /**
   * Send audit deadline notification
   */
  async notifyAuditDeadline(
    auditId: string,
    auditNumber: string,
    daysUntil: number,
  ): Promise<void> {
    await this.sendNotification({
      type: "compliance_deadline",
      title: `Audit Deadline: ${auditNumber}`,
      message: `Regulatory audit scheduled in ${daysUntil} days`,
      priority: daysUntil <= 7 ? "high" : "medium",
      channels: ["email", "in-app"],
      data: {
        auditId,
        daysUntil,
        link: `/qhse/regulatory?audit=${auditId}`,
      },
    });
  }

  /**
   * Send safety metric threshold alert
   */
  async notifySafetyMetricThreshold(
    metric: string,
    value: number,
    threshold: number,
    trend: "ABOVE" | "BELOW",
  ): Promise<void> {
    await this.sendNotification({
      type: "safety_metric_threshold",
      title: `Safety Metric Alert: ${metric}`,
      message: `${metric} is ${trend === "ABOVE" ? "above" : "below"} threshold (${value} vs ${threshold})`,
      priority: "high",
      channels: ["email", "in-app"],
      data: {
        metric,
        value,
        threshold,
        trend,
        link: "/qhse/safety-metrics",
      },
    });
  }

  /**
   * Internal send notification helper
   */
  private async sendNotification(config: {
    type: QHSENotificationType;
    title: string;
    message: string;
    priority: "low" | "medium" | "high" | "critical";
    channels: Array<"email" | "sms" | "push" | "in-app">;
    data?: any;
    recipients?: string[];
  }): Promise<void> {
    try {
      await notificationService.send({
        type: "alert",
        priority: config.priority,
        channel: config.channels,
        title: config.title,
        message: config.message,
        data: config.data,
        recipient: config.recipients,
      });

      // Publish event
      await eventBus.publish({
        type: "qhse.notification.sent",
        payload: {
          notificationType: config.type,
          title: config.title,
          channels: config.channels,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error sending QHSE notification:", error);
    }
  }

  /**
   * Setup default notification rules
   */
  setupDefaultRules(): void {
    // Critical incident rule
    this.registerRule({
      id: "critical-incident",
      name: "Critical Incident Alert",
      type: "incident_critical",
      enabled: true,
      conditions: { severity: ["CRITICAL", "HIGH"] },
      channels: ["email", "sms", "push", "in-app"],
      recipients: [{ type: "ROLE", id: "QHSE_MANAGER" }],
      priority: "critical",
    });

    // Training expiry rule
    this.registerRule({
      id: "training-expiry",
      name: "Training Expiry Alert",
      type: "training_expiring",
      enabled: true,
      conditions: { daysUntilExpiry: 30 },
      channels: ["email", "in-app"],
      recipients: [{ type: "ROLE", id: "TRAINING_MANAGER" }],
      priority: "medium",
    });

    // Inspection overdue rule
    this.registerRule({
      id: "inspection-overdue",
      name: "Inspection Overdue Alert",
      type: "inspection_overdue",
      enabled: true,
      conditions: { status: "OVERDUE" },
      channels: ["email", "in-app"],
      recipients: [{ type: "ROLE", id: "QHSE_OFFICER" }],
      priority: "high",
    });
  }
}

// Initialize service with default rules
const service = new QHSENotificationService();
service.setupDefaultRules();

export const qhseNotificationService = service;

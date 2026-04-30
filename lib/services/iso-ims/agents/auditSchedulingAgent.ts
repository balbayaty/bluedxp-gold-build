/**
 * Audit Scheduling Agent
 *
 * Autonomous agent that intelligently schedules audits:
 * - Risk-based scheduling
 * - Compliance-based scheduling
 * - Resource optimization
 * - Conflict detection
 * - Auto-rescheduling
 */

import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import { auditService } from "../auditService";
import { riskService } from "../riskService";
import { complianceEngine } from "../complianceEngine";
import { intelligenceService } from "../intelligenceService";
import { eventBus, createEvent } from "@/lib/services/event-bus";

export class AuditSchedulingAgent {
  private agentId = "audit-scheduling-agent";

  async initialize(): Promise<void> {
    await agentOrchestrator.registerAgent({
      id: this.agentId,
      type: "audit-scheduling",
      name: "Audit Scheduling Agent",
      description:
        "Intelligently schedules audits based on risk, compliance, and resource availability",
      capabilities: [
        {
          id: "schedule-risk-based-audit",
          name: "Schedule Risk-Based Audit",
          description: "Schedule audits based on risk levels",
          categories: ["audit", "risk"],
          confidenceThreshold: 0.85,
          priority: 9,
        },
        {
          id: "schedule-compliance-audit",
          name: "Schedule Compliance Audit",
          description: "Schedule audits based on compliance scores",
          categories: ["audit", "compliance"],
          confidenceThreshold: 0.9,
          priority: 10,
        },
        {
          id: "optimize-audit-schedule",
          name: "Optimize Audit Schedule",
          description: "Optimize audit schedule for resource efficiency",
          categories: ["audit", "optimization"],
          confidenceThreshold: 0.8,
          priority: 8,
        },
        {
          id: "auto-reschedule-audit",
          name: "Auto-Reschedule Audit",
          description: "Automatically reschedule conflicting or missed audits",
          categories: ["audit", "automation"],
          confidenceThreshold: 0.85,
          priority: 7,
        },
      ],
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Subscribe to events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to audit-related events
   */
  private subscribeToEvents(): void {
    // Subscribe to compliance score updates
    eventBus.subscribe("iso-ims.compliance.updated", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        const { tenantId } = event.metadata;
        const complianceData = event.payload as any;
        if (complianceData.score !== undefined && complianceData.standard) {
          await this.scheduleComplianceBasedAudit(
            tenantId,
            complianceData.standard,
            complianceData.score,
          );
        }
      }
    });

    // Subscribe to risk identification
    eventBus.subscribe("iso-ims.risk.created", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        const { tenantId } = event.metadata;
        const riskData = event.payload as any;
        if (riskData.riskId) {
          await this.scheduleRiskBasedAudit(tenantId, riskData.riskId);
        }
      }
    });

    console.log("✅ Audit Scheduling Agent event subscriptions registered");
  }

  /**
   * Schedule audit based on risk
   */
  async scheduleRiskBasedAudit(
    tenantId: string,
    riskId: string,
  ): Promise<string | null> {
    try {
      const risk = await riskService.getRisk(riskId, tenantId);
      if (!risk) {
        throw new Error("Risk not found");
      }

      // Calculate audit urgency based on risk
      const urgency = this.calculateAuditUrgency(risk);
      const auditDate = this.calculateAuditDate(urgency);

      const audit = await auditService.createAudit({
        tenantId,
        title: `Risk-Based Audit - ${risk.title}`,
        description: `Scheduled by Audit Scheduling Agent based on risk level: ${risk.riskLevel}`,
        auditType: "INTERNAL",
        standard: risk.relatedStandard || undefined,
        scheduledDate: auditDate,
        status: "SCHEDULED",
        priority:
          risk.riskLevel === "CRITICAL"
            ? "HIGH"
            : risk.riskLevel === "HIGH"
              ? "MEDIUM"
              : "LOW",
      });

      await eventBus.publish(
        createEvent(
          "iso-ims.agent.audit.scheduled.risk-based",
          audit.id,
          "AUDIT",
          {
            auditId: audit.id,
            agentId: this.agentId,
            tenantId,
            riskId,
            urgency,
          },
          1,
          { tenantId, userId: "system" },
        ),
      );

      return audit.id;
    } catch (error) {
      console.error("Error scheduling risk-based audit:", error);
      return null;
    }
  }

  /**
   * Schedule audit based on compliance score
   */
  async scheduleComplianceBasedAudit(
    tenantId: string,
    standard: string,
    complianceScore: number,
  ): Promise<string | null> {
    try {
      // Calculate audit frequency based on compliance score
      const daysUntilAudit =
        complianceScore < 70 ? 30 : complianceScore < 85 ? 60 : 90;
      const auditDate = new Date();
      auditDate.setDate(auditDate.getDate() + daysUntilAudit);

      const audit = await auditService.createAudit({
        tenantId,
        title: `Compliance Audit - ${standard}`,
        description: `Scheduled by Audit Scheduling Agent. Current compliance score: ${complianceScore}%`,
        auditType: "INTERNAL",
        standard,
        scheduledDate: auditDate,
        status: "SCHEDULED",
        priority:
          complianceScore < 70
            ? "HIGH"
            : complianceScore < 85
              ? "MEDIUM"
              : "LOW",
      });

      await eventBus.publish(
        createEvent(
          "iso-ims.agent.audit.scheduled.compliance-based",
          audit.id,
          "AUDIT",
          {
            auditId: audit.id,
            agentId: this.agentId,
            tenantId,
            standard,
            complianceScore,
          },
          1,
          { tenantId, userId: "system" },
        ),
      );

      return audit.id;
    } catch (error) {
      console.error("Error scheduling compliance-based audit:", error);
      return null;
    }
  }

  /**
   * Optimize audit schedule
   */
  async optimizeAuditSchedule(
    tenantId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<{
    optimized: boolean;
    changes: Array<{
      auditId: string;
      oldDate: Date;
      newDate: Date;
      reason: string;
    }>;
  }> {
    try {
      // Get all audits in date range
      const { audits } = await auditService.getAudits({
        tenantId,
        filters: {
          scheduledDateFrom: dateRange.start,
          scheduledDateTo: dateRange.end,
        },
        pagination: { page: 1, pageSize: 100 },
      });

      // Detect conflicts
      const conflicts = this.detectConflicts(audits);
      const changes: Array<{
        auditId: string;
        oldDate: Date;
        newDate: Date;
        reason: string;
      }> = [];

      // Resolve conflicts
      for (const conflict of conflicts) {
        const newDate = this.findOptimalDate(conflict, audits);
        if (newDate) {
          await auditService.updateAudit(
            conflict.auditId,
            {
              scheduledDate: newDate,
            },
            tenantId,
            "system",
          );

          changes.push({
            auditId: conflict.auditId,
            oldDate: conflict.scheduledDate,
            newDate,
            reason: "Conflict resolution",
          });
        }
      }

      return {
        optimized: changes.length > 0,
        changes,
      };
    } catch (error) {
      console.error("Error optimizing audit schedule:", error);
      return { optimized: false, changes: [] };
    }
  }

  /**
   * Auto-reschedule missed or conflicting audits
   */
  async autoRescheduleAudits(tenantId: string): Promise<{
    rescheduled: number;
    audits: Array<{ auditId: string; oldDate: Date; newDate: Date }>;
  }> {
    try {
      const { audits } = await auditService.getAudits({
        tenantId,
        filters: {
          status: "SCHEDULED",
        },
        pagination: { page: 1, pageSize: 100 },
      });

      const now = new Date();
      const rescheduled: Array<{
        auditId: string;
        oldDate: Date;
        newDate: Date;
      }> = [];

      for (const audit of audits) {
        if (audit.scheduledDate && new Date(audit.scheduledDate) < now) {
          // Audit is in the past, reschedule
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + 7); // Reschedule 7 days from now

          await auditService.updateAudit(
            audit.id,
            {
              scheduledDate: newDate,
            },
            tenantId,
            "system",
          );

          rescheduled.push({
            auditId: audit.id,
            oldDate: new Date(audit.scheduledDate),
            newDate,
          });
        }
      }

      return {
        rescheduled: rescheduled.length,
        audits: rescheduled,
      };
    } catch (error) {
      console.error("Error auto-rescheduling audits:", error);
      return { rescheduled: 0, audits: [] };
    }
  }

  /**
   * Calculate audit urgency from risk
   */
  private calculateAuditUrgency(
    risk: any,
  ): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
    if (risk.riskLevel === "CRITICAL") return "CRITICAL";
    if (risk.riskLevel === "HIGH") return "HIGH";
    if (risk.riskScore > 75) return "HIGH";
    if (risk.riskScore > 50) return "MEDIUM";
    return "LOW";
  }

  /**
   * Calculate audit date based on urgency
   */
  private calculateAuditDate(
    urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  ): Date {
    const date = new Date();
    switch (urgency) {
      case "CRITICAL":
        date.setDate(date.getDate() + 7); // 1 week
        break;
      case "HIGH":
        date.setDate(date.getDate() + 14); // 2 weeks
        break;
      case "MEDIUM":
        date.setDate(date.getDate() + 30); // 1 month
        break;
      case "LOW":
        date.setDate(date.getDate() + 60); // 2 months
        break;
    }
    return date;
  }

  /**
   * Detect conflicts in audit schedule
   */
  private detectConflicts(
    audits: any[],
  ): Array<{ auditId: string; scheduledDate: Date; conflictWith: string[] }> {
    const conflicts: Array<{
      auditId: string;
      scheduledDate: Date;
      conflictWith: string[];
    }> = [];

    for (let i = 0; i < audits.length; i++) {
      const audit1 = audits[i];
      if (!audit1.scheduledDate) continue;

      const conflictWith: string[] = [];

      for (let j = i + 1; j < audits.length; j++) {
        const audit2 = audits[j];
        if (!audit2.scheduledDate) continue;

        // Check if dates are within 1 day of each other (conflict)
        const date1 = new Date(audit1.scheduledDate);
        const date2 = new Date(audit2.scheduledDate);
        const diffDays = Math.abs(
          (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays < 1) {
          conflictWith.push(audit2.id);
        }
      }

      if (conflictWith.length > 0) {
        conflicts.push({
          auditId: audit1.id,
          scheduledDate: new Date(audit1.scheduledDate),
          conflictWith,
        });
      }
    }

    return conflicts;
  }

  /**
   * Find optimal date for audit
   */
  private findOptimalDate(
    conflict: { auditId: string; scheduledDate: Date },
    allAudits: any[],
  ): Date | null {
    // Find next available date (at least 3 days after any other audit)
    const candidateDate = new Date(conflict.scheduledDate);
    candidateDate.setDate(candidateDate.getDate() + 3);

    // Check if candidate date conflicts with other audits
    for (const audit of allAudits) {
      if (audit.id === conflict.auditId || !audit.scheduledDate) continue;

      const auditDate = new Date(audit.scheduledDate);
      const diffDays = Math.abs(
        (candidateDate.getTime() - auditDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays < 1) {
        candidateDate.setDate(candidateDate.getDate() + 3);
      }
    }

    return candidateDate;
  }
}

export const auditSchedulingAgent = new AuditSchedulingAgent();

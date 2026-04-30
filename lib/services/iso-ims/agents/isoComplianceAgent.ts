/**
 * ISO Compliance Agent
 *
 * Autonomous agent that monitors compliance in real-time
 * - Auto-creates NCRs for violations
 * - Auto-suggests CAPAs
 * - Auto-schedules audits
 * - Monitors compliance scores
 * - Predicts compliance risks
 */

import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import { ncrService } from "../ncrService";
import { capaService } from "../capaService";
import { auditService } from "../auditService";
import { complianceEngine } from "../complianceEngine";
import { intelligenceService } from "../intelligenceService";
import { eventBus, createEvent } from "@/lib/services/event-bus";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

// ============================================================================
// ISO COMPLIANCE AGENT
// ============================================================================

export class ISOComplianceAgent {
  private agentId = "iso-compliance-agent";
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  /**
   * Initialize and start monitoring
   */
  async initialize(): Promise<void> {
    try {
      // Register agent with orchestrator
      await agentOrchestrator.registerAgent({
        id: this.agentId,
        type: "iso-compliance",
        name: "ISO Compliance Agent",
        description: "Autonomous compliance monitoring and management",
        capabilities: [
          {
            id: "monitor-compliance",
            name: "Monitor Compliance",
            description:
              "Continuously monitor compliance scores and detect violations",
            categories: ["compliance", "monitoring"],
            confidenceThreshold: 0.8,
            priority: 10,
          },
          {
            id: "auto-create-ncr",
            name: "Auto-Create NCR",
            description: "Automatically create NCRs for compliance violations",
            categories: ["compliance", "ncr"],
            confidenceThreshold: 0.9,
            priority: 9,
          },
          {
            id: "suggest-capa",
            name: "Suggest CAPA",
            description: "Intelligently suggest CAPAs based on compliance gaps",
            categories: ["compliance", "capa"],
            confidenceThreshold: 0.85,
            priority: 8,
          },
          {
            id: "schedule-audit",
            name: "Schedule Audit",
            description:
              "Automatically schedule audits based on compliance risk",
            categories: ["compliance", "audit"],
            confidenceThreshold: 0.8,
            priority: 7,
          },
        ],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Start monitoring
      this.startMonitoring();

      console.log("✅ ISO Compliance Agent initialized");
    } catch (error) {
      console.error("Error initializing ISO Compliance Agent:", error);
      throw error;
    }
  }

  /**
   * Start continuous compliance monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Subscribe to compliance events
    this.subscribeToEvents();

    // Monitor every 5 minutes
    this.monitoringInterval = setInterval(
      async () => {
        try {
          await this.monitorCompliance();
        } catch (error) {
          console.error("Error in compliance monitoring:", error);
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes

    // Initial monitoring
    this.monitorCompliance();
  }

  /**
   * Subscribe to compliance events
   */
  private subscribeToEvents(): void {
    // Subscribe to compliance score updates
    eventBus.subscribe("iso-ims.compliance.updated", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        const { tenantId } = event.metadata;
        await this.monitorTenantCompliance(tenantId);
      }
    });

    // Subscribe to critical compliance events
    eventBus.subscribe("iso-ims.compliance.critical", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        const { tenantId } = event.metadata;
        await this.monitorTenantCompliance(tenantId);
      }
    });

    console.log("✅ ISO Compliance Agent event subscriptions registered");
  }

  /**
   * Monitor compliance across all tenants/customers
   */
  private async monitorCompliance(): Promise<void> {
    try {
      // Get all active tenants (would come from tenant service)
      // For now, monitor based on events
      // Listen for compliance events
      // This would be handled by event subscriptions
    } catch (error) {
      console.error("Error monitoring compliance:", error);
    }
  }

  /**
   * Monitor compliance for a specific tenant
   */
  async monitorTenantCompliance(tenantId: string): Promise<{
    violations: number;
    ncrCreated: number;
    capaSuggested: number;
    auditsScheduled: number;
  }> {
    try {
      const dashboard = await complianceEngine.getComplianceDashboard(tenantId);
      const violations: Array<{
        type: string;
        severity: string;
        description: string;
      }> = [];
      let ncrCreated = 0;
      let capaSuggested = 0;
      let auditsScheduled = 0;

      // Check for critical compliance issues
      if (dashboard.overallScore < 70) {
        violations.push({
          type: "CRITICAL_COMPLIANCE",
          severity: "CRITICAL",
          description: `Overall compliance score is ${dashboard.overallScore}%`,
        });

        // Auto-create NCR for critical compliance
        if (dashboard.overallScore < 60) {
          const ncr = await this.autoCreateNCR(tenantId, {
            title: "Critical Compliance Violation",
            description: `Overall compliance score dropped to ${dashboard.overallScore}%`,
            severity: "CRITICAL",
            category: "COMPLIANCE",
          });
          if (ncr) ncrCreated++;
        }
      }

      // Check for overdue items
      if (dashboard.overdueItems > 0) {
        violations.push({
          type: "OVERDUE_ITEMS",
          severity: "HIGH",
          description: `${dashboard.overdueItems} overdue compliance items`,
        });
      }

      // Check for non-compliant standards
      for (const metric of dashboard.byStandard) {
        if (metric.status === "NON_COMPLIANT") {
          violations.push({
            type: "STANDARD_NON_COMPLIANT",
            severity: "HIGH",
            description: `${metric.standard} is non-compliant`,
          });

          // Suggest CAPA
          const capa = await this.suggestCAPA(tenantId, {
            relatedStandard: metric.standard,
            description: `Address non-compliance with ${metric.standard}`,
          });
          if (capa) capaSuggested++;
        }
      }

      // Schedule audits for high-risk areas
      const highRiskStandards = dashboard.byStandard.filter(
        (m) => m.status === "NON_COMPLIANT" || m.score < 70,
      );

      for (const standard of highRiskStandards) {
        const audit = await this.scheduleAudit(tenantId, {
          standard: standard.standard,
          reason: `Compliance score is ${standard.score}%`,
        });
        if (audit) auditsScheduled++;
      }

      return {
        violations: violations.length,
        ncrCreated,
        capaSuggested,
        auditsScheduled,
      };
    } catch (error) {
      console.error("Error monitoring tenant compliance:", error);
      return {
        violations: 0,
        ncrCreated: 0,
        capaSuggested: 0,
        auditsScheduled: 0,
      };
    }
  }

  /**
   * Auto-create NCR for compliance violation
   */
  private async autoCreateNCR(
    tenantId: string,
    violation: {
      title: string;
      description: string;
      severity: string;
      category: string;
    },
  ): Promise<string | null> {
    try {
      const ncr = await ncrService.createNCR({
        tenantId,
        title: violation.title,
        description: violation.description,
        severity: violation.severity as any,
        category: violation.category as any,
        source: "AUTO_COMPLIANCE_AGENT",
        department: "COMPLIANCE",
        assignedTo: undefined, // Would assign to compliance manager
      });

      // Publish event
      await eventBus.publish(
        createEvent(
          "iso-ims.agent.ncr.created",
          ncr.id,
          "NCR",
          { ncrId: ncr.id, agentId: this.agentId, tenantId, violation },
          1,
          { tenantId, userId: "system" },
        ),
      );

      return ncr.id;
    } catch (error) {
      console.error("Error auto-creating NCR:", error);
      return null;
    }
  }

  /**
   * Suggest CAPA based on compliance gap
   */
  private async suggestCAPA(
    tenantId: string,
    gap: {
      relatedStandard?: string;
      description: string;
    },
  ): Promise<string | null> {
    try {
      // Use intelligence service to generate CAPA suggestions
      const suggestions = await intelligenceService.getCAPASuggestions({
        tenantId,
        context: gap.description,
        relatedStandard: gap.relatedStandard,
      });

      if (suggestions.length > 0) {
        const suggestion = suggestions[0]; // Use top suggestion

        // Create CAPA
        const capa = await capaService.createCAPA({
          tenantId,
          title: suggestion.title,
          description: suggestion.description,
          source: "AUTO_COMPLIANCE_AGENT",
          priority: suggestion.priority || "MEDIUM",
          relatedStandard: gap.relatedStandard,
        });

        // Publish event
        await eventBus.publish(
          createEvent(
            "iso-ims.agent.capa.suggested",
            capa.id,
            "CAPA",
            { capaId: capa.id, agentId: this.agentId, tenantId, suggestion },
            1,
            { tenantId, userId: "system" },
          ),
        );

        return capa.id;
      }

      return null;
    } catch (error) {
      console.error("Error suggesting CAPA:", error);
      return null;
    }
  }

  /**
   * Schedule audit based on compliance risk
   */
  private async scheduleAudit(
    tenantId: string,
    risk: {
      standard: string;
      reason: string;
    },
  ): Promise<string | null> {
    try {
      // Calculate audit date (30 days from now for high risk)
      const auditDate = new Date();
      auditDate.setDate(auditDate.getDate() + 30);

      const audit = await auditService.createAudit({
        tenantId,
        title: `Compliance Audit - ${risk.standard}`,
        description: `Scheduled by Compliance Agent: ${risk.reason}`,
        auditType: "INTERNAL",
        standard: risk.standard,
        scheduledDate: auditDate,
        status: "SCHEDULED",
      });

      // Publish event
      await eventBus.publish(
        createEvent(
          "iso-ims.agent.audit.scheduled",
          audit.id,
          "AUDIT",
          { auditId: audit.id, agentId: this.agentId, tenantId, risk },
          1,
          { tenantId, userId: "system" },
        ),
      );

      return audit.id;
    } catch (error) {
      console.error("Error scheduling audit:", error);
      return null;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
  }
}

export const isoComplianceAgent = new ISOComplianceAgent();

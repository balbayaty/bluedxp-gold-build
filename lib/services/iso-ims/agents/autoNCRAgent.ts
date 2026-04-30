/**
 * Auto-NCR Agent
 *
 * Autonomous agent that automatically creates NCRs from:
 * - IoT sensor data
 * - Quality issues
 * - Audit findings
 * - Risk assessments
 * - Compliance violations
 */

import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
import { ncrService } from "../ncrService";
import { intelligenceService } from "../intelligenceService";
import { eventBus, createEvent } from "@/lib/services/event-bus";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

// ============================================================================
// AUTO-NCR AGENT
// ============================================================================

export class AutoNCRAgent {
  private agentId = "auto-ncr-agent";
  private eventSubscriptions: Array<() => void> = [];

  /**
   * Initialize agent
   */
  async initialize(): Promise<void> {
    try {
      // Register agent
      await agentOrchestrator.registerAgent({
        id: this.agentId,
        type: "auto-ncr",
        name: "Auto-NCR Agent",
        description: "Automatically creates NCRs from various sources",
        capabilities: [
          {
            id: "create-ncr-from-iot",
            name: "Create NCR from IoT",
            description: "Create NCRs from IoT sensor anomalies",
            categories: ["ncr", "iot"],
            confidenceThreshold: 0.85,
            priority: 9,
          },
          {
            id: "create-ncr-from-quality",
            name: "Create NCR from Quality Issue",
            description: "Create NCRs from quality inspection failures",
            categories: ["ncr", "quality"],
            confidenceThreshold: 0.9,
            priority: 10,
          },
          {
            id: "create-ncr-from-audit",
            name: "Create NCR from Audit Finding",
            description: "Create NCRs from audit findings",
            categories: ["ncr", "audit"],
            confidenceThreshold: 0.95,
            priority: 8,
          },
        ],
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Subscribe to events
      this.subscribeToEvents();

      console.log("✅ Auto-NCR Agent initialized");
    } catch (error) {
      console.error("Error initializing Auto-NCR Agent:", error);
      throw error;
    }
  }

  /**
   * Subscribe to events that trigger NCR creation
   */
  private subscribeToEvents(): void {
    // Subscribe to IoT sensor anomalies
    eventBus.subscribe("iot.sensor.anomaly", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        await this.createNCRFromIoT(
          event.metadata.tenantId,
          event.payload as any,
        );
      }
    });

    // Subscribe to quality inspection failures
    eventBus.subscribe("quality.inspection.failed", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        await this.createNCRFromQualityIssue(
          event.metadata.tenantId,
          event.payload as any,
        );
      }
    });

    // Subscribe to audit findings
    eventBus.subscribe("audit.finding.critical", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        await this.createNCRFromAuditFinding(
          event.metadata.tenantId,
          event.payload as any,
        );
      }
    });

    // Subscribe to risk identification
    eventBus.subscribe("risk.identified.critical", async (event) => {
      if (event.payload && event.metadata?.tenantId) {
        // Could create NCR for critical risks
      }
    });

    console.log("✅ Auto-NCR Agent event subscriptions registered");
  }

  /**
   * Create NCR from IoT sensor anomaly
   */
  async createNCRFromIoT(
    tenantId: string,
    anomaly: {
      sensorId: string;
      sensorType: string;
      value: number;
      threshold: number;
      location?: string;
      facilityId?: string;
    },
  ): Promise<string | null> {
    try {
      // Use intelligence to determine if NCR is needed
      const shouldCreateNCR = await this.shouldCreateNCR({
        source: "IOT",
        severity: this.calculateSeverity(anomaly.value, anomaly.threshold),
        description: `${anomaly.sensorType} sensor ${anomaly.sensorId} detected anomaly: ${anomaly.value} (threshold: ${anomaly.threshold})`,
      });

      if (!shouldCreateNCR) {
        return null;
      }

      const ncr = await ncrService.createNCR({
        tenantId,
        title: `IoT Anomaly - ${anomaly.sensorType} Sensor ${anomaly.sensorId}`,
        description: `Sensor detected value ${anomaly.value} exceeding threshold ${anomaly.threshold}`,
        severity: this.calculateSeverity(anomaly.value, anomaly.threshold),
        category: "QUALITY",
        source: "AUTO_IOT_AGENT",
        department: "QUALITY",
        location: anomaly.location,
        facilityId: anomaly.facilityId,
      });

      // Publish event
      await eventBus.publish(
        createEvent(
          "iso-ims.agent.ncr.created.from-iot",
          ncr.id,
          "NCR",
          { ncrId: ncr.id, agentId: this.agentId, tenantId, anomaly },
          1,
          { tenantId, userId: "system" },
        ),
      );

      return ncr.id;
    } catch (error) {
      console.error("Error creating NCR from IoT:", error);
      return null;
    }
  }

  /**
   * Create NCR from quality inspection failure
   */
  async createNCRFromQualityIssue(
    tenantId: string,
    issue: {
      materialId?: string;
      orderId?: string;
      inspectionType: string;
      failureReason: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    },
  ): Promise<string | null> {
    try {
      const ncr = await ncrService.createNCR({
        tenantId,
        title: `Quality Issue - ${issue.inspectionType}`,
        description: issue.failureReason,
        severity: issue.severity,
        category: "QUALITY",
        source: "AUTO_QUALITY_AGENT",
        department: "QUALITY",
      });

      // Link to material/order if provided
      if (issue.materialId) {
        // Would link to material
      }
      if (issue.orderId) {
        // Would link to order
      }

      await eventBus.publish(
        createEvent(
          "iso-ims.agent.ncr.created.from-quality",
          ncr.id,
          "NCR",
          { ncrId: ncr.id, agentId: this.agentId, tenantId, issue },
          1,
          { tenantId, userId: "system" },
        ),
      );

      return ncr.id;
    } catch (error) {
      console.error("Error creating NCR from quality issue:", error);
      return null;
    }
  }

  /**
   * Create NCR from audit finding
   */
  async createNCRFromAuditFinding(
    tenantId: string,
    finding: {
      auditId: string;
      finding: string;
      severity: "MINOR" | "MAJOR" | "CRITICAL";
      standard?: string;
      clause?: string;
    },
  ): Promise<string | null> {
    try {
      // Convert audit severity to NCR severity
      const ncrSeverity =
        finding.severity === "CRITICAL"
          ? "CRITICAL"
          : finding.severity === "MAJOR"
            ? "HIGH"
            : "MEDIUM";

      const ncr = await ncrService.createNCR({
        tenantId,
        title: `Audit Finding - ${finding.standard || "General"}`,
        description: finding.finding,
        severity: ncrSeverity,
        category: "COMPLIANCE",
        source: "AUTO_AUDIT_AGENT",
        department: "COMPLIANCE",
        relatedStandard: finding.standard,
        relatedClause: finding.clause,
      });

      // Link to audit
      // Would update audit with NCR link

      await eventBus.publish(
        createEvent(
          "iso-ims.agent.ncr.created.from-audit",
          ncr.id,
          "NCR",
          { ncrId: ncr.id, agentId: this.agentId, tenantId, finding },
          1,
          { tenantId, userId: "system" },
        ),
      );

      return ncr.id;
    } catch (error) {
      console.error("Error creating NCR from audit finding:", error);
      return null;
    }
  }

  /**
   * Determine if NCR should be created
   */
  private async shouldCreateNCR(context: {
    source: string;
    severity: string;
    description: string;
  }): Promise<boolean> {
    try {
      // Use intelligence service to determine if NCR is needed
      // Check for similar existing NCRs
      // Check severity threshold
      // Check business rules

      // For now, create NCR if severity is HIGH or CRITICAL
      return context.severity === "HIGH" || context.severity === "CRITICAL";
    } catch (error) {
      console.error("Error determining if NCR should be created:", error);
      return false;
    }
  }

  /**
   * Calculate severity from sensor value
   */
  private calculateSeverity(
    value: number,
    threshold: number,
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const deviation = Math.abs(value - threshold) / threshold;

    if (deviation > 0.5) return "CRITICAL";
    if (deviation > 0.3) return "HIGH";
    if (deviation > 0.1) return "MEDIUM";
    return "LOW";
  }
}

export const autoNCRAgent = new AutoNCRAgent();

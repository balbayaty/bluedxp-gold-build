/**
 * Vision Workflow Triggers
 * Automatically triggers workflows based on vision analysis results
 */

import { eventBus } from "@/lib/services/event-store";
import unifiedVisionService, {
  UnifiedVisionAnalysis,
} from "@/lib/services/ai/unifiedVisionService";

export interface VisionWorkflowTrigger {
  id: string;
  name: string;
  condition: (analysis: UnifiedVisionAnalysis) => boolean;
  workflowId: string;
  workflowData: (analysis: UnifiedVisionAnalysis) => Record<string, any>;
  priority: "low" | "medium" | "high" | "critical";
  enabled: boolean;
}

class VisionWorkflowTriggerService {
  private triggers: VisionWorkflowTrigger[] = [
    {
      id: "critical-anomaly-ncr",
      name: "Auto-Create NCR on Critical Anomaly",
      condition: (analysis) => {
        const riskScore = analysis.anomalyDetection?.summary?.riskScore || 0;
        const criticalAnomalies =
          analysis.anomalyDetection?.anomalies?.filter(
            (a) => a.severity === "critical",
          ) || [];
        return riskScore >= 80 || criticalAnomalies.length > 0;
      },
      workflowId: "create-ncr",
      workflowData: (analysis) => ({
        type: "QUALITY",
        priority: "HIGH",
        subject: `Critical Anomaly Detected: ${analysis.anomalyDetection?.anomalies?.[0]?.type || "Unknown"}`,
        description:
          analysis.anomalyDetection?.anomalies?.[0]?.description ||
          "Critical anomaly detected by AI Vision",
        severity: "CRITICAL",
        source: "AI_VISION",
        visionAnalysisId: analysis.vision.id,
      }),
      priority: "critical",
      enabled: true,
    },
    {
      id: "safety-violation-incident",
      name: "Auto-Create Incident on Safety Violation",
      condition: (analysis) => {
        const safetyIssues = analysis.vision?.analysis?.safetyIssues || [];
        const criticalSafety = safetyIssues.filter(
          (s) => s.severity === "critical",
        );
        return criticalSafety.length > 0;
      },
      workflowId: "create-incident",
      workflowData: (analysis) => ({
        type: "SAFETY",
        severity: "CRITICAL",
        description:
          analysis.vision?.analysis?.safetyIssues?.[0]?.issue ||
          "Safety violation detected",
        source: "AI_VISION",
        visionAnalysisId: analysis.vision.id,
      }),
      priority: "critical",
      enabled: true,
    },
    {
      id: "damage-detected-report",
      name: "Auto-Create Damage Report",
      condition: (analysis) => {
        return (
          analysis.integration?.wms?.inventoryImpact?.damageDetected === true ||
          analysis.vision?.analysis?.qualityIssues?.some(
            (q) =>
              q.type.toLowerCase().includes("damage") ||
              q.type.toLowerCase().includes("crush") ||
              q.type.toLowerCase().includes("tear"),
          ) ||
          false
        );
      },
      workflowId: "create-damage-report",
      workflowData: (analysis) => {
        const damageIssue = analysis.vision?.analysis?.qualityIssues?.find(
          (q) => q.type.toLowerCase().includes("damage"),
        );
        return {
          damageType: damageIssue?.type?.toUpperCase() || "DAMAGED",
          severity: damageIssue?.severity?.toUpperCase() || "MODERATE",
          description: damageIssue?.issue || "Damage detected by AI Vision",
          source: "AI_VISION",
          visionAnalysisId: analysis.vision.id,
        };
      },
      priority: "high",
      enabled: true,
    },
    {
      id: "compliance-issue-capa",
      name: "Auto-Create CAPA on Compliance Issue",
      condition: (analysis) => {
        const complianceIssues =
          analysis.vision?.analysis?.complianceIssues || [];
        const criticalCompliance = complianceIssues.filter(
          (c) => c.confidence >= 80,
        );
        return criticalCompliance.length > 0;
      },
      workflowId: "create-capa",
      workflowData: (analysis) => ({
        type: "COMPLIANCE",
        priority: "HIGH",
        description:
          analysis.vision?.analysis?.complianceIssues?.[0]?.violation ||
          "Compliance issue detected",
        source: "AI_VISION",
        visionAnalysisId: analysis.vision.id,
      }),
      priority: "high",
      enabled: true,
    },
    {
      id: "quality-hold",
      name: "Auto-Create Quality Hold",
      condition: (analysis) => {
        const qualityScore = analysis.vision?.analysis?.qualityScore || 100;
        const qualityIssues = analysis.vision?.analysis?.qualityIssues || [];
        return qualityScore < 70 || qualityIssues.length >= 3;
      },
      workflowId: "create-quality-hold",
      workflowData: (analysis) => ({
        reason: "Quality issues detected by AI Vision",
        description: `Quality score: ${analysis.vision?.analysis?.qualityScore || 0}. Issues: ${analysis.vision?.analysis?.qualityIssues?.length || 0}`,
        source: "AI_VISION",
        visionAnalysisId: analysis.vision.id,
      }),
      priority: "medium",
      enabled: true,
    },
    {
      id: "inventory-update",
      name: "Auto-Update Inventory from Counting",
      condition: (analysis) => {
        return (
          analysis.integration?.wms?.inventoryImpact?.countDetected === true ||
          (analysis.vision?.analysis?.detectedObjects?.length || 0) > 0
        );
      },
      workflowId: "update-inventory",
      workflowData: (analysis) => ({
        itemCount: analysis.vision?.analysis?.detectedObjects?.length || 0,
        source: "AI_VISION",
        visionAnalysisId: analysis.vision.id,
      }),
      priority: "low",
      enabled: true,
    },
  ];

  /**
   * Process vision analysis and trigger workflows
   */
  async processVisionAnalysis(analysis: UnifiedVisionAnalysis): Promise<{
    triggered: number;
    workflows: Array<{ triggerId: string; workflowId: string; data: any }>;
  }> {
    const triggered: Array<{
      triggerId: string;
      workflowId: string;
      data: any;
    }> = [];

    for (const trigger of this.triggers) {
      if (!trigger.enabled) continue;

      try {
        if (trigger.condition(analysis)) {
          const workflowData = trigger.workflowData(analysis);

          // Emit workflow event
          await eventBus.emit("workflow:trigger", {
            workflowId: trigger.workflowId,
            data: workflowData,
            priority: trigger.priority,
            source: "vision_analysis",
            visionAnalysisId: analysis.vision.id,
          });

          triggered.push({
            triggerId: trigger.id,
            workflowId: trigger.workflowId,
            data: workflowData,
          });
        }
      } catch (error) {
        console.error(`Error processing trigger ${trigger.id}:`, error);
      }
    }

    return {
      triggered: triggered.length,
      workflows: triggered,
    };
  }

  /**
   * Get all triggers
   */
  getTriggers(): VisionWorkflowTrigger[] {
    return this.triggers;
  }

  /**
   * Enable/disable trigger
   */
  setTriggerEnabled(triggerId: string, enabled: boolean): void {
    const trigger = this.triggers.find((t) => t.id === triggerId);
    if (trigger) {
      trigger.enabled = enabled;
    }
  }

  /**
   * Add custom trigger
   */
  addTrigger(trigger: VisionWorkflowTrigger): void {
    this.triggers.push(trigger);
  }
}

export const visionWorkflowTriggerService = new VisionWorkflowTriggerService();
export default visionWorkflowTriggerService;

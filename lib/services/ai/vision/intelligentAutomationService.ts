/**
 * Intelligent Automation Service for Vision Module
 * Automated decision-making, workflow triggers, and continuous improvement
 * Uses AI agents, knowledge base, and self-learning for intelligent automation
 * NO DUPLICATION - Integrates with existing services
 */

import { visionAgentIntegration } from "./visionAgentIntegration";
import { visionDatabaseService } from "./visionDatabaseService";
import { humanInTheLoopService } from "./humanInTheLoopService";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { eventBus } from "@/lib/services/event-store";
import { agentOrchestrator } from "@/lib/services/agents/agentOrchestrator";
// Self-learning service is optional
// const selfLearningVisionService = null // Not directly used in automation

// ============================================================================
// TYPES
// ============================================================================

export interface AutomatedDecision {
  id: string;
  analysisId: string;
  decision: string;
  confidence: number;
  reasoning: string;
  actions: AutomatedAction[];
  requiresHumanApproval: boolean;
  createdAt: Date;
}

export interface AutomatedAction {
  type:
    | "create_ncr"
    | "create_capa"
    | "create_incident"
    | "create_damage_report"
    | "send_notification"
    | "update_status"
    | "trigger_workflow";
  priority: number;
  parameters: Record<string, any>;
  executed: boolean;
  executedAt?: Date;
  result?: any;
  error?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  conditions: AutomationCondition[];
  actions: Omit<
    AutomatedAction,
    "executed" | "executedAt" | "result" | "error"
  >[];
  enabled: boolean;
  priority: number;
  confidenceThreshold: number;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationCondition {
  field: string;
  operator:
    | "equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "in"
    | "not_in";
  value: any;
  logic?: "AND" | "OR";
}

// ============================================================================
// INTELLIGENT AUTOMATION SERVICE
// ============================================================================

class IntelligentAutomationService {
  private automationRules: Map<string, AutomationRule> = new Map();
  private decisionHistory: Map<string, AutomatedDecision> = new Map();

  /**
   * Initialize automation rules from knowledge base
   */
  async initialize(): Promise<void> {
    try {
      // Load automation rules from knowledge base
      const rules = await knowledgeBaseService.semanticSearch({
        query: "vision automation rule",
        limit: 100,
        threshold: 0.5,
      });

      for (const result of rules) {
        if (result.entry.type === "automation_rule") {
          try {
            const rule = JSON.parse(
              typeof result.entry.content === "string"
                ? result.entry.content
                : JSON.stringify(result.entry.content),
            ) as AutomationRule;
            if (rule.enabled) {
              this.automationRules.set(rule.id, rule);
            }
          } catch (error) {
            console.warn("Error parsing automation rule:", error);
          }
        }
      }

      console.log(`✅ Loaded ${this.automationRules.size} automation rules`);
    } catch (error) {
      console.warn("Error initializing automation rules:", error);
    }
  }

  /**
   * Process analysis and make automated decisions
   */
  async processAnalysis(
    analysisId: string,
    tenantId?: string,
  ): Promise<AutomatedDecision> {
    try {
      // Get analysis
      const analysis = await visionDatabaseService.getAnalysisByAnalysisId(
        analysisId,
        tenantId,
      );
      if (!analysis) {
        throw new Error("Analysis not found");
      }

      // Evaluate all automation rules
      const matchedRules = await this.evaluateRules(analysis, tenantId);

      // Generate actions from matched rules
      const actions = await this.generateActions(matchedRules, analysis);

      // Determine if human approval is needed
      const requiresHumanApproval = await this.requiresHumanApproval(
        analysis,
        actions,
      );

      // Create decision
      const decision: AutomatedDecision = {
        id: `decision-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        analysisId,
        decision: requiresHumanApproval
          ? "PENDING_HUMAN_APPROVAL"
          : "AUTO_EXECUTE",
        confidence: this.calculateDecisionConfidence(analysis, matchedRules),
        reasoning: this.generateReasoning(analysis, matchedRules, actions),
        actions,
        requiresHumanApproval,
        createdAt: new Date(),
      };

      // Store decision
      this.decisionHistory.set(decision.id, decision);

      // Execute actions if approved
      if (!requiresHumanApproval) {
        await this.executeActions(decision.actions, analysis);
      } else {
        // Request human approval
        await humanInTheLoopService.createFeedbackRequest({
          analysisId,
          type: "approval",
          priority: this.determinePriority(analysis),
          reason: "Automated actions require human approval",
          context: {
            analysis: analysis.analysis as any,
            suggestedActions: actions,
            questions: [
              "Please review the suggested automated actions",
              "Do you approve these actions?",
              "Are there any additional actions needed?",
            ],
            confidence: decision.confidence,
          },
          tenantId,
        });
      }

      // Emit decision event
      await eventBus.publish({
        type: "ai.vision.automation.decision.made",
        aggregateId: analysisId,
        aggregateType: "VisionAnalysis",
        payload: {
          decisionId: decision.id,
          analysisId,
          decision: decision.decision,
          confidence: decision.confidence,
          actionsCount: actions.length,
          requiresHumanApproval,
        },
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });

      return decision;
    } catch (error) {
      console.error("Error processing analysis for automation:", error);
      throw error;
    }
  }

  /**
   * Evaluate automation rules against analysis
   */
  private async evaluateRules(
    analysis: any,
    tenantId?: string,
  ): Promise<AutomationRule[]> {
    const matchedRules: AutomationRule[] = [];

    for (const rule of this.automationRules.values()) {
      // Check tenant match
      if (rule.tenantId && rule.tenantId !== tenantId) continue;

      // Check if rule is enabled
      if (!rule.enabled) continue;

      // Evaluate conditions
      const matches = await this.evaluateConditions(rule.conditions, analysis);
      if (matches) {
        matchedRules.push(rule);
      }
    }

    // Sort by priority
    return matchedRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate conditions against analysis
   */
  private async evaluateConditions(
    conditions: AutomationCondition[],
    analysis: any,
  ): Promise<boolean> {
    if (conditions.length === 0) return true;

    let result = true;
    let lastLogic: "AND" | "OR" = "AND";

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, analysis);

      if (i === 0) {
        result = conditionResult;
      } else {
        if (lastLogic === "AND") {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }
      }

      lastLogic = condition.logic || "AND";
    }

    return result;
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(
    condition: AutomationCondition,
    analysis: any,
  ): boolean {
    const fieldValue = this.getFieldValue(analysis, condition.field);

    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value;
      case "greater_than":
        return Number(fieldValue) > Number(condition.value);
      case "less_than":
        return Number(fieldValue) < Number(condition.value);
      case "contains":
        return String(fieldValue).includes(String(condition.value));
      case "in":
        return (
          Array.isArray(condition.value) && condition.value.includes(fieldValue)
        );
      case "not_in":
        return (
          Array.isArray(condition.value) &&
          !condition.value.includes(fieldValue)
        );
      default:
        return false;
    }
  }

  /**
   * Get field value from analysis (supports nested paths)
   */
  private getFieldValue(analysis: any, field: string): any {
    const parts = field.split(".");
    let value = analysis;

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Generate actions from matched rules
   */
  private async generateActions(
    rules: AutomationRule[],
    analysis: any,
  ): Promise<AutomatedAction[]> {
    const actions: AutomatedAction[] = [];

    for (const rule of rules) {
      for (const actionTemplate of rule.actions) {
        // Check confidence threshold
        const analysisConfidence = this.calculateAnalysisConfidence(analysis);
        if (analysisConfidence < rule.confidenceThreshold) {
          continue;
        }

        // Generate action with parameters
        const action: AutomatedAction = {
          ...actionTemplate,
          parameters: this.resolveParameters(
            actionTemplate.parameters,
            analysis,
          ),
          executed: false,
        };

        actions.push(action);
      }
    }

    // Remove duplicates and sort by priority
    const uniqueActions = this.deduplicateActions(actions);
    return uniqueActions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Resolve action parameters (supports template variables)
   */
  private resolveParameters(
    parameters: Record<string, any>,
    analysis: any,
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(parameters)) {
      if (
        typeof value === "string" &&
        value.startsWith("{{") &&
        value.endsWith("}}")
      ) {
        // Template variable
        const field = value.slice(2, -2).trim();
        resolved[key] = this.getFieldValue(analysis, field) || value;
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Deduplicate actions
   */
  private deduplicateActions(actions: AutomatedAction[]): AutomatedAction[] {
    const seen = new Set<string>();
    const unique: AutomatedAction[] = [];

    for (const action of actions) {
      const key = `${action.type}-${JSON.stringify(action.parameters)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(action);
      }
    }

    return unique;
  }

  /**
   * Execute automated actions
   */
  private async executeActions(
    actions: AutomatedAction[],
    analysis: any,
  ): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, analysis);
        action.executed = true;
        action.executedAt = new Date();
      } catch (error) {
        action.executed = false;
        action.error = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error executing action ${action.type}:`, error);
        // Continue with other actions
      }
    }
  }

  /**
   * Execute single action
   */
  private async executeAction(
    action: AutomatedAction,
    analysis: any,
  ): Promise<any> {
    switch (action.type) {
      case "create_ncr":
        return await this.createNCR(action.parameters, analysis);
      case "create_capa":
        return await this.createCAPA(action.parameters, analysis);
      case "create_incident":
        return await this.createIncident(action.parameters, analysis);
      case "create_damage_report":
        return await this.createDamageReport(action.parameters, analysis);
      case "send_notification":
        return await this.sendNotification(action.parameters, analysis);
      case "update_status":
        return await this.updateStatus(action.parameters, analysis);
      case "trigger_workflow":
        return await this.triggerWorkflow(action.parameters, analysis);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Create NCR (Non-Conformance Report)
   */
  private async createNCR(
    parameters: Record<string, any>,
    analysis: any,
  ): Promise<any> {
    await eventBus.publish({
      type: "iso-ims.ncr.auto.created",
      aggregateId: parameters.ncrId || `ncr-${Date.now()}`,
      aggregateType: "NCR",
      payload: {
        ...parameters,
        visionAnalysisId: analysis.analysisId,
        source: "vision_automation",
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
    return { success: true, type: "ncr" };
  }

  /**
   * Create CAPA (Corrective and Preventive Action)
   */
  private async createCAPA(
    parameters: Record<string, any>,
    analysis: any,
  ): Promise<any> {
    await eventBus.publish({
      type: "iso-ims.capa.auto.created",
      aggregateId: parameters.capaId || `capa-${Date.now()}`,
      aggregateType: "CAPA",
      payload: {
        ...parameters,
        visionAnalysisId: analysis.analysisId,
        source: "vision_automation",
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
    return { success: true, type: "capa" };
  }

  /**
   * Create Incident Report
   */
  private async createIncident(
    parameters: Record<string, any>,
    analysis: any,
  ): Promise<any> {
    await eventBus.publish({
      type: "qhse.incident.auto.created",
      aggregateId: parameters.incidentId || `incident-${Date.now()}`,
      aggregateType: "Incident",
      payload: {
        ...parameters,
        visionAnalysisId: analysis.analysisId,
        source: "vision_automation",
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
    return { success: true, type: "incident" };
  }

  /**
   * Create Damage Report
   */
  private async createDamageReport(
    parameters: Record<string, any>,
    analysis: any,
  ): Promise<any> {
    await eventBus.publish({
      type: "wms.damage.auto.created",
      aggregateId: parameters.damageId || `damage-${Date.now()}`,
      aggregateType: "Damage",
      payload: {
        ...parameters,
        visionAnalysisId: analysis.analysisId,
        source: "vision_automation",
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
    return { success: true, type: "damage" };
  }

  /**
   * Send Notification
   */
  private async sendNotification(
    parameters: Record<string, any>,
    analysis: any,
  ): Promise<any> {
    await eventBus.publish({
      type: "notification.send",
      aggregateId: `notification-${Date.now()}`,
      aggregateType: "Notification",
      payload: {
        ...parameters,
        visionAnalysisId: analysis.analysisId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
    return { success: true, type: "notification" };
  }

  /**
   * Update Status
   */
  private async updateStatus(
    parameters: Record<string, any>,
    analysis: any,
  ): Promise<any> {
    await visionDatabaseService.updateAnalysis(analysis.analysisId, {
      metadata: {
        ...analysis.metadata,
        status: parameters.status,
        updatedBy: "automation",
      },
    });
    return { success: true, type: "status_update" };
  }

  /**
   * Trigger Workflow
   */
  private async triggerWorkflow(
    parameters: Record<string, any>,
    analysis: any,
  ): Promise<any> {
    await eventBus.publish({
      type: "workflow:trigger",
      aggregateId: `workflow-${Date.now()}`,
      aggregateType: "Workflow",
      payload: {
        workflowId: parameters.workflowId,
        data: {
          ...parameters.data,
          visionAnalysisId: analysis.analysisId,
        },
        priority: parameters.priority || "medium",
        source: "vision_automation",
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
    return { success: true, type: "workflow" };
  }

  /**
   * Check if human approval is required
   */
  private async requiresHumanApproval(
    analysis: any,
    actions: AutomatedAction[],
  ): Promise<boolean> {
    // Always require approval for critical actions
    const criticalActions = actions.filter(
      (a) =>
        ["create_incident", "create_capa"].includes(a.type) && a.priority >= 8,
    );
    if (criticalActions.length > 0) return true;

    // Require approval if confidence is low
    const confidence = this.calculateAnalysisConfidence(analysis);
    if (confidence < 0.7) return true;

    // Require approval if critical issues detected
    if ((analysis.criticalIssues || 0) > 0) return true;

    // Check if auto-approval is allowed
    return !(await humanInTheLoopService.shouldAutoApprove(
      analysis.analysisId,
    ));
  }

  /**
   * Calculate analysis confidence
   */
  private calculateAnalysisConfidence(analysis: any): number {
    const complianceScore = analysis.complianceScore || 0;
    return complianceScore / 100;
  }

  /**
   * Calculate decision confidence
   */
  private calculateDecisionConfidence(
    analysis: any,
    rules: AutomationRule[],
  ): number {
    const analysisConfidence = this.calculateAnalysisConfidence(analysis);
    const rulesConfidence = rules.length > 0 ? 0.8 : 0.5;
    return (analysisConfidence + rulesConfidence) / 2;
  }

  /**
   * Generate reasoning for decision
   */
  private generateReasoning(
    analysis: any,
    rules: AutomationRule[],
    actions: AutomatedAction[],
  ): string {
    const reasons: string[] = [];

    reasons.push(
      `Analysis confidence: ${(this.calculateAnalysisConfidence(analysis) * 100).toFixed(0)}%`,
    );
    reasons.push(`Matched ${rules.length} automation rule(s)`);
    reasons.push(`Generated ${actions.length} action(s)`);

    if (analysis.criticalIssues > 0) {
      reasons.push(`${analysis.criticalIssues} critical issue(s) detected`);
    }

    return reasons.join(". ");
  }

  /**
   * Determine priority from analysis
   */
  private determinePriority(
    analysis: any,
  ): "low" | "medium" | "high" | "urgent" {
    if ((analysis.criticalIssues || 0) > 0) return "urgent";
    if ((analysis.totalIssues || 0) > 5) return "high";
    if ((analysis.totalIssues || 0) > 0) return "medium";
    return "low";
  }

  /**
   * Add automation rule
   */
  async addRule(
    rule: Omit<AutomationRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<AutomationRule> {
    const fullRule: AutomationRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.automationRules.set(fullRule.id, fullRule);

    // Store in knowledge base
    await knowledgeBaseService.addEntry({
      id: `automation-rule-${fullRule.id}`,
      type: "automation_rule",
      category: "vision_intelligence",
      title: `Automation Rule: ${fullRule.name}`,
      content: JSON.stringify(fullRule),
      source: "automation_service",
      metadata: {
        ruleId: fullRule.id,
        enabled: fullRule.enabled,
      },
      tenantId: fullRule.tenantId,
    });

    return fullRule;
  }
}

// Export singleton
export const intelligentAutomationService = new IntelligentAutomationService();

// Initialize on import
if (typeof window === "undefined") {
  intelligentAutomationService.initialize();
}

export default intelligentAutomationService;

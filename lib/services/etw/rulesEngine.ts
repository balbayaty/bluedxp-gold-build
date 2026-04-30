/**
 * ETW Rules Engine
 *
 * Policy-driven rules engine that determines:
 * - Required fields based on scope + mode + cargo hazard flags
 * - When permits section is required and which permits apply
 * - When MSDS is mandatory (Hazardous = true)
 * - When Civil Defense reference is required
 * - When border stages appear (cross-border = true)
 * - When multimodal handovers appear (legs > 1)
 * - When exception remarks are mandatory
 * - When invoice becomes eligible
 * - Visibility levels: internal vs customer-facing view
 */

import type { ETW, ETWScope, ComplianceFlags, PermitRecord } from "@/types/etw";

// ============================================================================
// RULE TYPES
// ============================================================================

export interface ETWRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  condition: RuleCondition;
  actions: RuleAction[];
}

export interface RuleCondition {
  scope?: ETWScope[];
  mode?: string[];
  hazardous?: boolean;
  crossBorder?: boolean;
  multimodal?: boolean;
  hasMSDS?: boolean;
  hasPermits?: boolean;
  custom?: (etw: ETW) => boolean;
}

export interface RuleAction {
  type:
    | "REQUIRE_FIELD"
    | "REQUIRE_SECTION"
    | "SHOW_SECTION"
    | "HIDE_SECTION"
    | "SET_VISIBILITY"
    | "VALIDATE"
    | "NOTIFY";
  target: string;
  value?: any;
  message?: string;
}

export interface RuleEvaluationResult {
  requiredFields: string[];
  requiredSections: string[];
  visibleSections: string[];
  hiddenSections: string[];
  visibilityLevel: "INTERNAL" | "CUSTOMER" | "PUBLIC";
  validationErrors: Array<{ field: string; message: string }>;
  notifications: Array<{ type: string; message: string }>;
}

// ============================================================================
// RULES ENGINE
// ============================================================================

class ETWRulesEngine {
  private rules: Map<string, ETWRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default rules
   */
  private initializeDefaultRules(): void {
    // Rule 1: Require MSDS for hazardous cargo
    this.registerRule({
      id: "require-msds-hazardous",
      name: "Require MSDS for Hazardous Cargo",
      description:
        "MSDS reference is mandatory when cargo is marked as hazardous",
      enabled: true,
      priority: 100,
      condition: {
        hazardous: true,
      },
      actions: [
        {
          type: "REQUIRE_FIELD",
          target: "compliance.msdsId",
          message: "MSDS reference is required for hazardous cargo",
        },
        {
          type: "REQUIRE_SECTION",
          target: "msds",
        },
      ],
    });

    // Rule 2: Require Civil Defense for hazardous/chemical
    this.registerRule({
      id: "require-civil-defense",
      name: "Require Civil Defense Reference",
      description: "Civil Defense reference required for hazardous cargo",
      enabled: true,
      priority: 90,
      condition: {
        hazardous: true,
      },
      actions: [
        {
          type: "REQUIRE_FIELD",
          target: "compliance.civilDefenseReference",
          message: "Civil Defense reference is required for hazardous cargo",
        },
      ],
    });

    // Rule 3: Show border stages for cross-border
    this.registerRule({
      id: "show-border-stages",
      name: "Show Border Stages",
      description: "Border stages section appears for cross-border shipments",
      enabled: true,
      priority: 80,
      condition: {
        crossBorder: true,
      },
      actions: [
        {
          type: "SHOW_SECTION",
          target: "border",
        },
        {
          type: "REQUIRE_SECTION",
          target: "customs",
        },
      ],
    });

    // Rule 4: Show multimodal handovers
    this.registerRule({
      id: "show-multimodal-handovers",
      name: "Show Multimodal Handovers",
      description: "Multimodal handover section appears when legs > 1",
      enabled: true,
      priority: 70,
      condition: {
        multimodal: true,
      },
      actions: [
        {
          type: "SHOW_SECTION",
          target: "multimodal",
        },
        {
          type: "REQUIRE_SECTION",
          target: "legs",
        },
      ],
    });

    // Rule 5: Require exception remarks for delivery exceptions
    this.registerRule({
      id: "require-exception-remarks",
      name: "Require Exception Remarks",
      description: "Exception remarks mandatory when delivery has exceptions",
      enabled: true,
      priority: 60,
      condition: {
        custom: (etw) => {
          return etw.delivery?.exceptions && etw.delivery.exceptions.length > 0;
        },
      },
      actions: [
        {
          type: "REQUIRE_FIELD",
          target: "delivery.exceptions[].description",
          message: "Exception description is required",
        },
      ],
    });

    // Rule 6: Invoice eligibility (delivery confirmed + receiver verification)
    this.registerRule({
      id: "invoice-eligibility",
      name: "Invoice Eligibility",
      description:
        "Invoice becomes eligible when delivery is confirmed and receiver verified",
      enabled: true,
      priority: 50,
      condition: {
        custom: (etw) => {
          return (
            etw.status === "DELIVERED" &&
            etw.delivery?.receiver?.signature?.verified === true
          );
        },
      },
      actions: [
        {
          type: "SET_VISIBILITY",
          target: "invoice",
          value: "ELIGIBLE",
        },
      ],
    });

    // Rule 7: Permits required for cross-border
    this.registerRule({
      id: "require-permits-cross-border",
      name: "Require Permits for Cross-Border",
      description: "Permits section required for cross-border shipments",
      enabled: true,
      priority: 85,
      condition: {
        crossBorder: true,
      },
      actions: [
        {
          type: "REQUIRE_SECTION",
          target: "permits",
        },
      ],
    });

    // Rule 8: Temperature control for temperature-sensitive cargo
    this.registerRule({
      id: "require-temperature-control",
      name: "Require Temperature Control",
      description: "Temperature control required when cargo requires it",
      enabled: true,
      priority: 75,
      condition: {
        custom: (etw) => {
          return etw.compliance.temperatureControl?.required === true;
        },
      },
      actions: [
        {
          type: "REQUIRE_FIELD",
          target: "compliance.temperatureControl.min",
          message: "Minimum temperature is required",
        },
        {
          type: "REQUIRE_FIELD",
          target: "compliance.temperatureControl.max",
          message: "Maximum temperature is required",
        },
      ],
    });

    // Rule 9: Customer view visibility
    this.registerRule({
      id: "customer-view-visibility",
      name: "Customer View Visibility",
      description: "Hide internal-only fields in customer view",
      enabled: true,
      priority: 40,
      condition: {
        custom: (etw) => {
          return etw.metadata?.customerView === true;
        },
      },
      actions: [
        {
          type: "HIDE_SECTION",
          target: "risk.causes",
        },
        {
          type: "HIDE_SECTION",
          target: "internal.notes",
        },
        {
          type: "SET_VISIBILITY",
          target: "visibility",
          value: "CUSTOMER",
        },
      ],
    });
  }

  /**
   * Register a rule
   */
  registerRule(rule: ETWRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Evaluate rules for an ETW
   */
  evaluateRules(etw: ETW): RuleEvaluationResult {
    const result: RuleEvaluationResult = {
      requiredFields: [],
      requiredSections: [],
      visibleSections: [],
      hiddenSections: [],
      visibilityLevel: "INTERNAL",
      validationErrors: [],
      notifications: [],
    };

    // Get applicable rules sorted by priority
    const applicableRules = Array.from(this.rules.values())
      .filter((rule) => rule.enabled)
      .filter((rule) => this.matchesCondition(rule.condition, etw))
      .sort((a, b) => b.priority - a.priority);

    // Apply rule actions
    for (const rule of applicableRules) {
      for (const action of rule.actions) {
        this.applyAction(action, result, etw);
      }
    }

    return result;
  }

  /**
   * Check if condition matches
   */
  private matchesCondition(condition: RuleCondition, etw: ETW): boolean {
    // Check scope
    if (condition.scope && !condition.scope.includes(etw.scope)) {
      return false;
    }

    // Check mode
    if (condition.mode && !condition.mode.includes(etw.mode)) {
      return false;
    }

    // Check hazardous
    if (
      condition.hazardous !== undefined &&
      condition.hazardous !== etw.compliance.hazardous
    ) {
      return false;
    }

    // Check cross-border
    if (condition.crossBorder !== undefined) {
      const isCrossBorder = etw.scope === "CROSS_BORDER";
      if (condition.crossBorder !== isCrossBorder) {
        return false;
      }
    }

    // Check multimodal
    if (
      condition.multimodal !== undefined &&
      condition.multimodal !== etw.isMultimodal
    ) {
      return false;
    }

    // Check hasMSDS
    if (condition.hasMSDS !== undefined) {
      const hasMSDS = !!etw.compliance.msdsId;
      if (condition.hasMSDS !== hasMSDS) {
        return false;
      }
    }

    // Check hasPermits
    if (condition.hasPermits !== undefined) {
      const hasPermits = etw.permits && etw.permits.length > 0;
      if (condition.hasPermits !== hasPermits) {
        return false;
      }
    }

    // Check custom condition
    if (condition.custom && !condition.custom(etw)) {
      return false;
    }

    return true;
  }

  /**
   * Apply rule action
   */
  private applyAction(
    action: RuleAction,
    result: RuleEvaluationResult,
    etw: ETW,
  ): void {
    switch (action.type) {
      case "REQUIRE_FIELD":
        if (!result.requiredFields.includes(action.target)) {
          result.requiredFields.push(action.target);
        }
        if (action.message) {
          result.validationErrors.push({
            field: action.target,
            message: action.message,
          });
        }
        break;

      case "REQUIRE_SECTION":
        if (!result.requiredSections.includes(action.target)) {
          result.requiredSections.push(action.target);
        }
        break;

      case "SHOW_SECTION":
        if (!result.visibleSections.includes(action.target)) {
          result.visibleSections.push(action.target);
        }
        // Remove from hidden if present
        result.hiddenSections = result.hiddenSections.filter(
          (s) => s !== action.target,
        );
        break;

      case "HIDE_SECTION":
        if (!result.hiddenSections.includes(action.target)) {
          result.hiddenSections.push(action.target);
        }
        // Remove from visible if present
        result.visibleSections = result.visibleSections.filter(
          (s) => s !== action.target,
        );
        break;

      case "SET_VISIBILITY":
        if (action.value === "CUSTOMER") {
          result.visibilityLevel = "CUSTOMER";
        } else if (action.value === "PUBLIC") {
          result.visibilityLevel = "PUBLIC";
        }
        break;

      case "VALIDATE":
        if (action.message) {
          result.validationErrors.push({
            field: action.target,
            message: action.message,
          });
        }
        break;

      case "NOTIFY":
        if (action.message) {
          result.notifications.push({
            type: action.target,
            message: action.message,
          });
        }
        break;
    }
  }

  /**
   * Validate ETW against rules
   */
  validateETW(etw: ETW): {
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
  } {
    const evaluation = this.evaluateRules(etw);

    // Check required fields
    const missingFields: Array<{ field: string; message: string }> = [];

    for (const field of evaluation.requiredFields) {
      const value = this.getFieldValue(etw, field);
      if (!value || (Array.isArray(value) && value.length === 0)) {
        const error = evaluation.validationErrors.find(
          (e) => e.field === field,
        );
        missingFields.push({
          field,
          message: error?.message || `${field} is required`,
        });
      }
    }

    return {
      valid: missingFields.length === 0,
      errors: missingFields,
    };
  }

  /**
   * Get field value from ETW using dot notation
   */
  private getFieldValue(etw: ETW, path: string): any {
    const parts = path.split(".");
    let value: any = etw;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return null;
      }

      // Handle array notation like "exceptions[].description"
      if (part.includes("[]")) {
        const [arrayName] = part.split("[]");
        if (Array.isArray(value[arrayName])) {
          return value[arrayName];
        }
        return null;
      }

      value = value[part];
    }

    return value;
  }

  /**
   * Get required permits for ETW
   */
  getRequiredPermits(etw: ETW): string[] {
    const required: string[] = [];

    // Cross-border requires customs permits
    if (etw.scope === "CROSS_BORDER") {
      required.push("CUSTOMS_DECLARATION");
      required.push("IMPORT_LICENSE");
    }

    // Hazardous cargo requires special permits
    if (etw.compliance.hazardous) {
      required.push("HAZARDOUS_MATERIALS_PERMIT");
      required.push("CIVIL_DEFENSE_APPROVAL");
    }

    // Temperature-controlled requires health permits
    if (etw.compliance.temperatureControl?.required) {
      required.push("HEALTH_CERTIFICATE");
    }

    return required;
  }
}

// Export singleton instance
export const etwRulesEngine = new ETWRulesEngine();

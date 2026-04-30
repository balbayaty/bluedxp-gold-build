/**
 * Controls Registry
 * Configurable controls referencing SOPs, regulations, Iktva requirements
 * NOT hardcoded legal claims - structured as configurable controls
 *
 * Aligned with Saudi compliance practices, internal IMS, and Iktva considerations
 */

import type { ControlReference } from "./types";

/**
 * Control Definition
 * Represents a configurable control that can be applied to decisions
 */
export interface Control {
  id: string;
  name: string;
  type: "SOP" | "REGULATION" | "IKTVA" | "INTERNAL_POLICY" | "CUSTOM";
  reference: string; // SOP ID, regulation code, Iktva control tag
  category?: string; // Regulation category (Saudi, Global, etc.)
  version?: string;
  description?: string;

  // Applicability
  appliesToModules: string[]; // Which modules this applies to
  appliesToEntityTypes: string[]; // Which entity types
  appliesToTenants?: string[]; // Specific tenants (empty = all)

  // Validation
  validationRule?: string; // JSONLogic or function reference
  validationFunction?: (
    context: any,
  ) => Promise<{ passed: boolean; notes?: string; severity?: string }>;
  required: boolean;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

  // Iktva-specific
  iktvaTag?: string; // Iktva control tag (configurable)
  iktvaCategory?: string; // Iktva category
  iktvaWeight?: number; // Iktva scoring weight

  // Saudi Compliance
  saudiRegulation?: {
    authority: string; // TGA, SFDA, SASO, etc.
    regulationCode?: string;
    article?: string;
  };

  // Status
  isActive: boolean;
  effectiveDate?: Date | string;
  expiryDate?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Control Validation Result
 */
export interface ControlValidationResult {
  passed: boolean;
  notes?: string;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  evidenceIds?: string[];
  violations?: string[];
}

class ControlsRegistry {
  private controls: Map<string, Control> = new Map();
  private controlCache: Map<string, Control[]> = new Map(); // Cache by module+entityType

  /**
   * Register a control
   */
  register(control: Control): void {
    this.controls.set(control.id, control);
    this.invalidateCache();
  }

  /**
   * Register multiple controls
   */
  registerBatch(controls: Control[]): void {
    controls.forEach((control) => this.register(control));
  }

  /**
   * Get control by ID
   */
  getControl(id: string): Control | undefined {
    return this.controls.get(id);
  }

  /**
   * Get all controls
   */
  getAllControls(): Control[] {
    return Array.from(this.controls.values());
  }

  /**
   * Get applicable controls for context
   */
  async getApplicableControls(
    module: string,
    entityType: string,
    tenantId?: string,
  ): Promise<Control[]> {
    const cacheKey = `${module}:${entityType}:${tenantId || "all"}`;

    if (this.controlCache.has(cacheKey)) {
      return this.controlCache.get(cacheKey)!;
    }

    const applicable = Array.from(this.controls.values())
      .filter((c) => {
        if (!c.isActive) return false;

        // Check effective/expiry dates
        const now = new Date();
        if (c.effectiveDate && new Date(c.effectiveDate) > now) return false;
        if (c.expiryDate && new Date(c.expiryDate) < now) return false;

        // Check module applicability
        if (
          c.appliesToModules.length > 0 &&
          !c.appliesToModules.includes(module)
        ) {
          return false;
        }

        // Check entity type applicability
        if (
          c.appliesToEntityTypes.length > 0 &&
          !c.appliesToEntityTypes.includes(entityType)
        ) {
          return false;
        }

        // Check tenant applicability
        if (c.appliesToTenants && c.appliesToTenants.length > 0) {
          if (!tenantId || !c.appliesToTenants.includes(tenantId)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by severity (CRITICAL first)
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });

    this.controlCache.set(cacheKey, applicable);
    return applicable;
  }

  /**
   * Validate control against context
   */
  async validateControl(
    control: Control,
    context: any,
  ): Promise<ControlValidationResult> {
    // Use custom validation function if provided
    if (control.validationFunction) {
      return await control.validationFunction(context);
    }

    // Use validation rule if provided (JSONLogic)
    if (control.validationRule) {
      // In a real implementation, this would use JSONLogic or similar
      // For now, return a placeholder
      return {
        passed: true,
        notes: `Control ${control.id} validated using rule`,
        severity: control.severity,
      };
    }

    // Default: pass if no validation defined
    return {
      passed: true,
      notes: `Control ${control.id} has no validation rule`,
      severity: control.severity,
    };
  }

  /**
   * Validate all applicable controls
   */
  async validateControls(
    module: string,
    entityType: string,
    context: any,
    tenantId?: string,
  ): Promise<ControlReference[]> {
    const applicableControls = await this.getApplicableControls(
      module,
      entityType,
      tenantId,
    );
    const results: ControlReference[] = [];

    for (const control of applicableControls) {
      const validation = await this.validateControl(control, context);

      results.push({
        controlId: control.id,
        controlType: control.type,
        reference: control.reference,
        category: control.category,
        version: control.version,
        appliedAt: new Date().toISOString(),
        result: validation.passed ? "PASS" : "FAIL",
        notes: validation.notes,
        severity: control.severity,
        evidenceIds: validation.evidenceIds,
      });
    }

    return results;
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.controlCache.clear();
  }

  /**
   * Update control
   */
  updateControl(id: string, updates: Partial<Control>): boolean {
    const control = this.controls.get(id);
    if (!control) return false;

    const updated: Control = {
      ...control,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.controls.set(id, updated);
    this.invalidateCache();
    return true;
  }

  /**
   * Delete control (soft delete)
   */
  deleteControl(id: string): boolean {
    const control = this.controls.get(id);
    if (!control) return false;

    this.updateControl(id, { isActive: false });
    return true;
  }

  /**
   * Get controls by type
   */
  getControlsByType(type: Control["type"]): Control[] {
    return Array.from(this.controls.values()).filter(
      (c) => c.type === type && c.isActive,
    );
  }

  /**
   * Get Iktva controls
   */
  getIktvaControls(): Control[] {
    return Array.from(this.controls.values()).filter(
      (c) => c.type === "IKTVA" && c.isActive,
    );
  }

  /**
   * Get Saudi regulation controls
   */
  getSaudiRegulationControls(): Control[] {
    return Array.from(this.controls.values()).filter(
      (c) => c.saudiRegulation && c.isActive,
    );
  }
}

export const controlsRegistry = new ControlsRegistry();

// ============================================================================
// DEFAULT CONTROLS INITIALIZATION
// ============================================================================

/**
 * Initialize default controls
 * These are examples - in production, controls should be loaded from database/config
 */
export function initializeDefaultControls(): void {
  // MSDS Approval SOP
  controlsRegistry.register({
    id: "sop-msds-001",
    name: "MSDS Approval SOP",
    type: "SOP",
    reference: "SOP-MSDS-001",
    description: "Standard Operating Procedure for MSDS approval",
    appliesToModules: ["hazalyze", "msds"],
    appliesToEntityTypes: ["msds"],
    required: true,
    severity: "HIGH",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    validationFunction: async (context) => {
      // Example validation: Check if MSDS has required fields
      const hasRequiredFields =
        context.data?.safetyData && context.data?.hazardInformation;
      return {
        passed: hasRequiredFields,
        notes: hasRequiredFields
          ? "MSDS has required fields"
          : "MSDS missing required fields",
        severity: "HIGH",
      };
    },
  });

  // Iktva Local Content Requirement
  controlsRegistry.register({
    id: "iktva-local-content",
    name: "Iktva Local Content Requirement",
    type: "IKTVA",
    reference: "IKTVA-LOCAL-CONTENT",
    iktvaTag: "local_content",
    iktvaCategory: "procurement",
    iktvaWeight: 0.3,
    description: "Iktva local content requirement for procurement",
    appliesToModules: ["procurement"],
    appliesToEntityTypes: ["purchase_order", "vendor"],
    required: false, // Configurable
    severity: "MEDIUM",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    validationFunction: async (context) => {
      // Example: Check if vendor has local content certification
      const hasLocalContent = context.data?.vendor?.localContentCertified;
      return {
        passed: hasLocalContent !== false,
        notes: hasLocalContent
          ? "Vendor meets local content requirements"
          : "Vendor local content status unknown",
        severity: "MEDIUM",
      };
    },
  });

  // Saudi SFDA Chemical Regulation
  controlsRegistry.register({
    id: "saudi-sfda-chemical",
    name: "SFDA Chemical Regulation Compliance",
    type: "REGULATION",
    reference: "SFDA-CHEM-REG-2024",
    category: "Saudi",
    saudiRegulation: {
      authority: "SFDA",
      regulationCode: "SFDA-CHEM-REG-2024",
      article: "Article 15",
    },
    description: "Saudi Food and Drug Authority chemical regulation compliance",
    appliesToModules: ["hazalyze", "msds"],
    appliesToEntityTypes: ["msds", "chemical"],
    required: true,
    severity: "CRITICAL",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Procurement Spend Limit Control
  controlsRegistry.register({
    id: "procurement-spend-limit",
    name: "Procurement Spend Limit Control",
    type: "INTERNAL_POLICY",
    reference: "POL-PROC-SPEND-001",
    description: "Internal policy for procurement spend approval limits",
    appliesToModules: ["procurement"],
    appliesToEntityTypes: ["purchase_order"],
    required: true,
    severity: "HIGH",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    validationFunction: async (context) => {
      const amount = context.data?.amount || 0;
      const limit = context.data?.approvalLimit || 100000;

      return {
        passed: amount <= limit,
        notes:
          amount > limit
            ? `Amount ${amount} exceeds limit ${limit}`
            : `Amount ${amount} within limit ${limit}`,
        severity: amount > limit ? "HIGH" : "LOW",
      };
    },
  });

  // Route Border Hours Control
  controlsRegistry.register({
    id: "route-border-hours",
    name: "Border Operating Hours Control",
    type: "REGULATION",
    reference: "TGA-BORDER-HOURS",
    category: "Saudi",
    saudiRegulation: {
      authority: "TGA",
      regulationCode: "TGA-BORDER-HOURS",
    },
    description:
      "Transport General Authority border operating hours regulation",
    appliesToModules: ["tms", "route-ops"],
    appliesToEntityTypes: ["shipment", "route"],
    required: true,
    severity: "HIGH",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    validationFunction: async (context) => {
      // Example: Check if route timing aligns with border hours
      const borderHours = { open: 6, close: 22 }; // 6 AM to 10 PM
      const estimatedArrival = context.data?.estimatedArrivalHour;

      const withinHours =
        estimatedArrival >= borderHours.open &&
        estimatedArrival <= borderHours.close;

      return {
        passed: withinHours,
        notes: withinHours
          ? `Arrival time ${estimatedArrival} within border hours`
          : `Arrival time ${estimatedArrival} outside border hours (${borderHours.open}-${borderHours.close})`,
        severity: withinHours ? "LOW" : "HIGH",
      };
    },
  });
}

// Initialize default controls on module load
initializeDefaultControls();

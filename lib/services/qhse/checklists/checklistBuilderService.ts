/**
 * QHSE Checklist Builder Service
 * Visual checklist builder with templates and scoring
 * Integrated with inspection service
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import type { InspectionChecklistItem } from "@/types/qhse";

// ============================================================================
// CHECKLIST TYPES
// ============================================================================

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  category: "SAFETY" | "ENVIRONMENTAL" | "QUALITY" | "COMPLIANCE" | "CUSTOM";
  standard?: string; // ISO 45001, OSHA, etc.
  items: ChecklistItemTemplate[];
  scoringRules?: ScoringRule[];
  version: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ChecklistItemTemplate {
  id: string;
  question: string;
  type:
    | "YES_NO"
    | "MULTIPLE_CHOICE"
    | "TEXT"
    | "NUMBER"
    | "PHOTO"
    | "SIGNATURE";
  required: boolean;
  options?: string[];
  conditionalLogic?: ConditionalLogic;
  weight?: number; // For scoring
  category?: string;
}

export interface ConditionalLogic {
  dependsOn: string; // Item ID
  condition:
    | "EQUALS"
    | "NOT_EQUALS"
    | "CONTAINS"
    | "GREATER_THAN"
    | "LESS_THAN";
  value: any;
  showIf: boolean;
}

export interface ScoringRule {
  id: string;
  name: string;
  type: "WEIGHTED" | "PENALTY" | "BONUS";
  items: string[]; // Item IDs
  calculation: string; // Formula
}

export interface BuiltChecklist {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  items: InspectionChecklistItem[];
  scoringEnabled: boolean;
  totalScore?: number;
  maxScore?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// CHECKLIST BUILDER SERVICE
// ============================================================================

class ChecklistBuilderService {
  private templates: Map<string, ChecklistTemplate> = new Map();
  private builtChecklists: Map<string, BuiltChecklist> = new Map();

  /**
   * Register template
   */
  registerTemplate(template: ChecklistTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get all templates
   */
  getTemplates(category?: string): ChecklistTemplate[] {
    const templates = Array.from(this.templates.values());
    return category
      ? templates.filter((t) => t.category === category)
      : templates;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): ChecklistTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Build checklist from template
   */
  async buildFromTemplate(
    templateId: string,
    customizations?: {
      name?: string;
      description?: string;
      includeItems?: string[];
      excludeItems?: string[];
    },
  ): Promise<BuiltChecklist> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let items = template.items;
    if (customizations?.includeItems) {
      items = items.filter((item) =>
        customizations.includeItems!.includes(item.id),
      );
    }
    if (customizations?.excludeItems) {
      items = items.filter(
        (item) => !customizations.excludeItems!.includes(item.id),
      );
    }

    const checklistItems: InspectionChecklistItem[] = items.map((item) => ({
      id: item.id,
      inspectionId: "", // Will be set when used in inspection
      question: item.question,
      type: item.type,
      required: item.required,
      options: item.options,
      answer: undefined,
      status: "PENDING",
      notes: undefined,
      photos: [],
      weight: item.weight,
    }));

    const checklist: BuiltChecklist = {
      id: `checklist-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: customizations?.name || template.name,
      description: customizations?.description || template.description,
      templateId,
      items: checklistItems,
      scoringEnabled: !!template.scoringRules,
      maxScore: template.scoringRules
        ? this.calculateMaxScore(checklistItems)
        : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.builtChecklists.set(checklist.id, checklist);

    // Store in knowledge base
    await knowledgeBaseService.store({
      entity: "qhse-checklist",
      id: checklist.id,
      content: `QHSE Checklist: ${checklist.name}\n\nItems: ${checklist.items.length}\nTemplate: ${template.name}`,
      metadata: {
        templateId,
        category: template.category,
        itemCount: checklist.items.length,
      },
    });

    // Publish event
    await eventBus.publish({
      type: "qhse.checklist.built",
      payload: { checklistId: checklist.id, templateId },
      timestamp: new Date().toISOString(),
    });

    return checklist;
  }

  /**
   * Create custom checklist
   */
  async createCustomChecklist(
    name: string,
    description: string,
    items: ChecklistItemTemplate[],
  ): Promise<BuiltChecklist> {
    const checklistItems: InspectionChecklistItem[] = items.map((item) => ({
      id: item.id,
      inspectionId: "",
      question: item.question,
      type: item.type,
      required: item.required,
      options: item.options,
      answer: undefined,
      status: "PENDING",
      notes: undefined,
      photos: [],
      weight: item.weight,
    }));

    const checklist: BuiltChecklist = {
      id: `checklist-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      description,
      items: checklistItems,
      scoringEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.builtChecklists.set(checklist.id, checklist);
    return checklist;
  }

  /**
   * Get built checklist
   */
  getBuiltChecklist(checklistId: string): BuiltChecklist | null {
    return this.builtChecklists.get(checklistId) || null;
  }

  /**
   * Calculate max score
   */
  private calculateMaxScore(items: InspectionChecklistItem[]): number {
    return items.reduce((sum, item) => sum + (item.weight || 1), 0);
  }

  /**
   * Calculate score for completed checklist
   */
  calculateScore(checklist: BuiltChecklist): number {
    if (!checklist.scoringEnabled) return 0;

    return checklist.items.reduce((score, item) => {
      if (item.answer === "YES" || item.answer === "PASS") {
        return score + (item.weight || 1);
      }
      return score;
    }, 0);
  }
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

const service = new ChecklistBuilderService();

// ISO 45001 Safety Inspection Template
service.registerTemplate({
  id: "iso-45001-safety",
  name: "ISO 45001 Safety Inspection",
  description: "Comprehensive safety inspection checklist based on ISO 45001",
  category: "SAFETY",
  standard: "ISO 45001:2018",
  items: [
    {
      id: "safety-1",
      question: "Are all safety procedures documented and accessible?",
      type: "YES_NO",
      required: true,
      weight: 5,
      category: "Documentation",
    },
    {
      id: "safety-2",
      question: "Are emergency exits clearly marked and unobstructed?",
      type: "YES_NO",
      required: true,
      weight: 10,
      category: "Emergency Preparedness",
    },
    {
      id: "safety-3",
      question: "Are fire extinguishers present and properly maintained?",
      type: "YES_NO",
      required: true,
      weight: 10,
      category: "Fire Safety",
    },
    {
      id: "safety-4",
      question: "Is PPE available and in good condition?",
      type: "YES_NO",
      required: true,
      weight: 8,
      category: "PPE",
    },
    {
      id: "safety-5",
      question: "Are safety training records up to date?",
      type: "YES_NO",
      required: true,
      weight: 5,
      category: "Training",
    },
  ],
  version: "1.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// OSHA Compliance Template
service.registerTemplate({
  id: "osha-compliance",
  name: "OSHA Compliance Checklist",
  description: "OSHA compliance inspection checklist",
  category: "COMPLIANCE",
  standard: "OSHA",
  items: [
    {
      id: "osha-1",
      question: "Are hazard communication programs in place?",
      type: "YES_NO",
      required: true,
      weight: 10,
    },
    {
      id: "osha-2",
      question: "Are lockout/tagout procedures documented?",
      type: "YES_NO",
      required: true,
      weight: 10,
    },
    {
      id: "osha-3",
      question: "Are machine guards in place and functional?",
      type: "YES_NO",
      required: true,
      weight: 8,
    },
  ],
  version: "1.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Environmental Inspection Template
service.registerTemplate({
  id: "environmental-inspection",
  name: "Environmental Inspection Checklist",
  description: "Environmental compliance inspection",
  category: "ENVIRONMENTAL",
  standard: "ISO 14001",
  items: [
    {
      id: "env-1",
      question: "Are waste management procedures followed?",
      type: "YES_NO",
      required: true,
      weight: 10,
    },
    {
      id: "env-2",
      question: "Are spill containment measures in place?",
      type: "YES_NO",
      required: true,
      weight: 10,
    },
    {
      id: "env-3",
      question: "Is air quality monitoring conducted?",
      type: "YES_NO",
      required: false,
      weight: 5,
    },
  ],
  version: "1.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const checklistBuilderService = service;

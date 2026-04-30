/**
 * Intelligent Form Service
 * AI-powered form field suggestions, auto-completion, and context-aware assistance
 * Much more comprehensive than source apps
 */

import { callAI } from "@/utils/aiClient";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";
import { eventBus } from "@/lib/services/event-store";

export interface FormField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "email" | "url";
  label: string;
  value: any;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: any }>;
}

export interface FormContext {
  formType: string;
  moduleId: string;
  entityType?: string;
  entityId?: string;
  relatedEntities?: Array<{ type: string; id: string; name: string }>;
  userRole?: string;
  tenantId?: string;
  previousValues?: Record<string, any>;
  similarForms?: Array<Record<string, any>>;
}

export interface FieldSuggestion {
  fieldId: string;
  suggestedValue: any;
  confidence: number; // 0-100
  reasoning: string;
  source:
    | "AI_ANALYSIS"
    | "PATTERN_DETECTION"
    | "KNOWLEDGE_BASE"
    | "SIMILAR_FORMS"
    | "USER_HISTORY";
  alternatives?: Array<{ value: any; confidence: number }>;
}

export interface FormRecommendation {
  type:
    | "FIELD_SUGGESTION"
    | "VALIDATION_WARNING"
    | "COMPLETION_TIP"
    | "RELATED_FIELD"
    | "AUTO_FILL";
  fieldId?: string;
  message: string;
  action?: {
    type: "FILL_FIELD" | "SHOW_OPTIONS" | "VALIDATE" | "SUGGEST_RELATED";
    data?: any;
  };
  priority: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
}

export interface IntelligentFormState {
  fields: FormField[];
  context: FormContext;
  suggestions: Map<string, FieldSuggestion>;
  recommendations: FormRecommendation[];
  autoFilledFields: Set<string>;
  validationErrors: Map<string, string>;
}

class IntelligentFormService {
  private formStates: Map<string, IntelligentFormState> = new Map();

  /**
   * Initialize intelligent form
   */
  async initializeForm(
    formId: string,
    fields: FormField[],
    context: FormContext,
  ): Promise<IntelligentFormState> {
    const state: IntelligentFormState = {
      fields,
      context,
      suggestions: new Map(),
      recommendations: [],
      autoFilledFields: new Set(),
      validationErrors: new Map(),
    };

    this.formStates.set(formId, state);

    // Generate initial suggestions
    await this.generateSuggestions(formId);

    return state;
  }

  /**
   * Generate intelligent field suggestions
   */
  async generateSuggestions(formId: string): Promise<FieldSuggestion[]> {
    const state = this.formStates.get(formId);
    if (!state) {
      throw new Error(`Form not found: ${formId}`);
    }

    const suggestions: FieldSuggestion[] = [];

    // Analyze each field
    for (const field of state.fields) {
      // Skip if already has value
      if (field.value) continue;

      // Get suggestions from multiple sources
      const aiSuggestion = await this.getAISuggestion(field, state.context);
      const patternSuggestion = await this.getPatternSuggestion(
        field,
        state.context,
      );
      const knowledgeSuggestion = await this.getKnowledgeBaseSuggestion(
        field,
        state.context,
      );

      // Combine suggestions (prioritize AI, then pattern, then knowledge base)
      let bestSuggestion: FieldSuggestion | null = null;
      if (aiSuggestion && aiSuggestion.confidence >= 70) {
        bestSuggestion = aiSuggestion;
      } else if (patternSuggestion && patternSuggestion.confidence >= 60) {
        bestSuggestion = patternSuggestion;
      } else if (knowledgeSuggestion && knowledgeSuggestion.confidence >= 50) {
        bestSuggestion = knowledgeSuggestion;
      }

      if (bestSuggestion) {
        suggestions.push(bestSuggestion);
        state.suggestions.set(field.id, bestSuggestion);
      }
    }

    // Generate recommendations
    state.recommendations = await this.generateRecommendations(state);

    return suggestions;
  }

  /**
   * Get AI-powered suggestion for a field
   */
  private async getAISuggestion(
    field: FormField,
    context: FormContext,
  ): Promise<FieldSuggestion | null> {
    try {
      const prompt = `You are an intelligent form assistant. Suggest a value for this form field based on context.

Form Type: ${context.formType}
Module: ${context.moduleId}
Field: ${field.label} (${field.name})
Field Type: ${field.type}
${field.placeholder ? `Placeholder: ${field.placeholder}` : ""}
${context.relatedEntities ? `Related Entities: ${JSON.stringify(context.relatedEntities)}` : ""}
${context.previousValues ? `Previous Values: ${JSON.stringify(context.previousValues)}` : ""}

Suggest a value that makes sense in this context. Return JSON:
{
  "suggestedValue": "the suggested value",
  "confidence": 0-100,
  "reasoning": "why this value makes sense",
  "alternatives": [{"value": "alt1", "confidence": 50}, ...]
}`;

      const response = await callAI(
        [
          {
            role: "system",
            content:
              "You are an intelligent form assistant that provides helpful, context-aware field suggestions.",
          },
          { role: "user", content: prompt },
        ],
        {
          temperature: 0.3,
          maxTokens: 500,
        },
      );

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return {
          fieldId: field.id,
          suggestedValue: data.suggestedValue,
          confidence: data.confidence || 50,
          reasoning: data.reasoning || "AI-generated suggestion",
          source: "AI_ANALYSIS",
          alternatives: data.alternatives || [],
        };
      }
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
    }

    return null;
  }

  /**
   * Get pattern-based suggestion
   */
  private async getPatternSuggestion(
    field: FormField,
    context: FormContext,
  ): Promise<FieldSuggestion | null> {
    // Analyze similar forms
    if (context.similarForms && context.similarForms.length > 0) {
      const values = context.similarForms
        .map((form) => form[field.name])
        .filter((v) => v !== undefined && v !== null && v !== "");

      if (values.length > 0) {
        // Get most common value
        const valueCounts = new Map<any, number>();
        values.forEach((v) => {
          valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
        });

        const mostCommon = Array.from(valueCounts.entries()).sort(
          (a, b) => b[1] - a[1],
        )[0];

        if (mostCommon && mostCommon[1] >= 2) {
          return {
            fieldId: field.id,
            suggestedValue: mostCommon[0],
            confidence: Math.min(80, (mostCommon[1] / values.length) * 100),
            reasoning: `Based on ${mostCommon[1]} similar forms`,
            source: "SIMILAR_FORMS",
          };
        }
      }
    }

    return null;
  }

  /**
   * Get suggestion from knowledge base
   */
  private async getKnowledgeBaseSuggestion(
    field: FormField,
    context: FormContext,
  ): Promise<FieldSuggestion | null> {
    try {
      const query = `${context.formType} ${field.label} ${field.name}`;
      const results = await knowledgeBaseService.search(query, {
        limit: 5,
        tenantId: context.tenantId,
      });

      if (results.length > 0) {
        // Extract common values from knowledge base
        const topResult = results[0];
        return {
          fieldId: field.id,
          suggestedValue: topResult.content.substring(0, 100), // Simplified
          confidence: Math.min(70, topResult.relevance * 100),
          reasoning: `Based on knowledge base: ${topResult.entity}`,
          source: "KNOWLEDGE_BASE",
        };
      }
    } catch (error) {
      console.error("Error getting knowledge base suggestion:", error);
    }

    return null;
  }

  /**
   * Generate form recommendations
   */
  private async generateRecommendations(
    state: IntelligentFormState,
  ): Promise<FormRecommendation[]> {
    const recommendations: FormRecommendation[] = [];

    // Check for required fields without values
    state.fields.forEach((field) => {
      if (field.required && !field.value) {
        recommendations.push({
          type: "COMPLETION_TIP",
          fieldId: field.id,
          message: `${field.label} is required`,
          priority: "HIGH",
          confidence: 100,
        });
      }
    });

    // Check for related fields that should be filled together
    const relatedFields = this.detectRelatedFields(state.fields);
    relatedFields.forEach((related) => {
      recommendations.push({
        type: "RELATED_FIELD",
        fieldId: related.fieldId,
        message: `Consider also filling: ${related.relatedLabel}`,
        action: {
          type: "SUGGEST_RELATED",
          data: related.relatedFieldId,
        },
        priority: "MEDIUM",
        confidence: 75,
      });
    });

    // Auto-fill suggestions
    state.suggestions.forEach((suggestion, fieldId) => {
      if (suggestion.confidence >= 70) {
        recommendations.push({
          type: "AUTO_FILL",
          fieldId,
          message: suggestion.reasoning,
          action: {
            type: "FILL_FIELD",
            data: suggestion.suggestedValue,
          },
          priority: "MEDIUM",
          confidence: suggestion.confidence,
        });
      }
    });

    return recommendations;
  }

  /**
   * Detect related fields
   */
  private detectRelatedFields(fields: FormField[]): Array<{
    fieldId: string;
    relatedFieldId: string;
    relatedLabel: string;
  }> {
    const related: Array<{
      fieldId: string;
      relatedFieldId: string;
      relatedLabel: string;
    }> = [];

    // Common field relationships
    const relationships: Array<[string, string]> = [
      ["customer", "customer_impact"],
      ["supplier", "supplier_impact"],
      ["priority", "due_date"],
      ["type", "category"],
    ];

    relationships.forEach(([field1, field2]) => {
      const f1 = fields.find((f) => f.name.includes(field1));
      const f2 = fields.find((f) => f.name.includes(field2));
      if (f1 && f2 && f1.value && !f2.value) {
        related.push({
          fieldId: f1.id,
          relatedFieldId: f2.id,
          relatedLabel: f2.label,
        });
      }
    });

    return related;
  }

  /**
   * Update field value and regenerate suggestions
   */
  async updateField(
    formId: string,
    fieldId: string,
    value: any,
  ): Promise<IntelligentFormState> {
    const state = this.formStates.get(formId);
    if (!state) {
      throw new Error(`Form not found: ${formId}`);
    }

    // Update field value
    const field = state.fields.find((f) => f.id === fieldId);
    if (field) {
      field.value = value;
      state.suggestions.delete(fieldId); // Remove suggestion for filled field
    }

    // Regenerate suggestions for related fields
    await this.generateSuggestions(formId);

    return state;
  }

  /**
   * Auto-fill field with suggestion
   */
  async autoFillField(
    formId: string,
    fieldId: string,
  ): Promise<IntelligentFormState> {
    const state = this.formStates.get(formId);
    if (!state) {
      throw new Error(`Form not found: ${formId}`);
    }

    const suggestion = state.suggestions.get(fieldId);
    if (suggestion) {
      await this.updateField(formId, fieldId, suggestion.suggestedValue);
      state.autoFilledFields.add(fieldId);

      // Publish event
      eventBus.publish({
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: "form.field.auto_filled",
        aggregateId: formId,
        aggregateType: "INTELLIGENT_FORM",
        version: 1,
        timestamp: new Date().toISOString(),
        payload: {
          formId,
          fieldId,
          value: suggestion.suggestedValue,
          confidence: suggestion.confidence,
        },
      });
    }

    return state;
  }

  /**
   * Get form state
   */
  getFormState(formId: string): IntelligentFormState | null {
    return this.formStates.get(formId) || null;
  }

  /**
   * Validate form
   */
  async validateForm(formId: string): Promise<{
    valid: boolean;
    errors: Map<string, string>;
  }> {
    const state = this.formStates.get(formId);
    if (!state) {
      throw new Error(`Form not found: ${formId}`);
    }

    const errors = new Map<string, string>();

    state.fields.forEach((field) => {
      if (field.required && (!field.value || field.value === "")) {
        errors.set(field.id, `${field.label} is required`);
      }

      // Type-specific validation
      if (field.value) {
        if (field.type === "email" && !field.value.includes("@")) {
          errors.set(field.id, "Invalid email format");
        }
        if (field.type === "number" && isNaN(Number(field.value))) {
          errors.set(field.id, "Must be a number");
        }
        if (field.type === "date" && isNaN(Date.parse(field.value))) {
          errors.set(field.id, "Invalid date format");
        }
      }
    });

    state.validationErrors = errors;

    return {
      valid: errors.size === 0,
      errors,
    };
  }
}

export const intelligentFormService = new IntelligentFormService();
export default intelligentFormService;

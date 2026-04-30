/**
 * QHSE Custom Fields Service
 * Dynamic custom fields for incidents, inspections, training
 * Integrated with all QHSE entities
 */

import { eventBus } from "@/lib/services/event-store";
import { knowledgeBaseService } from "@/lib/services/knowledge-base";

// ============================================================================
// CUSTOM FIELD TYPES
// ============================================================================

export type CustomFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "DATETIME"
  | "BOOLEAN"
  | "SELECT"
  | "MULTI_SELECT"
  | "TEXTAREA"
  | "URL"
  | "EMAIL"
  | "PHONE";

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: CustomFieldType;
  entityType: "INCIDENT" | "INSPECTION" | "TRAINING" | "ALL";
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For SELECT/MULTI_SELECT
  validation?: ValidationRule;
  visibility?: VisibilityRule;
  dependencies?: FieldDependency[];
  order: number;
  tenantId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ValidationRule {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: (value: any) => boolean | string;
}

export interface VisibilityRule {
  roles?: string[];
  conditions?: Array<{
    field: string;
    operator:
      | "EQUALS"
      | "NOT_EQUALS"
      | "CONTAINS"
      | "GREATER_THAN"
      | "LESS_THAN";
    value: any;
  }>;
}

export interface FieldDependency {
  fieldId: string;
  condition:
    | "EQUALS"
    | "NOT_EQUALS"
    | "CONTAINS"
    | "GREATER_THAN"
    | "LESS_THAN";
  value: any;
  showIf: boolean;
}

export interface CustomFieldValue {
  fieldId: string;
  value: any;
}

// ============================================================================
// CUSTOM FIELD SERVICE
// ============================================================================

class CustomFieldService {
  private fields: Map<string, CustomField> = new Map();
  private fieldValues: Map<string, Map<string, CustomFieldValue>> = new Map(); // entityId -> fieldId -> value

  /**
   * Get all custom fields or filter by entity type
   */
  async getCustomFields(entityType?: string): Promise<CustomField[]> {
    const fields = Array.from(this.fields.values());

    if (entityType && entityType !== "ALL") {
      return fields.filter(
        (f) => f.entityType === entityType || f.entityType === "ALL",
      );
    }

    return fields;
  }

  /**
   * Create custom field
   */
  async createCustomField(
    field: Omit<CustomField, "id" | "createdAt" | "updatedAt">,
  ): Promise<CustomField> {
    return this.createField(field);
  }

  /**
   * Create custom field (internal)
   */
  async createField(
    field: Omit<CustomField, "id" | "createdAt" | "updatedAt">,
  ): Promise<CustomField> {
    const customField: CustomField = {
      ...field,
      id: `field-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.fields.set(customField.id, customField);

    // Store in knowledge base
    await knowledgeBaseService.store({
      entity: "qhse-custom-field",
      id: customField.id,
      content: `Custom Field: ${customField.label}\nType: ${customField.type}\nEntity: ${customField.entityType}`,
      metadata: {
        entityType: customField.entityType,
        type: customField.type,
        required: customField.required,
      },
    });

    // Publish event
    await eventBus.publish({
      type: "qhse.custom-field.created",
      payload: { fieldId: customField.id, entityType: customField.entityType },
      timestamp: new Date().toISOString(),
    });

    return customField;
  }

  /**
   * Get fields for entity type
   */
  getFieldsForEntity(
    entityType: "INCIDENT" | "INSPECTION" | "TRAINING",
    tenantId: string,
    context?: { role?: string; data?: Record<string, any> },
  ): CustomField[] {
    const fields = Array.from(this.fields.values())
      .filter((f) => {
        if (f.tenantId !== tenantId) return false;
        if (f.entityType !== "ALL" && f.entityType !== entityType) return false;
        return true;
      })
      .filter((f) => this.isFieldVisible(f, context))
      .sort((a, b) => a.order - b.order);

    return fields;
  }

  /**
   * Check if field is visible
   */
  private isFieldVisible(
    field: CustomField,
    context?: { role?: string; data?: Record<string, any> },
  ): boolean {
    if (!field.visibility) return true;

    // Check role visibility
    if (field.visibility.roles && context?.role) {
      if (!field.visibility.roles.includes(context.role)) return false;
    }

    // Check condition visibility
    if (field.visibility.conditions && context?.data) {
      for (const condition of field.visibility.conditions) {
        const fieldValue = context.data[condition.field];
        let matches = false;

        switch (condition.operator) {
          case "EQUALS":
            matches = fieldValue === condition.value;
            break;
          case "NOT_EQUALS":
            matches = fieldValue !== condition.value;
            break;
          case "CONTAINS":
            matches = String(fieldValue).includes(String(condition.value));
            break;
          case "GREATER_THAN":
            matches = Number(fieldValue) > Number(condition.value);
            break;
          case "LESS_THAN":
            matches = Number(fieldValue) < Number(condition.value);
            break;
        }

        if (!matches) return false;
      }
    }

    return true;
  }

  /**
   * Set field value for entity
   */
  async setFieldValue(
    entityId: string,
    fieldId: string,
    value: any,
  ): Promise<void> {
    const field = this.fields.get(fieldId);
    if (!field) {
      throw new Error(`Field ${fieldId} not found`);
    }

    // Validate value
    this.validateFieldValue(field, value);

    if (!this.fieldValues.has(entityId)) {
      this.fieldValues.set(entityId, new Map());
    }

    const entityValues = this.fieldValues.get(entityId)!;
    entityValues.set(fieldId, { fieldId, value });

    // Publish event
    await eventBus.publish({
      type: "qhse.custom-field.value.updated",
      payload: { entityId, fieldId, value },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get field values for entity
   */
  getFieldValues(entityId: string): CustomFieldValue[] {
    const entityValues = this.fieldValues.get(entityId);
    if (!entityValues) return [];

    return Array.from(entityValues.values());
  }

  /**
   * Validate field value
   */
  private validateFieldValue(field: CustomField, value: any): void {
    if (
      field.required &&
      (value === undefined || value === null || value === "")
    ) {
      throw new Error(`Field ${field.label} is required`);
    }

    if (value === undefined || value === null || value === "") return;

    if (field.validation) {
      const rule = field.validation;

      if (field.type === "NUMBER") {
        const num = Number(value);
        if (rule.min !== undefined && num < rule.min) {
          throw new Error(`${field.label} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && num > rule.max) {
          throw new Error(`${field.label} must be at most ${rule.max}`);
        }
      }

      if (field.type === "TEXT" || field.type === "TEXTAREA") {
        const str = String(value);
        if (rule.minLength !== undefined && str.length < rule.minLength) {
          throw new Error(
            `${field.label} must be at least ${rule.minLength} characters`,
          );
        }
        if (rule.maxLength !== undefined && str.length > rule.maxLength) {
          throw new Error(
            `${field.label} must be at most ${rule.maxLength} characters`,
          );
        }
        if (rule.pattern) {
          const regex = new RegExp(rule.pattern);
          if (!regex.test(str)) {
            throw new Error(`${field.label} format is invalid`);
          }
        }
      }

      if (field.type === "SELECT" || field.type === "MULTI_SELECT") {
        if (field.options) {
          if (field.type === "SELECT") {
            if (!field.options.includes(value)) {
              throw new Error(
                `${field.label} must be one of: ${field.options.join(", ")}`,
              );
            }
          } else {
            const values = Array.isArray(value) ? value : [value];
            for (const v of values) {
              if (!field.options.includes(v)) {
                throw new Error(`${field.label} contains invalid option: ${v}`);
              }
            }
          }
        }
      }

      if (rule.custom) {
        const result = rule.custom(value);
        if (result !== true) {
          throw new Error(
            typeof result === "string"
              ? result
              : `${field.label} validation failed`,
          );
        }
      }
    }
  }

  /**
   * Update field
   */
  async updateField(
    fieldId: string,
    updates: Partial<CustomField>,
  ): Promise<CustomField> {
    const field = this.fields.get(fieldId);
    if (!field) {
      throw new Error(`Field ${fieldId} not found`);
    }

    const updated = {
      ...field,
      ...updates,
      id: fieldId,
      updatedAt: new Date().toISOString(),
    };

    this.fields.set(fieldId, updated);
    return updated;
  }

  /**
   * Delete field (internal)
   */
  async deleteField(fieldId: string): Promise<void> {
    if (!this.fields.has(fieldId)) {
      throw new Error(`Field ${fieldId} not found`);
    }

    this.fields.delete(fieldId);

    // Remove all values for this field
    for (const [entityId, values] of this.fieldValues.entries()) {
      values.delete(fieldId);
      if (values.size === 0) {
        this.fieldValues.delete(entityId);
      }
    }

    await eventBus.publish({
      type: "qhse.custom-field.deleted",
      payload: { fieldId },
      timestamp: new Date().toISOString(),
    });
  }
}

export const customFieldService = new CustomFieldService();

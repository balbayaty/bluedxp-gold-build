/**
 * QHSE Document Template Service
 * Pre-built templates for QHSE reports and documents
 * Integrated with platform document template service
 */

import { documentTemplateService } from "@/lib/services/compliance/documentTemplateService";
import { eventBus } from "@/lib/services/event-store";

// ============================================================================
// QHSE DOCUMENT TEMPLATE TYPES
// ============================================================================

export interface QHSEDocumentTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "INCIDENT_REPORT"
    | "INSPECTION_REPORT"
    | "TRAINING_CERTIFICATE"
    | "AUDIT_REPORT"
    | "SAFETY_MEETING"
    | "COMPLIANCE_CERTIFICATE";
  format: "PDF" | "DOCX" | "XLSX" | "HTML";
  fields: TemplateField[];
  sections: TemplateSection[];
  standard?: string; // ISO 45001, OSHA, etc.
  version: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "TEXTAREA";
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

export interface TemplateSection {
  id: string;
  title: string;
  fields: string[]; // Field IDs
  order: number;
}

// ============================================================================
// QHSE DOCUMENT TEMPLATE SERVICE
// ============================================================================

class QHSEDocumentTemplateService {
  private templates: Map<string, QHSEDocumentTemplate> = new Map();

  /**
   * Register template
   */
  registerTemplate(template: QHSEDocumentTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get template
   */
  getTemplate(templateId: string): QHSEDocumentTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(
    category: QHSEDocumentTemplate["category"],
  ): QHSEDocumentTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.category === category,
    );
  }

  /**
   * Get all templates or filter by type
   */
  getTemplates(type?: string): QHSEDocumentTemplate[] {
    if (!type) {
      return Array.from(this.templates.values());
    }

    // Map type string to category
    const categoryMap: Record<string, QHSEDocumentTemplate["category"]> = {
      INCIDENT_REPORT: "INCIDENT_REPORT",
      INSPECTION_REPORT: "INSPECTION_REPORT",
      AUDIT_REPORT: "AUDIT_REPORT",
      TRAINING_CERTIFICATE: "TRAINING_CERTIFICATE",
      ESG_REPORT: "INCIDENT_REPORT", // Map ESG to incident for now
      CUSTOM: "INCIDENT_REPORT", // Map custom to incident for now
    };

    const category = categoryMap[type.toUpperCase()];
    if (category) {
      return this.getTemplatesByCategory(category);
    }

    return Array.from(this.templates.values());
  }

  /**
   * Create template
   */
  createTemplate(data: Partial<QHSEDocumentTemplate>): QHSEDocumentTemplate {
    const template: QHSEDocumentTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: data.name || "Untitled Template",
      description: data.description || "",
      category: data.category || "INCIDENT_REPORT",
      format: data.format || "PDF",
      fields: data.fields || [],
      sections: data.sections || [],
      standard: data.standard,
      version: data.version || "1.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(template.id, template);

    return template;
  }

  /**
   * Update template
   */
  updateTemplate(
    templateId: string,
    data: Partial<QHSEDocumentTemplate>,
  ): QHSEDocumentTemplate {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const updated: QHSEDocumentTemplate = {
      ...template,
      ...data,
      id: templateId,
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(templateId, updated);

    return updated;
  }

  /**
   * Delete template
   */
  deleteTemplate(templateId: string): void {
    if (!this.templates.has(templateId)) {
      throw new Error(`Template ${templateId} not found`);
    }

    this.templates.delete(templateId);
  }

  /**
   * Generate document from template
   */
  async generateDocument(
    templateId: string,
    data: Record<string, any>,
    format: "PDF" | "DOCX" | "XLSX" | "HTML" = "PDF",
  ): Promise<Blob> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Use platform document template service
    const platformTemplate = {
      id: template.id,
      name: template.name,
      description: template.description,
      authority: "QHSE" as any,
      category: "QUALITY_MANAGEMENT" as any,
      documentType: template.category,
      format: template.format,
      fields: template.fields.map((f) => ({
        id: f.id,
        name: f.name,
        label: f.label,
        type: f.type,
        required: f.required,
        defaultValue: f.defaultValue,
        options: f.options,
      })),
      sections: template.sections.map((s) => ({
        id: s.id,
        title: s.title,
        fields: s.fields,
        order: s.order,
      })),
      requiredFields: template.fields
        .filter((f) => f.required)
        .map((f) => f.id),
      lastUpdated: template.updatedAt,
      version: template.version,
    };

    // Generate document (would use actual document generation service)
    // For now, return a placeholder
    const content = `QHSE Document: ${template.name}\n\nGenerated from template: ${templateId}\n\nData: ${JSON.stringify(data, null, 2)}`;
    return new Blob([content], { type: "text/plain" });
  }
}

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

const service = new QHSEDocumentTemplateService();

// Incident Report Template
service.registerTemplate({
  id: "incident-report-template",
  name: "Incident Report Template",
  description: "Standard incident report template",
  category: "INCIDENT_REPORT",
  format: "PDF",
  fields: [
    {
      id: "incident-number",
      name: "incidentNumber",
      label: "Incident Number",
      type: "TEXT",
      required: true,
    },
    {
      id: "title",
      name: "title",
      label: "Title",
      type: "TEXT",
      required: true,
    },
    {
      id: "description",
      name: "description",
      label: "Description",
      type: "TEXTAREA",
      required: true,
    },
    {
      id: "type",
      name: "type",
      label: "Type",
      type: "SELECT",
      required: true,
      options: ["ACCIDENT", "INJURY", "NEAR_MISS", "ENVIRONMENTAL"],
    },
    {
      id: "severity",
      name: "severity",
      label: "Severity",
      type: "SELECT",
      required: true,
      options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    },
    {
      id: "location",
      name: "location",
      label: "Location",
      type: "TEXT",
      required: true,
    },
    {
      id: "occurred-at",
      name: "occurredAt",
      label: "Occurred At",
      type: "DATE",
      required: true,
    },
  ],
  sections: [
    {
      id: "basic-info",
      title: "Basic Information",
      fields: ["incident-number", "title", "type", "severity"],
      order: 1,
    },
    {
      id: "details",
      title: "Details",
      fields: ["description", "location", "occurred-at"],
      order: 2,
    },
  ],
  version: "1.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Inspection Report Template
service.registerTemplate({
  id: "inspection-report-template",
  name: "Inspection Report Template",
  description: "Standard inspection report template",
  category: "INSPECTION_REPORT",
  format: "PDF",
  fields: [
    {
      id: "inspection-number",
      name: "inspectionNumber",
      label: "Inspection Number",
      type: "TEXT",
      required: true,
    },
    {
      id: "title",
      name: "title",
      label: "Title",
      type: "TEXT",
      required: true,
    },
    {
      id: "type",
      name: "type",
      label: "Type",
      type: "SELECT",
      required: true,
      options: ["SAFETY", "ENVIRONMENTAL", "QUALITY"],
    },
    {
      id: "compliance-score",
      name: "complianceScore",
      label: "Compliance Score",
      type: "NUMBER",
      required: false,
    },
    {
      id: "findings",
      name: "findings",
      label: "Findings",
      type: "TEXTAREA",
      required: false,
    },
  ],
  sections: [
    {
      id: "basic-info",
      title: "Basic Information",
      fields: ["inspection-number", "title", "type"],
      order: 1,
    },
    {
      id: "results",
      title: "Results",
      fields: ["compliance-score", "findings"],
      order: 2,
    },
  ],
  version: "1.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Training Certificate Template
service.registerTemplate({
  id: "training-certificate-template",
  name: "Training Certificate Template",
  description: "Training completion certificate template",
  category: "TRAINING_CERTIFICATE",
  format: "PDF",
  fields: [
    {
      id: "employee-name",
      name: "employeeName",
      label: "Employee Name",
      type: "TEXT",
      required: true,
    },
    {
      id: "training-program",
      name: "trainingProgram",
      label: "Training Program",
      type: "TEXT",
      required: true,
    },
    {
      id: "completion-date",
      name: "completionDate",
      label: "Completion Date",
      type: "DATE",
      required: true,
    },
    {
      id: "expiry-date",
      name: "expiryDate",
      label: "Expiry Date",
      type: "DATE",
      required: false,
    },
  ],
  sections: [
    {
      id: "certificate-info",
      title: "Certificate Information",
      fields: [
        "employee-name",
        "training-program",
        "completion-date",
        "expiry-date",
      ],
      order: 1,
    },
  ],
  version: "1.0",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const qhseDocumentTemplateService = service;

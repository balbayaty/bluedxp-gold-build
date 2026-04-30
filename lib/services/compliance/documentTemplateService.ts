/**
 * Document Template Service
 * Generate compliance document templates, forms, and checklists
 * Support for multiple formats and languages
 */

import { RegulatoryAuthority, ComplianceCategory } from "@/types/compliance";
import { RegulatoryAuthorityNode } from "@/types/compliance-hierarchy";

// ============================================================================
// DOCUMENT TEMPLATES
// ============================================================================

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  authority: RegulatoryAuthority;
  category: ComplianceCategory;
  documentType: string;
  format: "PDF" | "DOCX" | "XLSX" | "HTML";
  templateUrl?: string;
  fields: TemplateField[];
  sections: TemplateSection[];
  requiredFields: string[];
  validationRules?: ValidationRule[];
  instructions?: string;
  exampleUrl?: string;
  lastUpdated: Date | string;
  version: string;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type:
    | "TEXT"
    | "NUMBER"
    | "DATE"
    | "SELECT"
    | "CHECKBOX"
    | "FILE"
    | "SIGNATURE";
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    errorMessage?: string;
  };
  helpText?: string;
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  fields: string[]; // Field IDs
  order: number;
  collapsible?: boolean;
}

export interface ValidationRule {
  fieldId: string;
  rule: string;
  errorMessage: string;
}

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

export const documentTemplates: DocumentTemplate[] = [
  {
    id: "template-tga-vehicle-reg",
    name: "TGA Vehicle Registration Application",
    description: "Official TGA vehicle registration application form",
    authority: "TGA",
    category: "TRANSPORTATION",
    documentType: "TGA_REGISTRATION_APPLICATION",
    format: "PDF",
    templateUrl: "/templates/tga-vehicle-registration.pdf",
    fields: [
      {
        id: "vehicle-make",
        name: "vehicleMake",
        label: "Vehicle Make",
        type: "TEXT",
        required: true,
        placeholder: "e.g., Toyota, Mercedes",
      },
      {
        id: "vehicle-model",
        name: "vehicleModel",
        label: "Vehicle Model",
        type: "TEXT",
        required: true,
      },
      {
        id: "year",
        name: "year",
        label: "Manufacturing Year",
        type: "NUMBER",
        required: true,
        validation: {
          min: 2000,
          max: new Date().getFullYear() + 1,
        },
      },
      {
        id: "chassis-number",
        name: "chassisNumber",
        label: "Chassis Number",
        type: "TEXT",
        required: true,
        validation: {
          pattern: "^[A-Z0-9]{17}$",
          errorMessage: "Invalid chassis number format",
        },
      },
      {
        id: "vehicle-type",
        name: "vehicleType",
        label: "Vehicle Type",
        type: "SELECT",
        required: true,
        options: ["Truck", "Van", "Bus", "Trailer", "Other"],
      },
      {
        id: "purpose",
        name: "purpose",
        label: "Commercial Purpose",
        type: "SELECT",
        required: true,
        options: ["Freight", "Passenger", "Construction", "Other"],
      },
      {
        id: "insurance-certificate",
        name: "insuranceCertificate",
        label: "Insurance Certificate",
        type: "FILE",
        required: true,
        helpText:
          "Upload valid commercial vehicle insurance certificate (PDF, max 5MB)",
      },
      {
        id: "inspection-certificate",
        name: "inspectionCertificate",
        label: "Vehicle Inspection Certificate",
        type: "FILE",
        required: true,
        helpText: "Upload valid vehicle inspection certificate (PDF, max 5MB)",
      },
    ],
    sections: [
      {
        id: "section-vehicle-info",
        title: "Vehicle Information",
        description: "Basic vehicle details",
        fields: [
          "vehicle-make",
          "vehicle-model",
          "year",
          "chassis-number",
          "vehicle-type",
        ],
        order: 1,
      },
      {
        id: "section-commercial-info",
        title: "Commercial Information",
        description: "Commercial use details",
        fields: ["purpose"],
        order: 2,
      },
      {
        id: "section-documents",
        title: "Required Documents",
        description: "Upload required documents",
        fields: ["insurance-certificate", "inspection-certificate"],
        order: 3,
      },
    ],
    requiredFields: [
      "vehicle-make",
      "vehicle-model",
      "year",
      "chassis-number",
      "vehicle-type",
      "purpose",
      "insurance-certificate",
      "inspection-certificate",
    ],
    instructions:
      "Complete all required fields and upload supporting documents. Application will be processed within 5-7 business days.",
    exampleUrl: "/templates/examples/tga-vehicle-registration-example.pdf",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
  },
  {
    id: "template-sfda-food-license",
    name: "SFDA Food Safety License Application",
    description: "SFDA food safety license application form",
    authority: "SFDA",
    category: "FOOD_DRUG",
    documentType: "SFDA_FOOD_LICENSE_APPLICATION",
    format: "PDF",
    templateUrl: "/templates/sfda-food-license.pdf",
    fields: [
      {
        id: "facility-name",
        name: "facilityName",
        label: "Facility Name",
        type: "TEXT",
        required: true,
      },
      {
        id: "facility-type",
        name: "facilityType",
        label: "Facility Type",
        type: "SELECT",
        required: true,
        options: [
          "Warehouse",
          "Distribution Center",
          "Processing Facility",
          "Retail Store",
          "Restaurant",
        ],
      },
      {
        id: "food-categories",
        name: "foodCategories",
        label: "Food Categories",
        type: "CHECKBOX",
        required: true,
        options: [
          "Frozen Foods",
          "Fresh Produce",
          "Dairy Products",
          "Meat & Poultry",
          "Beverages",
          "Packaged Foods",
        ],
      },
      {
        id: "storage-capacity",
        name: "storageCapacity",
        label: "Storage Capacity (sqm)",
        type: "NUMBER",
        required: true,
        validation: {
          min: 1,
        },
      },
      {
        id: "temperature-control",
        name: "temperatureControl",
        label: "Temperature Controlled Storage",
        type: "CHECKBOX",
        required: false,
      },
      {
        id: "haccp-certificate",
        name: "haccpCertificate",
        label: "HACCP Certificate",
        type: "FILE",
        required: true,
        helpText: "Upload HACCP certificate (PDF, max 5MB)",
      },
      {
        id: "food-safety-plan",
        name: "foodSafetyPlan",
        label: "Food Safety Plan",
        type: "FILE",
        required: true,
        helpText: "Upload food safety plan document (PDF, max 10MB)",
      },
    ],
    sections: [
      {
        id: "section-facility",
        title: "Facility Information",
        fields: [
          "facility-name",
          "facility-type",
          "storage-capacity",
          "temperature-control",
        ],
        order: 1,
      },
      {
        id: "section-food-categories",
        title: "Food Categories",
        fields: ["food-categories"],
        order: 2,
      },
      {
        id: "section-certificates",
        title: "Certificates & Documents",
        fields: ["haccp-certificate", "food-safety-plan"],
        order: 3,
      },
    ],
    requiredFields: [
      "facility-name",
      "facility-type",
      "food-categories",
      "storage-capacity",
      "haccp-certificate",
      "food-safety-plan",
    ],
    instructions:
      "Complete application form and upload all required certificates. SFDA will review and conduct inspection within 14 business days.",
    exampleUrl: "/templates/examples/sfda-food-license-example.pdf",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
  },
  {
    id: "template-compliance-checklist",
    name: "Compliance Self-Assessment Checklist",
    description: "Comprehensive compliance self-assessment checklist",
    authority: "TGA" as any, // Generic checklist
    category: "QUALITY_MANAGEMENT",
    documentType: "COMPLIANCE_CHECKLIST",
    format: "PDF",
    fields: [
      {
        id: "check-required-docs",
        name: "requiredDocuments",
        label: "All Required Documents Present",
        type: "CHECKBOX",
        required: true,
      },
      {
        id: "check-doc-validity",
        name: "documentValidity",
        label: "All Documents Valid and Not Expired",
        type: "CHECKBOX",
        required: true,
      },
      {
        id: "check-evidence",
        name: "evidence",
        label: "Evidence of Compliance Available",
        type: "CHECKBOX",
        required: true,
      },
      {
        id: "check-violations",
        name: "violations",
        label: "No Open Violations",
        type: "CHECKBOX",
        required: true,
      },
      {
        id: "check-training",
        name: "training",
        label: "Staff Training Completed",
        type: "CHECKBOX",
        required: false,
      },
      {
        id: "check-audit",
        name: "audit",
        label: "Internal Audit Conducted",
        type: "CHECKBOX",
        required: false,
      },
      {
        id: "notes",
        name: "notes",
        label: "Additional Notes",
        type: "TEXT",
        required: false,
        placeholder: "Enter any additional notes or observations...",
      },
    ],
    sections: [
      {
        id: "section-requirements",
        title: "Compliance Requirements",
        fields: [
          "check-required-docs",
          "check-doc-validity",
          "check-evidence",
          "check-violations",
        ],
        order: 1,
      },
      {
        id: "section-additional",
        title: "Additional Checks",
        fields: ["check-training", "check-audit", "notes"],
        order: 2,
      },
    ],
    requiredFields: [
      "check-required-docs",
      "check-doc-validity",
      "check-evidence",
      "check-violations",
    ],
    instructions:
      "Complete this checklist to assess your compliance status. Check all applicable items.",
    lastUpdated: new Date().toISOString(),
    version: "1.0.0",
  },
];

// ============================================================================
// TEMPLATE SERVICE
// ============================================================================

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): DocumentTemplate | undefined {
  return documentTemplates.find((t) => t.id === templateId);
}

/**
 * Get templates by authority
 */
export function getTemplatesByAuthority(
  authority: RegulatoryAuthority,
): DocumentTemplate[] {
  return documentTemplates.filter((t) => t.authority === authority);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: ComplianceCategory,
): DocumentTemplate[] {
  return documentTemplates.filter((t) => t.category === category);
}

/**
 * Generate document from template
 */
export function generateDocumentFromTemplate(
  templateId: string,
  data: Record<string, any>,
): {
  success: boolean;
  documentUrl?: string;
  errors?: string[];
} {
  const template = getTemplate(templateId);
  if (!template) {
    return {
      success: false,
      errors: ["Template not found"],
    };
  }

  // Validate required fields
  const errors: string[] = [];
  for (const fieldId of template.requiredFields) {
    const field = template.fields.find((f) => f.id === fieldId);
    if (field && !data[field.name]) {
      errors.push(`${field.label} is required`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      errors,
    };
  }

  // In a real implementation, this would generate the actual document
  // For now, return success
  const documentUrl = `/documents/generated/${templateId}-${Date.now()}.${template.format.toLowerCase()}`;

  return {
    success: true,
    documentUrl,
  };
}

/**
 * Get template preview
 */
export function getTemplatePreview(templateId: string): {
  template: DocumentTemplate;
  previewUrl?: string;
} {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  return {
    template,
    previewUrl: template.exampleUrl,
  };
}

// ============================================================================
// EXPORTED SERVICE
// ============================================================================

export const documentTemplateService = {
  getTemplate,
  getTemplatesByAuthority,
  getTemplatesByCategory,
  generateDocumentFromTemplate,
  getTemplatePreview,
  getAllTemplates: () => documentTemplates,
};

export default documentTemplateService;

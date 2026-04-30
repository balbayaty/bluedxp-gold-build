/**
 * Job Templates
 *
 * Pre-configured job templates for common operations
 */

import { CreateJobRequest, JobType, JobPriority } from "@/types/job";

export interface JobTemplate {
  id: string;
  name: string;
  description: string;
  type: JobType;
  category: "export" | "import" | "processing" | "report" | "sync";
  icon: string;
  createRequest: (params?: Record<string, any>) => CreateJobRequest;
}

export const jobTemplates: JobTemplate[] = [
  {
    id: "export-shipments-excel",
    name: "Export Shipments to Excel",
    description: "Export all shipments to Excel format",
    type: "DATA_EXPORT",
    category: "export",
    icon: "📊",
    createRequest: (params = {}) => ({
      type: "DATA_EXPORT",
      name: "Export Shipments to Excel",
      description: "Exporting shipments data to Excel format",
      priority: (params.priority as JobPriority) || "NORMAL",
      input: {
        format: "EXCEL",
        dataType: "shipments",
        filters: params.filters || {},
        columns: params.columns,
      },
      moduleId: "tms",
    }),
  },
  {
    id: "export-shipments-pdf",
    name: "Export Shipments to PDF",
    description: "Export shipments report to PDF",
    type: "DATA_EXPORT",
    category: "export",
    icon: "📄",
    createRequest: (params = {}) => ({
      type: "DATA_EXPORT",
      name: "Export Shipments to PDF",
      description: "Exporting shipments report to PDF format",
      priority: (params.priority as JobPriority) || "NORMAL",
      input: {
        format: "PDF",
        dataType: "shipments",
        filters: params.filters || {},
      },
      moduleId: "tms",
    }),
  },
  {
    id: "batch-validate-shipments",
    name: "Batch Validate Shipments",
    description: "Validate multiple shipments for data completeness",
    type: "BATCH_PROCESSING",
    category: "processing",
    icon: "✅",
    createRequest: (params = {}) => ({
      type: "BATCH_PROCESSING",
      name: "Batch Validate Shipments",
      description: `Validating ${params.shipmentIds?.length || 0} shipments`,
      priority: (params.priority as JobPriority) || "NORMAL",
      input: {
        shipmentIds: params.shipmentIds || [],
        operation: "validate",
      },
      moduleId: "tms",
    }),
  },
  {
    id: "batch-update-status",
    name: "Batch Update Status",
    description: "Update status for multiple shipments",
    type: "BATCH_PROCESSING",
    category: "processing",
    icon: "🔄",
    createRequest: (params = {}) => ({
      type: "BATCH_PROCESSING",
      name: `Batch Update Status to ${params.status || "NEW_STATUS"}`,
      description: `Updating status for ${params.shipmentIds?.length || 0} shipments`,
      priority: (params.priority as JobPriority) || "NORMAL",
      input: {
        shipmentIds: params.shipmentIds || [],
        operation: "update_status",
        parameters: {
          status: params.status,
        },
      },
      moduleId: "tms",
    }),
  },
  {
    id: "batch-calculate-costs",
    name: "Batch Calculate Costs",
    description: "Recalculate freight costs for multiple shipments",
    type: "BATCH_PROCESSING",
    category: "processing",
    icon: "💰",
    createRequest: (params = {}) => ({
      type: "BATCH_PROCESSING",
      name: "Batch Calculate Costs",
      description: `Calculating costs for ${params.shipmentIds?.length || 0} shipments`,
      priority: (params.priority as JobPriority) || "NORMAL",
      input: {
        shipmentIds: params.shipmentIds || [],
        operation: "calculate_costs",
      },
      moduleId: "tms",
    }),
  },
  {
    id: "batch-generate-labels",
    name: "Batch Generate Labels",
    description: "Generate shipping labels for multiple shipments",
    type: "BATCH_PROCESSING",
    category: "processing",
    icon: "🏷️",
    createRequest: (params = {}) => ({
      type: "BATCH_PROCESSING",
      name: "Batch Generate Labels",
      description: `Generating labels for ${params.shipmentIds?.length || 0} shipments`,
      priority: (params.priority as JobPriority) || "NORMAL",
      input: {
        shipmentIds: params.shipmentIds || [],
        operation: "generate_labels",
      },
      moduleId: "tms",
    }),
  },
];

export function getTemplateById(id: string): JobTemplate | undefined {
  return jobTemplates.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: JobTemplate["category"],
): JobTemplate[] {
  return jobTemplates.filter((t) => t.category === category);
}

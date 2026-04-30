/**
 * Report Builder Service
 * Build custom reports with drag-and-drop interface
 */

export type ReportField =
  | "chemical_name"
  | "cas_number"
  | "hazard_level"
  | "container_count"
  | "location"
  | "compliance_status"
  | "msds_status"
  | "expiry_date"
  | "quantity"
  | "cost";

export type ReportFilter = {
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than" | "between";
  value: any;
};

export type ReportSort = {
  field: string;
  direction: "asc" | "desc";
};

export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  fields: ReportField[];
  filters: ReportFilter[];
  sort: ReportSort[];
  groupBy?: string[];
  format: "pdf" | "excel" | "csv" | "json";
  schedule?: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    time: string;
    recipients: string[];
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  };
}

export class ReportBuilder {
  private reports: Map<string, ReportConfig> = new Map();

  /**
   * Create new report
   */
  createReport(
    config: Omit<ReportConfig, "id" | "metadata"> & { id?: string },
  ): ReportConfig {
    const id =
      config.id ||
      `report-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    const fullConfig: ReportConfig = {
      id,
      ...config,
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: config.metadata?.createdBy || "system",
      },
    };

    this.reports.set(id, fullConfig);
    return fullConfig;
  }

  /**
   * Get report by ID
   */
  getReport(id: string): ReportConfig | null {
    return this.reports.get(id) || null;
  }

  /**
   * Get all reports
   */
  getAllReports(): ReportConfig[] {
    return Array.from(this.reports.values());
  }

  /**
   * Update report
   */
  updateReport(
    id: string,
    updates: Partial<ReportConfig>,
  ): ReportConfig | null {
    const existing = this.reports.get(id);
    if (!existing) return null;

    const updated: ReportConfig = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date(),
      },
    };

    this.reports.set(id, updated);
    return updated;
  }

  /**
   * Delete report
   */
  deleteReport(id: string): boolean {
    return this.reports.delete(id);
  }

  /**
   * Validate report config
   */
  validateReport(config: ReportConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push("Report name is required");
    }

    if (!config.fields || config.fields.length === 0) {
      errors.push("At least one field is required");
    }

    if (!config.format) {
      errors.push("Report format is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available fields
   */
  getAvailableFields(): Array<{
    value: ReportField;
    label: string;
    category: string;
  }> {
    return [
      { value: "chemical_name", label: "Chemical Name", category: "Basic" },
      { value: "cas_number", label: "CAS Number", category: "Basic" },
      { value: "hazard_level", label: "Hazard Level", category: "Safety" },
      {
        value: "container_count",
        label: "Container Count",
        category: "Inventory",
      },
      { value: "location", label: "Location", category: "Inventory" },
      {
        value: "compliance_status",
        label: "Compliance Status",
        category: "Compliance",
      },
      { value: "msds_status", label: "MSDS Status", category: "Compliance" },
      { value: "expiry_date", label: "Expiry Date", category: "Inventory" },
      { value: "quantity", label: "Quantity", category: "Inventory" },
      { value: "cost", label: "Cost", category: "Financial" },
    ];
  }

  /**
   * Get field category
   */
  getFieldCategory(field: ReportField): string {
    const fieldInfo = this.getAvailableFields().find((f) => f.value === field);
    return fieldInfo?.category || "Other";
  }
}

export const reportBuilder = new ReportBuilder();

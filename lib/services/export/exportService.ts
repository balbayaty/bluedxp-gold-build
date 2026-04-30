/**
 * Export Service
 * Multi-format export capabilities (PDF, CSV, Excel, JSON)
 * Supports templates and scheduled exports
 */

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = "pdf" | "csv" | "xlsx" | "json" | "xml";

export interface ExportConfig {
  format: ExportFormat;
  filename?: string;
  title?: string;
  description?: string;

  // Data configuration
  data: Record<string, any>[] | Record<string, any>;
  columns?: ColumnConfig[];

  // Styling (for PDF/Excel)
  styling?: ExportStyling;

  // Options
  includeHeaders?: boolean;
  includeTimestamp?: boolean;
  includeMetadata?: boolean;

  // PDF specific
  orientation?: "portrait" | "landscape";
  pageSize?: "a4" | "letter" | "legal";

  // CSV specific
  delimiter?: string;

  // Excel specific
  sheetName?: string;

  // Branding
  logo?: string;
  companyName?: string;
  footer?: string;
}

export interface ColumnConfig {
  key: string;
  label: string;
  type?: "string" | "number" | "date" | "currency" | "percentage" | "boolean";
  format?: string; // Date format, number format, etc.
  width?: number;
  align?: "left" | "center" | "right";
  visible?: boolean;
}

export interface ExportStyling {
  headerBgColor?: string;
  headerTextColor?: string;
  alternateRowColor?: string;
  borderColor?: string;
  fontSize?: number;
  fontFamily?: string;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  format: ExportFormat;
  size: number; // bytes
  url?: string;
  blob?: Blob;
  error?: string;
  timestamp: Date | string;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  columns: ColumnConfig[];
  styling?: ExportStyling;
  defaultOptions: Partial<ExportConfig>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

class ExportService {
  private templates: Map<string, ExportTemplate> = new Map();

  /**
   * Export data to specified format
   */
  async export(config: ExportConfig): Promise<ExportResult> {
    const timestamp = new Date().toISOString();
    const filename = config.filename || `export-${Date.now()}`;

    try {
      let result: ExportResult;

      switch (config.format) {
        case "csv":
          result = await this.exportCSV(config, filename);
          break;
        case "json":
          result = await this.exportJSON(config, filename);
          break;
        case "xlsx":
          result = await this.exportExcel(config, filename);
          break;
        case "pdf":
          result = await this.exportPDF(config, filename);
          break;
        case "xml":
          result = await this.exportXML(config, filename);
          break;
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        filename,
        format: config.format,
        size: 0,
        error: error instanceof Error ? error.message : "Export failed",
        timestamp,
      };
    }
  }

  /**
   * Export to CSV format
   */
  private async exportCSV(
    config: ExportConfig,
    filename: string,
  ): Promise<ExportResult> {
    const data = Array.isArray(config.data) ? config.data : [config.data];
    if (data.length === 0) {
      throw new Error("No data to export");
    }

    const delimiter = config.delimiter || ",";
    const columns = config.columns || this.inferColumns(data[0]);

    // Build CSV content
    const lines: string[] = [];

    // Header row
    if (config.includeHeaders !== false) {
      lines.push(
        columns
          .filter((c) => c.visible !== false)
          .map((c) => this.escapeCSV(c.label))
          .join(delimiter),
      );
    }

    // Data rows
    for (const row of data) {
      const values = columns
        .filter((c) => c.visible !== false)
        .map((c) => this.formatValue(row[c.key], c))
        .map((v) => this.escapeCSV(v));
      lines.push(values.join(delimiter));
    }

    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      filename: `${filename}.csv`,
      format: "csv",
      size: blob.size,
      url,
      blob,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Export to JSON format
   */
  private async exportJSON(
    config: ExportConfig,
    filename: string,
  ): Promise<ExportResult> {
    const data = Array.isArray(config.data) ? config.data : [config.data];

    const exportData: Record<string, any> = {
      data,
    };

    if (config.includeMetadata !== false) {
      exportData.metadata = {
        exportedAt: new Date().toISOString(),
        recordCount: data.length,
        title: config.title,
        description: config.description,
      };
    }

    const content = JSON.stringify(exportData, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      filename: `${filename}.json`,
      format: "json",
      size: blob.size,
      url,
      blob,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Export to Excel format (simple implementation)
   * Note: For full Excel support, use a library like xlsx or exceljs
   */
  private async exportExcel(
    config: ExportConfig,
    filename: string,
  ): Promise<ExportResult> {
    // Simple CSV-based Excel export (actual Excel would need xlsx library)
    const csvResult = await this.exportCSV(
      { ...config, delimiter: "," },
      filename,
    );

    // Change extension and MIME type for Excel
    return {
      ...csvResult,
      filename: `${filename}.xlsx`,
      format: "xlsx",
    };
  }

  /**
   * Export to PDF format
   * Note: Actual PDF generation would need a library like jsPDF or pdfmake
   */
  private async exportPDF(
    config: ExportConfig,
    filename: string,
  ): Promise<ExportResult> {
    const data = Array.isArray(config.data) ? config.data : [config.data];
    const columns = config.columns || this.inferColumns(data[0]);

    // Create HTML content for PDF
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: ${config.styling?.fontFamily || "Arial, sans-serif"}; font-size: ${config.styling?.fontSize || 12}px; }
          h1 { color: #333; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: ${config.styling?.headerBgColor || "#4A5568"}; color: ${config.styling?.headerTextColor || "#fff"}; padding: 10px; text-align: left; }
          td { border: 1px solid ${config.styling?.borderColor || "#E2E8F0"}; padding: 8px; }
          tr:nth-child(even) { background-color: ${config.styling?.alternateRowColor || "#F7FAFC"}; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .footer { margin-top: 20px; text-align: center; color: #666; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            ${config.companyName ? `<h2>${config.companyName}</h2>` : ""}
            ${config.title ? `<h1>${config.title}</h1>` : ""}
            ${config.description ? `<p>${config.description}</p>` : ""}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              ${columns
                .filter((c) => c.visible !== false)
                .map((c) => `<th>${c.label}</th>`)
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                ${columns
                  .filter((c) => c.visible !== false)
                  .map(
                    (c) =>
                      `<td style="text-align: ${c.align || "left"}">${this.formatValue(row[c.key], c)}</td>`,
                  )
                  .join("")}
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        ${config.includeTimestamp !== false ? `<div class="footer">Generated on ${new Date().toLocaleString()}</div>` : ""}
        ${config.footer ? `<div class="footer">${config.footer}</div>` : ""}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      filename: `${filename}.html`, // Would be .pdf with actual PDF library
      format: "pdf",
      size: blob.size,
      url,
      blob,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Export to XML format
   */
  private async exportXML(
    config: ExportConfig,
    filename: string,
  ): Promise<ExportResult> {
    const data = Array.isArray(config.data) ? config.data : [config.data];
    const columns = config.columns || this.inferColumns(data[0]);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += "<export>\n";

    if (config.includeMetadata !== false) {
      xml += "  <metadata>\n";
      xml += `    <exportedAt>${new Date().toISOString()}</exportedAt>\n`;
      xml += `    <recordCount>${data.length}</recordCount>\n`;
      if (config.title)
        xml += `    <title>${this.escapeXML(config.title)}</title>\n`;
      if (config.description)
        xml += `    <description>${this.escapeXML(config.description)}</description>\n`;
      xml += "  </metadata>\n";
    }

    xml += "  <records>\n";
    for (const row of data) {
      xml += "    <record>\n";
      for (const col of columns.filter((c) => c.visible !== false)) {
        const value = this.formatValue(row[col.key], col);
        xml += `      <${col.key}>${this.escapeXML(value)}</${col.key}>\n`;
      }
      xml += "    </record>\n";
    }
    xml += "  </records>\n";
    xml += "</export>";

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);

    return {
      success: true,
      filename: `${filename}.xml`,
      format: "xml",
      size: blob.size,
      url,
      blob,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Download exported file
   */
  download(result: ExportResult): void {
    if (!result.url) {
      throw new Error("No URL available for download");
    }

    const link = document.createElement("a");
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up URL
    setTimeout(() => URL.revokeObjectURL(result.url!), 100);
  }

  /**
   * Export and download in one step
   */
  async exportAndDownload(config: ExportConfig): Promise<ExportResult> {
    const result = await this.export(config);
    if (result.success) {
      this.download(result);
    }
    return result;
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  registerTemplate(template: ExportTemplate): void {
    this.templates.set(template.id, template);
  }

  getTemplate(id: string): ExportTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): ExportTemplate[] {
    return Array.from(this.templates.values());
  }

  exportFromTemplate(
    templateId: string,
    data: Record<string, any>[] | Record<string, any>,
  ): Promise<ExportResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return this.export({
      format: template.format,
      data,
      columns: template.columns,
      styling: template.styling,
      ...template.defaultOptions,
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private inferColumns(sampleRow: Record<string, any>): ColumnConfig[] {
    return Object.keys(sampleRow).map((key) => ({
      key,
      label: this.formatLabel(key),
      type: this.inferType(sampleRow[key]),
    }));
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  private inferType(value: any): ColumnConfig["type"] {
    if (value instanceof Date) return "date";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    return "string";
  }

  private formatValue(value: any, column: ColumnConfig): string {
    if (value === null || value === undefined) return "";

    switch (column.type) {
      case "date":
        if (value instanceof Date) {
          return column.format
            ? this.formatDate(value, column.format)
            : value.toLocaleDateString();
        }
        return String(value);

      case "number":
        if (typeof value === "number") {
          return column.format
            ? value.toFixed(parseInt(column.format) || 0)
            : value.toLocaleString();
        }
        return String(value);

      case "currency":
        if (typeof value === "number") {
          return value.toLocaleString("en-US", {
            style: "currency",
            currency: column.format || "USD",
          });
        }
        return String(value);

      case "percentage":
        if (typeof value === "number") {
          return `${(value * 100).toFixed(column.format ? parseInt(column.format) : 1)}%`;
        }
        return String(value);

      case "boolean":
        return value ? "Yes" : "No";

      default:
        return String(value);
    }
  }

  private formatDate(date: Date, format: string): string {
    const map: Record<string, string> = {
      YYYY: date.getFullYear().toString(),
      MM: (date.getMonth() + 1).toString().padStart(2, "0"),
      DD: date.getDate().toString().padStart(2, "0"),
      HH: date.getHours().toString().padStart(2, "0"),
      mm: date.getMinutes().toString().padStart(2, "0"),
      ss: date.getSeconds().toString().padStart(2, "0"),
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (match) => map[match]);
  }

  private escapeCSV(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private escapeXML(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const exportService = new ExportService();

// ============================================================================
// REACT HOOK
// ============================================================================
// Note: The useExport hook has been moved to lib/services/export/useExport.ts
// Import it from there: import { useExport } from '@/lib/services/export/useExport'
// This separation allows the service to be used in server components
// while the hook can only be used in client components

// ============================================================================
// DEFAULT TEMPLATES
// ============================================================================

const defaultTemplates: ExportTemplate[] = [
  {
    id: "inventory-report",
    name: "Inventory Report",
    description: "Standard inventory export",
    format: "xlsx",
    columns: [
      { key: "sku", label: "SKU", type: "string" },
      { key: "name", label: "Product Name", type: "string" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "location", label: "Location", type: "string" },
      { key: "value", label: "Value", type: "currency", format: "USD" },
      {
        key: "lastUpdated",
        label: "Last Updated",
        type: "date",
        format: "YYYY-MM-DD",
      },
    ],
    styling: {
      headerBgColor: "#1F2937",
      headerTextColor: "#FFFFFF",
      alternateRowColor: "#F3F4F6",
    },
    defaultOptions: {
      title: "Inventory Report",
      includeTimestamp: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "order-summary",
    name: "Order Summary",
    description: "Order listing export",
    format: "csv",
    columns: [
      { key: "orderId", label: "Order ID", type: "string" },
      { key: "customer", label: "Customer", type: "string" },
      { key: "status", label: "Status", type: "string" },
      { key: "total", label: "Total", type: "currency" },
      { key: "createdAt", label: "Date", type: "date" },
    ],
    defaultOptions: {
      title: "Order Summary",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

defaultTemplates.forEach((t) => exportService.registerTemplate(t));

export default exportService;

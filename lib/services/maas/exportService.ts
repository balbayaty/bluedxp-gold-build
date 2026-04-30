/**
 * MaaS Export Service
 *
 * Comprehensive export functionality for MaaS data
 * - CSV export
 * - PDF export
 * - Excel export
 * - JSON export
 *
 * @module maas
 */

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = "csv" | "pdf" | "excel" | "json";

export interface ExportOptions {
  format: ExportFormat;
  data: any;
  filename?: string;
  includeCharts?: boolean;
  includeMetadata?: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

export class MaaSExportService {
  /**
   * Export data to CSV
   */
  exportToCSV(data: any[], filename: string = "maas-export"): void {
    if (!data || data.length === 0) {
      throw new Error("No data to export");
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Handle values that might contain commas or quotes
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? "";
          })
          .join(","),
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Export data to JSON
   */
  exportToJSON(data: any, filename: string = "maas-export"): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.json`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Export dashboard data
   */
  exportDashboard(options: ExportOptions): void {
    const { format, data, filename = "maas-dashboard" } = options;

    switch (format) {
      case "csv":
        if (Array.isArray(data)) {
          this.exportToCSV(data, filename);
        } else {
          // Convert object to array
          const arrayData = Object.entries(data).map(([key, value]) => ({
            key,
            value: typeof value === "object" ? JSON.stringify(value) : value,
          }));
          this.exportToCSV(arrayData, filename);
        }
        break;
      case "json":
        this.exportToJSON(data, filename);
        break;
      case "pdf":
        // PDF export would require a library like jsPDF
        console.warn("PDF export not yet implemented");
        break;
      case "excel":
        // Excel export would require a library like xlsx
        console.warn("Excel export not yet implemented");
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export pillars data
   */
  exportPillars(pillars: any[], format: ExportFormat = "csv"): void {
    const exportData = pillars.map((pillar) => ({
      id: pillar.id,
      name: pillar.name,
      type: pillar.type,
      description: pillar.description,
      services: pillar.services.join("; "),
      revenue: pillar.revenue || 0,
      utilization: pillar.utilization || 0,
      tenants: pillar.tenants || 0,
      status: pillar.status || "unknown",
    }));

    this.exportDashboard({
      format,
      data: exportData,
      filename: "maas-pillars",
    });
  }

  /**
   * Export tenants data
   */
  exportTenants(tenants: any[], format: ExportFormat = "csv"): void {
    const exportData = tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      utilization: tenant.utilization || 0,
      revenue: tenant.revenue || 0,
      status: tenant.status || "unknown",
      pillars: tenant.pillars || 0,
      health: tenant.health || "unknown",
      createdAt: tenant.createdAt || "",
    }));

    this.exportDashboard({
      format,
      data: exportData,
      filename: "maas-tenants",
    });
  }

  /**
   * Export revenue data
   */
  exportRevenue(revenueData: any, format: ExportFormat = "csv"): void {
    let exportData: any[] = [];

    if (revenueData.byPillar) {
      exportData = revenueData.byPillar.map((item: any) => ({
        pillar: item.name || item.pillar,
        revenue: item.revenue || 0,
        percentage: item.percentage || 0,
      }));
    } else if (Array.isArray(revenueData)) {
      exportData = revenueData;
    } else {
      exportData = [revenueData];
    }

    this.exportDashboard({
      format,
      data: exportData,
      filename: "maas-revenue",
    });
  }
}

// Export singleton
export const maasExportService = new MaaSExportService();

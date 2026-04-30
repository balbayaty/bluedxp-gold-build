/**
 * Export Service for Load Design
 *
 * Supports PDF, Excel, and CSV exports
 * - Load plan exports
 * - Analytics reports
 * - Cost analysis reports
 * - Compliance reports
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { LoadPlan, LoadAnalytics } from "@/types/load-design";

export interface ExportOptions {
  format: "PDF" | "EXCEL" | "CSV";
  includeCharts?: boolean;
  includeDetails?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class ExportService {
  /**
   * Export load plan to PDF
   */
  async exportLoadPlanToPDF(
    loadPlan: LoadPlan,
    options?: ExportOptions,
  ): Promise<Blob> {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text("Load Plan Report", 14, 20);

    // Load Plan Details
    doc.setFontSize(12);
    let yPos = 30;

    doc.text(`Load Number: ${loadPlan.loadNumber}`, 14, yPos);
    yPos += 7;
    doc.text(`Status: ${loadPlan.status}`, 14, yPos);
    yPos += 7;
    doc.text(`Vehicle Type: ${loadPlan.vehicleType || "N/A"}`, 14, yPos);
    yPos += 7;
    doc.text(`Transport Mode: ${loadPlan.transportMode || "N/A"}`, 14, yPos);
    yPos += 7;

    // Utilization
    doc.setFontSize(14);
    doc.text("Utilization", 14, yPos + 5);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [["Metric", "Value"]],
      body: [
        [
          "Weight Utilization",
          `${loadPlan.utilization.weightPercent.toFixed(1)}%`,
        ],
        [
          "Volume Utilization",
          `${loadPlan.utilization.volumePercent.toFixed(1)}%`,
        ],
        ["Cube Utilization", `${loadPlan.utilization.cubePercent.toFixed(1)}%`],
        [
          "Space Efficiency",
          `${loadPlan.utilization.spaceEfficiency.toFixed(1)}%`,
        ],
      ],
      theme: "striped",
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Cost Breakdown
    if (loadPlan.cost) {
      doc.setFontSize(14);
      doc.text("Cost Breakdown", 14, yPos + 5);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [["Category", "Amount", "Currency"]],
        body: [
          [
            "Base Cost",
            loadPlan.cost.base?.toFixed(2) || "0.00",
            loadPlan.cost.currency || "SAR",
          ],
          [
            "Fuel",
            loadPlan.cost.fuel?.toFixed(2) || "0.00",
            loadPlan.cost.currency || "SAR",
          ],
          [
            "Labor",
            loadPlan.cost.labor?.toFixed(2) || "0.00",
            loadPlan.cost.currency || "SAR",
          ],
          [
            "Total",
            loadPlan.cost.total.toFixed(2),
            loadPlan.cost.currency || "SAR",
          ],
        ],
        theme: "striped",
      });
    }

    // Items Table
    if (options?.includeDetails && loadPlan.items.length > 0) {
      yPos = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Items", 14, yPos + 5);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [["ID", "Description", "Weight (kg)", "Volume (m³)", "Quantity"]],
        body: loadPlan.items.map((item) => [
          item.id,
          item.description,
          item.weight.toFixed(2),
          item.volume.toFixed(2),
          item.quantity.toString(),
        ]),
        theme: "striped",
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} of ${pageCount} - Generated ${new Date().toLocaleString()}`,
        14,
        doc.internal.pageSize.height - 10,
      );
    }

    return doc.output("blob");
  }

  /**
   * Export analytics to Excel
   */
  async exportAnalyticsToExcel(
    analytics: LoadAnalytics,
    options?: ExportOptions,
  ): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["Metric", "Value"],
      ["Average Utilization", `${analytics.utilization.average.toFixed(1)}%`],
      ["Total Cost", `${analytics.cost.total.toFixed(2)}`],
      ["Average Cost", `${analytics.cost.average.toFixed(2)}`],
      ["Compliance Score", `${analytics.compliance.score.toFixed(1)}%`],
      ["Total Violations", analytics.compliance.violations.total.toString()],
      [
        "Critical Violations",
        analytics.compliance.violations.critical.toString(),
      ],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Trends Sheet
    const trendsData = [
      ["Week", "Utilization %", "Cost", "Compliance %"],
      ...analytics.trends.weekly.map((t) => [
        t.week,
        t.utilization.toFixed(1),
        t.cost.toFixed(2),
        t.compliance.toFixed(1),
      ]),
    ];
    const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
    XLSX.utils.book_append_sheet(workbook, trendsSheet, "Trends");

    // Carrier Performance Sheet
    if (analytics.carriers.length > 0) {
      const carrierData = [
        ["Carrier", "Shipments", "On-Time Rate %", "Average Cost", "Rating"],
        ...analytics.carriers.map((c) => [
          c.name,
          c.shipments,
          c.onTimeRate.toFixed(1),
          c.averageCost.toFixed(2),
          c.rating.toFixed(1),
        ]),
      ];
      const carrierSheet = XLSX.utils.aoa_to_sheet(carrierData);
      XLSX.utils.book_append_sheet(workbook, carrierSheet, "Carriers");
    }

    // Cost Breakdown Sheet
    const costData = [
      ["Category", "Amount"],
      ["Freight", analytics.cost.breakdown.freight.toFixed(2)],
      ["Fuel", analytics.cost.breakdown.fuel.toFixed(2)],
      ["Labor", analytics.cost.breakdown.labor.toFixed(2)],
      ["Handling", analytics.cost.breakdown.handling.toFixed(2)],
      ["Customs", analytics.cost.breakdown.customs.toFixed(2)],
      ["Insurance", analytics.cost.breakdown.insurance.toFixed(2)],
      ["Other", analytics.cost.breakdown.other.toFixed(2)],
    ];
    const costSheet = XLSX.utils.aoa_to_sheet(costData);
    XLSX.utils.book_append_sheet(workbook, costSheet, "Cost Breakdown");

    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });
    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  /**
   * Export load plans to CSV
   */
  async exportLoadPlansToCSV(loadPlans: LoadPlan[]): Promise<Blob> {
    const csvData = [
      [
        "Load Number",
        "Status",
        "Vehicle Type",
        "Transport Mode",
        "Weight Utilization %",
        "Volume Utilization %",
        "Total Cost",
        "Currency",
        "Compliance Score",
        "Created At",
      ],
      ...loadPlans.map((plan) => [
        plan.loadNumber,
        plan.status,
        plan.vehicleType || "",
        plan.transportMode || "",
        plan.utilization.weightPercent.toFixed(1),
        plan.utilization.volumePercent.toFixed(1),
        plan.cost?.total.toFixed(2) || "0.00",
        plan.cost?.currency || "SAR",
        plan.compliance?.score?.toFixed(1) || "0",
        new Date(plan.createdAt).toLocaleDateString(),
      ]),
    ];

    const csv = csvData
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    return new Blob([csv], { type: "text/csv" });
  }

  /**
   * Download file
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const exportService = new ExportService();

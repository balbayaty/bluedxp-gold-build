/**
 * Excel Report Generator
 * Actual Excel generation using xlsx
 */

import * as XLSX from "xlsx";
import { ReportConfig, ReportData } from "./reportBuilder";

export class ExcelGenerator {
  /**
   * Generate Excel report
   */
  async generate(config: ReportConfig, data: ReportData): Promise<Blob> {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheetData = [data.headers, ...data.rows];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = data.headers.map((_, index) => {
      const maxLength = Math.max(
        data.headers[index].length,
        ...data.rows.map((row) => (row[index]?.toString() || "").length),
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    worksheet["!cols"] = colWidths;

    // Style header row
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "06B6D4" } }, // Cyan
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // Add summary sheet if available
    if (data.summary) {
      const summaryData = [["Summary"], ["Total Rows", data.summary.totalRows]];

      if (data.summary.totals) {
        Object.entries(data.summary.totals).forEach(([key, value]) => {
          summaryData.push([key, value]);
        });
      }

      if (data.summary.averages) {
        summaryData.push([]);
        summaryData.push(["Averages"]);
        Object.entries(data.summary.averages).forEach(([key, value]) => {
          summaryData.push([key, value]);
        });
      }

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    }

    // Add main data sheet
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  /**
   * Generate Excel with multiple sheets
   */
  async generateMultiSheet(
    config: ReportConfig,
    sheets: Array<{ name: string; data: ReportData }>,
  ): Promise<Blob> {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ name, data }) => {
      const worksheetData = [data.headers, ...data.rows];

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Set column widths
      const colWidths = data.headers.map((_, index) => {
        const maxLength = Math.max(
          data.headers[index].length,
          ...data.rows.map((row) => (row[index]?.toString() || "").length),
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      worksheet["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, name);
    });

    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    return new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
}

export const excelGenerator = new ExcelGenerator();

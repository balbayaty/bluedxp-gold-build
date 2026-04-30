/**
 * PDF Report Generator
 * Actual PDF generation using jsPDF
 */

import jsPDF from "jspdf";
import "jspdf-autotable";
import { ReportConfig, ReportData } from "./reportBuilder";

export class PDFGenerator {
  /**
   * Generate PDF report
   */
  async generate(config: ReportConfig, data: ReportData): Promise<Blob> {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Add title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(config.name, 14, 20);

    // Add description if available
    if (config.description) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(config.description, 14, 28);
    }

    // Add generation date
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

    // Add table
    if (data.rows.length > 0) {
      const tableData = data.rows.map((row) =>
        data.headers.map((_, index) => row[index]?.toString() || ""),
      );

      (doc as any).autoTable({
        head: [data.headers],
        body: tableData,
        startY: 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [6, 182, 212], // Cyan color
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [31, 41, 55], // Gray background
        },
        margin: { top: 40 },
      });
    }

    // Add summary if available
    if (data.summary) {
      let yPos = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Summary", 14, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      if (data.summary.totalRows) {
        doc.text(`Total Rows: ${data.summary.totalRows}`, 14, yPos);
        yPos += 6;
      }

      if (data.summary.totals) {
        Object.entries(data.summary.totals).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`, 14, yPos);
          yPos += 6;
        });
      }
    }

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
    }

    // Convert to blob
    const pdfBlob = doc.output("blob");
    return pdfBlob;
  }

  /**
   * Generate PDF with custom styling
   */
  async generateStyled(
    config: ReportConfig,
    data: ReportData,
    options?: {
      title?: string;
      logo?: string;
      colors?: {
        primary?: [number, number, number];
        secondary?: [number, number, number];
      };
    },
  ): Promise<Blob> {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Add logo if provided
    if (options?.logo) {
      try {
        const img = new Image();
        img.src = options.logo;
        doc.addImage(img, "PNG", 14, 10, 30, 10);
      } catch (error) {
        console.error("Error adding logo:", error);
      }
    }

    // Add title
    const title = options?.title || config.name;
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    const primaryColor = options?.colors?.primary || [6, 182, 212];
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(title, 14, options?.logo ? 25 : 20);

    // Add table with custom colors
    if (data.rows.length > 0) {
      const tableData = data.rows.map((row) =>
        data.headers.map((_, index) => row[index]?.toString() || ""),
      );

      (doc as any).autoTable({
        head: [data.headers],
        body: tableData,
        startY: options?.logo ? 30 : 25,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [31, 41, 55],
        },
      });
    }

    const pdfBlob = doc.output("blob");
    return pdfBlob;
  }
}

export const pdfGenerator = new PDFGenerator();

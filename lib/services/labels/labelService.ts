/**
 * GHS Label Generation & Printing Service
 * Generate GHS-compliant labels with barcode/QR codes
 */

import { GHSLabel } from "@/types/container";
import jsPDF from "jspdf";

export interface LabelTemplate {
  id: string;
  name: string;
  width: number; // mm
  height: number; // mm
  layout: "portrait" | "landscape";
}

export interface LabelPrintOptions {
  template?: string;
  quantity?: number;
  includeBarcode?: boolean;
  includeQR?: boolean;
  printerName?: string;
}

export class LabelService {
  /**
   * Generate GHS label
   */
  generateGHSLabel(data: GHSLabel): string {
    // Generate label HTML/SVG for printing
    return this.generateLabelHTML(data);
  }

  /**
   * Print label to PDF
   */
  async printLabelToPDF(
    data: GHSLabel,
    options?: LabelPrintOptions,
  ): Promise<Blob> {
    const template = this.getTemplate(options?.template || "standard");
    const doc = new jsPDF({
      orientation: template.layout,
      unit: "mm",
      format: [template.width, template.height],
    });

    // Add label content
    this.addLabelContent(doc, data, template, options);

    // Generate PDF blob
    return doc.output("blob");
  }

  /**
   * Print label directly to printer
   */
  async printLabel(
    data: GHSLabel,
    options?: LabelPrintOptions,
  ): Promise<boolean> {
    try {
      // Generate PDF
      const pdfBlob = await this.printLabelToPDF(data, options);

      // Open print dialog or send to printer
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      return true;
    } catch (error) {
      console.error("Error printing label:", error);
      return false;
    }
  }

  /**
   * Batch print labels
   */
  async batchPrintLabels(
    labels: GHSLabel[],
    options?: LabelPrintOptions,
  ): Promise<boolean> {
    try {
      for (const label of labels) {
        await this.printLabel(label, options);
        // Small delay between prints
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return true;
    } catch (error) {
      console.error("Error batch printing labels:", error);
      return false;
    }
  }

  /**
   * Get label template
   */
  private getTemplate(templateId: string): LabelTemplate {
    const templates: Record<string, LabelTemplate> = {
      standard: {
        id: "standard",
        name: "Standard GHS Label",
        width: 100,
        height: 150,
        layout: "portrait",
      },
      small: {
        id: "small",
        name: "Small GHS Label",
        width: 50,
        height: 75,
        layout: "portrait",
      },
      large: {
        id: "large",
        name: "Large GHS Label",
        width: 150,
        height: 200,
        layout: "portrait",
      },
    };
    return templates[templateId] || templates.standard;
  }

  /**
   * Generate label HTML
   */
  private generateLabelHTML(data: GHSLabel): string {
    return `
      <div style="width: 100mm; height: 150mm; border: 2px solid black; padding: 5mm; font-family: Arial;">
        <h2 style="margin: 0; font-size: 14pt; font-weight: bold;">${data.chemicalName}</h2>
        ${data.casNumber ? `<p style="margin: 2mm 0; font-size: 10pt;">CAS: ${data.casNumber}</p>` : ""}
        
        <div style="margin: 5mm 0;">
          <p style="font-weight: bold; font-size: 12pt; color: red;">${data.signalWord}</p>
        </div>
        
        <div style="margin: 5mm 0;">
          ${data.ghsSymbols
            .map(
              (symbol) => `
            <span style="display: inline-block; padding: 2mm; margin: 1mm; background: yellow; border: 1px solid black;">
              ${symbol}
            </span>
          `,
            )
            .join("")}
        </div>
        
        <div style="margin: 5mm 0;">
          <h3 style="font-size: 10pt; margin: 2mm 0;">Hazard Statements:</h3>
          <ul style="margin: 0; padding-left: 5mm; font-size: 9pt;">
            ${data.hazardStatements.map((stmt) => `<li>${stmt}</li>`).join("")}
          </ul>
        </div>
        
        <div style="margin: 5mm 0;">
          <h3 style="font-size: 10pt; margin: 2mm 0;">Precautionary Statements:</h3>
          <ul style="margin: 0; padding-left: 5mm; font-size: 9pt;">
            ${data.precautionaryStatements.map((stmt) => `<li>${stmt}</li>`).join("")}
          </ul>
        </div>
        
        ${data.supplierInfo ? `<p style="margin-top: 5mm; font-size: 8pt;">Supplier: ${data.supplierInfo}</p>` : ""}
        ${data.lotNumber ? `<p style="font-size: 8pt;">Lot: ${data.lotNumber}</p>` : ""}
        
        ${
          data.barcode
            ? `
          <div style="margin-top: 5mm; text-align: center;">
            <img src="data:image/svg+xml;base64,${this.generateBarcodeSVG(data.barcode)}" style="height: 15mm;" />
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  /**
   * Add label content to PDF
   */
  private addLabelContent(
    doc: jsPDF,
    data: GHSLabel,
    template: LabelTemplate,
    options?: LabelPrintOptions,
  ): void {
    let yPos = 10;

    // Chemical Name
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(data.chemicalName, template.width / 2, yPos, { align: "center" });
    yPos += 10;

    // CAS Number
    if (data.casNumber) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`CAS: ${data.casNumber}`, template.width / 2, yPos, {
        align: "center",
      });
      yPos += 8;
    }

    // Signal Word
    doc.setFontSize(14);
    doc.setTextColor(255, 0, 0); // Red
    doc.text(data.signalWord, template.width / 2, yPos, { align: "center" });
    doc.setTextColor(0, 0, 0); // Black
    yPos += 10;

    // GHS Symbols
    doc.setFontSize(8);
    data.ghsSymbols.forEach((symbol, idx) => {
      const xPos = 10 + idx * 20;
      doc.rect(xPos, yPos - 5, 15, 15);
      doc.text(symbol, xPos + 7.5, yPos + 3, { align: "center" });
    });
    yPos += 15;

    // Hazard Statements
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Hazard Statements:", 10, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    data.hazardStatements.forEach((stmt) => {
      doc.text(`• ${stmt}`, 15, yPos, { maxWidth: template.width - 20 });
      yPos += 5;
    });
    yPos += 3;

    // Precautionary Statements
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Precautionary Statements:", 10, yPos);
    yPos += 6;
    doc.setFont("helvetica", "normal");
    data.precautionaryStatements.forEach((stmt) => {
      doc.text(`• ${stmt}`, 15, yPos, { maxWidth: template.width - 20 });
      yPos += 5;
    });

    // Barcode/QR (if enabled)
    if (options?.includeBarcode && data.barcode) {
      yPos += 5;
      // Add barcode representation to PDF
      this.addBarcodeToPDF(doc, data.barcode, template.width / 2, yPos);
    }

    // Add QR code if enabled
    if (options?.includeQR && data.qrCode) {
      yPos += 20;
      this.addQRCodeToPDF(doc, data.qrCode, template.width / 2, yPos);
    }
  }

  /**
   * Add barcode to PDF document
   */
  private addBarcodeToPDF(
    doc: jsPDF,
    barcode: string,
    x: number,
    y: number,
  ): void {
    // Create Code 128 style barcode representation
    const barcodeWidth = 60;
    const barcodeHeight = 15;
    const startX = x - barcodeWidth / 2;

    // Draw barcode bars (simplified representation)
    doc.setFillColor(0, 0, 0);
    const chars = barcode.split("");
    const barWidth = barcodeWidth / (chars.length * 4);

    chars.forEach((char, idx) => {
      // Generate pseudo-random bar pattern based on character
      const charCode = char.charCodeAt(0);
      const pattern = [
        charCode % 2 === 0,
        charCode % 3 === 0,
        charCode % 5 === 0,
        true, // Always have a bar
      ];

      pattern.forEach((isFilled, patternIdx) => {
        if (isFilled) {
          const barX = startX + (idx * 4 + patternIdx) * barWidth;
          doc.rect(barX, y, barWidth * 0.8, barcodeHeight, "F");
        }
      });
    });

    // Add barcode text below bars
    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.text(barcode, x, y + barcodeHeight + 4, { align: "center" });
  }

  /**
   * Add QR code to PDF document
   */
  private addQRCodeToPDF(
    doc: jsPDF,
    qrData: string,
    x: number,
    y: number,
  ): void {
    // Create QR code representation (simplified grid pattern)
    const qrSize = 20;
    const startX = x - qrSize / 2;
    const startY = y;
    const cellSize = qrSize / 10;

    doc.setFillColor(0, 0, 0);

    // Generate pseudo-QR pattern based on data
    const hash = qrData
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        // Corner positioning patterns (always filled)
        const isCorner =
          (row < 3 && col < 3) ||
          (row < 3 && col >= 7) ||
          (row >= 7 && col < 3);

        // Data pattern based on hash
        const isFilled = isCorner || (hash + row * col) % 3 === 0;

        if (isFilled) {
          doc.rect(
            startX + col * cellSize,
            startY + row * cellSize,
            cellSize * 0.9,
            cellSize * 0.9,
            "F",
          );
        }
      }
    }
  }

  /**
   * Generate barcode SVG (simplified)
   */
  private generateBarcodeSVG(barcode: string): string {
    // Simplified barcode representation
    const svg = `<svg width="200" height="50">
      <text x="100" y="25" text-anchor="middle" font-family="monospace" font-size="12">${barcode}</text>
    </svg>`;
    return btoa(svg);
  }
}

export const labelService = new LabelService();

/**
 * MSDS Export Service
 * Handles exporting MSDS data to various formats (Excel, PDF, CSV)
 */

import { MSDSSubmission } from "@/types/msds";

export interface ExportOptions {
  format: "excel" | "pdf" | "csv";
  submissions: MSDSSubmission[];
  includeFields?: string[];
  filename?: string;
}

export class MSDSExportService {
  /**
   * Export submissions to Excel format
   */
  async exportToExcel(options: ExportOptions): Promise<Blob> {
    const { submissions, includeFields, filename = "msds-export" } = options;

    // Dynamic import of xlsx library
    const XLSX = await import("xlsx");

    // Prepare data
    const data = submissions.map((sub) => {
      const data = sub.extractedData;
      const row: any = {
        ID: sub.id,
        "File Name": sub.file.name,
        "Product Name": data?.productName || "Unknown",
        "CAS Number": data?.casNumber || "N/A",
        "EC Number": data?.ecNumber || "N/A",
        "UN Number": data?.unNumber || "N/A",
        "Molecular Formula": data?.molecularFormula || "N/A",
        Manufacturer: data?.manufacturer || "N/A",
        "Hazard Level": data?.hazardLevel || "Medium",
        "Hazard Class": data?.hazardClass || "N/A",
        Status: sub.status,
        "Submitted Date": sub.submittedDate.toLocaleDateString(),
        "AI Confidence": `${data?.aiConfidence || 0}%`,
        "Safety Score": data?.safetyScore || 0,
        "GHS Compliant": data?.ghsCompliant ? "Yes" : "No",
        Customer: (sub as any).customerName || "N/A",
        "Sub-Customer": (sub as any).subCustomerName || "N/A",
      };

      // Add additional fields if specified
      if (includeFields) {
        includeFields.forEach((field) => {
          if (data && field in data) {
            row[field] = (data as any)[field];
          }
        });
      }

      return row;
    });

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MSDS Submissions");

    // Auto-size columns
    const maxWidth = 50;
    const wscols = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.min(Math.max(key.length, 10), maxWidth),
    }));
    worksheet["!cols"] = wscols;

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
   * Export submissions to CSV format
   */
  async exportToCSV(options: ExportOptions): Promise<string> {
    const { submissions, includeFields } = options;

    // Prepare headers
    const headers = [
      "ID",
      "File Name",
      "Product Name",
      "CAS Number",
      "EC Number",
      "UN Number",
      "Molecular Formula",
      "Manufacturer",
      "Hazard Level",
      "Hazard Class",
      "Status",
      "Submitted Date",
      "AI Confidence",
      "Safety Score",
      "GHS Compliant",
      "Customer",
      "Sub-Customer",
    ];

    // Add additional headers if specified
    if (includeFields) {
      headers.push(...includeFields);
    }

    // Create CSV rows
    const rows = [headers.join(",")];

    submissions.forEach((sub) => {
      const data = sub.extractedData;
      const row = [
        sub.id,
        `"${sub.file.name}"`,
        `"${data?.productName || "Unknown"}"`,
        data?.casNumber || "N/A",
        data?.ecNumber || "N/A",
        data?.unNumber || "N/A",
        data?.molecularFormula || "N/A",
        `"${data?.manufacturer || "N/A"}"`,
        data?.hazardLevel || "Medium",
        `"${data?.hazardClass || "N/A"}"`,
        sub.status,
        sub.submittedDate.toLocaleDateString(),
        `${data?.aiConfidence || 0}%`,
        data?.safetyScore || 0,
        data?.ghsCompliant ? "Yes" : "No",
        `"${(sub as any).customerName || "N/A"}"`,
        `"${(sub as any).subCustomerName || "N/A"}"`,
      ];

      // Add additional fields if specified
      if (includeFields) {
        includeFields.forEach((field) => {
          if (data && field in data) {
            const value = (data as any)[field];
            row.push(typeof value === "string" ? `"${value}"` : value);
          } else {
            row.push("N/A");
          }
        });
      }

      rows.push(row.join(","));
    });

    return rows.join("\n");
  }

  /**
   * Export submissions to PDF format (generates HTML that can be converted to PDF)
   */
  async exportToPDF(options: ExportOptions): Promise<string> {
    const { submissions, filename = "msds-export" } = options;

    // Generate HTML report
    const html = this.generatePDFHTML(submissions);
    return html;
  }

  /**
   * Generate HTML for PDF export
   */
  private generatePDFHTML(submissions: MSDSSubmission[]): string {
    const total = submissions.length;
    const approved = submissions.filter((s) => s.status === "approved").length;
    const rejected = submissions.filter((s) => s.status === "rejected").length;
    const pending = submissions.filter((s) => s.status === "review").length;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>MSDS Export Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 20px;
      color: #333;
    }
    .header {
      border-bottom: 3px solid #06b6d4;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #06b6d4;
      margin: 0;
      font-size: 28px;
    }
    .header .meta {
      color: #666;
      margin-top: 10px;
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #06b6d4;
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #06b6d4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #06b6d4;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    tr:hover {
      background: #f9fafb;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-approved {
      background: #10b981;
      color: white;
    }
    .badge-rejected {
      background: #ef4444;
      color: white;
    }
    .badge-pending {
      background: #f59e0b;
      color: white;
    }
    .badge-high {
      background: #ef4444;
      color: white;
    }
    .badge-medium {
      background: #f59e0b;
      color: white;
    }
    .badge-low {
      background: #10b981;
      color: white;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #666;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>MSDS Submission Report</h1>
    <div class="meta">
      Generated: ${new Date().toLocaleString()}<br>
      Total Submissions: ${total}
    </div>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <h3>Total</h3>
      <div class="value">${total}</div>
    </div>
    <div class="summary-card">
      <h3>Approved</h3>
      <div class="value" style="color: #10b981;">${approved}</div>
    </div>
    <div class="summary-card">
      <h3>Rejected</h3>
      <div class="value" style="color: #ef4444;">${rejected}</div>
    </div>
    <div class="summary-card">
      <h3>Pending</h3>
      <div class="value" style="color: #f59e0b;">${pending}</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Product Name</th>
        <th>CAS Number</th>
        <th>Manufacturer</th>
        <th>Hazard Level</th>
        <th>Status</th>
        <th>Submitted Date</th>
        <th>AI Confidence</th>
        <th>Customer</th>
      </tr>
    </thead>
    <tbody>
      ${submissions
        .map((sub) => {
          const data = sub.extractedData;
          const hazardLevel = data?.hazardLevel || "Medium";
          return `
        <tr>
          <td><strong>${data?.productName || "Unknown"}</strong></td>
          <td>${data?.casNumber || "N/A"}</td>
          <td>${data?.manufacturer || "N/A"}</td>
          <td><span class="badge badge-${hazardLevel.toLowerCase()}">${hazardLevel}</span></td>
          <td><span class="badge badge-${sub.status}">${sub.status}</span></td>
          <td>${sub.submittedDate.toLocaleDateString()}</td>
          <td>${data?.aiConfidence || 0}%</td>
          <td>${(sub as any).customerName || "N/A"}</td>
        </tr>
        `;
        })
        .join("")}
    </tbody>
  </table>
  
  <div class="footer">
    <p>This report was generated automatically by BlueDXP MSDS Management System</p>
    <p>© ${new Date().getFullYear()} BlueDXP Platform. All rights reserved.</p>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Download file helper
   */
  downloadFile(blob: Blob | string, filename: string, mimeType?: string) {
    if (typeof blob === "string") {
      // For HTML/PDF, create a blob URL
      const htmlBlob = new Blob([blob], { type: mimeType || "text/html" });
      const url = URL.createObjectURL(htmlBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // For binary files (Excel, CSV)
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
}

export const msdsExportService = new MSDSExportService();

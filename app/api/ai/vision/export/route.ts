/**
 * Vision Analysis Export API
 * Advanced reporting with PDF, Excel, CSV export
 */

import { NextRequest, NextResponse } from "next/server";
import { exportService } from "@/lib/services/export/exportService";
import { apiAuthMiddleware } from "@/middleware/apiAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await apiAuthMiddleware(request);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const { format, analyses, includeCharts, includeImages, title, dateRange } =
      body;

    if (!format || !analyses || !Array.isArray(analyses)) {
      return NextResponse.json(
        { success: false, error: "Format and analyses array are required" },
        { status: 400 },
      );
    }

    // Prepare export data
    const exportData = analyses.map((analysis: any) => ({
      ID: analysis.id,
      Timestamp: new Date(analysis.timestamp).toLocaleString(),
      Description: analysis.analysis?.description || "N/A",
      "Safety Issues": analysis.analysis?.safetyIssues?.length || 0,
      "Quality Issues": analysis.analysis?.qualityIssues?.length || 0,
      "Compliance Issues": analysis.analysis?.complianceIssues?.length || 0,
      "Detected Objects": analysis.analysis?.detectedObjects?.length || 0,
      "Compliance Score": analysis.complianceScore || "N/A",
      Provider: analysis.metadata?.provider || "N/A",
      "Processing Time (ms)": analysis.metadata?.processingTime || 0,
    }));

    // Generate export
    const result = await exportService.export({
      format: format as "pdf" | "csv" | "xlsx" | "json",
      filename: `vision-analysis-report-${new Date().toISOString().split("T")[0]}`,
      title: title || "AI Vision Analysis Report",
      description: `Vision analysis report${dateRange ? ` for ${dateRange}` : ""}`,
      data: exportData,
      includeHeaders: true,
      includeTimestamp: true,
      includeMetadata: true,
      columns: [
        { key: "ID", label: "Analysis ID", type: "string" },
        { key: "Timestamp", label: "Timestamp", type: "date" },
        { key: "Description", label: "Description", type: "string" },
        { key: "Safety Issues", label: "Safety Issues", type: "number" },
        { key: "Quality Issues", label: "Quality Issues", type: "number" },
        {
          key: "Compliance Issues",
          label: "Compliance Issues",
          type: "number",
        },
        { key: "Detected Objects", label: "Detected Objects", type: "number" },
        { key: "Compliance Score", label: "Compliance Score", type: "number" },
        { key: "Provider", label: "Provider", type: "string" },
        {
          key: "Processing Time (ms)",
          label: "Processing Time (ms)",
          type: "number",
        },
      ],
      styling: {
        headerBgColor: "#1f2937",
        headerTextColor: "#ffffff",
        alternateRowColor: "#374151",
        borderColor: "#4b5563",
        fontSize: 10,
      },
    });

    if (result.success && result.blob) {
      const contentType =
        format === "pdf"
          ? "application/pdf"
          : format === "excel" || format === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : format === "csv"
              ? "text/csv"
              : "application/json";

      return new NextResponse(result.blob, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${result.filename}.${format === "pdf" ? "pdf" : format === "excel" || format === "xlsx" ? "xlsx" : format === "csv" ? "csv" : "json"}"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Export failed" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Vision export error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to export vision analysis",
      },
      { status: 500 },
    );
  }
}

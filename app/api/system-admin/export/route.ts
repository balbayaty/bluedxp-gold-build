/**
 * System Admin Export API
 * Export metrics, reports, and data
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json"; // json, csv, pdf
    const section = searchParams.get("section") || "overview";
    const tenantId = searchParams.get("tenantId") || "default-tenant";

    // Fetch comprehensive metrics
    const metricsResponse = await fetch(
      `${request.nextUrl.origin}/api/system-admin/comprehensive-metrics?tenantId=${tenantId}`,
    );
    const metricsData = await metricsResponse.json();

    if (!metricsData.success) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch metrics" },
        { status: 500 },
      );
    }

    switch (format) {
      case "csv":
        // Convert to CSV
        const csv = convertToCSV(metricsData.data, section);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="system-admin-${section}-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });

      case "json":
        return NextResponse.json(metricsData.data, {
          headers: {
            "Content-Disposition": `attachment; filename="system-admin-${section}-${new Date().toISOString().split("T")[0]}.json"`,
          },
        });

      case "pdf":
        // PDF generation would require a library like pdfkit or puppeteer
        return NextResponse.json(
          { success: false, error: "PDF export not yet implemented" },
          { status: 501 },
        );

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported format: ${format}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to export data",
      },
      { status: 500 },
    );
  }
}

function convertToCSV(data: any, section: string): string {
  // Simple CSV conversion
  const rows: string[] = [];

  if (section === "overview") {
    rows.push("Metric,Value");
    rows.push(`System Health Score,${data.overview.systemHealthScore}%`);
    rows.push(`Total Modules,${data.overview.totalModules}`);
    rows.push(`Healthy Modules,${data.overview.healthyModules}`);
    rows.push(`Total Users,${data.overview.totalUsers}`);
    rows.push(`Active Users,${data.overview.activeUsers}`);
  } else if (section === "modules") {
    rows.push("Module ID,Module Name,Status,Uptime,Response Time,Error Rate");
    data.modules.forEach((module: any) => {
      rows.push(
        `${module.moduleId},${module.moduleName},${module.status},${module.uptime},${module.metrics.responseTime},${module.metrics.errorRate}`,
      );
    });
  }

  return rows.join("\n");
}

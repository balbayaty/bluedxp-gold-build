/**
 * Intelligence Export API
 * Exports intelligence data in various formats
 */

import { NextResponse } from "next/server";
import { exportService } from "@/lib/services/intelligence-analytics/export/exportService";
import { rootCauseAnalysisEngine } from "@/lib/services/intelligence-analytics";
import { DataMiningEngine } from "@/lib/services/intelligence-analytics/data-mining/dataMiningEngine";
import { ProcessMiningEngine } from "@/lib/services/intelligence-analytics/process-mining/processMiningEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, format, ids, tenantId } = body;

    if (!type || !format || !tenantId) {
      return NextResponse.json(
        { error: "type, format, and tenantId are required" },
        { status: 400 },
      );
    }

    let exportData: string;

    switch (type) {
      case "root-cause":
        if (!ids || ids.length === 0) {
          return NextResponse.json(
            { error: "ids array is required for root-cause export" },
            { status: 400 },
          );
        }
        const rcas = ids
          .map((id: string) => rootCauseAnalysisEngine.getAnalysis(id))
          .filter(Boolean);
        if (format === "csv") {
          exportData = await exportService.exportRCAToExcel(rcas[0]);
        } else {
          exportData = exportService.exportToJSON(rcas);
        }
        break;

      case "data-mining":
        const dataMiningEngine = DataMiningEngine.getInstance();
        const miningResults = await dataMiningEngine.mine({
          tenantId,
          moduleIds: body.moduleIds,
          timeRange: body.timeRange,
          algorithms: body.algorithms,
        });
        exportData = exportService.exportToJSON(miningResults);
        break;

      case "process-mining":
        const processMiningEngine = ProcessMiningEngine.getInstance();
        const processResults = await processMiningEngine.discoverProcess({
          tenantId,
          processType: body.processType || "order_fulfillment",
          moduleIds: body.moduleIds,
          timeRange: body.timeRange,
        });
        exportData = exportService.exportToJSON(processResults);
        break;

      case "analytics":
        const { analyticsAggregationService } =
          await import("@/lib/services/intelligence-analytics/analytics/analyticsAggregationService");
        const analyticsResults =
          await analyticsAggregationService.aggregateAnalytics(
            tenantId,
            body.timeRange,
          );
        exportData = exportService.exportToJSON(analyticsResults);
        break;

      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const contentType = format === "csv" ? "text/csv" : "application/json";
    const filename = `intelligence-${type}-${Date.now()}.${format}`;

    return new NextResponse(exportData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting intelligence data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}

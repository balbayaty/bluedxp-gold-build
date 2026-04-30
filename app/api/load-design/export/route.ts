/**
 * Load Design Export API
 *
 * Endpoints for exporting load plans and analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { exportService } from "@/lib/services/load-design/export/exportService";
import { loadPlanDatabaseAdapter } from "@/lib/services/load-design/database/loadPlanDatabaseAdapter";
import { loadAnalyticsService } from "@/lib/services/load-design/analytics/loadAnalyticsService";
import type { LoadPlan } from "@/types/load-design";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, format, loadPlanId, filters } = body;

    if (type === "load-plan" && loadPlanId) {
      // Export single load plan
      const loadPlan = await loadPlanDatabaseAdapter.getLoadPlan(loadPlanId);
      if (!loadPlan) {
        return NextResponse.json(
          { success: false, error: "Load plan not found" },
          { status: 404 },
        );
      }

      let blob: Blob;
      if (format === "PDF") {
        blob = await exportService.exportLoadPlanToPDF(loadPlan, {
          format: "PDF",
          includeDetails: true,
        });
        return new NextResponse(blob, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="load-plan-${loadPlan.loadNumber}.pdf"`,
          },
        });
      } else if (format === "CSV") {
        blob = await exportService.exportLoadPlansToCSV([loadPlan]);
        return new NextResponse(blob, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="load-plan-${loadPlan.loadNumber}.csv"`,
          },
        });
      }
    } else if (type === "analytics") {
      // Export analytics
      const loadPlans = await loadPlanDatabaseAdapter.getAllLoadPlans(
        filters || {},
      );
      const analytics = await loadAnalyticsService.calculateAnalytics(
        loadPlans,
        filters,
      );

      if (format === "EXCEL") {
        const blob = await exportService.exportAnalyticsToExcel(analytics);
        return new NextResponse(blob, {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="analytics-${new Date().toISOString().split("T")[0]}.xlsx"`,
          },
        });
      } else if (format === "CSV") {
        const blob = await exportService.exportLoadPlansToCSV(loadPlans);
        return new NextResponse(blob, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="analytics-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      }
    } else if (type === "load-plans" && filters) {
      // Export multiple load plans
      const loadPlans = await loadPlanDatabaseAdapter.getAllLoadPlans(filters);

      if (format === "CSV") {
        const blob = await exportService.exportLoadPlansToCSV(loadPlans);
        return new NextResponse(blob, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="load-plans-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid export type or format" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Export failed",
      },
      { status: 500 },
    );
  }
}

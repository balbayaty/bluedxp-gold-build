/**
 * QHSE Reports Export API
 * Export QHSE reports to PDF, Excel, CSV formats
 */

import { NextRequest, NextResponse } from "next/server";
import { exportService } from "@/lib/services/export/exportService";
import { qhseIncidentService } from "@/lib/services/qhse/incidentService";
import { qhseInspectionService } from "@/lib/services/qhse/inspectionService";
import { qhseTrainingService } from "@/lib/services/qhse/trainingService";
import { qhseEnvironmentalService } from "@/lib/services/qhse/environmentalService";
import { qhseSafetyMetricsService } from "@/lib/services/qhse/safetyMetricsService";
import { qhseRegulatoryComplianceService } from "@/lib/services/qhse/regulatoryComplianceService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") || "incidents";
    const format = (searchParams.get("format") || "pdf") as
      | "pdf"
      | "excel"
      | "csv";
    const tenantId = searchParams.get("tenantId");
    const customerId = searchParams.get("customerId");
    const warehouseId = searchParams.get("warehouseId");
    const facilityId = searchParams.get("facilityId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let exportData: any[] = [];
    let title = "QHSE Report";
    let filename = "qhse-report";

    switch (reportType) {
      case "incidents":
        const incidents = await qhseIncidentService.getIncidents({
          tenantId,
          customerId,
          warehouseId,
          facilityId,
          dateFrom,
          dateTo,
        });
        exportData = incidents.map((inc) => ({
          "Incident Number": inc.incidentNumber,
          Title: inc.title,
          Type: inc.type,
          Severity: inc.severity,
          Status: inc.status,
          Location: inc.location,
          "Occurred At": new Date(inc.occurredAt).toLocaleDateString(),
          "Reported By": inc.reportedBy,
        }));
        title = "QHSE Incidents Report";
        filename = "qhse-incidents-report";
        break;

      case "inspections":
        const inspections = await qhseInspectionService.getInspections({
          tenantId,
          customerId,
          warehouseId,
          facilityId,
          dateFrom,
          dateTo,
        });
        exportData = inspections.map((ins) => ({
          "Inspection Number": ins.inspectionNumber,
          Title: ins.title,
          Type: ins.type,
          Status: ins.status,
          "Scheduled Date": new Date(ins.scheduledDate).toLocaleDateString(),
          "Conducted Date": ins.conductedDate
            ? new Date(ins.conductedDate).toLocaleDateString()
            : "",
          "Compliance Score": ins.complianceScore || 0,
          "Total Findings": ins.totalFindings || 0,
        }));
        title = "QHSE Inspections Report";
        filename = "qhse-inspections-report";
        break;

      case "training":
        const trainingRecords = await qhseTrainingService.getTrainingRecords({
          tenantId,
          customerId,
          warehouseId,
        });
        exportData = trainingRecords.map((tr) => ({
          Employee: tr.employeeName || tr.employeeId,
          "Training Program": tr.trainingProgram?.name || "",
          Status: tr.status,
          Progress: `${tr.progress || 0}%`,
          "Assigned Date": new Date(tr.assignedDate).toLocaleDateString(),
          "Completed Date": tr.completedDate
            ? new Date(tr.completedDate).toLocaleDateString()
            : "",
          "Expiry Date": tr.expiryDate
            ? new Date(tr.expiryDate).toLocaleDateString()
            : "",
          "Certification Status": tr.certificationStatus || "",
        }));
        title = "QHSE Training Report";
        filename = "qhse-training-report";
        break;

      case "safety-metrics":
        const safetyMetrics = await qhseSafetyMetricsService.getSafetyMetrics({
          tenantId,
          customerId,
          warehouseId,
          facilityId,
          periodStart: dateFrom,
          periodEnd: dateTo,
        });
        exportData = safetyMetrics.map((sm) => ({
          Period: `${new Date(sm.periodStart).toLocaleDateString()} - ${new Date(sm.periodEnd).toLocaleDateString()}`,
          TRIR: sm.trir?.rate || 0,
          LTIFR: sm.ltifr?.rate || 0,
          "Near Misses": sm.nearMisses || 0,
          "First Aid Cases": sm.firstAidCases || 0,
          "Lost Time Cases": sm.lostTimeCases || 0,
          "Total Hours Worked": sm.totalHoursWorked || 0,
        }));
        title = "QHSE Safety Metrics Report";
        filename = "qhse-safety-metrics-report";
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown report type: ${reportType}` },
          { status: 400 },
        );
    }

    // Use export service
    const result = await exportService.export({
      format: format === "excel" ? "xlsx" : format,
      filename: `${filename}-${new Date().toISOString().split("T")[0]}`,
      title,
      data: exportData,
      includeHeaders: true,
      includeTimestamp: true,
      includeMetadata: true,
    });

    if (result.success && result.blob) {
      const contentType =
        format === "pdf"
          ? "application/pdf"
          : format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv";

      return new NextResponse(result.blob, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${result.filename}.${format === "pdf" ? "pdf" : format === "excel" ? "xlsx" : "csv"}"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Export failed" },
      { status: 500 },
    );
  } catch (error) {
    console.error("Error exporting QHSE report:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to export report",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.reports.export",
  action: "export",
  requireAuth: true,
  rateLimit: true,
});

/**
 * Export & Reporting API Route
 *
 * Comprehensive export and reporting capabilities
 */

import { NextRequest, NextResponse } from "next/server";
import { withTransportationAPI } from "@/lib/services/transportation/apiMiddleware";
import { exportReportingService } from "@/lib/services/transportation/exportReportingService";
import type {
  ExportRequest,
  ScheduledReport,
  CustomReportTemplate,
} from "@/lib/services/transportation/exportReportingService";

async function handler(
  req: NextRequest,
  context: { tenantId?: string; userId?: string },
) {
  try {
    const body = await req.json();
    const { action, ...data } = body;
    const tenantId = context?.tenantId;

    if (!tenantId || String(tenantId).trim().length === 0) {
      return NextResponse.json(
        { error: "tenantId is required (multi-tenant day 1)" },
        { status: 400 },
      );
    }

    switch (action) {
      case "export":
        return await handleExport({
          ...(data as any),
          tenantId: String(tenantId),
        } as any);

      case "get-export":
        return await handleGetExport({
          ...(data as any),
          tenantId: String(tenantId),
        });

      case "create-scheduled":
        return await handleCreateScheduled({
          ...(data as any),
          tenantId: String(tenantId),
          createdBy: context?.userId,
        } as any);

      case "get-scheduled":
        return await handleGetScheduled(data);

      case "list-scheduled":
        return await handleListScheduled();

      case "create-template":
        return await handleCreateTemplate({
          ...(data as any),
          tenantId: String(tenantId),
          createdBy: context?.userId,
        } as any);

      case "get-template":
        return await handleGetTemplate(data);

      case "list-templates":
        return await handleListTemplates();

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

async function handleExport(data: ExportRequest) {
  const result = await exportReportingService.exportData(data);
  return NextResponse.json({ export: result });
}

async function handleGetExport(data: { exportId: string }) {
  const tenantId = (data as any).tenantId as string | undefined;
  if (!tenantId) {
    return NextResponse.json(
      { error: "tenantId is required (multi-tenant day 1)" },
      { status: 400 },
    );
  }
  const exportResult = await exportReportingService.getExport(
    tenantId,
    data.exportId,
  );
  if (!exportResult) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }
  return NextResponse.json({ export: exportResult });
}

async function handleCreateScheduled(data: {
  name: string;
  reportType: string;
  format: string;
  schedule: ScheduledReport["schedule"];
  filters?: ExportRequest["filters"];
  recipients: string[];
  options?: ExportRequest["options"];
  createdBy: string;
  tenantId?: string;
}) {
  const scheduled = await exportReportingService.createScheduledReport(
    data as any,
  );
  return NextResponse.json({ scheduled });
}

async function handleGetScheduled(data: { reportId: string }) {
  const scheduled = exportReportingService.getScheduledReport(data.reportId);
  if (!scheduled) {
    return NextResponse.json(
      { error: "Scheduled report not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ scheduled });
}

async function handleListScheduled() {
  const scheduled = exportReportingService.listScheduledReports();
  return NextResponse.json({ scheduled });
}

async function handleCreateTemplate(data: {
  name: string;
  description: string;
  reportType: string;
  sections: CustomReportTemplate["sections"];
  layout?: "PORTRAIT" | "LANDSCAPE";
  header?: CustomReportTemplate["header"];
  footer?: CustomReportTemplate["footer"];
  styling?: CustomReportTemplate["styling"];
  createdBy: string;
  tenantId?: string;
}) {
  const template = await exportReportingService.createCustomTemplate(
    data as any,
  );
  return NextResponse.json({ template });
}

async function handleGetTemplate(data: { templateId: string }) {
  const template = exportReportingService.getCustomTemplate(data.templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
  return NextResponse.json({ template });
}

async function handleListTemplates() {
  const templates = exportReportingService.listCustomTemplates();
  return NextResponse.json({ templates });
}

export const POST = withTransportationAPI(handler, { action: "execute" });

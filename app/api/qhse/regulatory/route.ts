/**
 * QHSE Regulatory Compliance API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseRegulatoryComplianceService } from "@/lib/services/qhse";
import type {
  RegulatoryAuditFilters,
  ComplianceScoreFilters,
  SafetyMetricFilters,
} from "@/types/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    if (action === "upcoming") {
      const days = parseInt(searchParams.get("days") || "30");
      const audits =
        await qhseRegulatoryComplianceService.getUpcomingAudits(days);
      return NextResponse.json({
        success: true,
        data: audits,
        count: audits.length,
      });
    }

    if (action === "compliance-score") {
      const filters: ComplianceScoreFilters = {
        tenantId: searchParams.get("tenantId") || undefined,
        customerId: searchParams.get("customerId") || undefined,
        warehouseId: searchParams.get("warehouseId") || undefined,
        facilityId: searchParams.get("facilityId") || undefined,
        dateFrom: searchParams.get("dateFrom") || undefined,
        dateTo: searchParams.get("dateTo") || undefined,
      };

      const score =
        await qhseRegulatoryComplianceService.getComplianceScore(filters);
      return NextResponse.json({
        success: true,
        data: { complianceScore: score },
      });
    }

    if (action === "osha-log") {
      const filters: SafetyMetricFilters = {
        tenantId: searchParams.get("tenantId") || undefined,
        customerId: searchParams.get("customerId") || undefined,
        warehouseId: searchParams.get("warehouseId") || undefined,
        facilityId: searchParams.get("facilityId") || undefined,
        periodStart: searchParams.get("periodStart") || undefined,
        periodEnd: searchParams.get("periodEnd") || undefined,
      };

      const log =
        await qhseRegulatoryComplianceService.generateOSHALog(filters);
      return NextResponse.json({
        success: true,
        data: log,
      });
    }

    // Default: Get all audits
    const filters: RegulatoryAuditFilters = {
      tenantId: searchParams.get("tenantId") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      warehouseId: searchParams.get("warehouseId") || undefined,
      facilityId: searchParams.get("facilityId") || undefined,
      auditType: (searchParams.get("auditType") as any) || undefined,
      regulatoryStandard:
        (searchParams.get("regulatoryStandard") as any) || undefined,
      status: (searchParams.get("status") as any) || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
    };

    const audits = await qhseRegulatoryComplianceService.getAudits(filters);

    return NextResponse.json({
      success: true,
      data: audits,
      count: audits.length,
    });
  } catch (error) {
    console.error("Error fetching regulatory data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch regulatory data",
      },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action || "schedule-audit";

    if (action === "schedule-audit") {
      if (
        !body.tenantId ||
        !body.auditType ||
        !body.regulatoryStandard ||
        !body.scheduledDate
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Missing required fields: tenantId, auditType, regulatoryStandard, scheduledDate",
          },
          { status: 400 },
        );
      }

      const audit = await qhseRegulatoryComplianceService.scheduleAudit({
        tenantId: body.tenantId,
        customerId: body.customerId,
        warehouseId: body.warehouseId,
        facilityId: body.facilityId,
        auditNumber: body.auditNumber,
        auditType: body.auditType,
        regulatoryStandard: body.regulatoryStandard,
        authority: body.authority,
        auditorName: body.auditorName,
        auditorOrganization: body.auditorOrganization,
        scheduledDate: body.scheduledDate,
        scheduledBy: body.scheduledBy,
        scope: body.scope,
        scopeAreas: body.scopeAreas,
        followUpRequired: body.followUpRequired || false,
        createdBy: body.createdBy,
        updatedBy: body.updatedBy || body.createdBy,
      });

      return NextResponse.json(
        {
          success: true,
          data: audit,
        },
        { status: 201 },
      );
    } else if (action === "submit-osha-log") {
      if (!body.logId) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required field: logId",
          },
          { status: 400 },
        );
      }

      await qhseRegulatoryComplianceService.submitOSHALog(body.logId);
      return NextResponse.json({
        success: true,
        message: "OSHA log submitted successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "schedule-audit" or "submit-osha-log"',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error in regulatory operation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to perform regulatory operation",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.regulatory",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.regulatory",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

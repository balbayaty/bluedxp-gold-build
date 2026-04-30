/**
 * Pharmaceutical & FDA API Route
 * FDA Part 11, cGMP, ICH Q7 compliance
 * Comprehensive validation and error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { pharmaceuticalService } from "@/lib/services/qhse/pharmaceuticalService";
import { QHSEValidator } from "@/lib/services/qhse/utils/validation";
import { QHSEErrorHandler } from "@/lib/services/qhse/utils/errorHandler";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");
    const tenantId = searchParams.get("tenantId");

    if (action === "batch-records") {
      const records = await pharmaceuticalService.listBatchRecords({
        tenantId,
      });
      return NextResponse.json({ success: true, data: records });
    }

    if (action === "batch-record") {
      const id = searchParams.get("id");
      if (!id) {
        return NextResponse.json(
          { success: false, error: "id required" },
          { status: 400 },
        );
      }
      const record = await pharmaceuticalService.getBatchRecord(id);
      return NextResponse.json({ success: true, data: record });
    }

    if (action === "deviations") {
      // List deviations would be added to service
      return NextResponse.json({ success: true, data: [] });
    }

    if (action === "change-controls") {
      // List change controls would be added to service
      return NextResponse.json({ success: true, data: [] });
    }

    if (action === "audit-trail") {
      const recordId = searchParams.get("recordId");
      const recordType = searchParams.get("recordType");
      if (!recordId || !recordType) {
        return NextResponse.json(
          { success: false, error: "recordId and recordType required" },
          { status: 400 },
        );
      }
      const trail = await pharmaceuticalService.getAuditTrail(
        recordId,
        recordType,
      );
      return NextResponse.json({ success: true, data: trail });
    }

    if (action === "compliance") {
      const standard = searchParams.get("standard") || "FDA11";
      let compliance;
      if (standard === "FDA11") {
        compliance = await pharmaceuticalService.checkFDA11Compliance(
          tenantId || undefined,
        );
      } else if (standard === "cGMP") {
        compliance = await pharmaceuticalService.checkcGMPCompliance(
          tenantId || undefined,
        );
      } else if (standard === "ICHQ7") {
        compliance = await pharmaceuticalService.checkICHQ7Compliance(
          tenantId || undefined,
        );
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid standard" },
          { status: 400 },
        );
      }
      return NextResponse.json({ success: true, data: compliance });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(error, "Pharmaceutical API");
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action;

    if (action === "create-batch-record") {
      const record = await pharmaceuticalService.createBatchRecord(body.record);
      return NextResponse.json({ success: true, data: record });
    }

    if (action === "update-batch-record") {
      const { id, updates, userId, reason } = body;
      const record = await pharmaceuticalService.updateBatchRecord(
        id,
        updates,
        userId,
        reason,
      );
      return NextResponse.json({ success: true, data: record });
    }

    if (action === "approve-batch") {
      const { batchId, approverId, signature } = body;
      const record = await pharmaceuticalService.approveBatchRecord(
        batchId,
        approverId,
        signature,
      );
      return NextResponse.json({ success: true, data: record });
    }

    if (action === "release-batch") {
      const { batchId, releaserId, signature } = body;
      const record = await pharmaceuticalService.releaseBatchRecord(
        batchId,
        releaserId,
        signature,
      );
      return NextResponse.json({ success: true, data: record });
    }

    if (action === "ai-review-batch") {
      const { batchId } = body;
      const review = await pharmaceuticalService.aiReviewBatchRecord(batchId);
      return NextResponse.json({ success: true, data: review });
    }

    if (action === "report-deviation") {
      const deviation = await pharmaceuticalService.reportDeviation(
        body.deviation,
      );
      return NextResponse.json({ success: true, data: deviation });
    }

    if (action === "create-change-control") {
      const change = await pharmaceuticalService.createChangeControl(
        body.change,
      );
      return NextResponse.json({ success: true, data: change });
    }

    if (action === "create-electronic-signature") {
      // Validate electronic signature (FDA Part 11)
      const validation = QHSEValidator.validateElectronicSignature(
        body.signature,
      );
      if (!validation.valid) {
        const error = QHSEErrorHandler.createValidationError(validation.errors);
        return NextResponse.json(QHSEErrorHandler.formatErrorResponse(error), {
          status: error.statusCode,
        });
      }

      const signature = await pharmaceuticalService.createElectronicSignature(
        body.signature,
      );
      return NextResponse.json({ success: true, data: signature });
    }

    if (action === "validate-data-integrity") {
      const { recordId, recordType } = body;
      const validation = await pharmaceuticalService.validateDataIntegrity(
        recordId,
        recordType,
      );
      return NextResponse.json({ success: true, data: validation });
    }

    if (action === "predict-batch-quality") {
      const { batchId } = body;
      const prediction =
        await pharmaceuticalService.predictBatchQuality(batchId);
      return NextResponse.json({ success: true, data: prediction });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    const qhseError = QHSEErrorHandler.handleError(error, "Pharmaceutical API");
    return NextResponse.json(QHSEErrorHandler.formatErrorResponse(qhseError), {
      status: qhseError.statusCode,
    });
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.pharmaceutical",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.pharmaceutical",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

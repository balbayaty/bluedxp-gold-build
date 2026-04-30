/**
 * QHSE Training API Route
 */

import { NextRequest, NextResponse } from "next/server";
import { qhseTrainingService } from "@/lib/services/qhse";
import type {
  TrainingProgramFilters,
  TrainingRecordFilters,
} from "@/types/qhse";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

// GET - Get training programs or records
async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "programs"; // 'programs' or 'records'

    if (type === "programs") {
      const filters: TrainingProgramFilters = {
        tenantId: searchParams.get("tenantId") || undefined,
        customerId: searchParams.get("customerId") || undefined,
        category: searchParams.get("category") || undefined,
        type: (searchParams.get("programType") as any) || undefined,
        isActive:
          searchParams.get("isActive") === "true"
            ? true
            : searchParams.get("isActive") === "false"
              ? false
              : undefined,
        isMandatory:
          searchParams.get("isMandatory") === "true"
            ? true
            : searchParams.get("isMandatory") === "false"
              ? false
              : undefined,
      };

      const programs = await qhseTrainingService.getTrainingPrograms(filters);
      return NextResponse.json({
        success: true,
        data: programs,
        count: programs.length,
      });
    } else {
      const filters: TrainingRecordFilters = {
        tenantId: searchParams.get("tenantId") || undefined,
        customerId: searchParams.get("customerId") || undefined,
        warehouseId: searchParams.get("warehouseId") || undefined,
        employeeId: searchParams.get("employeeId") || undefined,
        trainingProgramId: searchParams.get("trainingProgramId") || undefined,
        status: (searchParams.get("status") as any) || undefined,
        certificationStatus:
          (searchParams.get("certificationStatus") as any) || undefined,
        expiryDateFrom: searchParams.get("expiryDateFrom") || undefined,
        expiryDateTo: searchParams.get("expiryDateTo") || undefined,
      };

      const records = await qhseTrainingService.getTrainingRecords(filters);
      return NextResponse.json({
        success: true,
        data: records,
        count: records.length,
      });
    }
  } catch (error) {
    console.error("Error fetching training data:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch training data",
      },
      { status: 500 },
    );
  }
}

// POST - Create training program or assign training
async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const action = body.action || "create-program"; // 'create-program' or 'assign-training'

    if (action === "create-program") {
      if (
        !body.tenantId ||
        !body.name ||
        !body.category ||
        !body.deliveryMethod
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Missing required fields: tenantId, name, category, deliveryMethod",
          },
          { status: 400 },
        );
      }

      const program = await qhseTrainingService.createTrainingProgram({
        tenantId: body.tenantId,
        customerId: body.customerId,
        programNumber: body.programNumber,
        name: body.name,
        description: body.description,
        category: body.category,
        type: body.type || "INITIAL",
        requiredForRoles: body.requiredForRoles,
        requiredForDepartments: body.requiredForDepartments,
        frequency: body.frequency,
        validityPeriod: body.validityPeriod,
        prerequisites: body.prerequisites,
        content: body.content,
        materials: body.materials,
        duration: body.duration,
        deliveryMethod: body.deliveryMethod,
        regulatoryStandard: body.regulatoryStandard,
        certificationRequired: body.certificationRequired || false,
        certificationBody: body.certificationBody,
        isActive: body.isActive !== undefined ? body.isActive : true,
        isMandatory: body.isMandatory || false,
        createdBy: body.createdBy,
        updatedBy: body.updatedBy || body.createdBy,
      });

      return NextResponse.json(
        {
          success: true,
          data: program,
        },
        { status: 201 },
      );
    } else if (action === "assign-training") {
      if (!body.employeeId || !body.trainingProgramId) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields: employeeId, trainingProgramId",
          },
          { status: 400 },
        );
      }

      const record = await qhseTrainingService.assignTraining(
        body.employeeId,
        body.trainingProgramId,
        body.dueDate ? new Date(body.dueDate) : undefined,
      );

      return NextResponse.json(
        {
          success: true,
          data: record,
        },
        { status: 201 },
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use "create-program" or "assign-training"',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error in training operation:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to perform training operation",
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "qhse",
  featureId: "qhse.training",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "qhse",
  featureId: "qhse.training",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

/**
 * ISO-IMS Training API Route
 * Handles Training records list and creation
 */

import { NextRequest, NextResponse } from "next/server";
import { trainingService } from "@/lib/services/iso-ims/trainingService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const createTrainingSchema = z.object({
  tenantId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  trainingType: z.enum([
    "INITIAL",
    "REFRESHER",
    "ON_THE_JOB",
    "E_LEARNING",
    "CLASSROOM",
    "WORKSHOP",
    "CERTIFICATION",
  ]),
  isoStandards: z.array(z.string()).optional(),
  competencies: z.array(z.string()).optional(),
  scheduledDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .optional(),
  duration: z.number().optional(),
  trainer: z.string().min(1),
  maxParticipants: z.number().optional(),
  assessmentRequired: z.boolean(),
  passingScore: z.number().optional(),
  createdBy: z.string().min(1),
});

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await trainingService.getTrainings({
      tenantId,
      pagination: { page, pageSize },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Trainings:", error);
    return NextResponse.json(
      { error: "Failed to fetch Trainings" },
      { status: 500 },
    );
  }
}

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();

    // Override tenantId and createdBy from auth context
    body.tenantId = context.tenantId;
    if (!body.createdBy) {
      body.createdBy = context.userId;
    }

    const validated = createTrainingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.format() },
        { status: 400 },
      );
    }

    const training = await trainingService.createTraining(validated.data);
    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error("Error creating Training:", error);
    return NextResponse.json(
      { error: "Failed to create Training" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.training",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.training",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

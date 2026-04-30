/**
 * ISO-IMS Risk API Route
 * Handles Risk assessment list and creation
 */

import { NextRequest, NextResponse } from "next/server";
import { riskService } from "@/lib/services/iso-ims/riskService";
import { z } from "zod";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

const createRiskSchema = z.object({
  tenantId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum([
    "QUALITY",
    "ENVIRONMENTAL",
    "SAFETY",
    "INFORMATION_SECURITY",
    "FINANCIAL",
    "OPERATIONAL",
    "REPUTATIONAL",
    "COMPLIANCE",
    "STRATEGIC",
  ]),
  owner: z.string().min(1),
  likelihood: z
    .number()
    .min(1)
    .max(5)
    .transform((val) => val as 1 | 2 | 3 | 4 | 5),
  impact: z
    .number()
    .min(1)
    .max(5)
    .transform((val) => val as 1 | 2 | 3 | 4 | 5),
  treatmentStrategy: z
    .enum(["AVOID", "MITIGATE", "TRANSFER", "ACCEPT"])
    .optional(),
  treatmentPlan: z.string().optional(),
  createdBy: z.string().min(1),
});

async function getHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const tenantId = context.tenantId;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await riskService.getRisks({
      tenantId,
      pagination: { page, pageSize },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Risks:", error);
    return NextResponse.json(
      { error: "Failed to fetch Risks" },
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

    const validated = createRiskSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.format() },
        { status: 400 },
      );
    }

    const risk = await riskService.createRisk(validated.data);
    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    console.error("Error creating Risk:", error);
    return NextResponse.json(
      { error: "Failed to create Risk" },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(getHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.risk",
  action: "read",
  requireAuth: true,
  rateLimit: true,
});

export const POST = withAPIGateway(postHandler, {
  moduleId: "iso-ims",
  featureId: "iso-ims.risk",
  action: "write",
  requireAuth: true,
  rateLimit: true,
});

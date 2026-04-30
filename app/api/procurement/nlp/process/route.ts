/**
 * NLP Processing API
 * POST /api/procurement/nlp/process
 */

import { NextRequest, NextResponse } from "next/server";
import { nlpService } from "@/lib/services/procurement/nlpService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { tenantId, text, type } = body;

    if (!tenantId || !text) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID and text are required",
        },
        { status: 400 },
      );
    }

    let result;
    if (type === "VOICE") {
      result = await nlpService.processVoiceRequisition(tenantId, text);
    } else {
      result = await nlpService.processNaturalLanguageRequisition(
        tenantId,
        text,
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error processing NLP:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process NLP",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "procurement",
  featureId: "procurement.nlp.process",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

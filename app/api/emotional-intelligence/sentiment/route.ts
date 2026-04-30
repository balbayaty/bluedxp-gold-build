/**
 * Emotional Intelligence - Sentiment Analysis API
 *
 * POST /api/emotional-intelligence/sentiment
 * Analyze sentiment from any text source
 *
 * PRODUCTION READY - Validated, multi-tenant, bulletproof error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { unifiedEmotionalIntelligenceService } from "@/lib/services/emotional-intelligence/unifiedEmotionalIntelligenceService";
import {
  SentimentAnalysisRequestSchema,
  sanitizeText,
} from "@/lib/services/emotional-intelligence/validation";
import { z } from "zod";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (request.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 },
      );
    }

    // Validate tenant context
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required", code: "TENANT_REQUIRED" },
        { status: 400 },
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON body", code: "INVALID_JSON" },
        { status: 400 },
      );
    }

    // Validate with Zod schema
    let validatedData;
    try {
      validatedData = SentimentAnalysisRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          },
          { status: 400 },
        );
      }
      throw error;
    }

    // Sanitize text
    const sanitizedText = sanitizeText(validatedData.text);

    // Analyze sentiment
    const sentiment =
      await unifiedEmotionalIntelligenceService.analyzeSentiment(
        sanitizedText,
        context.tenantId,
        {
          entityId: validatedData.entityId,
          entityType: validatedData.entityType,
          language: validatedData.language,
          includeCulturalContext: validatedData.includeCulturalContext,
        },
      );

    return NextResponse.json({
      success: true,
      data: sentiment,
    });
  } catch (error: any) {
    console.error("[Emotional Intelligence API] Error:", error);

    // Don't expose internal errors to users
    const errorMessage = error.message || "Failed to analyze sentiment";
    const isUserError =
      errorMessage.includes("required") ||
      errorMessage.includes("Invalid") ||
      errorMessage.includes("format");

    return NextResponse.json(
      {
        error: isUserError ? errorMessage : "Failed to analyze sentiment",
        code: isUserError ? "USER_ERROR" : "INTERNAL_ERROR",
        ...(process.env.NODE_ENV === "development" && {
          details: error.message,
        }),
      },
      { status: isUserError ? 400 : 500 },
    );
  }
}

export const POST = withAPIGateway(handler, {
  feature: "emotional-intelligence",
  action: "execute",
  description: "Analyze sentiment from text",
  requireAuth: true,
});

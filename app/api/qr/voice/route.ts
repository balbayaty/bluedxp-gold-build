/**
 * QR Voice Intelligence API
 * Voice-controlled QR operations
 */

import { NextRequest, NextResponse } from "next/server";
import { qrVoiceIntelligenceService } from "@/lib/services/qr/qrVoiceIntelligenceService";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";

async function postHandler(request: NextRequest, context: APIRequestContext) {
  try {
    const body = await request.json();
    const { action, command, audioInput, context: voiceContext } = body;

    if (action === "process-command") {
      const voiceCommand = await qrVoiceIntelligenceService.processVoiceCommand(
        command || audioInput,
        { language: body.language, context: voiceContext },
      );

      const response =
        await qrVoiceIntelligenceService.executeVoiceCommand(voiceCommand);

      return NextResponse.json({
        success: true,
        command: voiceCommand,
        response,
      });
    }

    if (action === "search") {
      const result = await qrVoiceIntelligenceService.naturalLanguageSearch(
        command,
        {
          tenantId: body.tenantId || context.tenantId,
          limit: body.limit,
        },
      );

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error in QR voice API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process voice command",
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(postHandler, {
  moduleId: "qr",
  featureId: "qr.voice",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

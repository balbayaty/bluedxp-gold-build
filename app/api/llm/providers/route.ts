/**
 * LLM Providers API
 * List and manage LLM providers
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { providerRegistry } from "@/lib/services/llm-provider/core/providerRegistry";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    if (request.method === "GET") {
      // List all providers
      const providers = providerRegistry.list();
      const stats = providerRegistry.getStats();

      return NextResponse.json({
        success: true,
        providers: providers.map((p) => ({
          id: p.id,
          name: p.name,
          version: p.version,
          description: p.description,
          category: p.category,
          tags: p.tags,
          capabilities: {
            streaming: p.supportsStreaming,
            functionCalling: p.supportsFunctionCalling,
            vision: p.supportsVision,
            audio: p.supportsAudio,
          },
          maxContextLength: p.maxContextLength,
          supportedModels: p.supportedModels,
          pricing: p.pricing,
          status: p.getStatus(),
        })),
        stats,
      });
    }

    if (request.method === "POST") {
      // Register a new provider (admin only)
      const body = await request.json();
      const { providerId, config } = body;

      if (!providerId) {
        return NextResponse.json(
          { error: "providerId is required" },
          { status: 400 },
        );
      }

      const provider = providerRegistry.get(providerId);
      if (!provider) {
        return NextResponse.json(
          { error: `Provider ${providerId} not found` },
          { status: 404 },
        );
      }

      // Initialize provider with config
      await providerRegistry.initializeProvider(
        providerId,
        config,
        context.tenantId,
      );

      return NextResponse.json({
        success: true,
        providerId,
        status: provider.getStatus(),
      });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("[LLM Providers API] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export const GET = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.llm",
  action: "read",
});

export const POST = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.llm",
  action: "create",
});

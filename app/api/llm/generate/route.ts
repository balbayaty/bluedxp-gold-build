/**
 * LLM Generate API
 * Generate text using any registered LLM provider
 */

import { NextRequest, NextResponse } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { providerRegistry } from "@/lib/services/llm-provider/core/providerRegistry";
import { llmMLModuleIntegration } from "@/lib/services/llm-provider/integration/mlModuleIntegration";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return NextResponse.json(
        { error: "Tenant context required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      provider,
      messages,
      model,
      temperature,
      maxTokens,
      stream,
      tools,
      toolChoice,
    } = body;

    if (!provider) {
      return NextResponse.json(
        { error: "provider is required" },
        { status: 400 },
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 },
      );
    }

    // Get provider
    const llmProvider = providerRegistry.get(provider);
    if (!llmProvider) {
      return NextResponse.json(
        {
          error: `Provider ${provider} not found. Available: ${providerRegistry
            .list()
            .map((p) => p.id)
            .join(", ")}`,
        },
        { status: 404 },
      );
    }

    // Check if provider is initialized
    const status = llmProvider.getStatus();
    if (status.status !== "online") {
      return NextResponse.json(
        {
          error: `Provider ${provider} is not online. Status: ${status.status}`,
        },
        { status: 503 },
      );
    }

    // Prepare request
    const llmRequest = {
      messages,
      model,
      temperature,
      maxTokens,
      stream: stream || false,
      tools,
      toolChoice,
    };

    // Handle streaming
    if (stream && llmProvider.supportsStreaming && llmProvider.stream) {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of llmProvider.stream!(llmRequest)) {
              const data = JSON.stringify(chunk) + "\n";
              controller.enqueue(new TextEncoder().encode(data));

              if (chunk.done) {
                controller.close();
                break;
              }
            }
          } catch (error: any) {
            controller.error(error);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming request
    const response = await llmProvider.generate(llmRequest);

    // Track usage for learning (async, don't wait)
    llmMLModuleIntegration
      .trackLLMUsage(
        `${provider}-${model || "default"}`,
        {
          messages,
          model: model || "default",
          provider,
        },
        response,
        {
          task: context.feature || "llm-generation",
          domain: context.tenantId,
          userId: context.userId,
          tenantId: context.tenantId,
        },
      )
      .catch((error) => {
        console.warn("[LLM Generate] Failed to track usage:", error);
      });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error: any) {
    console.error("[LLM Generate API] Error:", error);
    return NextResponse.json(
      {
        error: "Generation failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export const POST = withAPIGateway(handler, {
  feature: "llm",
  action: "execute",
  description: "Generate text with LLM",
});

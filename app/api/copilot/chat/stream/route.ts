/**
 * Copilot Chat Streaming API
 * Streams AI responses in real-time
 */

import { NextRequest } from "next/server";
import { withAPIGateway } from "@/middleware/apiGateway";
import type { APIRequestContext } from "@/middleware/apiPermissions";
import { copilotService } from "@/lib/services/copilot/copilotService";
import type { CopilotRequest } from "@/lib/services/copilot/copilotService";

async function handler(request: NextRequest, context: APIRequestContext) {
  try {
    if (!context.tenantId) {
      return new Response(
        JSON.stringify({ error: "Tenant context required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!context.userId) {
      return new Response(
        JSON.stringify({ error: "User authentication required" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await request.json().catch(() => ({}));
    const copilotRequest: CopilotRequest = {
      conversationId: body.conversationId,
      message: body.message || "",
      context: body.context,
      options: {
        ...body.options,
        useRAG: body.options?.useRAG !== false,
        useMemory: body.options?.useMemory !== false,
        useTools: body.options?.useTools !== false,
      },
    };

    if (!copilotRequest.message.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Import streaming service
    const { streamCopilotResponse } =
      await import("@/lib/services/copilot/streamingService");

    // Create a readable stream with real AI streaming
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream real AI response with RAG and memory
          for await (const chunk of streamCopilotResponse(
            context.tenantId,
            context.userId,
            copilotRequest,
          )) {
            const data = JSON.stringify(chunk) + "\n";
            controller.enqueue(new TextEncoder().encode(data));

            if (chunk.done) {
              controller.close();
              break;
            }
          }
        } catch (error) {
          const errorData =
            JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "Unknown error",
              done: true,
            }) + "\n";

          controller.enqueue(new TextEncoder().encode(errorData));
          controller.close();
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
  } catch (error) {
    console.error("[Copilot Streaming API] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process streaming request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export const POST = withAPIGateway(handler, {
  moduleId: "ai",
  featureId: "ai.copilot",
  action: "execute",
  requireAuth: true,
  rateLimit: true,
});

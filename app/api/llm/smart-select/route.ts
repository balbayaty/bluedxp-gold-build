/**
 * Smart Provider Selection API
 * Automatically selects best provider based on task, data sensitivity, etc.
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

    if (request.method === "POST") {
      const body = await request.json();
      const {
        messages,
        model,
        dataSensitivity,
        taskType,
        requiredCapabilities,
      } = body;

      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json(
          { error: "messages array is required" },
          { status: 400 },
        );
      }

      // Smart provider selection
      let selectedProvider: string;
      let selectedModel: string;

      // 1. Check data sensitivity (highest priority)
      if (dataSensitivity === "high" || dataSensitivity === "sensitive") {
        // Must use local for sensitive data
        const ollama = providerRegistry.get("ollama");
        if (ollama && ollama.getStatus().status === "online") {
          selectedProvider = "ollama";
          selectedModel = model || "llama2";
        } else {
          return NextResponse.json(
            {
              error:
                "Local LLM required for sensitive data but Ollama is not available",
            },
            { status: 503 },
          );
        }
      }
      // 2. Check required capabilities
      else if (
        requiredCapabilities?.includes("vision") ||
        requiredCapabilities?.includes("image")
      ) {
        // Use OpenAI for vision
        const openai = providerRegistry.get("openai");
        if (
          openai &&
          openai.supportsVision &&
          openai.getStatus().status === "online"
        ) {
          selectedProvider = "openai";
          selectedModel = model || "gpt-4o";
        } else {
          // Fallback to Anthropic if supports vision
          const anthropic = providerRegistry.get("anthropic");
          if (anthropic && anthropic.supportsVision) {
            selectedProvider = "anthropic";
            selectedModel = model || "claude-3-5-sonnet-20241022";
          } else {
            return NextResponse.json(
              { error: "No provider available with vision support" },
              { status: 503 },
            );
          }
        }
      }
      // 3. Check task type
      else if (
        taskType === "analysis" ||
        taskType === "reasoning" ||
        taskType === "complex"
      ) {
        // Use Anthropic for analysis
        const anthropic = providerRegistry.get("anthropic");
        if (anthropic && anthropic.getStatus().status === "online") {
          selectedProvider = "anthropic";
          selectedModel = model || "claude-3-5-sonnet-20241022";
        } else {
          // Fallback to OpenAI
          const openai = providerRegistry.get("openai");
          if (openai && openai.getStatus().status === "online") {
            selectedProvider = "openai";
            selectedModel = model || "gpt-4o";
          } else {
            // Fallback to local
            selectedProvider = "ollama";
            selectedModel = model || "llama2";
          }
        }
      }
      // 4. Default: Try providers in order of preference
      else {
        const providers = [
          { id: "ollama", model: "llama2" }, // Prefer local (cost savings)
          { id: "openai", model: "gpt-4o" }, // Then OpenAI
          { id: "anthropic", model: "claude-3-5-sonnet-20241022" }, // Then Anthropic
        ];

        let providerFound = false;
        for (const provider of providers) {
          const llmProvider = providerRegistry.get(provider.id);
          if (llmProvider && llmProvider.getStatus().status === "online") {
            selectedProvider = provider.id;
            selectedModel = model || provider.model;
            providerFound = true;
            break;
          }
        }

        if (!providerFound) {
          return NextResponse.json(
            { error: "No LLM providers available" },
            { status: 503 },
          );
        }
      }

      // Generate with selected provider
      const llmProvider = providerRegistry.get(selectedProvider);
      if (!llmProvider) {
        return NextResponse.json(
          { error: `Provider ${selectedProvider} not found` },
          { status: 404 },
        );
      }

      const response = await llmProvider.generate({
        messages,
        model: selectedModel,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
      });

      return NextResponse.json({
        success: true,
        provider: selectedProvider,
        model: selectedModel,
        selectionReason: getSelectionReason(
          dataSensitivity,
          taskType,
          requiredCapabilities,
        ),
        ...response,
      });
    }

    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (error: any) {
    console.error("[Smart Select API] Error:", error);
    return NextResponse.json(
      {
        error: "Generation failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

function getSelectionReason(
  dataSensitivity?: string,
  taskType?: string,
  requiredCapabilities?: string[],
): string {
  if (dataSensitivity === "high" || dataSensitivity === "sensitive") {
    return "Selected Ollama (local) for data sovereignty and compliance";
  }
  if (requiredCapabilities?.includes("vision")) {
    return "Selected OpenAI for vision capabilities";
  }
  if (taskType === "analysis" || taskType === "reasoning") {
    return "Selected Anthropic for superior analysis capabilities";
  }
  return "Selected based on availability and performance";
}

export const POST = withAPIGateway(handler, {
  feature: "llm",
  action: "execute",
  description: "Smart provider selection based on context",
});

/**
 * Mistral AI Provider
 * Example implementation showing how easy it is to add a new provider
 *
 * To add this provider, just:
 * 1. Create this file
 * 2. Register it: providerRegistry.register(new MistralProvider())
 * That's it! No other code changes needed.
 */

import { BaseLLMProvider } from "../base/BaseLLMProvider";
import type {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
} from "../../../core/providerInterface";

export class MistralProvider extends BaseLLMProvider {
  // ============================================================================
  // METADATA
  // ============================================================================

  id = "mistral";
  name = "Mistral AI";
  version = "1.0.0";
  description = "Mistral AI provides high-performance language models";
  website = "https://mistral.ai";
  documentation = "https://docs.mistral.ai";
  category = "text";
  tags = ["mistral", "open-source", "european"];

  // ============================================================================
  // CAPABILITIES
  // ============================================================================

  supportsStreaming = true;
  supportsFunctionCalling = true;
  supportsVision = false;
  supportsAudio = false;
  maxContextLength = 32000;

  supportedModels = [
    "mistral-large-latest",
    "mistral-medium-latest",
    "mistral-small-latest",
    "mistral-tiny",
    "mixtral-8x7b",
    "mixtral-8x22b",
  ];

  pricing = {
    type: "per-token" as const,
    promptCost: 2.7, // $2.70 per 1M prompt tokens (mistral-large)
    completionCost: 8.1, // $8.10 per 1M completion tokens
  };

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  requiredConfig = {
    type: "object" as const,
    properties: {
      apiKey: {
        type: "string" as const,
        description: "Mistral API key",
        required: true,
        secret: true,
      },
    },
    required: ["apiKey"],
  };

  optionalConfig = {
    type: "object" as const,
    properties: {
      baseUrl: {
        type: "string" as const,
        description: "Custom API base URL",
        default: "https://api.mistral.ai/v1",
      },
      timeout: {
        type: "number" as const,
        description: "Request timeout in milliseconds",
        default: 30000,
      },
    },
  };

  // ============================================================================
  // IMPLEMENTATION
  // ============================================================================

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.config) {
      throw new Error("Provider not initialized");
    }

    const startTime = Date.now();
    const apiKey = this.config.apiKey;
    const baseUrl = this.config.baseUrl || "https://api.mistral.ai/v1";
    const model = request.model || "mistral-large-latest";

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          tools: request.tools,
          tool_choice: request.toolChoice,
        }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: { message: response.statusText } }));
        throw new Error(
          error.error?.message || `Mistral API error: ${response.statusText}`,
        );
      }

      const data = await response.json();
      const choice = data.choices[0];
      const tokensUsed = {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      };

      const latency = Date.now() - startTime;
      const cost = this.calculateCost(tokensUsed);

      this.updateStatusAfterRequest(tokensUsed, cost, latency);

      return {
        content: choice.message.content || "",
        model: data.model,
        provider: this.id,
        tokensUsed,
        finishReason: choice.finish_reason,
        toolCalls: choice.message.tool_calls?.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })),
        cost,
        latency,
      };
    } catch (error: any) {
      this.status.status = "error";
      this.status.errorRate = (this.status.errorRate || 0) * 0.9 + 0.1; // Exponential moving average
      throw error;
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    if (!this.config) {
      throw new Error("Provider not initialized");
    }

    const apiKey = this.config.apiKey;
    const baseUrl = this.config.baseUrl || "https://api.mistral.ai/v1";
    const model = request.model || "mistral-large-latest";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body");
    }

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        yield { content: "", done: true, model, provider: this.id };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            yield { content: "", done: true, model, provider: this.id };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta;
            if (delta?.content) {
              yield {
                content: delta.content,
                done: false,
                model,
                provider: this.id,
              };
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }

  protected async testConnection(): Promise<void> {
    // Optional: Implement a lightweight health check
    // For now, we'll just mark as online if initialized
    this.status.status = "online";
  }
}

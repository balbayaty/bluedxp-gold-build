/**
 * Anthropic Provider Implementation
 * Extends BaseLLMProvider for Anthropic Claude models
 */

import { BaseLLMProvider } from "../base/BaseLLMProvider";
import type {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
} from "../../../core/providerInterface";

export class AnthropicProvider extends BaseLLMProvider {
  id = "anthropic";
  name = "Anthropic Claude";
  version = "1.0.0";
  description = "Anthropic Claude models (Claude 3 Opus, Sonnet, Haiku)";
  website = "https://anthropic.com";
  documentation = "https://docs.anthropic.com";
  category = "text";
  tags = ["anthropic", "claude", "claude-3"];

  supportsStreaming = true;
  supportsFunctionCalling = true;
  supportsVision = true;
  supportsAudio = false;
  maxContextLength = 200000;

  supportedModels = [
    "claude-3-5-sonnet-20241022",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
  ];

  pricing = {
    type: "per-token" as const,
    promptCost: 3.0, // $3.00 per 1M prompt tokens (claude-3-opus)
    completionCost: 15.0, // $15.00 per 1M completion tokens
  };

  requiredConfig = {
    type: "object" as const,
    properties: {
      apiKey: {
        type: "string" as const,
        description: "Anthropic API key",
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
        default: "https://api.anthropic.com/v1",
      },
      timeout: {
        type: "number" as const,
        description: "Request timeout in milliseconds",
        default: 30000,
      },
    },
  };

  async generate(request: LLMRequest): Promise<LLMResponse> {
    if (!this.config) {
      throw new Error("Provider not initialized");
    }

    const startTime = Date.now();
    const apiKey = this.config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const baseUrl = this.config.baseUrl || "https://api.anthropic.com/v1";
    const model = request.model || "claude-3-5-sonnet-20241022";

    // Separate system message from conversation
    const systemMessage = request.messages.find((m) => m.role === "system");
    const conversationMessages = request.messages.filter(
      (m) => m.role !== "system",
    );

    try {
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          messages: conversationMessages,
          system: systemMessage?.content,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4096,
          tools: request.tools,
        }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: { message: response.statusText } }));
        throw new Error(
          error.error?.message || `Anthropic API error: ${response.statusText}`,
        );
      }

      const data = await response.json();
      const tokensUsed = {
        prompt: data.usage?.input_tokens || 0,
        completion: data.usage?.output_tokens || 0,
        total:
          (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      };

      const latency = Date.now() - startTime;
      const cost = this.calculateCost(tokensUsed);

      this.updateStatusAfterRequest(tokensUsed, cost, latency);

      return {
        content: data.content[0]?.text || "",
        model: data.model,
        provider: this.id,
        tokensUsed,
        finishReason: data.stop_reason,
        toolCalls: data.content
          .filter((c: any) => c.type === "tool_use")
          .map((tc: any) => ({
            id: tc.id,
            name: tc.name,
            arguments: tc.input,
          })),
        cost,
        latency,
      };
    } catch (error: any) {
      this.status.status = "error";
      this.status.errorRate = (this.status.errorRate || 0) * 0.9 + 0.1;
      throw error;
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    if (!this.config) {
      throw new Error("Provider not initialized");
    }

    const apiKey = this.config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const baseUrl = this.config.baseUrl || "https://api.anthropic.com/v1";
    const model = request.model || "claude-3-5-sonnet-20241022";

    const systemMessage = request.messages.find((m) => m.role === "system");
    const conversationMessages = request.messages.filter(
      (m) => m.role !== "system",
    );

    const response = await fetch(`${baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        messages: conversationMessages,
        system: systemMessage?.content,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
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
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              yield {
                content: parsed.delta.text,
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
}

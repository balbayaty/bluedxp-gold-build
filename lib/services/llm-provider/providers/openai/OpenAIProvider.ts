/**
 * OpenAI Provider Implementation
 * Extends BaseLLMProvider for OpenAI GPT models
 */

import { BaseLLMProvider } from "../base/BaseLLMProvider";
import type {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
} from "../../../core/providerInterface";

export class OpenAIProvider extends BaseLLMProvider {
  id = "openai";
  name = "OpenAI";
  version = "1.0.0";
  description = "OpenAI GPT models (GPT-4, GPT-3.5, GPT-4o)";
  website = "https://openai.com";
  documentation = "https://platform.openai.com/docs";
  category = "text";
  tags = ["openai", "gpt", "gpt-4", "gpt-3.5"];

  supportsStreaming = true;
  supportsFunctionCalling = true;
  supportsVision = true;
  supportsAudio = false;
  maxContextLength = 128000;

  supportedModels = [
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "gpt-4-vision-preview",
  ];

  pricing = {
    type: "per-token" as const,
    promptCost: 2.5, // $2.50 per 1M prompt tokens (gpt-4o)
    completionCost: 10.0, // $10.00 per 1M completion tokens
  };

  requiredConfig = {
    type: "object" as const,
    properties: {
      apiKey: {
        type: "string" as const,
        description: "OpenAI API key",
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
        default: "https://api.openai.com/v1",
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
    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const baseUrl = this.config.baseUrl || "https://api.openai.com/v1";
    const model = request.model || "gpt-4o";

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
          error.error?.message || `OpenAI API error: ${response.statusText}`,
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
      this.status.errorRate = (this.status.errorRate || 0) * 0.9 + 0.1;
      throw error;
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    if (!this.config) {
      throw new Error("Provider not initialized");
    }

    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const baseUrl = this.config.baseUrl || "https://api.openai.com/v1";
    const model = request.model || "gpt-4o";

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
      throw new Error(`OpenAI API error: ${response.statusText}`);
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
}

/**
 * Ollama Local LLM Provider
 * Runs LLMs locally on your infrastructure
 *
 * Benefits:
 * - Data sovereignty (data never leaves your servers)
 * - Zero API costs
 * - No rate limits
 * - Full control
 * - Privacy compliance (GDPR, etc.)
 *
 * Requirements:
 * - Ollama installed and running
 * - Sufficient GPU/CPU resources
 * - Models downloaded (llama2, mistral, etc.)
 */

import { BaseLLMProvider } from "../base/BaseLLMProvider";
import type {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
} from "../../../core/providerInterface";

export class OllamaProvider extends BaseLLMProvider {
  id = "ollama";
  name = "Ollama (Local)";
  version = "1.0.0";
  description = "Local LLM via Ollama - Run models on your infrastructure";
  website = "https://ollama.ai";
  documentation = "https://github.com/ollama/ollama";
  category = "local";
  tags = ["ollama", "local", "open-source", "privacy", "data-sovereignty"];

  supportsStreaming = true;
  supportsFunctionCalling = false; // Ollama supports tools but needs custom implementation
  supportsVision = true; // Some models support vision
  supportsAudio = false;
  maxContextLength = 4096; // Depends on model

  supportedModels = [
    "llama2",
    "llama2:13b",
    "llama2:70b",
    "mistral",
    "codellama",
    "neural-chat",
    "starling-lm",
    "llama2-uncensored",
    "vicuna",
    "orca-mini",
    "wizardcoder",
    "nous-hermes",
    "phind-codellama",
    "falcon",
    "wizard-vicuna",
  ];

  pricing = {
    type: "free" as const, // No API costs, only infrastructure
  };

  requiredConfig = {
    type: "object" as const,
    properties: {
      baseUrl: {
        type: "string" as const,
        description: "Ollama API base URL",
        default: "http://localhost:11434",
        required: false,
      },
    },
    required: [],
  };

  optionalConfig = {
    type: "object" as const,
    properties: {
      timeout: {
        type: "number" as const,
        description: "Request timeout in milliseconds",
        default: 60000, // Longer timeout for local inference
      },
      keepAlive: {
        type: "string" as const,
        description: 'Keep model in memory (e.g., "5m", "1h")',
        default: "5m",
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
    const baseUrl = this.config.baseUrl || "http://localhost:11434";
    const model = request.model || "llama2";

    try {
      // Check if Ollama is running
      await this.healthCheck();

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: this.formatMessages(request.messages),
          stream: false,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.maxTokens,
            keep_alive: this.config.keepAlive || "5m",
          },
        }),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: response.statusText }));
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Ollama returns tokens used
      const tokensUsed = {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0,
        total: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      };

      const latency = Date.now() - startTime;

      this.updateStatusAfterRequest(tokensUsed, 0, latency); // No cost for local

      return {
        content: data.response || "",
        model: data.model || model,
        provider: this.id,
        tokensUsed,
        finishReason: data.done ? "stop" : "length",
        cost: 0, // Free!
        latency,
      };
    } catch (error: any) {
      this.status.status = "error";
      this.status.errorRate = (this.status.errorRate || 0) * 0.9 + 0.1;

      // Provide helpful error messages
      if (
        error.message?.includes("ECONNREFUSED") ||
        error.message?.includes("fetch failed")
      ) {
        throw new Error(
          "Ollama is not running. Please start Ollama:\n" +
            "1. Install: https://ollama.ai\n" +
            "2. Run: ollama serve\n" +
            "3. Pull a model: ollama pull llama2",
        );
      }

      throw error;
    }
  }

  async *stream(request: LLMRequest): AsyncGenerator<LLMStreamChunk> {
    if (!this.config) {
      throw new Error("Provider not initialized");
    }

    const baseUrl = this.config.baseUrl || "http://localhost:11434";
    const model = request.model || "llama2";

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: this.formatMessages(request.messages),
        stream: true,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens,
          keep_alive: this.config.keepAlive || "5m",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("No response body");
    }

    let buffer = "";
    let done = false;

    while (!done) {
      const { done: streamDone, value } = await reader.read();

      if (streamDone) {
        done = true;
        yield { content: "", done: true, model, provider: this.id };
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              yield {
                content: parsed.response,
                done: false,
                model: parsed.model || model,
                provider: this.id,
              };
            }
            if (parsed.done) {
              done = true;
              yield { content: "", done: true, model, provider: this.id };
              return;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }

  protected async testConnection(): Promise<void> {
    const baseUrl = this.config?.baseUrl || "http://localhost:11434";

    try {
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Ollama not responding");
      }

      const data = await response.json();
      const models = data.models || [];

      if (models.length === 0) {
        console.warn(
          "[Ollama] No models found. Pull a model: ollama pull llama2",
        );
      }

      this.status.status = "online";
    } catch (error) {
      this.status.status = "offline";
      throw new Error(
        "Ollama connection failed. Make sure Ollama is running:\n" +
          "1. Install: https://ollama.ai\n" +
          "2. Run: ollama serve\n" +
          "3. Check: curl http://localhost:11434/api/tags",
      );
    }
  }

  async healthCheck(): Promise<any> {
    return this.testConnection();
  }

  /**
   * Format messages for Ollama (simple prompt format)
   */
  private formatMessages(messages: any[]): string {
    return messages
      .map((msg) => {
        if (msg.role === "system") {
          return `System: ${msg.content}`;
        }
        if (msg.role === "user") {
          return `User: ${msg.content}`;
        }
        if (msg.role === "assistant") {
          return `Assistant: ${msg.content}`;
        }
        return msg.content;
      })
      .join("\n\n");
  }

  /**
   * List available models in Ollama
   */
  async listModels(): Promise<string[]> {
    const baseUrl = this.config?.baseUrl || "http://localhost:11434";

    try {
      const response = await fetch(`${baseUrl}/api/tags`);
      const data = await response.json();
      return (data.models || []).map((m: any) => m.name);
    } catch (error) {
      return [];
    }
  }
}

/**
 * Multi-LLM Provider Service
 * Vendor-neutral LLM abstraction with automatic fallback and retry
 */

import {
  LLMProvider,
  LLMModel,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMProviderConfig,
  LLMProviderStatus,
  LLMFallbackStrategy,
} from "./types";
import { eventBus } from "@/lib/services/event-bus";
import { evidenceService } from "@/lib/services/evidence";

class MultiLLMProviderService {
  private providers: Map<LLMProvider, LLMProviderConfig> = new Map();
  private status: Map<LLMProvider, LLMProviderStatus> = new Map();
  private defaultStrategy: LLMFallbackStrategy = {
    primary: "auto",
    fallbacks: ["openai", "anthropic"],
    retryOnError: true,
    retryOnRateLimit: true,
    maxRetries: 3,
  };

  /**
   * Register LLM provider
   */
  async registerProvider(config: LLMProviderConfig): Promise<void> {
    this.providers.set(config.provider, config);
    this.status.set(config.provider, {
      provider: config.provider,
      status: "online",
    });

    await eventBus.publish("llm.provider.registered", {
      provider: config.provider,
      timestamp: new Date(),
    });
  }

  /**
   * Get provider status
   */
  getProviderStatus(provider: LLMProvider): LLMProviderStatus | undefined {
    return this.status.get(provider);
  }

  /**
   * Generate text using LLM with automatic fallback
   */
  async generate(
    request: LLMRequest,
    strategy?: Partial<LLMFallbackStrategy>,
  ): Promise<LLMResponse> {
    const fallbackStrategy = { ...this.defaultStrategy, ...strategy };
    const providers = this.getProviderSequence(fallbackStrategy);

    let lastError: Error | null = null;

    for (const provider of providers) {
      try {
        const response = await this.generateWithProvider(provider, request);

        // Update status
        this.updateProviderStatus(provider, "online", Date.now());

        // Log evidence
        await evidenceService.logAction({
          tenantId: "default", // TODO: Get from context
          actor: "system",
          action: "llm.generate",
          entityType: "llm-request",
          entityId: `req-${Date.now()}`,
          metadata: {
            provider,
            model: response.model,
            tokensUsed: response.tokensUsed,
          },
        });

        return response;
      } catch (error: any) {
        lastError = error;

        // Update status
        this.updateProviderStatus(provider, "error");

        // Check if we should retry
        if (
          (error.message?.includes("rate limit") &&
            fallbackStrategy.retryOnRateLimit) ||
          (error.message && fallbackStrategy.retryOnError)
        ) {
          // Continue to next provider
          continue;
        }

        // If not retryable, throw
        throw error;
      }
    }

    // All providers failed
    throw new Error(
      `All LLM providers failed. Last error: ${lastError?.message}`,
    );
  }

  /**
   * Generate with specific provider
   */
  private async generateWithProvider(
    provider: LLMProvider,
    request: LLMRequest,
  ): Promise<LLMResponse> {
    const config = this.providers.get(provider);
    if (!config || !config.enabled) {
      throw new Error(`Provider ${provider} is not configured or enabled`);
    }

    const startTime = Date.now();

    try {
      let response: LLMResponse;

      switch (provider) {
        case "openai":
          response = await this.generateOpenAI(request, config);
          break;
        case "anthropic":
          response = await this.generateAnthropic(request, config);
          break;
        case "google":
          response = await this.generateGoogle(request, config);
          break;
        case "local":
          response = await this.generateLocal(request, config);
          break;
        case "auto":
          // Try providers in order
          const autoProviders: LLMProvider[] = [
            "openai",
            "anthropic",
            "google",
          ];
          for (const p of autoProviders) {
            try {
              return await this.generateWithProvider(p, request);
            } catch (e) {
              continue;
            }
          }
          throw new Error("No auto provider available");
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      const latency = Date.now() - startTime;
      this.updateProviderStatus(provider, "online", latency);

      return response;
    } catch (error: any) {
      this.updateProviderStatus(provider, "error");
      throw error;
    }
  }

  /**
   * Generate with OpenAI
   */
  private async generateOpenAI(
    request: LLMRequest,
    config: LLMProviderConfig,
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const model = request.model || config.defaultModel || "gpt-4";
    const url = config.baseUrl || "https://api.openai.com/v1/chat/completions";

    const response = await fetch(url, {
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
      const error = await response.json();
      throw new Error(
        error.error?.message || `OpenAI API error: ${response.statusText}`,
      );
    }

    const data = await response.json();
    const choice = data.choices[0];

    return {
      content: choice.message.content || "",
      model: data.model,
      provider: "openai",
      tokensUsed: {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      },
      finishReason: choice.finish_reason,
      toolCalls: choice.message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
    };
  }

  /**
   * Generate with Anthropic
   */
  private async generateAnthropic(
    request: LLMRequest,
    config: LLMProviderConfig,
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key not configured");
    }

    const model = request.model || config.defaultModel || "claude-3-5-sonnet";
    const url = config.baseUrl || "https://api.anthropic.com/v1/messages";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || `Anthropic API error: ${response.statusText}`,
      );
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      model: data.model,
      provider: "anthropic",
      tokensUsed: {
        prompt: data.usage.input_tokens,
        completion: data.usage.output_tokens,
        total: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason: data.stop_reason,
    };
  }

  /**
   * Generate with Google Gemini
   */
  private async generateGoogle(
    request: LLMRequest,
    config: LLMProviderConfig,
  ): Promise<LLMResponse> {
    const apiKey = config.apiKey || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Google AI API key not configured");
    }

    const model = request.model || "gemini-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              ...(request.systemPrompt
                ? [{ text: `System: ${request.systemPrompt}\n\n` }]
                : []),
              { text: request.prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 2048,
          topP: request.topP,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH",
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      content,
      model,
      provider: "google",
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      },
      finishReason: data.candidates?.[0]?.finishReason || "STOP",
    };
  }

  /**
   * Generate with local LLM (Ollama)
   */
  private async generateLocal(
    request: LLMRequest,
    config: LLMProviderConfig,
  ): Promise<LLMResponse> {
    const baseUrl =
      config.baseUrl || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const model = request.model || "llama2";

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: request.systemPrompt
          ? `${request.systemPrompt}\n\n${request.prompt}`
          : request.prompt,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 2048,
          top_p: request.topP,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.response || "",
      model,
      provider: "local",
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      finishReason: data.done ? "stop" : "length",
    };
  }

  /**
   * Get provider sequence for fallback
   */
  private getProviderSequence(strategy: LLMFallbackStrategy): LLMProvider[] {
    if (strategy.primary === "auto") {
      return strategy.fallbacks;
    }
    return [strategy.primary, ...strategy.fallbacks];
  }

  /**
   * Update provider status
   */
  private updateProviderStatus(
    provider: LLMProvider,
    status: "online" | "offline" | "error",
    latency?: number,
  ): void {
    const current = this.status.get(provider) || {
      provider,
      status: "offline",
    };

    this.status.set(provider, {
      ...current,
      status,
      latency,
      lastUsed: new Date(),
    });
  }

  /**
   * Stream generation (for real-time responses)
   * Implements Server-Sent Events style streaming
   */
  async *stream(
    request: LLMRequest,
    strategy?: Partial<LLMFallbackStrategy>,
  ): AsyncGenerator<LLMStreamChunk> {
    const mergedStrategy = { ...this.defaultStrategy, ...strategy };
    const providers = this.getProviderSequence(mergedStrategy);

    for (const provider of providers) {
      try {
        const config = this.configs.get(provider);
        if (!config?.enabled) continue;

        // Try streaming with the provider
        yield* this.streamWithProvider(request, provider, config);
        return;
      } catch (error) {
        console.warn(`Streaming failed for ${provider}:`, error);
        continue;
      }
    }

    // Fallback: return full response as single chunk
    const response = await this.generate(request, strategy);
    yield {
      content: response.content,
      done: true,
      model: response.model,
      provider: response.provider,
    };
  }

  /**
   * Stream with a specific provider
   */
  private async *streamWithProvider(
    request: LLMRequest,
    provider: LLMProvider,
    config: LLMProviderConfig,
  ): AsyncGenerator<LLMStreamChunk> {
    const model = request.model || config.defaultModel || "gpt-4";

    if (provider === "openai") {
      const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OpenAI API key not configured");

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              ...(request.systemPrompt
                ? [{ role: "system", content: request.systemPrompt }]
                : []),
              { role: "user", content: request.prompt },
            ],
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 2048,
            stream: true,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI streaming error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const data = JSON.parse(line.substring(6));
              const content = data.choices?.[0]?.delta?.content || "";
              const isDone = data.choices?.[0]?.finish_reason === "stop";

              if (content || isDone) {
                yield {
                  content,
                  done: isDone,
                  model,
                  provider,
                };
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } else if (provider === "local") {
      // Ollama streaming
      const baseUrl = config.baseUrl || "http://localhost:11434";

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "llama2",
          prompt: request.systemPrompt
            ? `${request.systemPrompt}\n\n${request.prompt}`
            : request.prompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama streaming error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter((l) => l.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            yield {
              content: data.response || "",
              done: data.done || false,
              model: model || "llama2",
              provider,
            };
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    } else {
      // Fallback for providers without streaming support
      const response = await this.generate(request, {
        primary: provider,
        fallbacks: [],
      });
      yield {
        content: response.content,
        done: true,
        model: response.model,
        provider: response.provider,
      };
    }
  }
}

export const multiLLMProviderService = new MultiLLMProviderService();

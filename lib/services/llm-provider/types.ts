/**
 * Multi-LLM Provider Interface - Type Definitions
 * Vendor-neutral LLM abstraction with fallback/retry
 */

export type LLMProvider = "openai" | "anthropic" | "google" | "local" | "auto";

export type LLMModel =
  | "gpt-4"
  | "gpt-4-turbo"
  | "gpt-3.5-turbo"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "claude-3-haiku"
  | "claude-3-5-sonnet"
  | "gemini-pro"
  | "gemini-ultra"
  | "local-llama"
  | "local-mistral";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: LLMModel;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: LLMTool[];
  toolChoice?:
    | "auto"
    | "none"
    | { type: "function"; function: { name: string } };
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason?: "stop" | "length" | "tool_calls" | "error";
  toolCalls?: LLMToolCall[];
  metadata?: Record<string, any>;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
  model?: string;
  provider?: LLMProvider;
}

export interface LLMTool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface LLMProviderConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: LLMModel;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
}

export interface LLMProviderStatus {
  provider: LLMProvider;
  status: "online" | "offline" | "error";
  latency?: number;
  lastUsed?: Date;
  errorRate?: number;
  costPerToken?: {
    prompt: number;
    completion: number;
  };
}

export interface LLMFallbackStrategy {
  primary: LLMProvider;
  fallbacks: LLMProvider[];
  retryOnError: boolean;
  retryOnRateLimit: boolean;
  maxRetries: number;
}

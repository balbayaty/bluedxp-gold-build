/**
 * LLM Provider Interface
 * Base interface that ALL LLM providers must implement
 * This enables unlimited provider support with zero code changes to core system
 */

export interface ILLMProvider {
  // ============================================================================
  // METADATA
  // ============================================================================

  /** Unique provider identifier (e.g., 'openai', 'mistral', 'custom-provider') */
  id: string;

  /** Human-readable provider name */
  name: string;

  /** Provider version */
  version: string;

  /** Provider description */
  description?: string;

  /** Provider website */
  website?: string;

  /** Provider documentation URL */
  documentation?: string;

  /** Provider category */
  category?: "text" | "vision" | "audio" | "multimodal" | "local" | "custom";

  /** Provider tags for search */
  tags?: string[];

  // ============================================================================
  // CAPABILITIES
  // ============================================================================

  /** Supports streaming responses */
  supportsStreaming: boolean;

  /** Supports function/tool calling */
  supportsFunctionCalling: boolean;

  /** Supports vision/image inputs */
  supportsVision: boolean;

  /** Supports audio inputs/outputs */
  supportsAudio: boolean;

  /** Maximum context length (tokens) */
  maxContextLength: number;

  /** List of supported models */
  supportedModels: string[];

  /** Pricing model */
  pricing?: {
    type: "per-token" | "per-request" | "subscription" | "free";
    promptCost?: number; // Cost per 1M prompt tokens
    completionCost?: number; // Cost per 1M completion tokens
  };

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /** Required configuration fields */
  requiredConfig: ProviderConfigSchema;

  /** Optional configuration fields */
  optionalConfig?: ProviderConfigSchema;

  // ============================================================================
  // METHODS
  // ============================================================================

  /**
   * Initialize provider with configuration
   */
  initialize(config: ProviderConfig, tenantId?: string): Promise<void>;

  /**
   * Generate text completion
   */
  generate(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Stream text completion
   */
  stream?(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;

  /**
   * Validate configuration
   */
  validateConfig(config: ProviderConfig): ValidationResult;

  /**
   * Health check
   */
  healthCheck?(): Promise<ProviderHealth>;

  /**
   * Get current status
   */
  getStatus(): ProviderStatus;

  /**
   * Cleanup resources
   */
  cleanup?(): Promise<void>;
}

// ============================================================================
// TYPES
// ============================================================================

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  [key: string]: any; // Allow custom config fields
}

export interface ProviderConfigSchema {
  type: "object";
  properties: Record<
    string,
    {
      type: "string" | "number" | "boolean" | "object" | "array";
      description?: string;
      required?: boolean;
      default?: any;
      secret?: boolean; // If true, will be encrypted
    }
  >;
  required?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ProviderHealth {
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  errorRate?: number;
  lastChecked?: Date;
  details?: Record<string, any>;
}

export interface ProviderStatus {
  status: "online" | "offline" | "error" | "initializing";
  latency?: number;
  lastUsed?: Date;
  errorRate?: number;
  totalRequests?: number;
  totalTokens?: number;
  totalCost?: number;
}

export interface LLMRequest {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: LLMTool[];
  toolChoice?:
    | "auto"
    | "none"
    | { type: "function"; function: { name: string } };
  metadata?: Record<string, any>;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content:
    | string
    | Array<{
        type: "text" | "image_url";
        text?: string;
        image_url?: { url: string };
      }>;
  name?: string;
  toolCallId?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason?: "stop" | "length" | "tool_calls" | "error" | "content_filter";
  toolCalls?: LLMToolCall[];
  metadata?: Record<string, any>;
  cost?: number;
  latency?: number;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
  model?: string;
  provider?: string;
  finishReason?: string;
  toolCalls?: LLMToolCall[];
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

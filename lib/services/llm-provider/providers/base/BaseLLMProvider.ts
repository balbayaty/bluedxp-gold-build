/**
 * Base LLM Provider
 * Abstract base class that all providers should extend
 * Provides common functionality and reduces boilerplate
 */

import type {
  ILLMProvider,
  ProviderConfig,
  ValidationResult,
  ProviderHealth,
  ProviderStatus,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
} from "../../core/providerInterface";

export abstract class BaseLLMProvider implements ILLMProvider {
  // ============================================================================
  // METADATA (Must be defined by subclasses)
  // ============================================================================

  abstract id: string;
  abstract name: string;
  abstract version: string;
  abstract description?: string;
  abstract website?: string;
  abstract documentation?: string;

  abstract category?:
    | "text"
    | "vision"
    | "audio"
    | "multimodal"
    | "local"
    | "custom";
  abstract tags?: string[];

  // ============================================================================
  // CAPABILITIES (Must be defined by subclasses)
  // ============================================================================

  abstract supportsStreaming: boolean;
  abstract supportsFunctionCalling: boolean;
  abstract supportsVision: boolean;
  abstract supportsAudio: boolean;
  abstract maxContextLength: number;
  abstract supportedModels: string[];
  abstract pricing?: {
    type: "per-token" | "per-request" | "subscription" | "free";
    promptCost?: number;
    completionCost?: number;
  };

  // ============================================================================
  // CONFIGURATION (Must be defined by subclasses)
  // ============================================================================

  abstract requiredConfig: any;
  abstract optionalConfig?: any;

  // ============================================================================
  // PROTECTED STATE
  // ============================================================================

  protected config: ProviderConfig | null = null;
  protected tenantId?: string;
  protected status: ProviderStatus = {
    status: "offline",
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
  };

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  async initialize(config: ProviderConfig, tenantId?: string): Promise<void> {
    this.status.status = "initializing";

    // Validate configuration
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid configuration: ${validation.errors?.join(", ")}`,
      );
    }

    // Encrypt secrets (API keys, etc.)
    this.config = await this.encryptSecrets(config);
    this.tenantId = tenantId;

    // Test connection
    await this.testConnection();

    this.status.status = "online";
    this.status.lastUsed = new Date();
  }

  // ============================================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // ============================================================================

  abstract generate(request: LLMRequest): Promise<LLMResponse>;

  abstract stream?(request: LLMRequest): AsyncGenerator<LLMStreamChunk>;

  // ============================================================================
  // VALIDATION
  // ============================================================================

  validateConfig(config: ProviderConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (this.requiredConfig?.required) {
      for (const field of this.requiredConfig.required) {
        if (!config[field]) {
          errors.push(`Required field missing: ${field}`);
        }
      }
    }

    // Validate API key format (if present)
    if (config.apiKey) {
      if (config.apiKey.length < 10) {
        errors.push("API key appears to be invalid (too short)");
      }
      if (config.apiKey.includes("your-") || config.apiKey.includes("****")) {
        errors.push("API key appears to be a placeholder");
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  // ============================================================================
  // HEALTH & STATUS
  // ============================================================================

  async healthCheck(): Promise<ProviderHealth> {
    try {
      const startTime = Date.now();

      // Simple test request (if supported)
      // For now, just check if initialized
      const latency = Date.now() - startTime;

      return {
        status: this.status.status === "online" ? "healthy" : "unhealthy",
        latency,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        lastChecked: new Date(),
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  getStatus(): ProviderStatus {
    return { ...this.status };
  }

  // ============================================================================
  // PROTECTED UTILITIES
  // ============================================================================

  /**
   * Encrypt secrets in configuration
   */
  protected async encryptSecrets(
    config: ProviderConfig,
  ): Promise<ProviderConfig> {
    // In production, this would use proper encryption
    // For now, we'll just return the config
    // TODO: Integrate with keyManager for encryption
    return config;
  }

  /**
   * Test connection to provider
   */
  protected async testConnection(): Promise<void> {
    // Subclasses can override this for provider-specific health checks
    // Default: just mark as online if initialized
  }

  /**
   * Update status after request
   */
  protected updateStatusAfterRequest(
    tokensUsed?: { prompt: number; completion: number; total: number },
    cost?: number,
    latency?: number,
  ): void {
    this.status.lastUsed = new Date();
    this.status.totalRequests = (this.status.totalRequests || 0) + 1;

    if (tokensUsed) {
      this.status.totalTokens =
        (this.status.totalTokens || 0) + tokensUsed.total;
    }

    if (cost) {
      this.status.totalCost = (this.status.totalCost || 0) + cost;
    }

    if (latency) {
      // Update average latency
      const currentLatency = this.status.latency || 0;
      const requestCount = this.status.totalRequests || 1;
      this.status.latency =
        (currentLatency * (requestCount - 1) + latency) / requestCount;
    }
  }

  /**
   * Calculate cost based on token usage
   */
  protected calculateCost(tokensUsed: {
    prompt: number;
    completion: number;
  }): number {
    if (!this.pricing || this.pricing.type !== "per-token") {
      return 0;
    }

    const promptCost =
      (tokensUsed.prompt / 1_000_000) * (this.pricing.promptCost || 0);
    const completionCost =
      (tokensUsed.completion / 1_000_000) * (this.pricing.completionCost || 0);

    return promptCost + completionCost;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.status.status = "offline";
    this.config = null;
  }
}

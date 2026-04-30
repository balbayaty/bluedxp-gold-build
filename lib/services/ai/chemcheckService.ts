/**
 * ChemCheck AI Service
 * Merged AI service from chemcheck-ai
 *
 * Source: chemcheck-ai/lib/ai-service.ts
 * Merged with existing Hazalyze AI client
 */

import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

// Define interfaces for common operations
export interface AIProvider {
  name: string;
  analyzeDocument(text: string, options?: any): Promise<AIAnalysisResult>;
  isAvailable(): boolean;
}

// Define a standard result type for AI analysis
export interface AIAnalysisResult {
  id: string;
  timestamp: string;
  analysis: any;
  provider: string;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Anthropic Claude implementation
 */
class AnthropicProvider implements AIProvider {
  private client: Anthropic | null = null;
  name = "Anthropic Claude";

  constructor() {
    try {
      // Check multiple sources for API key (same as utils/aiClient.ts)
      let apiKey: string | null = null;

      // 1. Check environment variables (server-side)
      if (typeof window === "undefined") {
        apiKey =
          process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
          process.env.ANTHROPIC_API_KEY ||
          null;
      } else {
        // 2. Check localStorage (from AI settings page) - PRIMARY SOURCE
        try {
          const storedKey = localStorage.getItem("anthropic_api_key");
          if (
            storedKey &&
            storedKey.trim() &&
            storedKey.length > 20 &&
            !storedKey.includes("****") &&
            !storedKey.includes("your-key")
          ) {
            apiKey = storedKey;
            console.log(
              "[chemcheckService] ✅ Found Anthropic API key in localStorage",
            );
          }
        } catch (e) {
          console.warn("[chemcheckService] Error reading localStorage:", e);
        }

        // 3. Fallback to environment variables
        if (!apiKey) {
          apiKey =
            process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
            process.env.ANTHROPIC_API_KEY ||
            null;
        }
      }

      if (apiKey) {
        this.client = new Anthropic({
          apiKey: apiKey,
        });
        console.log("[chemcheckService] ✅ Anthropic client initialized");
      } else {
        console.warn("[chemcheckService] ⚠️ No Anthropic API key found");
      }
    } catch (error) {
      console.error("[chemcheckService] Error initializing Anthropic:", error);
      this.client = null;
    }
  }

  isAvailable(): boolean {
    // Check if client is initialized AND we have an API key from any source
    if (!this.client) return false;

    // Check environment variables (server-side)
    if (typeof window === "undefined") {
      return !!(
        process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
        process.env.ANTHROPIC_API_KEY
      );
    }

    // Check localStorage (client-side)
    try {
      const storedKey = localStorage.getItem("anthropic_api_key");
      if (
        storedKey &&
        storedKey.trim() &&
        storedKey.length > 20 &&
        !storedKey.includes("****")
      ) {
        return true;
      }
    } catch (e) {
      // Ignore
    }

    // Fallback to environment variables
    return !!(
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY
    );
  }

  async analyzeDocument(
    text: string,
    options?: any,
  ): Promise<AIAnalysisResult> {
    // Re-check API key availability (in case it was set after initialization)
    // Check BOTH localStorage (client-side) AND environment variables (server-side)
    let apiKey: string | null = null;

    if (typeof window === "undefined") {
      // Server-side: Check environment variables (may have been set dynamically by extraction adapter)
      apiKey =
        process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
        process.env.ANTHROPIC_API_KEY ||
        null;
      if (apiKey && (!this.client || this.client.apiKey !== apiKey)) {
        this.client = new Anthropic({ apiKey });
        console.log(
          "[chemcheckService] ✅ Re-initialized Anthropic client with environment key",
        );
      }
    } else {
      // Client-side: Check localStorage first, then environment
      try {
        const storedKey = localStorage.getItem("anthropic_api_key");
        if (
          storedKey &&
          storedKey.trim() &&
          storedKey.length > 20 &&
          !storedKey.includes("****")
        ) {
          apiKey = storedKey;
          if (!this.client || this.client.apiKey !== apiKey) {
            this.client = new Anthropic({ apiKey });
            console.log(
              "[chemcheckService] ✅ Re-initialized Anthropic client with localStorage key",
            );
          }
        }
      } catch (e) {
        // Ignore
      }

      if (!apiKey) {
        apiKey =
          process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY ||
          process.env.ANTHROPIC_API_KEY ||
          null;
        if (apiKey && (!this.client || this.client.apiKey !== apiKey)) {
          this.client = new Anthropic({ apiKey });
          console.log(
            "[chemcheckService] ✅ Re-initialized Anthropic client with environment key",
          );
        }
      }
    }

    if (!this.client || !apiKey) {
      console.warn(
        "[chemcheckService] ⚠️ Warning: ANTHROPIC_API_KEY not found in environment or localStorage.",
      );
      return this.getMockAnalysisResult("No API key provided");
    }

    // Ensure client is initialized
    if (!this.client) {
      console.error("[chemcheckService] Anthropic client not initialized");
      return this.getMockAnalysisResult("Anthropic client not initialized");
    }

    try {
      const defaultOptions = {
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        temperature: 0.5,
      };

      const mergedOptions = { ...defaultOptions, ...options };
      const { response_format, ...claudeOptions } = mergedOptions;

      const systemPrompt =
        response_format?.type === "json_object"
          ? "You are a helpful assistant. You always output valid JSON with no explanations."
          : "You are a helpful assistant for a chemical safety management system.";

      const response = await this.client!.messages.create({
        model: claudeOptions.model,
        system: systemPrompt,
        max_tokens: claudeOptions.max_tokens,
        temperature: claudeOptions.temperature,
        messages: [
          {
            role: "user",
            content: text,
          },
        ],
      });

      let analysisText = "";
      if (response.content && response.content.length > 0) {
        const content = response.content[0];
        if ("text" in content) {
          analysisText = content.text;
        } else {
          analysisText = JSON.stringify(content);
        }
      }

      return {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        analysis: analysisText,
        provider: this.name,
        metadata: {
          model: claudeOptions.model,
          usage: {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
          },
        },
      };
    } catch (error) {
      console.error("Error calling Anthropic API:", error);
      return this.getMockAnalysisResult(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private getMockAnalysisResult(errorMessage: string): AIAnalysisResult {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      analysis: {
        result:
          "This is a fallback response because Anthropic Claude is not available.",
        explanation:
          "The actual AI service is unavailable. This is mock data for demonstration purposes only.",
      },
      provider: "Mock " + this.name,
      error: errorMessage,
    };
  }
}

/**
 * OpenAI implementation
 */
class OpenAIProvider implements AIProvider {
  private client: OpenAI | null = null;
  name = "OpenAI";

  constructor() {
    try {
      // Check multiple sources for API key (same as utils/aiClient.ts)
      let apiKey: string | null = null;

      // 1. Check environment variables (server-side)
      if (typeof window === "undefined") {
        apiKey =
          process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
          process.env.OPENAI_API_KEY ||
          null;
      } else {
        // 2. Check localStorage (from AI settings page) - PRIMARY SOURCE
        try {
          const storedKey = localStorage.getItem("openai_api_key");
          if (
            storedKey &&
            storedKey.trim() &&
            storedKey.length > 20 &&
            storedKey.startsWith("sk-") &&
            !storedKey.includes("****") &&
            !storedKey.includes("your-key")
          ) {
            apiKey = storedKey;
            console.log(
              "[chemcheckService] ✅ Found OpenAI API key in localStorage",
            );
          }
        } catch (e) {
          console.warn("[chemcheckService] Error reading localStorage:", e);
        }

        // 3. Check alternative localStorage keys
        if (!apiKey) {
          const altKeys = [
            "OPENAI_API_KEY",
            "openai-key",
            "ai_api_key",
            "OPENAI_KEY",
            "openaiKey",
          ];
          for (const key of altKeys) {
            try {
              const value = localStorage.getItem(key);
              if (
                value &&
                value.trim() &&
                value.length > 20 &&
                value.startsWith("sk-") &&
                !value.includes("****")
              ) {
                apiKey = value;
                localStorage.setItem("openai_api_key", value); // Save with standard name
                console.log(
                  "[chemcheckService] ✅ Found OpenAI API key in localStorage (alternative key)",
                );
                break;
              }
            } catch (e) {
              // Ignore
            }
          }
        }

        // 4. Fallback to environment variables
        if (!apiKey) {
          apiKey =
            process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
            process.env.OPENAI_API_KEY ||
            null;
        }
      }

      if (apiKey) {
        this.client = new OpenAI({
          apiKey: apiKey,
        });
        console.log("[chemcheckService] ✅ OpenAI client initialized");
      } else {
        console.warn("[chemcheckService] ⚠️ No OpenAI API key found");
      }
    } catch (error) {
      console.error("[chemcheckService] Error initializing OpenAI:", error);
      this.client = null;
    }
  }

  isAvailable(): boolean {
    // Always check current state (environment variables may have been set dynamically)
    if (typeof window === "undefined") {
      // Server-side: Check environment variables (may have been set by extraction adapter)
      const envKey =
        process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (envKey && envKey.length > 20 && envKey.startsWith("sk-")) {
        // Re-initialize client if key is available but client isn't set
        if (!this.client) {
          try {
            this.client = new OpenAI({ apiKey: envKey });
          } catch (e) {
            return false;
          }
        }
        return true;
      }
      return false;
    }

    // Client-side: Check localStorage first, then environment
    try {
      const storedKey = localStorage.getItem("openai_api_key");
      if (
        storedKey &&
        storedKey.trim() &&
        storedKey.length > 20 &&
        storedKey.startsWith("sk-") &&
        !storedKey.includes("****")
      ) {
        if (!this.client) {
          try {
            this.client = new OpenAI({ apiKey: storedKey });
          } catch (e) {
            return false;
          }
        }
        return true;
      }

      // Check alternative keys
      const altKeys = [
        "OPENAI_API_KEY",
        "openai-key",
        "ai_api_key",
        "OPENAI_KEY",
        "openaiKey",
      ];
      for (const key of altKeys) {
        const value = localStorage.getItem(key);
        if (
          value &&
          value.trim() &&
          value.length > 20 &&
          value.startsWith("sk-") &&
          !value.includes("****")
        ) {
          if (!this.client) {
            try {
              this.client = new OpenAI({ apiKey: value });
            } catch (e) {
              return false;
            }
          }
          return true;
        }
      }
    } catch (e) {
      // Ignore
    }

    // Fallback to environment variables
    const envKey =
      process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (envKey && envKey.length > 20 && envKey.startsWith("sk-")) {
      if (!this.client) {
        try {
          this.client = new OpenAI({ apiKey: envKey });
        } catch (e) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  async analyzeDocument(
    text: string,
    options?: any,
  ): Promise<AIAnalysisResult> {
    // Re-check API key availability (in case it was set after initialization)
    // Check BOTH localStorage (client-side) AND environment variables (server-side)
    let apiKey: string | null = null;

    if (typeof window === "undefined") {
      // Server-side: Check environment variables (may have been set dynamically by extraction adapter)
      apiKey =
        process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
        process.env.OPENAI_API_KEY ||
        null;
      if (apiKey && (!this.client || (this.client as any).apiKey !== apiKey)) {
        this.client = new OpenAI({ apiKey });
        console.log(
          "[chemcheckService] ✅ Re-initialized OpenAI client with environment key",
        );
      }
    } else {
      // Client-side: Check localStorage first, then environment
      try {
        const storedKey = localStorage.getItem("openai_api_key");
        if (
          storedKey &&
          storedKey.trim() &&
          storedKey.length > 20 &&
          storedKey.startsWith("sk-") &&
          !storedKey.includes("****")
        ) {
          apiKey = storedKey;
          if (!this.client || (this.client as any).apiKey !== apiKey) {
            this.client = new OpenAI({ apiKey });
            console.log(
              "[chemcheckService] ✅ Re-initialized OpenAI client with localStorage key",
            );
          }
        }
      } catch (e) {
        // Ignore
      }

      if (!apiKey) {
        apiKey =
          process.env.NEXT_PUBLIC_OPENAI_API_KEY ||
          process.env.OPENAI_API_KEY ||
          null;
        if (
          apiKey &&
          (!this.client || (this.client as any).apiKey !== apiKey)
        ) {
          this.client = new OpenAI({ apiKey });
          console.log(
            "[chemcheckService] ✅ Re-initialized OpenAI client with environment key",
          );
        }
      }
    }

    if (!this.client || !apiKey) {
      console.warn(
        "[chemcheckService] ⚠️ Warning: OPENAI_API_KEY not found in environment or localStorage.",
      );
      return this.getMockAnalysisResult("No API key provided");
    }

    try {
      const defaultOptions = {
        model: "gpt-4-0125-preview",
        max_tokens: 4000,
        temperature: 0.5,
      };

      const mergedOptions = { ...defaultOptions, ...options };

      const response = await this.client!.chat.completions.create({
        model: mergedOptions.model,
        temperature: mergedOptions.temperature,
        max_tokens: mergedOptions.max_tokens,
        response_format: mergedOptions.response_format,
        messages: [
          {
            role: "system",
            content:
              mergedOptions.response_format?.type === "json_object"
                ? "You are a helpful assistant. You always output valid JSON with no explanations."
                : "You are a helpful assistant for a chemical safety management system.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      });

      return {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        analysis: response.choices[0].message.content,
        provider: this.name,
        metadata: {
          model: mergedOptions.model,
          usage: {
            input_tokens: response.usage?.prompt_tokens,
            output_tokens: response.usage?.completion_tokens,
          },
        },
      };
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      return this.getMockAnalysisResult(
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private getMockAnalysisResult(errorMessage: string): AIAnalysisResult {
    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      analysis: {
        result: "This is a fallback response because OpenAI is not available.",
        explanation:
          "The actual AI service is unavailable. This is mock data for demonstration purposes only.",
      },
      provider: "Mock " + this.name,
      error: errorMessage,
    };
  }
}

/**
 * A mock provider for testing and development
 */
class MockAIProvider implements AIProvider {
  name = "Mock AI Provider";

  isAvailable(): boolean {
    return true;
  }

  async analyzeDocument(
    text: string,
    options?: any,
  ): Promise<AIAnalysisResult> {
    const isJsonFormat = options?.response_format?.type === "json_object";
    const isChemicalRelated =
      text.toLowerCase().includes("chemical") ||
      text.toLowerCase().includes("hazard") ||
      text.toLowerCase().includes("safety");

    let mockResponse: any;

    if (isJsonFormat) {
      if (isChemicalRelated) {
        mockResponse = {
          analysis: {
            chemicalName: "Example Chemical",
            hazardLevel: "Medium",
            safetyRecommendations: [
              "Store in cool, dry place",
              "Keep away from incompatible materials",
              "Use appropriate personal protective equipment",
            ],
            compatibilityNotes: "Incompatible with strong oxidizers and acids",
          },
          confidence: 0.85,
        };
      } else {
        mockResponse = {
          result: "Mock analysis complete",
          content: "This is a generic mock response in JSON format",
        };
      }
    } else {
      if (isChemicalRelated) {
        mockResponse = `The chemical appears to have moderate hazard level. Recommended safety precautions include proper storage in a cool, dry place away from incompatible materials such as strong oxidizers and acids. Always use appropriate personal protective equipment when handling.`;
      } else {
        mockResponse = `This is a mock AI response for demonstration purposes. In a production environment, this would contain an actual analysis from the AI model.`;
      }
    }

    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      analysis: mockResponse,
      provider: this.name,
      metadata: {
        model: "mock-model-v1",
        demo: true,
      },
    };
  }
}

/**
 * Master AI Service that manages multiple providers
 */
class ChemCheckAIService {
  private providers: AIProvider[] = [];
  private activeProviderIndex = 0;

  constructor() {
    this.providers.push(new AnthropicProvider());
    this.providers.push(new OpenAIProvider());
    this.providers.push(new MockAIProvider());
    this.setActiveProvider();
  }

  private setActiveProvider(): void {
    console.log("[ai-service] Checking available AI providers...");

    // Check each provider
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const available = provider.isAvailable();
      console.log(
        `[ai-service] ${provider.name}: ${available ? "✅ Available" : "❌ Not available"}`,
      );

      if (available && !provider.name.includes("Mock")) {
        this.activeProviderIndex = i;
        console.log(`[ai-service] ✅ Using AI provider: ${provider.name}`);
        return;
      }
    }

    // Fall back to Mock if no real providers available
    this.activeProviderIndex = this.providers.length - 1;
    console.warn(
      `[ai-service] ⚠️ No API keys found - Using fallback: ${this.providers[this.activeProviderIndex].name}`,
    );
    console.warn(
      `[ai-service] ⚠️ To enable real AI, set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local`,
    );
  }

  public getActiveProvider(): AIProvider {
    return this.providers[this.activeProviderIndex];
  }

  public switchProvider(providerName: string): boolean {
    const index = this.providers.findIndex(
      (p) =>
        p.name.toLowerCase() === providerName.toLowerCase() && p.isAvailable(),
    );

    if (index >= 0) {
      this.activeProviderIndex = index;
      console.log(`Switched to AI provider: ${this.providers[index].name}`);
      return true;
    }

    return false;
  }

  public listAvailableProviders(): { name: string; active: boolean }[] {
    return this.providers
      .filter((p) => p.isAvailable())
      .map((p, i) => ({
        name: p.name,
        active: i === this.activeProviderIndex,
      }));
  }

  public async analyzeDocument(
    text: string,
    options?: any,
  ): Promise<AIAnalysisResult> {
    // Re-check provider availability before each call (environment variables may have been set dynamically)
    // This ensures we use real AI if keys were set by extraction adapter
    this.setActiveProvider();

    try {
      return await this.providers[this.activeProviderIndex].analyzeDocument(
        text,
        options,
      );
    } catch (error) {
      console.error(
        "Error in primary AI provider, falling back to alternative",
        error,
      );
      // Re-check availability after error
      this.setActiveProvider();
      const nextIndex = (this.activeProviderIndex + 1) % this.providers.length;
      if (
        nextIndex !== this.activeProviderIndex &&
        this.providers[nextIndex].isAvailable()
      ) {
        try {
          return await this.providers[nextIndex].analyzeDocument(text, options);
        } catch (fallbackError) {
          console.error("Error in fallback AI provider", fallbackError);
        }
      }
      const mockProvider = new MockAIProvider();
      return mockProvider.analyzeDocument(text, options);
    }
  }

  public async analyzeWithMultipleProviders(
    text: string,
    options?: any,
  ): Promise<{
    results: AIAnalysisResult[];
    summary: string;
    confidence: number;
  }> {
    const availableProviders = this.providers.filter((p) => p.isAvailable());
    const results: AIAnalysisResult[] = [];

    for (const provider of availableProviders) {
      try {
        const result = await provider.analyzeDocument(text, options);
        results.push(result);
      } catch (error) {
        console.error(`Error with provider ${provider.name}:`, error);
      }
    }

    if (results.length === 0) {
      const mockProvider = new MockAIProvider();
      results.push(await mockProvider.analyzeDocument(text, options));
    }

    const confidence =
      results.reduce((sum, result) => {
        const resultConfidence =
          typeof result.analysis === "object" && result.analysis?.confidence
            ? result.analysis.confidence
            : 0.5;
        return sum + resultConfidence;
      }, 0) / results.length;

    return {
      results,
      summary: `Analysis completed with ${results.length} provider(s).`,
      confidence,
    };
  }
}

// Export singleton instance
export const chemCheckAIService = new ChemCheckAIService();
export const aiService = chemCheckAIService; // Alias for compatibility

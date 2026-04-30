/**
 * LLM Provider Registry
 * Dynamic registry for unlimited LLM providers
 * Supports plugin-based registration - just add code, no core changes needed!
 */

import type { ILLMProvider } from "./providerInterface";

export class LLMProviderRegistry {
  private providers: Map<string, ILLMProvider> = new Map();
  private providersByCategory: Map<string, ILLMProvider[]> = new Map();
  private initializationPromises: Map<string, Promise<void>> = new Map();

  /**
   * Register a provider dynamically
   * This is the ONLY function you need to call to add a new provider!
   *
   * @example
   * ```typescript
   * import { MistralProvider } from './providers/mistral/MistralProvider'
   * providerRegistry.register(new MistralProvider())
   * ```
   */
  register(provider: ILLMProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(
        `[LLM Registry] Provider ${provider.id} already registered, overwriting...`,
      );
    }

    this.providers.set(provider.id, provider);
    this.categorizeProvider(provider);

    console.log(
      `[LLM Registry] ✅ Registered provider: ${provider.name} (${provider.id})`,
    );
  }

  /**
   * Register multiple providers at once
   */
  registerMany(providers: ILLMProvider[]): void {
    providers.forEach((provider) => this.register(provider));
  }

  /**
   * Register from plugin file/package
   * Supports:
   * - Local file: './providers/mistral'
   * - NPM package: 'bluedxp-llm-mistral'
   * - URL: 'https://example.com/provider.js'
   */
  async registerFromPlugin(source: string): Promise<void> {
    try {
      let providerModule: any;

      // Try different loading strategies
      if (source.startsWith("http://") || source.startsWith("https://")) {
        // Load from URL
        providerModule = await this.loadFromURL(source);
      } else if (source.startsWith("npm:") || source.startsWith("package:")) {
        // Load from NPM package
        const packageName = source.replace(/^(npm:|package:)/, "");
        providerModule = await import(packageName);
      } else {
        // Load from local path
        providerModule = await import(source);
      }

      // Extract provider (supports default export or named export)
      const ProviderClass =
        providerModule.default || providerModule.Provider || providerModule;

      if (typeof ProviderClass === "function") {
        const provider = new ProviderClass();
        this.register(provider);
      } else if (typeof ProviderClass === "object" && "id" in ProviderClass) {
        // Already instantiated
        this.register(ProviderClass);
      } else {
        throw new Error(`Invalid provider format from ${source}`);
      }
    } catch (error) {
      console.error(
        `[LLM Registry] Failed to load plugin from ${source}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get provider by ID
   */
  get(id: string): ILLMProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get provider or throw error
   */
  getOrThrow(id: string): ILLMProvider {
    const provider = this.get(id);
    if (!provider) {
      throw new Error(`Provider ${id} not found`);
    }
    return provider;
  }

  /**
   * List all registered providers
   */
  list(): ILLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * List providers by category
   */
  listByCategory(category: string): ILLMProvider[] {
    return this.providersByCategory.get(category) || [];
  }

  /**
   * Search providers
   */
  search(query: string): ILLMProvider[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(
      (provider) =>
        provider.id.toLowerCase().includes(lowerQuery) ||
        provider.name.toLowerCase().includes(lowerQuery) ||
        provider.description?.toLowerCase().includes(lowerQuery) ||
        provider.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  /**
   * Get providers that support a capability
   */
  getByCapability(
    capability: keyof Pick<
      ILLMProvider,
      | "supportsStreaming"
      | "supportsFunctionCalling"
      | "supportsVision"
      | "supportsAudio"
    >,
  ): ILLMProvider[] {
    return this.list().filter((provider) => provider[capability] === true);
  }

  /**
   * Get providers that support a model
   */
  getByModel(model: string): ILLMProvider[] {
    return this.list().filter((provider) =>
      provider.supportedModels.includes(model),
    );
  }

  /**
   * Initialize a provider
   */
  async initializeProvider(
    id: string,
    config: any,
    tenantId?: string,
  ): Promise<void> {
    const provider = this.getOrThrow(id);

    // Prevent concurrent initialization
    if (this.initializationPromises.has(id)) {
      return this.initializationPromises.get(id)!;
    }

    const initPromise = provider.initialize(config, tenantId);
    this.initializationPromises.set(id, initPromise);

    try {
      await initPromise;
      console.log(`[LLM Registry] ✅ Initialized provider: ${id}`);
    } finally {
      this.initializationPromises.delete(id);
    }
  }

  /**
   * Get provider status
   */
  getProviderStatus(id: string) {
    const provider = this.get(id);
    return provider ? provider.getStatus() : null;
  }

  /**
   * Get all provider statuses
   */
  getAllStatuses(): Map<string, any> {
    const statuses = new Map();
    this.providers.forEach((provider, id) => {
      statuses.set(id, provider.getStatus());
    });
    return statuses;
  }

  /**
   * Categorize provider
   */
  private categorizeProvider(provider: ILLMProvider): void {
    const category = provider.category || "custom";
    if (!this.providersByCategory.has(category)) {
      this.providersByCategory.set(category, []);
    }
    this.providersByCategory.get(category)!.push(provider);
  }

  /**
   * Load provider from URL
   */
  private async loadFromURL(url: string): Promise<any> {
    // In production, this would fetch and execute the provider code
    // For now, we'll use dynamic imports
    throw new Error("URL-based provider loading not yet implemented");
  }

  /**
   * Unregister a provider
   */
  unregister(id: string): boolean {
    const provider = this.providers.get(id);
    if (provider) {
      // Cleanup if supported
      if (provider.cleanup) {
        provider.cleanup().catch(console.error);
      }

      this.providers.delete(id);

      // Remove from category
      const category = provider.category || "custom";
      const categoryList = this.providersByCategory.get(category);
      if (categoryList) {
        const index = categoryList.indexOf(provider);
        if (index > -1) {
          categoryList.splice(index, 1);
        }
      }

      console.log(`[LLM Registry] Unregistered provider: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalProviders: this.providers.size,
      byCategory: Object.fromEntries(
        Array.from(this.providersByCategory.entries()).map(
          ([cat, providers]) => [cat, providers.length],
        ),
      ),
      online: this.list().filter((p) => p.getStatus().status === "online")
        .length,
      offline: this.list().filter((p) => p.getStatus().status === "offline")
        .length,
    };
  }
}

// Singleton instance
export const providerRegistry = new LLMProviderRegistry();

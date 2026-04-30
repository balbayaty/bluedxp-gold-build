/**
 * Customs Adapter Registry
 * Manages all country-specific adapters
 */

import type { CustomsAdapter } from "@/types/customs";
import { createCustomsAdapter } from "@/lib/adapters/customs";

export class AdapterRegistry {
  private adapters: Map<string, CustomsAdapter> = new Map();

  /**
   * Register adapter
   */
  registerAdapter(adapter: CustomsAdapter): void {
    const key = `${adapter.country}-${adapter.id}`;
    this.adapters.set(key, adapter);
    console.log(`[Customs] Adapter registered: ${key}`);
  }

  /**
   * Get adapter by country and system
   */
  getAdapter(country: string, system?: string): CustomsAdapter | undefined {
    if (system) {
      return this.adapters.get(`${country}-${system}`);
    }

    // Get first adapter for country
    for (const [key, adapter] of this.adapters.entries()) {
      if (key.startsWith(`${country}-`)) {
        return adapter;
      }
    }

    return undefined;
  }

  /**
   * Get all adapters for a country
   */
  getAdaptersForCountry(country: string): CustomsAdapter[] {
    const adapters: CustomsAdapter[] = [];
    for (const [key, adapter] of this.adapters.entries()) {
      if (key.startsWith(`${country}-`)) {
        adapters.push(adapter);
      }
    }
    return adapters;
  }

  /**
   * Get all adapters
   */
  getAllAdapters(): CustomsAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Create and register adapter
   */
  createAndRegister(
    country: string,
    system: string,
    config: any,
  ): CustomsAdapter {
    const adapter = createCustomsAdapter(country, system, config);
    this.registerAdapter(adapter);
    return adapter;
  }
}

export const adapterRegistry = new AdapterRegistry();

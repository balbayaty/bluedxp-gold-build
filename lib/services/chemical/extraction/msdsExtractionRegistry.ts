/**
 * MSDS Extraction Adapter Registry
 * Allows swapping extraction engines per tenant/module config.
 */

import type { MSDSExtractionAdapter } from "./msdsExtractionAdapter";
import { defaultMsdsExtractionAdapter } from "./defaultMsdsExtractionAdapter";
import { chemcheckEnhancedMsdsExtractionAdapter } from "./chemcheckEnhancedMsdsExtractionAdapter";

class MSDSExtractionRegistry {
  private adapters = new Map<string, MSDSExtractionAdapter>();

  constructor() {
    this.register(defaultMsdsExtractionAdapter);
    this.register(chemcheckEnhancedMsdsExtractionAdapter);
  }

  register(adapter: MSDSExtractionAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  get(adapterId: string): MSDSExtractionAdapter {
    const a = this.adapters.get(adapterId);
    if (!a) throw new Error(`MSDS extraction adapter not found: ${adapterId}`);
    return a;
  }

  // Future: choose per tenant via module settings / feature flags
  getForTenant(_tenantId: string): MSDSExtractionAdapter {
    const forced = (process.env.MSDS_EXTRACTION_ADAPTER_DEFAULT || "").trim();
    if (forced) return this.get(forced);
    // Default to enhanced parser for better completeness + rule validation
    return this.get("chemcheck-enhanced-parser");
  }
}

export const msdsExtractionRegistry = new MSDSExtractionRegistry();

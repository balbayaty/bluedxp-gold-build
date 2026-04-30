import type { CustomsAdapter } from "@/lib/adapters/customs/base";
import { mockCustomsAdapter } from "@/lib/adapters/customs/mockAdapter";

class CustomsAdapterRegistry {
  private adapters = new Map<string, CustomsAdapter>();

  constructor() {
    this.register(mockCustomsAdapter);
  }

  register(adapter: CustomsAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): CustomsAdapter | undefined {
    return this.adapters.get(id);
  }

  resolve(system?: string): CustomsAdapter {
    const key = (system || "mock").toLowerCase();
    return this.adapters.get(key) || mockCustomsAdapter;
  }
}

export const customsAdapterRegistry = new CustomsAdapterRegistry();

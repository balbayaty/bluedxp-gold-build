/**
 * WMS Integration Service
 * Integrates customs with WMS module for product/inventory data
 */

import type { Product, InventoryItem } from "@/types/warehouse";
import type { DeclarationProduct } from "@/types/customs";
import { eventBus } from "@/lib/services/event-store";

/**
 * Initialize WMS integration
 */
export function initializeWMSIntegration() {
  // Subscribe to WMS product events
  eventBus.subscribe("wms.product.created", async (event) => {
    await handleProductCreated(event.data as Product);
  });

  eventBus.subscribe("wms.inventory.updated", async (event) => {
    await handleInventoryUpdated(event.data as InventoryItem);
  });

  console.log("[Customs] WMS integration initialized");
}

/**
 * Handle product created event
 */
async function handleProductCreated(product: Product) {
  // Update product classifications if needed
  console.log("[Customs] Product created:", product.id);
}

/**
 * Handle inventory updated event
 */
async function handleInventoryUpdated(inventory: InventoryItem) {
  // Update declaration products if needed
  console.log("[Customs] Inventory updated:", inventory.id);
}

/**
 * Convert WMS product to declaration product
 */
export function convertProductToDeclarationProduct(
  product: Product,
  quantity: number,
): DeclarationProduct {
  return {
    id: `prod-${Date.now()}`,
    productId: product.id,
    hsCode: product.hsCode || "",
    description: product.name,
    quantity,
    unit: product.unit || "PCS",
    unitValue: product.unitPrice || 0,
    totalValue: (product.unitPrice || 0) * quantity,
    currency: product.currency || "USD",
    originCountry: product.originCountry || "US",
    weight: product.weight,
    volume: product.volume,
    requiresLicense: false,
    requiresCertificate: false,
    restrictedItem: false,
    hazardousMaterial: product.hazardous || false,
  };
}

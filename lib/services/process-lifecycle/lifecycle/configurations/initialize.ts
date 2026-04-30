/**
 * Initialize Lifecycle System
 * Registers all lifecycle configurations with the lifecycle service
 */

import { lifecycleService } from "@/lib/services/process-lifecycle/lifecycle/lifecycleService";
import { salesOrderLifecycleConfig } from "./salesOrderLifecycle";
import { purchaseOrderLifecycleConfig } from "./purchaseOrderLifecycle";
import { msdsLifecycleConfig } from "./msdsLifecycle";
import { customsDeclarationLifecycleConfig } from "./customsDeclarationLifecycle";
import {
  asnLifecycleConfig,
  taskLifecycleConfig,
  pickingLifecycleConfig,
  putawayLifecycleConfig,
  cycleCountLifecycleConfig,
  goodsReceiptLifecycleConfig,
  wavePlanningLifecycleConfig,
} from "./wms";

/**
 * Initialize and register all lifecycle configurations
 */
export function initializeLifecycleSystem(): void {
  try {
    // Register Sales Order lifecycle
    if (!lifecycleService.getLifecycleConfig("SALES_ORDER")) {
      lifecycleService.registerLifecycle(
        "SALES_ORDER",
        salesOrderLifecycleConfig,
      );
    }

    // Register Purchase Order lifecycle
    if (!lifecycleService.getLifecycleConfig("PURCHASE_ORDER")) {
      lifecycleService.registerLifecycle(
        "PURCHASE_ORDER",
        purchaseOrderLifecycleConfig,
      );
    }

    // Register WMS Lifecycle Configurations
    if (!lifecycleService.getLifecycleConfig("ASN")) {
      lifecycleService.registerLifecycle("ASN", asnLifecycleConfig);
    }

    if (!lifecycleService.getLifecycleConfig("TASK")) {
      lifecycleService.registerLifecycle("TASK", taskLifecycleConfig);
    }

    if (!lifecycleService.getLifecycleConfig("PICKING")) {
      lifecycleService.registerLifecycle("PICKING", pickingLifecycleConfig);
    }

    if (!lifecycleService.getLifecycleConfig("PUTAWAY")) {
      lifecycleService.registerLifecycle("PUTAWAY", putawayLifecycleConfig);
    }

    if (!lifecycleService.getLifecycleConfig("CYCLE_COUNT")) {
      lifecycleService.registerLifecycle(
        "CYCLE_COUNT",
        cycleCountLifecycleConfig,
      );
    }

    if (!lifecycleService.getLifecycleConfig("GOODS_RECEIPT")) {
      lifecycleService.registerLifecycle(
        "GOODS_RECEIPT",
        goodsReceiptLifecycleConfig,
      );
    }

    if (!lifecycleService.getLifecycleConfig("WAVE")) {
      lifecycleService.registerLifecycle("WAVE", wavePlanningLifecycleConfig);
    }

    // Register MSDS lifecycle
    if (!lifecycleService.getLifecycleConfig("MSDS")) {
      lifecycleService.registerLifecycle("MSDS", msdsLifecycleConfig);
    }

    // Register Customs Declaration lifecycle
    if (!lifecycleService.getLifecycleConfig("CUSTOMS_DECLARATION")) {
      lifecycleService.registerLifecycle(
        "CUSTOMS_DECLARATION",
        customsDeclarationLifecycleConfig,
      );
    }
  } catch (error) {
    console.error("Error initializing lifecycle system:", error);
  }
}

// Auto-initialize on import (server + client). This is required so API routes / tools
// can safely initialize and transition lifecycles without relying on a client import.
initializeLifecycleSystem();

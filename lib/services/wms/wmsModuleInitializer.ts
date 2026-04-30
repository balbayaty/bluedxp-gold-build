/**
 * WMS Module Initializer
 * Initializes all WMS services and event handlers on application startup
 * Ensures everything is properly connected and ready
 */

import { realTimeSlaKpiService } from "./realTimeSlaKpiService";
import { initializeWmsEventHandlers } from "./wmsEventHandlers";

/**
 * Initialize WMS Module
 * Call this during application startup to ensure all services are ready
 */
export async function initializeWmsModule() {
  try {
    // 1. Initialize event handlers
    await initializeWmsEventHandlers();
    console.log("✅ WMS event handlers initialized");

    // 2. Start real-time SLA monitoring (in production)
    if (
      typeof window === "undefined" &&
      process.env.NODE_ENV === "production"
    ) {
      realTimeSlaKpiService.startMonitoring(60000); // Every 60 seconds
      console.log("✅ Real-time SLA monitoring started");
    }

    // 3. Verify services are accessible
    // Could add health checks here

    console.log("✅ WMS module initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ WMS module initialization failed:", error);
    return false;
  }
}

/**
 * Cleanup WMS Module (if needed)
 */
export function cleanupWmsModule() {
  try {
    realTimeSlaKpiService.stopMonitoring();
    console.log("✅ WMS module cleaned up");
  } catch (error) {
    console.error("❌ WMS module cleanup failed:", error);
  }
}

// Auto-initialize in production (server-side only)
// Note: This should be called from app initialization, not auto-initialized here
// to avoid circular dependencies and ensure proper initialization order

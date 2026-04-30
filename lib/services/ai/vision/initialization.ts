/**
 * Vision Module Initialization
 * Ensures all services are properly initialized on startup
 */

import { visionEventIntegration } from "./visionEventIntegration";
import { intelligentAutomationService } from "./intelligentAutomationService";

let initialized = false;

/**
 * Initialize Vision Module
 * Call this on application startup
 */
export async function initializeVisionModule(tenantId?: string): Promise<{
  success: boolean;
  errors: string[];
}> {
  if (initialized) {
    return { success: true, errors: [] };
  }

  const errors: string[] = [];

  try {
    console.log("🚀 Initializing AI Vision Module...");

    // 1. Initialize event integration
    try {
      visionEventIntegration.initialize();
      console.log("✅ Vision event integration initialized");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Event integration: ${errorMsg}`);
      console.error("❌ Error initializing event integration:", error);
    }

    // 2. Initialize automation service
    try {
      await intelligentAutomationService.initialize();
      console.log("✅ Intelligent automation service initialized");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Automation service: ${errorMsg}`);
      console.error("❌ Error initializing automation service:", error);
    }

    // 3. Initialize database adapter (if available)
    try {
      const { visionLearningDatabaseAdapter } =
        await import("./v2/visionLearningDatabaseAdapter");
      // Adapter initializes itself on import
      console.log("✅ Vision learning database adapter initialized");
    } catch (error) {
      // Non-critical - adapter has fallback
      console.warn(
        "⚠️ Vision learning database adapter not available (using fallback)",
      );
    }

    initialized = true;

    if (errors.length === 0) {
      console.log("✅ AI Vision Module initialized successfully");
      return { success: true, errors: [] };
    } else {
      console.warn(
        `⚠️ AI Vision Module initialized with ${errors.length} warning(s)`,
      );
      return { success: true, errors }; // Still success, but with warnings
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Critical error initializing AI Vision Module:", error);
    return { success: false, errors: [errorMsg] };
  }
}

/**
 * Check if module is initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Reset initialization (for testing)
 */
export function resetInitialization(): void {
  initialized = false;
}

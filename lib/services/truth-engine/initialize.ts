/**
 * Truth Engine Initialization
 * Initializes all Truth Engine services and integrations
 */

import { claimExtractionService } from "./claims/claimExtractionService";

export interface TruthEngineInitializationOptions {
  tenantId: string;
  enableRealTimeClaims?: boolean;
  enableEcosystemIntegration?: boolean;
}

export async function initializeTruthEngine(
  options: TruthEngineInitializationOptions,
): Promise<{
  cleanup: () => void;
}> {
  const {
    tenantId,
    enableRealTimeClaims = true,
    enableEcosystemIntegration = true,
  } = options;

  console.log("🚀 Initializing Truth Engine...");

  const cleanupFunctions: Array<() => void> = [];

  // Initialize real-time claim extraction
  if (enableRealTimeClaims) {
    const cleanupClaims =
      claimExtractionService.initializeRealTimeExtraction(tenantId);
    cleanupFunctions.push(cleanupClaims);
  }

  // Initialize ecosystem integration (if not already done)
  if (enableEcosystemIntegration) {
    try {
      const { initializeEcosystemIntegration } =
        await import("./integrations/ecosystemIntegrationService");
      const { unsubscribe } = initializeEcosystemIntegration(tenantId);
      cleanupFunctions.push(unsubscribe);
    } catch (error) {
      console.warn(
        "Ecosystem integration already initialized or failed:",
        error,
      );
    }
  }

  console.log("✅ Truth Engine initialized");

  return {
    cleanup: () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    },
  };
}

/**
 * Initialize Customs Adapters
 * Sets up all country-specific adapters with configuration
 */

import { adapterRegistry } from "./adapterRegistry";
import { customsOrchestrator } from "./customsOrchestrator";

/**
 * Initialize adapters from environment configuration
 */
export function initializeAdapters() {
  console.log("[Customs] Initializing adapters...");

  // Egypt - CargoX (if configured)
  if (process.env.CARGOX_API_KEY && process.env.CARGOX_API_SECRET) {
    try {
      const adapter = adapterRegistry.createAndRegister("EG", "cargox", {
        apiKey: process.env.CARGOX_API_KEY,
        apiSecret: process.env.CARGOX_API_SECRET,
        environment: (process.env.CARGOX_ENVIRONMENT || "sandbox") as
          | "sandbox"
          | "production",
        timeout: 30000,
        retries: 3,
      });
      customsOrchestrator.registerAdapter(adapter);
      console.log("[Customs] CargoX adapter initialized");
    } catch (error) {
      console.error("[Customs] Failed to initialize CargoX adapter:", error);
    }
  }

  // Egypt - NAFEZA (if configured)
  if (
    process.env.NAFEZA_USERNAME &&
    process.env.NAFEZA_PASSWORD &&
    process.env.NAFEZA_CLIENT_ID &&
    process.env.NAFEZA_CLIENT_SECRET
  ) {
    try {
      const adapter = adapterRegistry.createAndRegister("EG", "nafeza", {
        username: process.env.NAFEZA_USERNAME,
        password: process.env.NAFEZA_PASSWORD,
        clientId: process.env.NAFEZA_CLIENT_ID,
        clientSecret: process.env.NAFEZA_CLIENT_SECRET,
        environment: (process.env.NAFEZA_ENVIRONMENT || "sandbox") as
          | "sandbox"
          | "production",
        timeout: 30000,
        retries: 3,
      });
      customsOrchestrator.registerAdapter(adapter);
      console.log("[Customs] NAFEZA adapter initialized");
    } catch (error) {
      console.error("[Customs] Failed to initialize NAFEZA adapter:", error);
    }
  }

  // Saudi Arabia - FASAH (if configured)
  if (
    process.env.FASAH_API_KEY &&
    process.env.FASAH_API_SECRET &&
    process.env.FASAH_MERCHANT_ID
  ) {
    try {
      const adapter = adapterRegistry.createAndRegister("SA", "fasah", {
        apiKey: process.env.FASAH_API_KEY,
        apiSecret: process.env.FASAH_API_SECRET,
        merchantId: process.env.FASAH_MERCHANT_ID,
        environment: (process.env.FASAH_ENVIRONMENT || "sandbox") as
          | "sandbox"
          | "production",
        timeout: 30000,
        retries: 3,
      });
      customsOrchestrator.registerAdapter(adapter);
      console.log("[Customs] FASAH adapter initialized");
    } catch (error) {
      console.error("[Customs] Failed to initialize FASAH adapter:", error);
    }
  }

  // UAE - Dubai Trade (if configured)
  if (
    process.env.DUBAI_TRADE_USERNAME &&
    process.env.DUBAI_TRADE_PASSWORD &&
    process.env.DUBAI_TRADE_CLIENT_ID &&
    process.env.DUBAI_TRADE_CLIENT_SECRET
  ) {
    try {
      const adapter = adapterRegistry.createAndRegister("AE", "dubai-trade", {
        username: process.env.DUBAI_TRADE_USERNAME,
        password: process.env.DUBAI_TRADE_PASSWORD,
        clientId: process.env.DUBAI_TRADE_CLIENT_ID,
        clientSecret: process.env.DUBAI_TRADE_CLIENT_SECRET,
        environment: (process.env.DUBAI_TRADE_ENVIRONMENT || "sandbox") as
          | "sandbox"
          | "production",
        timeout: 30000,
        retries: 3,
      });
      customsOrchestrator.registerAdapter(adapter);
      console.log("[Customs] Dubai Trade adapter initialized");
    } catch (error) {
      console.error(
        "[Customs] Failed to initialize Dubai Trade adapter:",
        error,
      );
    }
  }

  // Kuwait - ASYCUDA (if configured)
  if (
    process.env.ASYCUDA_USERNAME &&
    process.env.ASYCUDA_PASSWORD &&
    process.env.ASYCUDA_OFFICE_CODE
  ) {
    try {
      const adapter = adapterRegistry.createAndRegister("KW", "asycuda", {
        username: process.env.ASYCUDA_USERNAME,
        password: process.env.ASYCUDA_PASSWORD,
        officeCode: process.env.ASYCUDA_OFFICE_CODE,
        environment: (process.env.ASYCUDA_ENVIRONMENT || "sandbox") as
          | "sandbox"
          | "production",
        timeout: 30000,
        retries: 3,
      });
      customsOrchestrator.registerAdapter(adapter);
      console.log("[Customs] ASYCUDA adapter initialized");
    } catch (error) {
      console.error("[Customs] Failed to initialize ASYCUDA adapter:", error);
    }
  }

  // TIR/ETIR (if configured)
  if (
    process.env.ETIR_OPERATOR_ID &&
    process.env.ETIR_API_KEY &&
    process.env.ETIR_API_SECRET
  ) {
    try {
      const adapter = adapterRegistry.createAndRegister("TIR", "etir", {
        operatorId: process.env.ETIR_OPERATOR_ID,
        apiKey: process.env.ETIR_API_KEY,
        apiSecret: process.env.ETIR_API_SECRET,
        environment: (process.env.ETIR_ENVIRONMENT || "sandbox") as
          | "sandbox"
          | "production",
        timeout: 30000,
        retries: 3,
      });
      customsOrchestrator.registerAdapter(adapter);
      console.log("[Customs] ETIR adapter initialized");
    } catch (error) {
      console.error("[Customs] Failed to initialize ETIR adapter:", error);
    }
  }

  console.log(
    `[Customs] Initialized ${adapterRegistry.getAllAdapters().length} adapters`,
  );
}

// Auto-initialize on server-side
if (typeof window === "undefined") {
  initializeAdapters();
}

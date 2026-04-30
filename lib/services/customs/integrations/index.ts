/**
 * Customs Integrations - Main Export
 * All cross-module integrations
 */

export {
  initializeTMSIntegration,
  getShipmentDataForDeclaration,
} from "./tmsIntegration";
export {
  initializeWMSIntegration,
  convertProductToDeclarationProduct,
} from "./wmsIntegration";
export {
  initializeTradeComplianceIntegration,
  getComplianceRequirements,
} from "./tradeComplianceIntegration";

/**
 * Initialize all integrations
 */
export function initializeAllIntegrations() {
  // Only initialize on server-side
  if (typeof window === "undefined") {
    const { initializeTMSIntegration } = require("./tmsIntegration");
    const { initializeWMSIntegration } = require("./wmsIntegration");
    const {
      initializeTradeComplianceIntegration,
    } = require("./tradeComplianceIntegration");

    initializeTMSIntegration();
    initializeWMSIntegration();
    initializeTradeComplianceIntegration();

    console.log("[Customs] All integrations initialized");
  }
}

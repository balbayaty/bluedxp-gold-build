/**
 * Geofence Integrations Index
 *
 * Central export for all geofence integrations
 */

export { transportationIntegrationService } from "./transportationIntegration";
export { wmsIntegrationService } from "./wmsIntegration";

// Auto-initialize all integrations
if (typeof window === "undefined") {
  import("./transportationIntegration").then((m) =>
    m.transportationIntegrationService.initialize().catch(console.error),
  );
  import("./wmsIntegration").then((m) =>
    m.wmsIntegrationService.initialize().catch(console.error),
  );
}

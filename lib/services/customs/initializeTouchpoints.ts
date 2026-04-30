/**
 * Initialize Touchpoint Data
 * Loads initial touchpoint data for Middle East countries
 */

import { touchpointService } from "./touchpointService";
import { allMiddleEastTouchpoints } from "@/data/touchpoints/middle-east";

/**
 * Initialize touchpoints on service startup
 */
export function initializeTouchpoints() {
  console.log("[Customs] Initializing touchpoints...");

  touchpointService.registerTouchpoints(allMiddleEastTouchpoints);

  console.log(
    `[Customs] Registered ${allMiddleEastTouchpoints.length} touchpoints`,
  );
}

// Auto-initialize on import
if (typeof window === "undefined") {
  initializeTouchpoints();
}

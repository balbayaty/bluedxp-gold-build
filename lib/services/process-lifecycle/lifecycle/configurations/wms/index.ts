/**
 * WMS Lifecycle Configurations Index
 * Exports all WMS entity lifecycle configurations
 */

import { asnLifecycleConfig } from "./asnLifecycle";
import { taskLifecycleConfig } from "./taskLifecycle";
import { pickingLifecycleConfig } from "./pickingLifecycle";
import { putawayLifecycleConfig } from "./putawayLifecycle";
import { cycleCountLifecycleConfig } from "./cycleCountLifecycle";
import { goodsReceiptLifecycleConfig } from "./goodsReceiptLifecycle";
import { wavePlanningLifecycleConfig } from "./wavePlanningLifecycle";

// Re-export all configurations
export { asnLifecycleConfig } from "./asnLifecycle";
export { taskLifecycleConfig } from "./taskLifecycle";
export { pickingLifecycleConfig } from "./pickingLifecycle";
export { putawayLifecycleConfig } from "./putawayLifecycle";
export { cycleCountLifecycleConfig } from "./cycleCountLifecycle";
export { goodsReceiptLifecycleConfig } from "./goodsReceiptLifecycle";
export { wavePlanningLifecycleConfig } from "./wavePlanningLifecycle";

// Register all WMS lifecycle configurations
export const wmsLifecycleConfigs = [
  asnLifecycleConfig,
  taskLifecycleConfig,
  pickingLifecycleConfig,
  putawayLifecycleConfig,
  cycleCountLifecycleConfig,
  goodsReceiptLifecycleConfig,
  wavePlanningLifecycleConfig,
];

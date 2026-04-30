/**
 * Register All Job Handlers
 *
 * This file registers all job handlers when the application starts
 */

import { jobQueue } from "./index";
import { transportationExportHandler } from "./handlers/transportationExportHandler";
import { batchShipmentProcessorHandler } from "./handlers/batchShipmentProcessor";
import { batchProcessHandler } from "./handlers/exampleBatchHandler";

/**
 * Register all job handlers
 * Call this during application initialization
 */
export function registerJobHandlers() {
  // Transportation handlers
  jobQueue.registerHandler(transportationExportHandler);
  jobQueue.registerHandler(batchShipmentProcessorHandler);

  // General handlers
  jobQueue.registerHandler(batchProcessHandler);

  console.log("✅ Job handlers registered");
}

// Auto-register on import (server-side only)
if (typeof window === "undefined") {
  registerJobHandlers();
}

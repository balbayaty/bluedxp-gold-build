/**
 * Corridor Intelligence Service
 *
 * Main export file
 *
 * @module corridors
 */

export * from "./types";
export * from "./saudi-kuwait-corridor";
export * from "./saudi-syria-corridor";
export * from "./corridor-service";

export { corridorIntelligenceService as default } from "./corridor-service";
export { SAUDI_KUWAIT_CORRIDOR } from "./saudi-kuwait-corridor";
export { SAUDI_SYRIA_CORRIDOR } from "./saudi-syria-corridor";
